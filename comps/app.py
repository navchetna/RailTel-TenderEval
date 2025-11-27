import os
import json
from typing import List, Dict, Optional


from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Path
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
import uvicorn
import pandas as pd
import io
import shutil
from datetime import datetime


from groq import Groq
from dotenv import load_dotenv
import motor.motor_asyncio


from comps.parsers.tree import Tree
from comps.parsers.text import Text
from comps.parsers.table import Table
from comps.parsers.treeparser import TreeParser
from comps.dataprep.excel_to_json_price import excel_to_price_compliance_json
from comps.dataprep.excel_to_json_tech import excel_to_technical_compliance_json


# ------------ CONFIG & INIT -----------------
load_dotenv()
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'tender_eval')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', "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")
BASE_OUTPUT_DIR = os.path.abspath("out")


def get_pdf_output_dir(project_id, pdf_id):
    return os.path.join(BASE_OUTPUT_DIR, str(project_id), str(pdf_id))


# --------- FastAPI and CORS (for local dev) -----------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://g2-wyn04.iind.intel.com:5009",
        "http://localhost:5009",
        "http://127.0.0.1:5009",
        "*"  # Keep this for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# --------- Mongo connection ------------
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = mongo_client[DB_NAME]
projects_coll = db['projects']
pdfs_coll = db['pdfs']


