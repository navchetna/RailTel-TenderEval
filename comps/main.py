import re
import os
import sys
import json
import numpy as np
import pandas as pd
from groq import Groq
from io import StringIO
from dotenv import load_dotenv

from comps.parsers.tree import Tree
from comps.parsers.text import Text
from comps.parsers.table import Table
from comps.parsers.treeparser import TreeParser
from comps.dataprep.excel_to_json_price import excel_to_price_compliance_json
from comps.dataprep.excel_to_json_tech import excel_to_technical_compliance_json

load_dotenv()

PDF_DIR = os.environ.get("PDF_DIR")
print("Parsing pdfs in: ", PDF_DIR)

GROQ_API_KEY= os.getenv('GROQ_API_KEY')
OUTPUT_DIR = 'tender-eval-outputs-1'

def parse_pdf(pdf_path):
    """Parse a single PDF and return the tree object"""
    filename_base = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Check if this PDF has already been processed successfully
    json_dir = os.path.join(OUTPUT_DIR, os.path.basename(pdf_path), 'json')
    if os.path.exists(json_dir) and os.path.exists(os.path.join(json_dir, 'combined.json')):
        print(f"PDF {filename_base} already processed successfully. Creating tree object...")
        # Still create and return the tree for downstream processing
        tree = Tree(pdf_path)
        parser = TreeParser(OUTPUT_DIR)
        parser.populate_tree(tree)
        return tree
    
    # Create the Tree and parser
    tree = Tree(pdf_path)
    parser = TreeParser(OUTPUT_DIR)
    # Populate the tree
    parser.populate_tree(tree)
    # Save hierarchy as text
    parser.generate_output_text(tree)
    # Save hierarchy as JSON
    parser.generate_output_json(tree)

    print("Parsing complete!")
    print(f"See outputs in: out/{tree.file.split('/')[-1].replace('.pdf','')}")
    
    return tree

def find_toc_for_pdf(pdf_filename):
    """
    Find the TOC file for a specific PDF. 
    The TreeParser seems to create a single toc.txt that gets overwritten.
    """
    filename_base = os.path.splitext(pdf_filename)[0]
    
    # The most likely location based on debug output
    primary_toc_path = f"{OUTPUT_DIR}/toc.txt"
    
    if os.path.exists(primary_toc_path):
        print(f"DEBUG: Found TOC at: {primary_toc_path}")
        return primary_toc_path
    
    # Alternative locations
    possible_paths = [
        f"out/{filename_base}/toc.txt",
        f"{OUTPUT_DIR}/{filename_base}/toc.txt", 
        f"./{filename_base}/toc.txt",
        f"{filename_base}/toc.txt",
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"DEBUG: Found TOC at alternative location: {path}")
            return path
    
    return None

def create_pdf_specific_toc(tree, pdf_filename):
    """
    Create a PDF-specific TOC from the tree object if the generic one doesn't work
    """
    try:
        filename_base = os.path.splitext(pdf_filename)[0]
        toc_content = []
        
        def extract_toc_from_node(node, level=0):
            indent = "  " * level
            heading = node.get_heading()
            if heading:
                toc_content.append(f"{indent}{heading}")
            
            for i in range(node.get_length_children()):
                extract_toc_from_node(node.get_child(i), level + 1)
        
        extract_toc_from_node(tree.rootNode)
        
        if toc_content:
            pdf_specific_toc_path = f"{OUTPUT_DIR}/{filename_base}_toc.txt"
            with open(pdf_specific_toc_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(toc_content))
            print(f"Created PDF-specific TOC: {pdf_specific_toc_path}")
            return pdf_specific_toc_path
    
    except Exception as e:
        print(f"Error creating PDF-specific TOC: {e}")
    
    return None

def read_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return content
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return None
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

