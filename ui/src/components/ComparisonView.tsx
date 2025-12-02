// import React, { useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { CheckCircle, XCircle, AlertCircle, Award, DollarSign, FileCheck, Code2, RefreshCw, Download } from "lucide-react"

// const ComparisonView = () => {
//   const [selectedBidId, setSelectedBidId] = useState("")
//   const [isGeneratingTable, setIsGeneratingTable] = useState(false)

//   const sampleComparisons = [
//     {
//       bidId: "BID-001",
//       bidderName: "control-centre-bid-seperated.pdf",
//       technicalScore: 85,
//       priceScore: 90,
//       overallScore: 87,
//       status: "winner",
//       technicalCompliance: { compliant: 17, nonCompliant: 3, total: 20 },
//       priceCompliance: { 
//         totalPrice: 450000, 
//         breakdown: { "Hardware": 200000, "Software": 150000, "Services": 100000 } 
//       }
//     }
//   ]

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "winner":
//         return "text-green-600"
//       case "qualified":
//         return "text-blue-600"
//       default:
//         return "text-red-600"
//     }
//   }

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "winner":
//         return <Award className="h-4 w-4 text-green-600" />
//       case "qualified":
//         return <CheckCircle className="h-4 w-4 text-blue-600" />
//       default:
//         return <XCircle className="h-4 w-4 text-red-600" />
//     }
//   }

//   const getComplianceColor = (compliance) => {
//     switch (compliance) {
//       case "compliant":
//         return "bg-green-100 text-green-800 border-green-200"
//       case "non-compliant":
//         return "bg-red-100 text-red-800 border-red-200"
//       case "partial":
//         return "bg-yellow-100 text-yellow-800 border-yellow-200"
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200"
//     }
//   }

//   const getComplianceIcon = (compliance) => {
//     switch (compliance) {
//       case "compliant":
//         return <CheckCircle className="h-4 w-4" />
//       case "non-compliant":
//         return <XCircle className="h-4 w-4" />
//       case "partial":
//         return <AlertCircle className="h-4 w-4" />
//       default:
//         return <AlertCircle className="h-4 w-4" />
//     }
//   }

//   const sampleComparisonTable = [
//     {
//       section: "Scope of Work (1;5)",
//       tenderRequirement: "Supply within 60 days from LOA. Material warranty for 1 year from delivery.",
//       tenderPenalty: "0.5% per week delay, max 10% of contract value",
//       bidResponse: "Unity platform complies with all technical requirements. Bi-directional control, real-time monitoring.",
//       bidCompliance: "compliant",
//       notes: "Full compliance with delivery timeline"
//     },
//     {
//       section: "Eligibility (1;9)",
//       tenderRequirement: "Single order ≥35% of estimated bid value OR Two orders ≥20% each OR Three orders ≥15% each. Min turnover 150% of tender value.",
//       tenderPenalty: "Bid rejection if criteria not met",
//       bidResponse: "Three major C&C/SCADA projects >Rs. 1.5 Cr each. Average turnover Rs. 22.5 Cr (FY 2017-20).",
//       bidCompliance: "compliant",
//       notes: "Exceeds minimum requirements"
//     },
//     {
//       section: "EMD (1;6)",
//       tenderRequirement: "Rs. 2,66,600 via RTGS to RailTel account",
//       tenderPenalty: "Bid rejection if not submitted",
//       bidResponse: "EMD of Rs. 10 Lakhs submitted",
//       bidCompliance: "compliant",
//       notes: "Submitted higher amount than required"
//     },
//     {
//       section: "PBG (1;8)",
//       tenderRequirement: "5% of PO value, validity 3 months beyond warranty period",
//       tenderPenalty: "15% per annum penal interest for delay",
//       bidResponse: "Not specified in bid documents",
//       bidCompliance: "not-specified",
//       notes: "To be provided upon contract award"
//     },
//     {
//       section: "Declarations (1;13)",
//       tenderRequirement: "Notarized affidavit on non-judicial stamp paper",
//       tenderPenalty: "Bid rejection if not submitted",
//       bidResponse: "Integrity Pact (IP) and NDA submitted digitally. Not blacklisted by BPCL/MoP&NG.",
//       bidCompliance: "compliant",
//       notes: "All required declarations submitted"
//     },
//     {
//       section: "Warranty/SLA (1;11)",
//       tenderRequirement: "1 year warranty from delivery. Service within 7 days.",
//       tenderPenalty: "0.5% unit price per week delay, max 100% unit price",
//       bidResponse: "Not explicitly mentioned in bid response",
//       bidCompliance: "not-specified",
//       notes: "Needs clarification on warranty terms"
//     },
//     {
//       section: "Payment Terms (1;12)",
//       tenderRequirement: "80% on delivery + inspection, 20% on installation & commissioning",
//       tenderPenalty: "None specified",
//       bidResponse: "Price bid submitted as per format. Total value approximately Rs. 15.8 Cr over 5 years.",
//       bidCompliance: "compliant",
//       notes: "Pricing structure aligns with tender requirements"
//     }
//   ]

//   const leftJsonData = {
    