# -------- Helper Models ----------------
class ProjectCreateReq(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    pdfs: List[str] = []


class PDFMetadataOut(BaseModel):
    id: str
    filename: str
    pdf_type: Optional[str] = None


# ---------- Utility Functions ---------------


def parse_pdf_pipeline_stages():
    # Just a names/ids list for the frontend
    return [
        {"id": 1, "name": "Parse and create structure"},
        {"id": 2, "name": "Extract TOC & Compliance Sections"},
        {"id": 3, "name": "Extract Compliance Nodes/Tables"},
        {"id": 4, "name": "Export to Excel"},
        {"id": 5, "name": "Export to JSON"},
    ]


def pdf_output_dir(project_id, pdf_id):
    return get_pdf_output_dir(project_id, pdf_id)


async def save_pdf_in_db(project_id, filename, bytes_data, pdf_type: str = "bid"):
    doc = {
        "project_id": project_id,
        "filename": filename,
        "data": bytes_data,
        "type": pdf_type,  # Add type field: 'tender' or 'bid'
        "uploadDate": datetime.now().isoformat()  # Add upload date
    }
    result = await pdfs_coll.insert_one(doc)
    return str(result.inserted_id)


async def get_pdf_bytes(pdf_id):
    pdf = await pdfs_coll.find_one({'_id': ObjectId(pdf_id)})
    if not pdf:
        raise HTTPException(404, 'PDF not found')
    return pdf["filename"], pdf["data"]


async def get_pdf_meta_for_project(project_id):
    pdfs = pdfs_coll.find({'project_id': project_id})
    result = []
    async for pdf in pdfs:
        result.append({
            "id": str(pdf["_id"]),
            "filename": pdf["filename"],
            "pdf_type": pdf.get("type", "bid")
        })
    return result


def save_bytes_to_disk(path, bytes_data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(bytes_data)


def fuzzy_matches(heading, query):
    from fuzzywuzzy import fuzz
    score = fuzz.ratio(heading.strip().lower(), query.strip().lower())
    return score >= 80


def find_node_by_level_or_title(rootNode, query):
    print(rootNode.get_length_children())
    print("Searching for:", query)
    
    if fuzzy_matches(rootNode.get_heading(), query):
        print(f"High score for '{rootNode.get_heading().strip()}' with '{query.strip()}'!\n")
        return rootNode


    for i in range(rootNode.get_length_children()):
        result = find_node_by_level_or_title(rootNode.get_child(i), query)
        if result:
            return result


    return None

def flatten_found(found):
    """
    Cleanly flatten the output of traverse_json_tree into plain text.
    """
    if not found:
        return ""

    # Case: single tuple (heading, dict)
    if isinstance(found, tuple) and len(found) == 2:
        heading, section = found
        parts = [heading]

        if isinstance(section, dict):
            # Add main content
            content = section.get("content", [])
            if isinstance(content, list):
                parts.extend(content)

            # Add children recursively
            children = section.get("children", [])
            if isinstance(children, list):
                for child in children:
                    for child_heading, child_dict in child.items():
                        parts.append(child_heading)
                        parts.extend(child_dict.get("content", []))

        return "\n".join(parts).strip()

    # Case: list of results
    if isinstance(found, list):
        return "\n".join([flatten_found(f) for f in found if f]).strip()

    # Fallback
    return str(found).strip()




# def traverse_json_tree(json_node, query):
#     """
#     Recursively search for a node in the JSON structure whose key/heading matches the query.
#     Returns (heading, node_dict) if found, else None.
#     """
#     if isinstance(json_node, dict):
#         for key in json_node:
#             if isinstance(json_node[key], dict):
#                 heading = key
#                 print()
#                 if fuzzy_matches(heading, query):
#                     return heading, json_node[key]
#                 children = json_node[key].get("children", [])
#                 for child in children:
#                     # Each child is a dict
#                     result = traverse_json_tree(child, query)
#                     if result is not None:
#                         return result
#             # fallback if this is just the root
#             elif key == "children":
#                 for child in json_node[key]:
#                     result = traverse_json_tree(child, query)
#                     if result is not None:
#                         return result
#     return None

import re

def normalize_heading(text: str) -> str:
    """Remove leading numbering like '1;5', '1.2', etc. and lowercase."""
    if not text:
        return ""
    # Remove patterns like "1;5 ", "1.2 ", "12) ", "1. "
    cleaned = re.sub(r"^\s*[\d;.\)\-]+\s*", "", text)
    return cleaned.strip().lower()

def traverse_json_tree(node, target_heading):
    results = []
    target_norm = normalize_heading(target_heading)

    if isinstance(node, dict):
        heading = node.get("heading", "")
        content = node.get("content", "")

        # DEBUG: print all headings being checked
        if heading:
            print("Checking heading:", heading, "→ normalized:", normalize_heading(heading))

        if normalize_heading(heading) == target_norm or target_norm in normalize_heading(heading):
            if content:
                results.append(content)

        for child in node.get("children", []):
            results.extend(traverse_json_tree(child, target_heading))

    elif isinstance(node, list):
        for item in node:
            results.extend(traverse_json_tree(item, target_heading))

    return results





def extract_sections(output_json, compliance_sections):
    """
    Build compliance sections with text from parsed PDF tree.
    """
    extracted = {}
    for sec_key, sec_title in compliance_sections.items():
        print(f"Processing {sec_key} with title: {sec_title}")
        text_blocks = traverse(output_json, sec_title)
        extracted[sec_key] = {
            "section_title": sec_title,
            "text": "\n".join(text_blocks) if text_blocks else None
        }
    return extracted



def find_markdown_in_json_section(section_dict):
    """
    Given a node dict (with key "content"), try to return the markdown block (first string or any string).
    """
    if not section_dict:
        return None
    contents = section_dict.get("content", [])
    
    for item in contents:
        if isinstance(item, str):
            return item
    return None


def retrieve_from_pdf(target_node):
    if target_node:
        print("Found Node:", target_node.get_heading())
        for item in target_node.get_content():
            if hasattr(item, "markdown_content"):
                return item.markdown_content
    else:
        print(" No table/ Node found not found")
    return None


def markdown_to_df(markdown_content, section_title):
    section_title = section_title.replace(" ", "_")
    lines = [line for line in markdown_content.splitlines() if line.strip().startswith('|')]
    cleaned_table_str = '\n'.join(lines)
    df = pd.read_csv(io.StringIO(cleaned_table_str), sep='|', engine='python', skipinitialspace=True)
    df = df.iloc[1:]
    df = df.drop(df.columns[[0, -1]], axis=1)
    df.columns = [col.strip() for col in df.columns]
    return df


def extract_markdown_table_from_list(markdown_list):
    """
    Given the 'markdown' field (a list), extract the markdown table string.
    Pattern: The list typically has [title_string, {content: [text, table_string], children: []}].
    Extract the table_string from content[1] if it starts with '|'.
    Return the table string, or None.
    """
    print("Extracting markdown table from list:", markdown_list)
    if not isinstance(markdown_list, list) or len(markdown_list) < 2:
        return None
    second_element = markdown_list[1]
    if not isinstance(second_element, dict):
        return None
    content = second_element.get("content", [])
    if not isinstance(content, list) or len(content) < 2:
        return None
    potential_table = content[1]
    if isinstance(potential_table, str) and potential_table.strip().startswith('|'):
        return potential_table
    return None


def combine_price_and_tech_json(json_dir_path, output_filename="combined.json"):
    combined_data = {
        "price_compliance": {},
        "technical_compliance": {}
    }
    for file_name in os.listdir(json_dir_path):
        if not file_name.endswith('.json'):
            continue
        file_path = os.path.join(json_dir_path, file_name)
        lower_name = file_name.lower()
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if "price" in lower_name:
            combined_data['price_compliance'] = data
        elif "tech" in lower_name:
            combined_data['technical_compliance'] = data
    output_path = os.path.join(json_dir_path, output_filename)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=4)
    return output_path


# --------------- Stage Functions (as previously modularized, but sync for backend CLI) ---------------


def stage_parse_pdf(pdf_bytes_path, output_dir):
    tree = Tree(pdf_bytes_path)
    parser = TreeParser(output_dir)
    parser.populate_tree(tree)
    parser.generate_output_text(tree)
    parser.generate_output_json(tree)
    return tree


def stage_extract_toc(tree, output_dir):
    toc_path = os.path.join(output_dir, 'toc.txt')
    with open(toc_path, 'r', encoding='utf-8') as f:
        toc_content = f.read()
    return toc_content


def stage_select_compliance_sections(toc_content, ask_groq_function):
    sections_str = ask_groq_function(toc_content)
    compliance_sections = json.loads(sections_str)
    return compliance_sections


def stage_extract_section_nodes(tree, compliance_sections):
    extracted = {}
    for section_type, section_title in compliance_sections.items():
        section_title = section_title[2:] if section_title else None
        node = find_node_by_level_or_title(tree.rootNode, section_title)
        markdown = retrieve_from_pdf(node)
        extracted[section_type] = {
            "section_title": section_title,
            "markdown": markdown
        }
    return extracted

def clean_and_deduplicate_sections(extracted):
    """Remove duplicate content and clean up sections"""
    seen_content = {}
    cleaned = {}
    duplicates_found = []
    
    for section_type, section_data in extracted.items():
        content = section_data.get("text", "")
        if not content:
            cleaned[section_type] = section_data
            continue
            
        content_hash = hash(content.strip())
        
        if content_hash not in seen_content:
            cleaned[section_type] = section_data
            seen_content[content_hash] = section_type
        else:
            duplicate_of = seen_content[content_hash]
            duplicates_found.append(f"{section_type} duplicates {duplicate_of}")
            # Keep the first occurrence, skip the duplicate
            print(f"Skipping duplicate: {section_type} (same as {duplicate_of})")
    
    if duplicates_found:
        print("Duplicates found and removed:", duplicates_found)
    
    return cleaned

def stage_convert_to_df(extracted):
    dfs = {}
    for k, v in extracted.items():
        if v["markdown"]:
            df = markdown_to_df(v["markdown"], v["section_title"])
            dfs[k] = df
    return dfs


def stage_save_excel_files(pdf_output_dir, dfs):
    excel_dir = os.path.join(pdf_output_dir, 'excel')
    os.makedirs(excel_dir, exist_ok=True)
    excel_paths = {}
    for k, df in dfs.items():
        excel_path = os.path.join(excel_dir, f"{k}.xlsx")
        df.to_excel(excel_path, index=False)
        excel_paths[k] = excel_path
    return excel_paths


def stage_transform_to_json(pdf_output_dir, excel_paths):
    json_dir = os.path.join(pdf_output_dir, 'json')
    os.makedirs(json_dir, exist_ok=True)
    json_outputs = {}
    for k, path in excel_paths.items():
        if "price" in k:
            compliance_json = excel_to_price_compliance_json(path)
        else:
            compliance_json = excel_to_technical_compliance_json(path)
        json_path = os.path.join(json_dir, f"{k}.json")
        with open(json_path, 'w') as fh:
            json.dump(compliance_json, fh, indent=4)
        json_outputs[k] = json_path
    combined_path = combine_price_and_tech_json(json_dir)
    json_outputs["combined"] = combined_path
    return json_outputs


# --------------- Ask Groq to identify compliance sections -----------------
def ask_groq_with_file_content(toc_content):
    client = Groq(api_key=GROQ_API_KEY)
    system_prompt = """
        You are an information extraction API that identifies the most relevant sections from a tender document's Table of Contents (TOC) for compliance evaluation.

Your task is to identify exactly one TOC entry for each of the following categories:

1) scope_of_work – section describing the scope of work, technical requirements, specifications, or execution details.  
2) eligibility – section specifying bidder eligibility criteria, such as experience, turnover, certifications, or OEM authorizations.  
3) emd – section describing Earnest Money Deposit (EMD), including amount, mode of payment, and exemptions.  
4) pbg – section describing Performance Bank Guarantee (PBG), including percentage, validity, and conditions.  
5) declarations – section describing mandatory declarations or certificates (e.g., no-blacklisting, Make in India, land border restrictions, notarized affidavits).  
6) delivery – section describing delivery schedules, installation timelines, deadlines, or penalties for delay.  
7) warranty_sla – section describing warranty period, service level agreements, scope of warranty, or penalties.  
8) payment_terms – section describing payment milestones, percentage splits, and release conditions.  

You must respond only with JSON in the following format:

{
    "scope_of_work": "<section_number> <section_title>",
    "eligibility": "<section_number> <section_title>",
    "emd": "<section_number> <section_title>",
    "pbg": "<section_number> <section_title>",
    "declarations": "<section_number> <section_title>",
    "delivery": "<section_number> <section_title>",
    "warranty_sla": "<section_number> <section_title>",
    "payment_terms": "<section_number> <section_title>"
}

Important instructions:
- Choose exactly one TOC entry for each field.  
- The value must be the **exact section title as written in the TOC**, including any numbering or formatting.  
- If no relevant section exists, return an empty string `""` for that field.  
- Do not include any extra text, explanations, or notes — only the JSON object above.

    """
    chat_completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": toc_content
            }
        ],
        response_format={"type": "json_object"}
    )
    return chat_completion.choices[0].message.content