def ask_groq_with_file_content(file_path):
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not found in environment variables")
        return "{}"
        
    client = Groq(api_key=GROQ_API_KEY)

    document_content = read_file_content(file_path)
    if document_content is None:
        print("Document content is None, returning empty response")
        return "{}"

    toc_content = f"TOC Content:\n```\n{document_content}\n```\n"

    system_prompt = """
        You are an information extraction API that identifies the most relevant sections from a tender document's Table of Contents (TOC) for technical and price compliance.
        
        Your task is to identify exactly two entries:
        1) One section that is the most relevant for evaluating technical compliance.
        2) One section that is the most relevant for evaluating price/commercial compliance.
        
        - The "technical" field should contain the single TOC entry that is most relevant to **technical compliance**, such as Platform Capabilities, functional requirements, platform specifications, implementation details, architecture.

        - The "price" field should contain the single most relevant entry for **price compliance**, which typically refers to a **price bid table** or **price evaluation section**. These are usually structured tables in the document where bidders must approximate the cost of delivering each line item. These entries are often titled **"Price Bid Evaluation"**, **"Commercial Bid Evaluation"**, or similar.
        
        You must respond only with JSON in the following format:

        {
            "technical": "<section_number> <section_title>",
            "price": "<section_number> <section_title>"
        }

        These sections will be used to compare the tender requirements against bidder documents, so it is critical to select the sections that provide the clearest and most complete technical and price requirement details respectively. Even a single extra whitespace can cause the program to fail to find the section, so ensure the output is exactly as specified. You should EXACTLY match the section titles as they appear in the TOC, including any leading numbers or formatting.
    
        Respond only with the JSON object described above. Do not include any explanation, preamble, or notes.
    """
    
    try:
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

        response = chat_completion.choices[0].message.content
        print(f"Groq response: {response}")
        return response

    except Exception as e:
        print(f"An error occurred with Groq API: {e}")
        return "{}"

def fuzzy_matches(heading, query):
    from fuzzywuzzy import fuzz
    score = fuzz.ratio(heading.strip().lower(), query.strip().lower())
    return score >= 90

def find_node_by_level_or_title(rootNode, query):
    print("Searching for:", query)
    
    if fuzzy_matches(rootNode.get_heading(), query):
        print(f"High score for '{rootNode.get_heading().strip()}' with '{query.strip()}'!\n")
        return rootNode

    for i in range(rootNode.get_length_children()):
        result = find_node_by_level_or_title(rootNode.get_child(i), query)
        if result:
            return result

    return None

def retrieve_from_pdf(target_node):
    if target_node:
        print("Found Node:", target_node.get_heading())
        for item in target_node.get_content():
            if hasattr(item, "markdown_content"):
                return(item.markdown_content)
    else:
        print("No table/Node found")
        
    return(None)

def markdown_to_df(markdown_content, section_title):
    if markdown_content is None:
        print("Markdown content is None, creating empty DataFrame")
        return pd.DataFrame()
    
    section_title = section_title.replace(" ", "_")

    lines = [line for line in markdown_content.splitlines() if line.strip().startswith('|')]
    
    if not lines:
        print("No table lines found in markdown content, creating empty DataFrame")
        return pd.DataFrame()
    
    cleaned_table_str = '\n'.join(lines)

    try:
        df = pd.read_csv(StringIO(cleaned_table_str), sep='|', engine='python', skipinitialspace=True)
        df = df.iloc[1:]
        df = df.drop(df.columns[[0, -1]], axis=1)
        df.columns = [col.strip() for col in df.columns]
        print("DataFrame created from markdown content")
        return df
    except Exception as e:
        print(f"Error creating DataFrame from markdown: {e}")
        return pd.DataFrame()

def combine_price_and_tech_json(json_dir_path, output_filename="combined.json"):
    combined_data = {
        "price_compliance": {},
        "technical_compliance": {}
    }
    
    for file_name in os.listdir(json_dir_path):
        if not file_name.endswith('.json') or file_name == output_filename:
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
    
    print(f"Combined JSON saved to {output_path}")