//   "compliance_sections": {
//     "scope_of_work": {
//       "section_title": "1;5 Delivery Period, Consignee Address and inspection",
//       "text": "- 5.1 Delivery Period: The supplier will have to supply the material within 60 days from the date of issue of GeM Contract/ LOA. If material is not supplied within the approved delivery period, a penalty of 0.5% per week on the undelivered/ uninstalled quantity, subject to a maximum of 10% of the contract value, will be levied.\n- 5.1.1 If the supplier fails to deliver the goods or any instalment thereof within the delivery period specified in the contract or any extension thereof, or repudiates the contract before the expiry of such period, the Purchaser may, without prejudice to other rights, recover from the supplier Liquidated Damages at the rate of 0.5% of the price of the undelivered goods (including applicable taxes, duties, freight, etc.) for each week or\npart thereof during which the delay continues, provided the delayed delivery is accepted by the Purchaser. The total amount of LD shall not exceed 10% of the total contract value.\n\nPost Receipt Inspection at consignee Site before acceptance of stores: Nominated RailTel Executive by CA.\nSupplier should also submit data sheet, guarantee and fitment certificate along with the supply of materials.\n"
//     },
//     "eligibility": {
//       "section_title": "1;9 Eligibility Criteria",
//       "text": " The bidder/ OEM (themselves or through reseller(s)) having valid authorization of OEM) should have executed project for supply and installation/ commissioning of same or similar category Products during preceding 03 (three) financial years (i.e. current year and three previous financial years) as on opening of bid, as per following criteria:\n- (i) Single Order of at least 35% of estimated bid value; or\n- (ii) Two Orders of at least 20% each of estimated bid value; or\n- (iii) Three Orders of at least 15% each of estimated bid value.\nSatisfactory performance certificate issued by respective Buyer Organization for the above Orders should be uploaded with bid. In case of bunch bids, the Category related to primary product having highest bid value should meet this criterion.\n#### Definition of similar work: Supply, SITC of UPS, Chargers, Battery Banks, Inverters in any Government/ State Government/ PSU/ Public listed Company/ reputed Telco.\nNote: In case a contract is started prior to 03 (three) years, ending on the date of opening of bid, but completed in last 03 (three) years, ending on the date of opening of bid, the completed work shall be considered for fulfilment of credentials.\n Work experience certificate from private individual shall not be considered. However, in addition to work experience certificates issued by any Govt. Organization, PSU or any reputed TELCO, work experience certificate issued by Public listed company having average annual turnover of Rs.500 crore and above in last 3 financial years excluding the current financial year, listed on National Stock Exchange or Bombay Stock Exchange, incorporated/ registered at least 5 years prior to the date of opening of tender, shall also be considered provided the work experience certificate has been issued by a person authorized by the Public listed company to issue such certificates. In case tenderer submits work experience certificate issued by public listed company, the tenderer shall also submit along with work experience certificate, the relevant copy of work order, bill of quantities, bill wise details of payment received duly certified by Chartered Accountant, TDS certificates for all payments received and copy of final/ last bill paid by company in support of above work experience certificate.\n\nThe bidder should have minimum cumulative turnover from operation in the previous three financial years and the current financial year, at least 150% of the advertised value of the tender. The tenderers shall submit Certificates to this effect which may be an attested Certificate from the concerned department/ client or Audited Balance Sheet duly certified by the Chartered Accountant/ Certificate from Chartered Accountant duly supported by Audited Balance Sheet. The contact details of CA/ Statutory Auditor along with UDIN No. shall be mandatorily mentioned on copy of certified Balance Sheet/ Certificate.\nNote: Client certificate from other than Govt. Organization should be duly supported by Form 16A/ 26AS generated through TRACES of Income Tax Department of India.\n- 9.3 The bidder shall submit an authorization certificate specific to this tender from the respective OEM, as per Annexure-II. In case the OEM itself is participating in the bid, a self-declaration to this effect shall be submitted in lieu of the authorization.\n- 9.4 Bidder and OEM should Not be convicted (within three years preceding the last date of bid submission) or stand declared ineligible/ suspended/ blacklisted/ banned/ debarred by any other Ministry/ Department/ PSUs of the Government of India from participation in Tender Processes of all of its entities. An undertaking to this effect signed by the authorized signatory to be submitted by the Bidder.\n"
//     },
//     "emd": {
//       "section_title": "1;6 Estimated cost of tender & Earnest Money Deposit (EMD)",
//       "text": "- 6.1 Estimated cost of tender: Estimated cost of the Tender is Rs. 1,33,29,162/- (Incl. GST).\n- 6.2 Earnest Money Deposit (EMD): Rs. 2,66,600/- with Payment online through RTGS/ internet banking in Beneficiary name RailTel Corporation of India Limited Account No. 11037321307, IFSC Code SBIN0001821, Bank Name: State Bank of India, Branch address: Churchgate Branch, Maharshi Karve Marg, Mumbai- 400020.\n- 6.2.1 The bidder seeking EMD exemption, must submit the valid supporting document for the relevant category as per the GeM General Terms and Conditions. However, in lieu of EMD, the bidder must submit Bid Securing Declaration (BSD) as per 'Annexure-IX.\n\n- 6.2.3 No exemption is, however, applicable to these units from payment of security deposit/ Performance Bank Guarantee.\n- 6.2.4 Earnest Money of the unsuccessful bidder will be discharged/returned as promptly as possible. No interest shall be payable on the EMD.\n- 6.3 RailTel is registered with m1xchange TReDS platform having buyer registration number \"BUYER00001496\". The URL for m1xchange platform is https://m1xchange.com. MSE suppliers/ vendors are required to register themselves on m1xchange platform for availing the facility of bill discounting on TReDS portal. The bidder is mandatorily required to submit its TReDS registration number (as provided by m1xchange portal) and GRN (Goods/ Service Receipt Note) Number (as provided by RailTel on delivery of Goods/ Service) while submitting the invoices if requires to avail TReDS facility.\n- 6.4 MSE vendor will bear all costs relating to availing the facility of discounting on TReDS platform including but not limited to Registration charges, Transaction charges for financing, Discounting charges, Interest on financing, or any other charges known by any name shall be borne by MSE vendor.\n- 6.5 MSE vendor hereby agrees to indemnify, hold harmless and keep RailTel and affiliates, Directors, Officers, representative, agents and employees indemnified, from any and all damages, losses claims and liabilities (including legal costs) which may arise from Sellers submission, posting or display, participation, in any manner, on the TReDS platform or from the use of Services from the Buyer's breach of any of the terms and conditions of the Usage terms or of this agreement and any applicable Law on a full indemnity basis.\n- 6.6 RailTel shall not be liable for any special, indirect, punitive, incidental or consequential damages or any damages whatsoever (including but not limited to damage for loss of profits or savings, business interruption, loss of information), whether in contract, tort, equity or otherwise or any other damages resulting from using TReDS platform for discounting their (MSE Vendor's) invoices.\n- 7 This bid complies with \"Public Procurement (preference to make in India) Policy Order, 2017 or latest issued by DIPP and Public Procurement Policy for Micro and Small Enterprises (MSEs) order,2012\" or latest issued by MoSME.\" The bidders claiming the preference have to submit relevant documents prescribed under relevant order.\nThis bid complies with \"Department of Expenditure's (DoE) Public Procurement Division Order (Public procurement no 1, 2 & 3 vide ref. F.No.6/18/2019-PPD dated 23.07.2020 & 24.7.2020 or latest regarding restrictions on procurement from a bidder of a country which shares a land border with India\"\n"
//     },
//     "pbg": {
//       "section_title": "1;8 Security Deposit/Performance Bank Guarantee",
//       "text": "The successful tenderer shall submit security deposit in the form of DD or irrevocable Bank Guarantee from any scheduled bank for due fulfillment of contract as per the details given below:\n- i. Security Deposit/ Performance Bank Guarantee @ 5% of total value of Purchase Order is required to be submitted within 30 days of issue of Purchase Order with validity of 3 months beyond warranty period, failing which a penal interest of 15% per annum shall be charged for the delay period i.e. beyond 30 (thirty) days from the date of issue of LOA/PO. PBG format specified in Annexure-IV.\n- ii. The security deposit/ PBG shall be submitted to RCIL/WR, Mumbai.\n- iii. A separate advice of the BG will invariably be sent by the BG issuing bank to the RailTel's Bank through SFMS and only after this the BG will become\nacceptable to RailTel. It is therefore in own interest of bidder to obtain RailTel's bank IFSC code, its branch and address and advise these particulars to the BG issuing bank and request them to send advice of BG through SFMS to the RailTel's Bank.\n## This PBG should be from a Scheduled commercial Bank (either Private or PSU) but not by any cooperative Bank or NBFC and the claim validity period shall be 1 year after PBG validity for lodging the claim.\nThe security deposit/ Performance Bank Guarantee shall be released after successful completion of Contract obligations under the contract, duly adjusting any dues recoverable from the successful tenderer. Payment of Security Deposit in the form of Pay Order/Demand Draft should be made in favor of \"RailTel Corporation of India Ltd\" payable at Mumbai.\n#### Note:\n- 1. Any Performance security up to a value of Rs.5 Lakhs is to be submitted through online transfer only.\n- 2. No interest shall be paid on the amount of Performance Security held by RailTel, at any stage.\n"
//     },
//     "declarations": {
//       "section_title": "1;13 Notarized Affidavit",
//       "text": "The tenderers shall submit a notarized affidavit on a non-judicial stamp paper stating that they are not liable to be disqualified and all their statement/ documents submitted along with bid are true and factual. Standard format of the affidavit to be submitted by the bidder is enclosed as Annexure-III. Non submission of a notarized affidavit by the bidder shall result in summarily rejection of his/their bid. And it shall be mandatorily incumbent upon the tenderer to identify state and submit the supporting documents duly self-attested by which they/he is qualifying the Qualifying Criteria mentioned in the Tender Document. It will not be obligatory on the part of Tender\nCommittee to scrutinize beyond the submitted document of tenderer as far as his qualification for the tender is concerned.\nThe RailTel (RCIL) reserves the right to verify all statements, information and documents submitted by the bidder in his tender offer, and the bidder shall, when so required by the RailTel (RCIL), make available all such information, evidence and documents as may be necessary for such verification. Any such verification or lack of such verification by the RailTel (RCIL) shall not relieve the bidder of its obligations or liabilities hereunder nor will it affect any rights of the RailTel thereunder.\nIn case of any wrong information submitted by tenderer, the contract shall be terminated. Performance Guarantee (PG) of contract forfeited and agency barred for doing business on RailTel (RCIL).\n"
//     },
//     "warranty_sla": {
//       "section_title": "1;11 Warranty",
//       "text": " The materials are to be warranted for 1 year from date of delivery to the consignee. The tenderer shall warrant that stores to be supplied shall be new and free from all defects and faults in material, workmanship and manufacturing and shall be of the highest grade and consistent with the established and generally accepted standards of materials of the type ordered and shall perform in full conformity with the specifications and drawings.\nThe supplier shall be responsible for any defects that may develop under the conditions provided by the contract and under proper use, arising from faulty materials, design or workmanship such as corrosion, inadequate quantity of material to meet item requirements, inadequate contact protection, deficiencies in design and/ or otherwise and shall remedy such defects at his own cost when called upon to do so by the Purchaser who shall state in writing in what respect the stores are faulty.\nIf it becomes necessary for the contractor to replace or renew any defective portion/portions of the supplies under this clause, the provisions of the clause shall apply to the portion/portions of the equipment/ material so replaced or renewed or until the end of the above-mentioned period, whichever may be later. If any defect is not rectified within a reasonable time, the Purchaser may proceed to do the work at the contractor's risk and expenses, but without prejudice to any other rights which the Purchaser may have against the contractor in respect of such defects.\nReplacement under warranty clause shall be made by the contractor free of all charges at site including freight, insurance and other incidental charges.\nThe Contractor/Seller hereby covenants that it is a condition of this contract that all goods, stores, or articles furnished to the Purchaser shall be of the highest grade, free from all defects and faults, and made of the best materials, quality, manufacture, and workmanship, consistent with the established and generally accepted standards for the type ordered, in full conformity with the contract specifications, drawings, or samples (if any), and, if operable, shall operate properly.\n# 11.(a) SLA:\nAfter having been notified of the defects/ service requirement during warranty period, Seller has to complete the required Service/ Rectification within time limit of max. 7 days. If the Seller fails to complete service/ rectification within defined time limit, a penalty of 0.5% of Unit Price of the product shall be charged as penalty for each week of delay from the seller & up to max. of 100% of Uthe Unit Price of the product. Seller can deposit the penalty with the Buyer directly else the Buyer shall have a right to recover all such penalty amount from the Performance Security (PBG) or from any running bills payable to the Supplier.\n"
//     },
//     "payment_terms": {
//       "section_title": "1;12 Payment Conditions: -",
//       "text": "- i) 80 % of the value of the supply of Equipment on receipt by the consignee at site duly inspected and accompanied with above mentioned documents.\n  - Original Tax Invoice. (With separate Tax amount, containing POS, RailTel GSTN and Supplier GSTN).\n  - Delivery Challan/E-way bill\n  - Original Consignee receipt with GRN No.\n  - Original Inspection Certificate\n  - Transit Insurance Certificate\n  - Warranty Certificate of OEM\n  - Copy of BG/Proof of BG Submission\n  - Certificate of receipt of Goods in good condition from RailTel\n- ii) Balance 20% value of the part supply on successful installation & commissioning at site. Bidder has to install and commission the equipment within 30 days from the communication by RailTel EIC (Engineer in charge) in this regard. In case installation and commissioning is delayed due to any reason beyond the control of the Contractor then 20% payment can be released after submission of a bank Guarantee of equal amount valid for a period of one year.\n- iii) Any changes in the statutory taxes & duties during the contract period shall be on RailTel account within the original DOC. Beyond DOC, changes in statutory taxes & duties shall be on RailTel's account only when the delay is an account of RailTel.\n"
//     }
//   }
//     }