def ask_groq_for_comparison_table(compliance_data):
    """
    Call Groq to generate a comparison table from compliance sections data
    """
    client = Groq(api_key=GROQ_API_KEY)
    system_prompt = """
You are given tender compliance sections in JSON format under "compliance_sections". Your task is to extract key requirements, penalties, and conditions from each section and generate a crisp comparison table.

Instructions:
1. For each section (scope_of_work, eligibility, emd, pbg, declarations, warranty_sla, payment_terms), create a row.
2. Columns must be:
   - Section (short title with clause reference)
   - Key Requirement / Details (main obligations, conditions, values, or processes)
   - Penalty / Notes (any penalties, restrictions, or special notes)

3. Keep the table concise, professional, and easy to compare.
4. Do not copy the raw text verbatim. Summarize clearly.
5. Ensure all percentages, monetary values, and deadlines are preserved.
6. If a section has no data or is empty, mark it as "Not specified" or "N/A".

Output format: A Markdown table with columns:
| Section | Key Requirement / Details | Penalty / Notes |

Make sure the table is well-formatted and ready for display.
"""
    
    # Convert compliance data to JSON string for the prompt
    compliance_json = json.dumps(compliance_data, indent=2)
    
    chat_completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": f"Here is the compliance data:\n\n{compliance_json}"
            }
        ],
        temperature=0.1  # Lower temperature for more consistent formatting
    )
    return chat_completion.choices[0].message.content