def process_single_pdf(pdf_path):
    """Process a single PDF through the entire pipeline"""
    filename = os.path.basename(pdf_path)
    filename_base = os.path.splitext(filename)[0]
    
    print(f"\n{'='*60}")
    print(f"PROCESSING: {filename}")
    print(f"{'='*60}")
    
    ## PART 1: Parse PDF and create tree
    tree = parse_pdf(pdf_path)
    print(f"Tree created for {filename}")

    ## PART 2: Find or create TOC
    toc_path = find_toc_for_pdf(filename)
    
    if not toc_path:
        print("No existing TOC found, creating PDF-specific TOC from tree...")
        toc_path = create_pdf_specific_toc(tree, filename)
    
    if not toc_path:
        print(f"Could not create TOC for {filename}, skipping")
        return False

    ## PART 3: Extract sections using Groq
    sections_str = ask_groq_with_file_content(toc_path)
    
    try:
        compliance_sections = json.loads(sections_str)
        if not compliance_sections or len(compliance_sections) == 0:
            print("No compliance sections found, skipping this PDF")
            return False
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        print(f"Response was: {sections_str}")
        return False

    print(f"Found compliance sections: {compliance_sections}")

    ## PART 4: Process sections and create outputs
    json_dir = os.path.join(OUTPUT_DIR, filename, 'json')
    excel_dir = os.path.join(OUTPUT_DIR, filename, 'excel')
    os.makedirs(json_dir, exist_ok=True)
    os.makedirs(excel_dir, exist_ok=True)

    processed_sections = 0
    
    for section_type, section_title in compliance_sections.items():
        if not section_title:
            print(f"Empty section title for {section_type}, skipping")
            continue
            
        # Remove leading numbers/dots if present
        clean_title = section_title[2:].strip() if len(section_title) > 2 and section_title[:2].replace('.', '').isdigit() else section_title.strip()

        print(f"\nProcessing {section_type} section: '{clean_title}'")
        
        target_node = find_node_by_level_or_title(tree.rootNode, clean_title)
        markdown_content = retrieve_from_pdf(target_node)

        df = markdown_to_df(markdown_content, clean_title)
        
        if df.empty:
            print(f"Empty DataFrame for section {clean_title}, skipping")
            continue
            
        section_title_clean = clean_title.replace(' ', '_').replace('(', '').replace(')', '').replace(',', '_')

        excel_path = os.path.join(excel_dir, f"{section_title_clean}.xlsx")
        df.to_excel(excel_path, index=False)
        print(f"DataFrame saved to '{excel_path}'")

        json_path = os.path.join(json_dir, f"{section_title_clean}.json")
        try:
            if "price" in section_type.lower():
                compliance_json = excel_to_price_compliance_json(excel_path)
            else:
                compliance_json = excel_to_technical_compliance_json(excel_path)
            
            with open(json_path, 'w') as fh:
                json.dump(compliance_json, fh, indent=4)
            
            processed_sections += 1
            print(f"JSON saved for {section_type}: {json_path}")
            
        except Exception as e:
            print(f"Error processing compliance JSON for {clean_title}: {e}")
            continue

    if processed_sections > 0:
        print(f"Combining JSON files for {filename}...")
        combine_price_and_tech_json(json_dir)
        print(f"Successfully processed {filename} with {processed_sections} sections!")
        return True
    else:
        print(f"No sections were successfully processed for {filename}")
        return False

def ingest_pdf_directory(pdf_dir):
    """Process all PDFs in a directory"""
    if not os.path.exists(pdf_dir):
        print(f"ERROR: PDF directory {pdf_dir} does not exist")
        return
    
    pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        print(f"No PDF files found in {pdf_dir}")
        return
    
    print(f"Found {len(pdf_files)} PDF files to process")
    
    successful = 0
    failed = 0
    
    for filename in pdf_files:
        pdf_path = os.path.join(pdf_dir, filename)
        try:
            if process_single_pdf(pdf_path):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            print(f"ERROR processing {filename}: {e}")
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"SUMMARY: {successful} successful, {failed} failed")
    print(f"{'='*60}")

if __name__ == "__main__":
    if not PDF_DIR:
        print("ERROR: PDF_DIR environment variable not set")
        sys.exit(1)
    
    ingest_pdf_directory(PDF_DIR)