//   const bidJsonData = {
//     "BID-001": {
      
//   "compliance_sections": {
//     "scope_of_work": {
//       "section_title": "2;3. Response to Technical Requirements (Ref: Annexure1, Section1.2.2)",
//       "text": "Our proposed 'Unity' C&C Platform complies with all minimum technical requirements.\n**Supporting Document Uploaded:** OEM/ISV Declaration Form (Annexure 10) signed and stamped.\n | Platform Capability                            | Compliance Status |  |  |\n|------------------------------------------------|-------------------|--|--|\n| 1. Bi-directional control of field devices     | Compliant         |  |  |\n| 2. Web responsive                              | Compliant         |  |  |\n| 3. Real-time monitoring (CCTV, Sensors)        | Compliant         |  |  |\n| 4. Cloud-agnostic deployment                   | Compliant         |  |  |\n| 5. Secure data handling (HTTPS)                | Compliant         |  |  |\n| 6. Interoperability (standard protocols)       | Compliant         |  |  |\n| 7. Integration via API/adaptors                | Compliant         |  |  |\n| 8. Configurable and customizable               | Compliant         |  |  |\n| 9. Integration with SSO, LDAP                  | Compliant         |  |  |\n| 10. Integration with multiple automation       |                   |  |  |\n| systems                                        | Compliant         |  |  |\n| 11. Integration with multiple database systems | Compliant         |  |  |\n"
//     },
//     "eligibility": {
//       "section_title": "2;2. Response to Bid Qualification Criterion (BQC) (Ref: Annexure1, Section1.2.1)",
//       "text": "Our compliance with the BQC is detailed below. All supporting documents have been uploaded to the e-procurement portal.\n | BQC Criteria (as per Tender           | Innovate Integration                                    |                                 |  |  |\n|---------------------------------------|---------------------------------------------------------|---------------------------------|--|--|\n| Doc)                                  | Solutions' Compliance                                   | Uploaded                        |  |  |\n|                                       | We have successfully                                    |                                 |  |  |\n|                                       | implemented three major                                 |                                 |  |  |\n|                                       | C&C/SCADA integration                                   |                                 |  |  |\n|                                       | projects in the last 5 years,                           |                                 |  |  |\n|                                       | each with a value exceeding                             |                                 |  |  |\n|                                       | Rs. 1.5 Cr. Our proposed 'Unity'                        |                                 |  |  |\n|                                       | platform was implemented in                             | Annexure 11, Annexure 12        |  |  |\n| a.<br>Proven<br>Track<br>Record       | the PowerGrid Utility project.                          | (TPIA Certified)                |  |  |\n|                                       | i.<br>Turnover:<br>Our average                          |                                 |  |  |\n|                                       | annual financial turnover for                           |                                 |  |  |\n|                                       | the last three consecutive                              |                                 |  |  |\n|                                       | accounting years (FY 2017-18,                           |                                 |  |  |\n|                                       | 2018-19, 2019-20) is<br>Rs.<br>22.5                     |                                 |  |  |\n|                                       | Crores.                                                 |                                 |  |  |\n|                                       | ii.<br>Net<br>Worth:<br>Our net worth                   |                                 |  |  |\n|                                       | as per the latest audited                               | Audited Balance Sheets and      |  |  |\n|                                       | financial statement (FY 2019-                           | P&L Accounts for FY 2017-18,    |  |  |\n| b.<br>Financial<br>Capacity           | 20) is positive.                                        | 2018-19, 2019-20.               |  |  |\n|                                       | We are a<br>CMMI<br>for<br>Services                     |                                 |  |  |\n|                                       | Level<br>5<br>appraised<br>Self-attested copy of valid  |                                 |  |  |\n| c.<br>Maturity<br>on<br>Services      | organization.                                           | CMMI Level 5 certificate.       |  |  |\n|                                       | Our 'Unity' platform has been                           |                                 |  |  |\n|                                       | deployed for our client,                                |                                 |  |  |\n|                                       | National Energy Corp,                                   |                                 |  |  |\n|                                       | integrating: 1) IoT (CCTV), 2)                          |                                 |  |  |\n| d.<br>Credentials<br>of<br>Technology | SCADA, 3) ERP workflow, and                             | OEM Declaration as per          |  |  |\n| Platform                              | 5) Data Lake.                                           | Annexure 13.                    |  |  |\n|                                       | Our partners for VA (VisionAI                           |                                 |  |  |\n|                                       | Ltd.) and Communication                                 |                                 |  |  |\n|                                       | Systems (ConnectComms Inc.)                             | Online declaration with partner |  |  |\n| e.<br>Communication<br>System<br>/    | have authorized presence and<br>details (Name, Address, |                                 |  |  |\n| VA<br>Capabilities                    | service centers in India.                               | Contact).                       |  |  |\n\n- **Our Claim:** Innovate Integration Solutions is appraised at **CMMI for Services, Maturity Level 5**. We claim the **maximum 10 marks**.\n- **Document Uploaded:** Self-attested valid CMMI Level 5 certificate.\n- **3. Demonstration of Platform (Max Marks: 35)**\n- We are prepared to demonstrate the full end-to-end functionality of our 'Unity' platform on a cloud environment. The demonstration will cover:\n  - **Exception Handling:** Live creation of an exception from a simulated field event, automated SOP workflow initiation, and notification via SMS/Email.\n  - **KPI Monitoring:** Real-time dashboards showing KPIs fed from simulated instruments (ATG, FCC) and various report generation (tabular, graphical, trend).\n  - **Bi-directional Control:** A live demonstration of an FCC shutdown command triggered from the C&C platform.\n  - **GIS Mapping:** Dynamic asset mapping on a GIS interface with drill-down capability for asset information and status.\n  - **UI/UX:** Showcase of our intuitive, user-friendly, and web-responsive interface, demonstrating ease of navigation.\n"
//     },
//     "emd": {
//       "section_title": "",
//       "text": null
//     },
//     "pbg": {
//       "section_title": "",
//       "text": null
//     },
//     "declarations": {
//       "section_title": "2;4. Compliance and Declarations",
//       "text": "- We confirm that we have submitted an **EMD of Rs. 10 Lakhs**.\n- We have digitally signed and uploaded the **Integrity Pact (IP)** as per Annexure 6.\n- We have digitally signed and uploaded the **Non-Disclosure Agreement (NDA)** as per Annexure 7.\n- We confirm we are not on the Black/Holiday List of BPCL, MoP&NG, or any Oil PSE.\n- We accept all contract terms and conditions as stated in Annexure 3.\n- We have submitted the **Vendor Code Creation Form** (Annexure 8) and **Common NEFT Mandate Form** (Annexure 14).\n# **Part 2: Quality Bid**\n\n- We will demonstrate our partner VisionAI's analytics engine, which achieves >90% accuracy, using both live and pre-recorded video feeds for all 5 use cases:\n  - 1. No Safety Belt detection\n  - 2. No Helmet detection\n  - 3. Intrusion Detection\n  - 4. Vehicle Count/Queue Management\n  - 5. Automatic Number Plate Recognition (ANPR)\n"
//     },
//     "warranty_sla": {
//       "section_title": "",
//       "text": null
//     },
//     "payment_terms": {
//       "section_title": "2;6. Price Bid Submission (Ref: Annexure1, Section1.4)",
//       "text": "- **Company Name:** Innovate Integration Solutions Pvt. Ltd.\n- **Year of Incorporation:** 2005\n- **Core Business:** System Integration, Enterprise Software Solutions, IoT & Automation, and Managed Services for large enterprises.\n- **Head Office:** Gurugram, Haryana\n- **Presence:** Offices in Mumbai, Bengaluru, Chennai, and Kolkata.\n\nOur compliance with the BQC is detailed below. All supporting documents have been uploaded to the e-procurement portal.\n | BQC Criteria (as per Tender           | Innovate Integration                                    |                                 |  |  |\n|---------------------------------------|---------------------------------------------------------|---------------------------------|--|--|\n| Doc)                                  | Solutions' Compliance                                   | Uploaded                        |  |  |\n|                                       | We have successfully                                    |                                 |  |  |\n|                                       | implemented three major                                 |                                 |  |  |\n|                                       | C&C/SCADA integration                                   |                                 |  |  |\n|                                       | projects in the last 5 years,                           |                                 |  |  |\n|                                       | each with a value exceeding                             |                                 |  |  |\n|                                       | Rs. 1.5 Cr. Our proposed 'Unity'                        |                                 |  |  |\n|                                       | platform was implemented in                             | Annexure 11, Annexure 12        |  |  |\n| a.<br>Proven<br>Track<br>Record       | the PowerGrid Utility project.                          | (TPIA Certified)                |  |  |\n|                                       | i.<br>Turnover:<br>Our average                          |                                 |  |  |\n|                                       | annual financial turnover for                           |                                 |  |  |\n|                                       | the last three consecutive                              |                                 |  |  |\n|                                       | accounting years (FY 2017-18,                           |                                 |  |  |\n|                                       | 2018-19, 2019-20) is<br>Rs.<br>22.5                     |                                 |  |  |\n|                                       | Crores.                                                 |                                 |  |  |\n|                                       | ii.<br>Net<br>Worth:<br>Our net worth                   |                                 |  |  |\n|                                       | as per the latest audited                               | Audited Balance Sheets and      |  |  |\n|                                       | financial statement (FY 2019-                           | P&L Accounts for FY 2017-18,    |  |  |\n| b.<br>Financial<br>Capacity           | 20) is positive.                                        | 2018-19, 2019-20.               |  |  |\n|                                       | We are a<br>CMMI<br>for<br>Services                     |                                 |  |  |\n|                                       | Level<br>5<br>appraised<br>Self-attested copy of valid  |                                 |  |  |\n| c.<br>Maturity<br>on<br>Services      | organization.                                           | CMMI Level 5 certificate.       |  |  |\n|                                       | Our 'Unity' platform has been                           |                                 |  |  |\n|                                       | deployed for our client,                                |                                 |  |  |\n|                                       | National Energy Corp,                                   |                                 |  |  |\n|                                       | integrating: 1) IoT (CCTV), 2)                          |                                 |  |  |\n| d.<br>Credentials<br>of<br>Technology | SCADA, 3) ERP workflow, and                             | OEM Declaration as per          |  |  |\n| Platform                              | 5) Data Lake.                                           | Annexure 13.                    |  |  |\n|                                       | Our partners for VA (VisionAI                           |                                 |  |  |\n|                                       | Ltd.) and Communication                                 |                                 |  |  |\n|                                       | Systems (ConnectComms Inc.)                             | Online declaration with partner |  |  |\n| e.<br>Communication<br>System<br>/    | have authorized presence and<br>details (Name, Address, |                                 |  |  |\n| VA<br>Capabilities                    | service centers in India.                               | Contact).                       |  |  |\n\n- **Our Claim:** Innovate Integration Solutions is appraised at **CMMI for Services, Maturity Level 5**. We claim the **maximum 10 marks**.\n- **Document Uploaded:** Self-attested valid CMMI Level 5 certificate.\n- **3. Demonstration of Platform (Max Marks: 35)**\n- We are prepared to demonstrate the full end-to-end functionality of our 'Unity' platform on a cloud environment. The demonstration will cover:\n  - **Exception Handling:** Live creation of an exception from a simulated field event, automated SOP workflow initiation, and notification via SMS/Email.\n  - **KPI Monitoring:** Real-time dashboards showing KPIs fed from simulated instruments (ATG, FCC) and various report generation (tabular, graphical, trend).\n  - **Bi-directional Control:** A live demonstration of an FCC shutdown command triggered from the C&C platform.\n  - **GIS Mapping:** Dynamic asset mapping on a GIS interface with drill-down capability for asset information and status.\n  - **UI/UX:** Showcase of our intuitive, user-friendly, and web-responsive interface, demonstrating ease of navigation.\n\nThe following price bid is submitted online in the prescribed format on the eprocurement portal. All costs are in INR and exclusive of taxes\n**Note:** The above table is a representation. The final binding submission is made on the e-procurement portal https://bpcleproc.in.\n**Annexure 6: Pro forma for Integrity Pact (IP)** - Duly signed and stamped.\n- **Annexure 7: Pro forma for Non-Disclosure Agreement (NDA)** Duly signed and stamped.\n- **Annexure 8: Vendor Code Creation Form** Completed with Innovate Integration Solutions Pvt. Ltd. details.\n- **Annexure 9: Pro forma for Performance Bank Guarantee** Acknowledged. To be provided upon award of contract.\n- **Annexure 10: OEM/ISV Declaration Form** Completed for our 'Unity' Platform and partner solutions.\n- **Annexure 11: Response to BQC Criteria a, Proven Track Record** Detailed table with client names, project values, completion certificates, and contact details for verification.\n- **Annexure 12: Response to BQC Criteria a, & Quality Bid Criteria 1 - Certificate from TPIA** - Certificate from 'Certified Verification Services India (Regd.)' verifying the project details provided in Annexure 11 & 13.\n- **Annexure 13: Response for Evaluation Criteria - 1** OEM declaration detailing the projects where our 'Unity' platform has been implemented, confirming the integration of required systems.\n- **Annexure 14: Common NEFT Mandate Form** Completed with our bank details. | Sl.No | Item                                   | Unit                  | Qty  | Unit Cost<br>(Ex. Tax) | Total Cost<br>(Ex. Tax) |\n|-------|----------------------------------------|-----------------------|------|------------------------|-------------------------|\n| 1     | C&C Platform and it's components       | Lump-sum              | 1    | 3,50,00,000            | 3,50,00,000             |\n|       | AMC of C&C Platform (10% of            |                       |      |                        |                         |\n| 2     | Item 1)                                | Per year              | 4    | 35,00,000              | 1,40,00,000             |\n| 3     | VA Solution at RO (10 Analytics)       | Per device            | 150  | 45,000                 | 67,50,000               |\n|       | AMC VA Solution at RO<br>(12% of       | Per device per        |      |                        |                         |\n| 4     | Item 3)                                | quarter               | 2400 | 1,350                  | 32,40,000               |\n|       | VA Solution at Terminals/LPG (20       |                       |      |                        |                         |\n| 5     | Analytics)                             | Per device            | 130  | 75,000                 | 97,50,000               |\n|       | AMC VA Solution at Terminals/LPG       | Per device per        |      |                        |                         |\n| 6     | (12% of Item 5)                        | quarter               | 2080 | 2,250                  | 46,80,000               |\n|       | Implementation Cost of C&C             |                       |      |                        |                         |\n| 7     | Platform                               | Lump-sum              | 1    | 1,25,00,000            | 1,25,00,000             |\n| 8     | Platform Maintenance Support           | Per quarter           | 16   | 12,00,000              | 1,92,00,000             |\n| 9     | Call Centre Solution (SaaS-30<br>User) | Per user per<br>month | 1392 | 2,500                  | 34,80,000               |\n| 10    | Operator Cost Year 1                   | Per man month         | 240  | 60,000                 | 1,44,00,000             |\n| 11    | Operator Cost Year 2                   | Per man month         | 288  | 63,000                 | 1,81,44,000             |\n| 12    | Operator Cost Year 3                   | Per man month         | 288  | 66,150                 | 1,90,51,200             |\n| 13    | Operator Cost Year 4                   | Per man month         | 288  | 69,458                 | 2,00,04,704             |\n| 14    | Operator Cost Year 5                   | Per man month         | 288  | 72,931                 | 2,10,04,128             |\n| 15    | Man-day Rate for Change Request        | Per Man-day           | 1000 | 25,000                 | 2,50,00,000             |\n"
//     }
//   }
// }
// }