# --------------- ROUTES -------------------
class ProjectUpdateReq(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@app.put("/projects/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, req: ProjectUpdateReq):
    # Fetch the existing project
    project = await projects_coll.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Prepare update data only for provided fields
    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    if req.description is not None:
        update_data["description"] = req.description
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    # Update the project in MongoDB
    await projects_coll.update_one({"_id": ObjectId(project_id)}, {"$set": update_data})
    
    # Fetch updated project details
    updated_project = await projects_coll.find_one({"_id": ObjectId(project_id)})
    pdfs = await get_pdf_meta_for_project(project_id)
    
    return ProjectOut(
        id=str(updated_project["_id"]),
        name=updated_project["name"],
        description=updated_project.get("description"),
        pdfs=[pdf['id'] for pdf in pdfs]
    )


@app.get("/projects", response_model=List[ProjectOut])
async def list_projects():
    cursor = projects_coll.find()
    res = []
    async for proj in cursor:
        pdfs = await get_pdf_meta_for_project(str(proj["_id"]))
        res.append(ProjectOut(
            id=str(proj["_id"]),
            name=proj["name"],
            description=proj.get("description"),
            pdfs=[pdf['id'] for pdf in pdfs]
        ))
    return res


@app.post("/projects", response_model=ProjectOut)
async def create_project(req: ProjectCreateReq):
    doc = {
        "name": req.name,
        "description": req.description or ""
    }
    result = await projects_coll.insert_one(doc)
    return ProjectOut(id=str(result.inserted_id), name=req.name, description=req.description, pdfs=[])


@app.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # Delete the project from MongoDB
    delete_result = await projects_coll.delete_one({"_id": ObjectId(project_id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete all associated PDFs from MongoDB
    await pdfs_coll.delete_many({"project_id": project_id})
    
    # Delete the output directory if it exists
    project_output_dir = os.path.join(BASE_OUTPUT_DIR, project_id)
    if os.path.exists(project_output_dir):
        shutil.rmtree(project_output_dir)
    
    return {"detail": "Project deleted successfully"}


@app.post("/projects/{project_id}/pdfs", response_model=PDFMetadataOut)
async def upload_pdf(project_id: str, file: UploadFile = File(...), pdf_type: Optional[str] = "bid"):
    bytes_data = await file.read()
    pdf_id = await save_pdf_in_db(project_id, file.filename, bytes_data, pdf_type)
    
    # Automatically run stage 1: Parse and create structure
    filename, pdf_bytes = await get_pdf_bytes(pdf_id)
    output_dir = pdf_output_dir(project_id, pdf_id)
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, filename)
    save_bytes_to_disk(pdf_path, pdf_bytes)
    stage_parse_pdf(pdf_path, output_dir)
    
    return PDFMetadataOut(id=pdf_id, filename=file.filename, pdf_type=pdf_type)


@app.get("/projects/{project_id}/pdfs", response_model=List[PDFMetadataOut])
async def list_project_pdfs(project_id: str):
    pdfs = await get_pdf_meta_for_project(project_id)
    return [PDFMetadataOut(
        id=pdf['id'], 
        filename=pdf['filename'],
        pdf_type=pdf.get('pdf_type')
    ) for pdf in pdfs]


@app.delete("/projects/{project_id}/pdfs/{pdf_id}")
async def delete_pdf(project_id: str, pdf_id: str):
    # Delete the PDF from MongoDB
    delete_result = await pdfs_coll.delete_one({"_id": ObjectId(pdf_id), "project_id": project_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # Delete the output directory for this PDF if it exists
    pdf_output_dir = get_pdf_output_dir(project_id, pdf_id)
    if os.path.exists(pdf_output_dir):
        shutil.rmtree(pdf_output_dir)
    
    return {"detail": "PDF deleted successfully"}


@app.get("/projects/{project_id}/download")
async def download_pdf(project_id: str, pdf_id: str):
    filename, pdf_bytes = await get_pdf_bytes(pdf_id)
    temp_path = f"/tmp/{pdf_id}-{filename}"
    save_bytes_to_disk(temp_path, pdf_bytes)
    return FileResponse(temp_path, media_type='application/pdf', filename=filename)


@app.get("/projects/{project_id}/pdfs/{pdf_id}/excel/{filename}")
async def get_excel_file(project_id: str, pdf_id: str, filename: str):
    base_dir = "out"  # Adjust if your BASE_OUTPUT_DIR is different
    file_path = os.path.join(base_dir, project_id, pdf_id, "excel", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=filename)


@app.get("/projects/{project_id}/details")
async def get_project_details(project_id: str = Path(..., description="The ID of the project to retrieve")):
    # Fetch project
    project = await projects_coll.find_one({"_id": ObjectId(project_id)})
    if not project:
        return JSONResponse(status_code=404, content={"detail": "Project not found"})


    # Fetch PDFs associated with project
    pdfs_cursor = pdfs_coll.find({"project_id": project_id})
    pdfs = []
    async for pdf in pdfs_cursor:
        pdfs.append({
            "id": str(pdf["_id"]),
            "name": pdf["filename"],
            "type": pdf.get("type", "bid"),  # Default to 'bid' if not set
            "bidderName": pdf.get("bidderName"),  # Optional
            "uploadDate": pdf.get("uploadDate", datetime.now().isoformat())
        })


    # Assuming the first PDF is 'tender' if type not specified, or based on type
    tender_file = next((p for p in pdfs if p["type"] == "tender"), None)
    bid_files = [p for p in pdfs if p["type"] == "bid"]


    # Compose response matching the Project interface
    project_out = {
        "id": str(project["_id"]),
        "name": project["name"],
        "tenderFile": tender_file,
        "bidFiles": bid_files,
        "createdAt": project.get("createdAt", datetime.now().isoformat()),
        "status": project.get("status", "draft")  # Default to 'draft'
    }


    return project_out

@app.get("/projects/{project_id}/pdfs/{pdf_id}/view")
async def view_pdf(project_id: str = Path(..., description="Project ID"), pdf_id: str = Path(..., description="PDF ID")):
    # Fetch the PDF document from MongoDB
    pdf_doc = await pdfs_coll.find_one({"_id": ObjectId(pdf_id), "project_id": project_id})
    if not pdf_doc:
        raise HTTPException(status_code=404, detail="PDF not found or does not belong to this project")
    
    # Get the binary data and filename
    pdf_data = pdf_doc.get("data")  # Assuming "data" field stores the binary PDF content
    filename = pdf_doc.get("filename", "document.pdf")
    
    if not pdf_data:
        raise HTTPException(status_code=500, detail="PDF data not found in database")
    
    # Stream the binary data with inline disposition for rendering
    def iterfile():
        yield pdf_data  # Yield the binary data (if it's bytes; adjust if it's a stream)
    
    headers = {
        "Content-Disposition": f"inline; filename={filename}",
        "Content-Type": "application/pdf"
    }
    
    return StreamingResponse(iterfile(), headers=headers, media_type="application/pdf")


@app.get("/projects/{project_id}/pdfs/{pdf_id}/json/{filename}")
async def get_json_file(project_id: str, pdf_id: str, filename: str):
    base_dir = "out"
    file_path = os.path.join(base_dir, project_id, pdf_id, "json", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="JSON file not found")
    return FileResponse(file_path, media_type="application/json", filename=filename)




@app.get("/pipeline/stages")
async def get_pipeline_stages():
    return parse_pdf_pipeline_stages()


# ------------------- PIPELINE STAGE ENDPOINTS, all async calls and temp-files ----------------------


@app.post("/projects/{project_id}/pdfs/{pdf_id}/stage/{stage_id}")
async def run_pipeline_stage(project_id: str, pdf_id: str, stage_id: int, request: Request):
    # 0: fetch PDF from Mongo to disk so parser can handle it
    filename, pdf_bytes = await get_pdf_bytes(pdf_id)
    output_dir = pdf_output_dir(project_id, pdf_id)
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, filename)
    save_bytes_to_disk(pdf_path, pdf_bytes)


    # Stage 1: Parse and create structure
    if stage_id == 1:
        
        tree = stage_parse_pdf(pdf_path, output_dir)
        return {"status": "parsed", "output_dir": output_dir}


    # Stage 2: Extract TOC and get Compliance Section Candidates via LLM
    elif stage_id == 2:
        tree = Tree(pdf_path)
        toc_content = stage_extract_toc(tree, output_dir)
        
        # Offer the raw toc_content for UI to display & correct, also provide auto-suggested by LLM
        auto_suggested = stage_select_compliance_sections(toc_content, ask_groq_with_file_content)

        # Build a clean dictionary for all required compliance sections
        temp_suggested = {
    "scope_of_work": auto_suggested.get("scope_of_work", ""),
    "eligibility": auto_suggested.get("eligibility", ""),
    "emd": auto_suggested.get("emd", ""),
    "pbg": auto_suggested.get("pbg", ""),
    "declarations": auto_suggested.get("declarations", ""),
    # "delivery": auto_suggested.get("delivery", ""),  # Remove this if same as scope_of_work
    "warranty_sla": auto_suggested.get("warranty_sla", ""),
    "payment_terms": auto_suggested.get("payment_terms", "")
        }

        return {"compliance_sections": temp_suggested}



    # elif stage_id == 3:
    #     data = await request.json()
    #     print("Recieved data", data)
    #     compliance_sections = data.get("compliance_sections", {}).get("compliance_sections", {})
    #     if not compliance_sections:
    #         raise HTTPException(400, "Missing compliance_sections")
        
    #     # To do: make the output path dynamic
    #     output_dir = get_pdf_output_dir(project_id, pdf_id)
    #     output_json_path = os.path.join(output_dir, "output.json")
    #     if not os.path.exists(output_json_path):
    #         raise HTTPException(404, f"output.json not found at {output_json_path}")
    #     with open(output_json_path, "r", encoding="utf-8") as f:
    #         tree_json = json.load(f)
    #     root_node = tree_json.get("root", {})


    #     extracted = {}
    #     print("Compliance sections:", compliance_sections)
    #     for section_type, section_title in compliance_sections.items():
    #         print("Processing section:", section_type, "with title:", section_title)
    #         # Remove index/numbering (if needed), or leave as is for matching
    #         section_heading = section_title
    #         # if isinstance(section_title, str) and len(section_title) > 1 and section_title[1] == '.':
    #         #     section_heading = section_title[2:]
    #         found = traverse_json_tree(root_node, section_heading)
    #         # print("Found:", found)
    #         extracted[section_type] = {
    #             "section_title": section_heading,
    #             "markdown": found if found else None,
    #             "full_heading": found[0] if found else None
    #         }
    #     return extracted

    # elif stage_id == 4:
    #     try:
    #         body_bytes = await request.body()
    #         if not body_bytes:
    #             raise HTTPException(status_code=400, detail="Empty request body - JSON data is required for stage 4")
    #         extracted = json.loads(body_bytes.decode('utf-8'))
    #     except json.JSONDecodeError:
    #         raise HTTPException(status_code=400, detail="Invalid JSON in request body - please provide valid JSON data")
    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=f"Unexpected error processing request: {str(e)}")

    #     dfs = {}
    #     extracted = extracted.get("compliance_sections", {})
    #     print("Extracted sections:", len(extracted))

    #     for k, v in extracted.items():
    #         # print(f"Processing section: {k} with title: {v}")
    #         markdown_content = extract_markdown_table_from_list(v.get('markdown'))
    #         if markdown_content:
    #             df = markdown_to_df(markdown_content, v['section_title'])
    #             dfs[k] = df

    #     excel_paths = stage_save_excel_files(output_dir, dfs)
    #     print("Excel paths:", excel_paths)
        
    #     # Return filenames (or full URLs) for UI to fetch and display
    #     excel_files = {}
    #     for key, path in excel_paths.items():
    #         filename = os.path.basename(path)  # e.g., "technical.xlsx"
    #         # Optionally, construct full URL for direct access
    #         file_url = f"http://localhost:8050/projects/{project_id}/pdfs/{pdf_id}/excel/{filename}"
    #         excel_files[key] = {"filename": filename, "url": file_url}
        
    #     return {"excel_files": excel_files}
    # # Stage 5: Transform compliance excels to json
    # elif stage_id == 5:
    #     excel_dir = os.path.join(output_dir, 'excel')
    #     excel_paths = {f.split(".")[0]: os.path.join(excel_dir, f) for f in os.listdir(excel_dir) if f.endswith(".xlsx")}
    #     json_outputs = stage_transform_to_json(output_dir, excel_paths)

    #     # Construct and return the download URL for combined.json
    #     combined_filename = "combined.json"
    #     download_url = f"http://localhost:8050/projects/{project_id}/pdfs/{pdf_id}/json/{combined_filename}"
        
    #     return {"download_url": download_url}

    elif stage_id == 3:
            
        data = await request.json()
        print("Recieved data", data)
        compliance_sections = data.get("compliance_sections", {}).get("compliance_sections", {})
        if not compliance_sections:
            raise HTTPException(400, "Missing compliance_sections")

        # To do: make the output path dynamic
        output_dir = get_pdf_output_dir(project_id, pdf_id)
        output_json_path = os.path.join(output_dir, "output.json")
        if not os.path.exists(output_json_path):
            raise HTTPException(404, f"output.json not found at {output_json_path}")
        with open(output_json_path, "r", encoding="utf-8") as f:
            tree_json = json.load(f)
        root_node = tree_json.get("root", {})

        # --- FIXED traversal ---
        def traverse(node, target_title, depth=0):
            """
            Recursively search for a section by matching its title in dict keys.
            Handles multiple document formats.
            """
            results = []
            
            if not target_title.strip():  # Skip empty titles
                return results

            if isinstance(node, dict):
                for key, value in node.items():
                    match_found = False
                    
                    # Clean up both strings for comparison
                    key_clean = key.lower().strip()
                    title_clean = target_title.lower().strip()
                    
                    # Strategy 1: Try exact section number matching for both formats
                    import re
                    
                    # Handle "1;5" format (first document)
                    title_match_1 = re.search(r'1;(\d+)', target_title)
                    # Handle "2;3." format (second document)  
                    title_match_2 = re.search(r'2;(\d+)\.?', target_title)
                    
                    target_section_num = None
                    if title_match_1:
                        target_section_num = title_match_1.group(1)
                    elif title_match_2:
                        target_section_num = title_match_2.group(1)
                    
                    # Get section number from key (handles both "5 Title" and "3. Title")
                    key_match = re.search(r'^(\d+)\.?\s*', key.strip())
                    key_section_num = key_match.group(1) if key_match else None
                    
                    # Check section number match
                    if target_section_num and key_section_num and target_section_num == key_section_num:
                        match_found = True
                    
                    # Strategy 2: Text-based matching (fallback)
                    if not match_found:
                        # Remove section numbers and references for text comparison
                        key_text = re.sub(r'^\d+\.?\s*', '', key_clean)
                        title_text = re.sub(r'[12];\d+\.?\s*', '', title_clean)
                        title_text = re.sub(r'\(ref:.*?\)', '', title_text).strip()
                        
                        # For old format, also try the original matching
                        if 'delivery' in title_text and 'delivery' in key_text:
                            match_found = True
                        elif 'eligibility' in title_text and 'eligibility' in key_text:
                            match_found = True
                        elif 'estimated cost' in title_text and 'estimated cost' in key_text:
                            match_found = True
                        elif 'security deposit' in title_text and ('security' in key_text or 'performance' in key_text):
                            match_found = True
                        elif 'affidavit' in title_text and 'affidavit' in key_text:
                            match_found = True
                        elif 'warranty' in title_text and 'warranty' in key_text:
                            match_found = True
                        elif 'payment' in title_text and 'payment' in key_text:
                            match_found = True
                        # New document specific matches
                        elif 'technical requirements' in title_text and 'technical' in key_text:
                            match_found = True
                        elif 'qualification criterion' in title_text and ('qualification' in key_text or 'bqc' in key_text):
                            match_found = True
                        elif 'compliance and declarations' in title_text and ('compliance' in key_text or 'declaration' in key_text):
                            match_found = True
                        elif 'price bid' in title_text and ('price' in key_text or 'bid' in key_text):
                            match_found = True
                    
                    if match_found:
                        print(f"MATCH: '{target_title}' matched with '{key}'")
                        content = " ".join(value.get("content", []))
                        if content.strip():
                            results.append(content)

                    # Recurse deeper
                    if isinstance(value, dict):
                        results.extend(traverse(value, target_title, depth + 1))
                    elif isinstance(value, list):
                        for child in value:
                            results.extend(traverse(child, target_title, depth + 1))

            elif isinstance(node, list):
                for child in node:
                    results.extend(traverse(child, target_title, depth + 1))

            return results
        # --- Extract compliance sections ---
        extracted = {}
        print("Compliance sections:", compliance_sections)
        for section_type, section_title in compliance_sections.items():
            print("Processing section:", section_type, "with title:", section_title)
            text_blocks = traverse(root_node, section_title)
            extracted[section_type] = {
                "section_title": section_title,
                "text": "\n".join(text_blocks) if text_blocks else None
            }
        extracted = clean_and_deduplicate_sections(extracted)

        # Save combined.json for comparison
        combined_path = os.path.join(output_dir, "combined.json")
        with open(combined_path, "w", encoding="utf-8") as f:
            json.dump({"compliance_sections": extracted}, f, indent=2, ensure_ascii=False)

        download_url = f"http://localhost:8050/projects/{project_id}/pdfs/{pdf_id}/json/combined.json"
        return {"download_url": download_url, "compliance_sections": extracted}


    else:
        raise HTTPException(400, f"Unknown pipeline stage: {stage_id}")


# Add this new function after the existing ask_groq_with_file_content function

def ask_groq_for_comparison_table(compliance_data):
    """
    Call Groq to generate a comparison table from compliance sections data
    """
    client = Groq(api_key=GROQ_API_KEY)
    system_prompt = """
You are given tender compliance sections in JSON format under "compliance_sections". Your task is to extract key requirements, penalties, and conditions from each section and generate a crisp comparison table.

Instructions:
1. For each section (scope_of_work, eligibility, emd, pbg, declarations, warranty_sla, payment_terms), create a row.
2. Columns must be:
   - Section (short title with clause reference)
   - Key Requirement / Details (main obligations, conditions, values, or processes)
   - Penalty / Notes (any penalties, restrictions, or special notes)

3. Keep the table concise, professional, and easy to compare.
4. Do not copy the raw text verbatim. Summarize clearly.
5. Ensure all percentages, monetary values, and deadlines are preserved.
6. If a section has no data or is empty, mark it as "Not specified" or "N/A".

Output format: A Markdown table with columns:
| Section | Key Requirement / Details | Penalty / Notes |

Make sure the table is well-formatted and ready for display.
"""
    
    # Convert compliance data to JSON string for the prompt
    compliance_json = json.dumps(compliance_data, indent=2)
    
    chat_completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": f"Here is the compliance data:\n\n{compliance_json}"
            }
        ],
        temperature=0.1  # Lower temperature for more consistent formatting
    )
    return chat_completion.choices[0].message.content


# Add this new endpoint after the existing pipeline stage endpoints

@app.post("/projects/{project_id}/pdfs/{pdf_id}/generate_table")
async def generate_comparison_table(project_id: str, pdf_id: str):
    """
    Generate a comparison table from the combined.json file using Groq
    """
    output_dir = pdf_output_dir(project_id, pdf_id)
    combined_json_path = os.path.join(output_dir, "combined.json")
    
    if not os.path.exists(combined_json_path):
        raise HTTPException(404, f"combined.json not found. Please run pipeline stage 3 first.")
    
    # Read the compliance data
    with open(combined_json_path, "r", encoding="utf-8") as f:
        combined_data = json.load(f)
    
    compliance_sections = combined_data.get("compliance_sections", {})
    
    if not compliance_sections:
        raise HTTPException(400, "No compliance sections found in combined.json")
    
    try:
        # Generate the table using Groq
        table_markdown = ask_groq_for_comparison_table(compliance_sections)
        
        # Save the table to a file
        table_path = os.path.join(output_dir, "comparison_table.md")
        with open(table_path, "w", encoding="utf-8") as f:
            f.write(table_markdown)
        
        return {
            "status": "success",
            "table_markdown": table_markdown,
            "table_file_path": table_path,
            "message": "Comparison table generated successfully"
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error generating comparison table: {str(e)}")


# Modify the existing stage 3 endpoint to optionally generate the table automatically
# Update the stage_id == 3 section in the run_pipeline_stage function:

# Replace the existing stage 3 return statement with:
"""
        # Save combined.json for comparison
        combined_path = os.path.join(output_dir, "combined.json")
        with open(combined_path, "w", encoding="utf-8") as f:
            json.dump({"compliance_sections": extracted}, f, indent=2, ensure_ascii=False)

        # Optionally generate comparison table automatically
        try:
            table_markdown = ask_groq_for_comparison_table(extracted)
            table_path = os.path.join(output_dir, "comparison_table.md")
            with open(table_path, "w", encoding="utf-8") as f:
                f.write(table_markdown)
            table_generated = True
        except Exception as e:
            print(f"Warning: Could not generate comparison table: {e}")
            table_markdown = None
            table_generated = False

        download_url = f"http://localhost:8050/projects/{project_id}/pdfs/{pdf_id}/json/combined.json"
        
        response = {
            "download_url": download_url, 
            "compliance_sections": extracted,
            "table_generated": table_generated
        }
        
        if table_generated:
            response["comparison_table"] = table_markdown
            
        return response
"""


# Add an endpoint to serve the markdown table file
@app.get("/projects/{project_id}/pdfs/{pdf_id}/comparison_table")
async def get_comparison_table(project_id: str, pdf_id: str):
    """
    Retrieve the generated comparison table
    """
    output_dir = pdf_output_dir(project_id, pdf_id)
    table_path = os.path.join(output_dir, "comparison_table.md")
    
    if not os.path.exists(table_path):
        raise HTTPException(404, "Comparison table not found. Generate it first using the generate_table endpoint.")
    
    return FileResponse(table_path, media_type="text/markdown", filename="comparison_table.md")


# Add an endpoint for tender vs bid comparison (for future use)
@app.post("/projects/{project_id}/compare_tender_bids")
async def compare_tender_with_bids(project_id: str, request: Request):
    """
    Compare tender requirements with multiple bid submissions
    This endpoint would take tender PDF ID and multiple bid PDF IDs
    """
    data = await request.json()
    tender_pdf_id = data.get("tender_pdf_id")
    bid_pdf_ids = data.get("bid_pdf_ids", [])
    
    if not tender_pdf_id or not bid_pdf_ids:
        raise HTTPException(400, "Both tender_pdf_id and bid_pdf_ids are required")
    
    # This is a placeholder for future implementation
    # You would:
    # 1. Load tender compliance data
    # 2. Load each bid's compliance data  
    # 3. Create a comprehensive comparison table
    # 4. Use Groq to generate the comparison
    
    return {"message": "Tender vs Bid comparison not yet implemented"}
# ----------- RUN-ALL PIPELINE ENDPOINT FOR TESTING/BATCH RUNNING (Backend) --------

@app.post("/projects/{project_id}/pdfs/{pdf_id}/run_all")
async def run_all_stages_one_pdf(project_id: str, pdf_id: str):
    filename, pdf_bytes = await get_pdf_bytes(pdf_id)
    output_dir = pdf_output_dir(project_id, pdf_id)
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, filename)
    save_bytes_to_disk(pdf_path, pdf_bytes)

    tree = stage_parse_pdf(pdf_path, output_dir)
    toc_content = stage_extract_toc(tree, output_dir)
    auto_sections = stage_select_compliance_sections(toc_content, ask_groq_with_file_content)
    extracted = stage_extract_section_nodes(tree, auto_sections)
    dfs = stage_convert_to_df(extracted)
    excel_paths = stage_save_excel_files(output_dir, dfs)
    json_outputs = stage_transform_to_json(output_dir, excel_paths)
    return {"success": True, "auto_sections": auto_sections, "json_paths": json_outputs, "output_dir": output_dir}



# ----------- SCRIPT RUNNER FOR LOCAL BATCH TESTING OF WHOLE PIPELINE ---------------

def run_local_pipeline_for_project(project_id):
    import asyncio
    loop = asyncio.get_event_loop()
    pdfs = loop.run_until_complete(get_pdf_meta_for_project(project_id))
    for pdf in pdfs:
        print(f"Processing {pdf['filename']}...")
        result = loop.run_until_complete(run_all_stages_one_pdf(project_id, pdf['id']))
        print(result)
    print("All PDFs processed!")

# ----------- MAIN -----------------

if __name__ == "__main__":
    import sys
    # To run API:  python main.py api
    # To run local processing:  python main.py process <project_id>
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        uvicorn.run("app:app", host="0.0.0.0", port=8050, reload=True)
    elif len(sys.argv) > 2 and sys.argv[1] == "process":
        run_local_pipeline_for_project(sys.argv[2])
    else:
        print("Usage: python main.py api OR python main.py process <project_id>")