//   const selectedBidData = bidJsonData[selectedBidId]
//   const sortedComparisons = [...sampleComparisons].sort((a, b) => b.overallScore - a.overallScore)

//   const handleGenerateComparisonTable = () => {
//     setIsGeneratingTable(true)
//     setTimeout(() => {
//       setIsGeneratingTable(false)
//       console.log("Comparison table generated!")
//     }, 2000)
//   }

//   return (
//     <div className="space-y-6 p-6">
//       <div className="flex items-center justify-between">
//         <h2 className="text-2xl font-bold">Bid Comparison Results</h2>
//         <div className="flex gap-2">
//           <Button 
//             onClick={handleGenerateComparisonTable} 
//             disabled={isGeneratingTable}
//             variant="outline"
//             className="shadow-sm"
//           >
//             {isGeneratingTable ? (
//               <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
//             ) : (
//               <FileCheck className="h-4 w-4 mr-2" />
//             )}
//             {isGeneratingTable ? "Generating..." : "Generate Table"}
//           </Button>
//           <Button onClick={() => console.log("Generating report...")} className="shadow-sm">
//             <Download className="h-4 w-4 mr-2" />
//             Generate Report
//           </Button>
//         </div>
//       </div>

//       <Tabs defaultValue="table-view" className="w-full">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="table-view">Table View</TabsTrigger>          
//           <TabsTrigger value="json-view">JSON View</TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="table-view" className="mt-6">
//           <Card className="shadow-md">
//             <CardHeader>
//               <CardTitle className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <FileCheck className="h-5 w-5 text-blue-600" />
//                   Compliance Comparison Table
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Select value={selectedBidId} onValueChange={setSelectedBidId}>
//                     <SelectTrigger className="w-64">
//                       <SelectValue placeholder="Select bid to compare..." />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {sampleComparisons.map((comparison) => (
//                         <SelectItem key={comparison.bidId} value={comparison.bidId}>
//                           {comparison.bidderName} ({comparison.bidId})
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {selectedBidId ? (
//                 <div className="overflow-x-auto">
//                   <table className="w-full border-collapse">
//                     <thead>
//                       <tr className="border-b-2 border-gray-200">
//                         <th className="text-left p-4 font-semibold bg-gray-50 w-32">Section</th>
//                         <th className="text-left p-4 font-semibold bg-gray-50 w-64">Tender Requirement</th>
//                         <th className="text-left p-4 font-semibold bg-gray-50 w-48">Penalty/Notes</th>
//                         <th className="text-left p-4 font-semibold bg-gray-50 w-64">Bid Response</th>
//                         <th className="text-left p-4 font-semibold bg-gray-50 w-32">Compliance</th>
//                         <th className="text-left p-4 font-semibold bg-gray-50 w-48">Assessment Notes</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {sampleComparisonTable.map((row, index) => (
//                         <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
//                           <td className="p-4 font-medium text-sm border-r border-gray-100">
//                             {row.section}
//                           </td>
//                           <td className="p-4 text-sm border-r border-gray-100">
//                             <div className="max-w-md">
//                               {row.tenderRequirement}
//                             </div>
//                           </td>
//                           <td className="p-4 text-sm border-r border-gray-100">
//                             <div className="max-w-xs text-orange-700">
//                               {row.tenderPenalty}
//                             </div>
//                           </td>
//                           <td className="p-4 text-sm border-r border-gray-100">
//                             <div className="max-w-md">
//                               {row.bidResponse}
//                             </div>
//                           </td>
//                           <td className="p-4 border-r border-gray-100">
//                             <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium border ${getComplianceColor(row.bidCompliance)}`}>
//                               {getComplianceIcon(row.bidCompliance)}
//                               {row.bidCompliance.replace('-', ' ')}
//                             </div>
//                           </td>
//                           <td className="p-4 text-sm">
//                             <div className="max-w-xs text-gray-600">
//                               {row.notes}
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   Please select a bid from the dropdown above to view the compliance comparison table.
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
        
//         <TabsContent value="json-view" className="mt-6">
//           <div className="grid grid-cols-2 gap-6 h-[600px]">
//             <Card className="shadow-md">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Code2 className="h-11 w-5 text-blue-600" />
//                   Tender Specs
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="h-[500px] overflow-hidden">
//                 <div className="h-full overflow-y-auto bg-gray-900 rounded-lg p-4">
//                   <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
//                     {JSON.stringify(leftJsonData, null, 2)}
//                   </pre>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="shadow-md">
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="flex items-center gap-2">
//                     <Code2 className="h-5 w-5 text-orange-600" />
//                     Bid Response
//                   </CardTitle>
//                   <Select value={selectedBidId} onValueChange={setSelectedBidId}>
//                     <SelectTrigger className="w-60">
//                       <SelectValue placeholder="Select a bid to display..." />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {sampleComparisons.map((comparison) => (
//                         <SelectItem key={comparison.bidId} value={comparison.bidId}>
//                           {comparison.bidderName} ({comparison.bidId})
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </CardHeader>
//               <CardContent className="h-[500px] overflow-hidden">
//                 <div className="h-full overflow-y-auto bg-gray-900 rounded-lg p-4">
//                   <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
//                     {selectedBidData 
//                       ? JSON.stringify(selectedBidData, null, 2)
//                       : selectedBidId 
//                         ? "Loading..." 
//                         : "Please select a bid from the dropdown above"
//                     }
//                   </pre>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>

      
//     </div>
//   )
// }

// export default ComparisonView


import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, AlertCircle, Award, DollarSign, FileCheck, Code2, RefreshCw, Download, Loader2 } from "lucide-react"

const ComparisonView = ({ projectId, tenderPdfId, bidPdfId }) => {
  const [selectedBidId, setSelectedBidId] = useState(bidPdfId || "")
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false)
  const [comparisonData, setComparisonData] = useState(null)
  const [tenderData, setTenderData] = useState(null)
  const [bidData, setBidData] = useState(null)
  const [error, setError] = useState(null)

  const getComplianceColor = (compliance) => {
    switch (compliance) {
      case "compliant":
        return "bg-green-100 text-green-800 border-green-200"
      case "non-compliant":
        return "bg-red-100 text-red-800 border-red-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "not-specified":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getComplianceIcon = (compliance) => {
    switch (compliance) {
      case "compliant":
        return <CheckCircle className="h-4 w-4" />
      case "non-compliant":
        return <XCircle className="h-4 w-4" />
      case "partial":
        return <AlertCircle className="h-4 w-4" />
      case "not-specified":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleGenerateComparison = async () => {
    if (!projectId || !tenderPdfId || !selectedBidId) {
      setError("Please select both tender and bid PDFs")
      return
    }

    setIsGeneratingComparison(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:8050/projects/${projectId}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tender_pdf_id: tenderPdfId,
          bid_pdf_id: selectedBidId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Comparison failed')
      }

      const data = await response.json()
      setComparisonData(data.comparison_results)
      
      // Also fetch the tender and bid combined.json for JSON view
      await fetchTenderAndBidData()
      
      console.log("Comparison generated successfully!", data)
    } catch (err) {
      setError(err.message)
      console.error("Error generating comparison:", err)
    } finally {
      setIsGeneratingComparison(false)
    }
  }

  const fetchTenderAndBidData = async () => {
    try {
      // Fetch tender data
      const tenderResponse = await fetch(`http://localhost:8050/projects/${projectId}/pdfs/${tenderPdfId}/json/combined.json`)
      if (tenderResponse.ok) {
        const tenderJson = await tenderResponse.json()
        setTenderData(tenderJson)
      }

      // Fetch bid data
      const bidResponse = await fetch(`http://localhost:8050/projects/${projectId}/pdfs/${selectedBidId}/json/combined.json`)
      if (bidResponse.ok) {
        const bidJson = await bidResponse.json()
        setBidData(bidJson)
      }
    } catch (err) {
      console.error("Error fetching JSON data:", err)
    }
  }

  // Convert comparison data to table rows
  const comparisonTableRows = comparisonData ? Object.entries(comparisonData).map(([key, value]) => ({
    section: value.section_title || key,
    tenderRequirement: value.tender_requirement || "Not specified",
    tenderPenalty: value.tender_penalty || "None specified",
    bidResponse: value.bid_response || "Not provided",
    compliance: value.compliance_status || "not-specified",
    notes: value.assessment_notes || "No assessment available"
  })) : []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bid Comparison Results</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateComparison} 
            disabled={isGeneratingComparison || !projectId || !tenderPdfId || !selectedBidId}
            variant="outline"
            className="shadow-sm"
          >
            {isGeneratingComparison ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Comparison
              </>
            )}
          </Button>
          <Button 
            onClick={() => window.open(`http://localhost:8050/projects/${projectId}/pdfs/${tenderPdfId}/json/comparison_result.json`, '_blank')}
            disabled={!comparisonData}
            className="shadow-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <Tabs defaultValue="table-view" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table-view">Table View</TabsTrigger>          
          <TabsTrigger value="json-view">JSON View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table-view" className="mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  Compliance Comparison Table
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparisonData ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-4 font-semibold bg-gray-50 w-32">Section</th>
                        <th className="text-left p-4 font-semibold bg-gray-50 w-64">Tender Requirement</th>
                        <th className="text-left p-4 font-semibold bg-gray-50 w-48">Penalty/Notes</th>
                        <th className="text-left p-4 font-semibold bg-gray-50 w-64">Bid Response</th>
                        <th className="text-left p-4 font-semibold bg-gray-50 w-32">Compliance</th>
                        <th className="text-left p-4 font-semibold bg-gray-50 w-48">LLM Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonTableRows.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-medium text-sm border-r border-gray-100">
                            {row.section}
                          </td>
                          <td className="p-4 text-sm border-r border-gray-100">
                            <div className="max-w-md max-h-32 overflow-y-auto">
                              {row.tenderRequirement.substring(0, 200)}
                              {row.tenderRequirement.length > 200 && "..."}
                            </div>
                          </td>
                          <td className="p-4 text-sm border-r border-gray-100">
                            <div className="max-w-xs text-orange-700">
                              {row.tenderPenalty}
                            </div>
                          </td>
                          <td className="p-4 text-sm border-r border-gray-100">
                            <div className="max-w-md max-h-32 overflow-y-auto">
                              {row.bidResponse.substring(0, 200)}
                              {row.bidResponse.length > 200 && "..."}
                            </div>
                          </td>
                          <td className="p-4 border-r border-gray-100">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium border ${getComplianceColor(row.compliance)}`}>
                              {getComplianceIcon(row.compliance)}
                              {row.compliance.replace('-', ' ')}
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            <div className="max-w-xs text-gray-600">
                              {row.notes}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">
                    No comparison data available. Click "Generate Comparison" to analyze tender vs bid compliance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="json-view" className="mt-6">
          <div className="grid grid-cols-2 gap-6 h-[600px]">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-600" />
                  Tender Specs
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[500px] overflow-hidden">
                <div className="h-full overflow-y-auto bg-gray-900 rounded-lg p-4">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {tenderData 
                      ? JSON.stringify(tenderData, null, 2)
                      : "Click 'Generate Comparison' to load data"
                    }
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-orange-600" />
                  Bid Response
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[500px] overflow-hidden">
                <div className="h-full overflow-y-auto bg-gray-900 rounded-lg p-4">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {bidData 
                      ? JSON.stringify(bidData, null, 2)
                      : "Click 'Generate Comparison' to load data"
                    }
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ComparisonView