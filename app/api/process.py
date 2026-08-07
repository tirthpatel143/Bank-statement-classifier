import os
import json
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.api.upload import JOB_STORE, RAW_DATA_DIR
from app.extraction.pdf_detector import detect_pdf_page_types
from app.extraction.text_extractor import extract_pdf_pages_text, get_full_text
from app.extraction.ocr_extractor import ocr_process_pdf_page
from app.extraction.table_extractor import extract_tables_from_pdf
from app.extraction.party_extractor import extract_party_details
from app.parsers.layout_detector import select_best_parser
from app.parsers.generic import GenericParser
from app.validation.transaction_checks import validate_transactions
from app.classification.hybrid import HybridClassifier
from app.schemas.models import StatementProcessResult, ProcessingStatus, Transaction

router = APIRouter()

PROCESSED_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "processed")
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

RESULT_STORE: Dict[str, StatementProcessResult] = {}
hybrid_classifier = HybridClassifier()

@router.post("/process/{job_id}", response_model=StatementProcessResult)
def process_statement(job_id: str):
    """
    Executes complete bank statement extraction pipeline:
    1. Validating & page type detection
    2. Text & OCR extraction
    3. Bank & layout detection
    4. Account details & transactions extraction
    5. Automatic party extraction (Sender / Recipient identification)
    6. Accounting validation checks
    7. Hybrid classification
    """
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job ID not found.")

    job_status = JOB_STORE[job_id]

    file_path = None
    for fname in os.listdir(RAW_DATA_DIR):
        if fname.startswith(job_id):
            file_path = os.path.join(RAW_DATA_DIR, fname)
            break

    if not file_path or not os.path.exists(file_path):
        job_status.status = "failed"
        job_status.error = "Raw uploaded PDF file not found."
        raise HTTPException(status_code=404, detail="Uploaded file missing.")

    try:
        # Step 1 & 2: Page-by-page PDF page type detection
        job_status.status = "validating"
        job_status.step_progress = 25
        job_status.message = "Detecting page types (text vs scanned image)..."
        
        page_types = detect_pdf_page_types(file_path)
        job_status.page_types = page_types

        # Step 3: Extract text / OCR fallback
        job_status.status = "extracting"
        job_status.step_progress = 45
        job_status.message = "Extracting text and structure..."
        
        pages_data = extract_pdf_pages_text(file_path)
        
        for idx, pt in enumerate(page_types):
            if pt.page_type == "image":
                ocr_text = ocr_process_pdf_page(file_path, pt.page_number)
                if ocr_text:
                    pages_data[idx]["text"] = pages_data[idx]["text"] + "\n" + ocr_text

        full_text = get_full_text(pages_data)

        # Step 4 & 5: Bank detection & layout parsing
        parser, confidence = select_best_parser(full_text)
        account_details = parser.extract_account_details(pages_data)
        
        detected_bank_display = account_details.bank_name.value or parser.bank_name
        job_status.detected_bank = detected_bank_display
        job_status.step_progress = 65
        job_status.message = f"Parsing using {detected_bank_display} engine..."

        transactions = parser.extract_transactions(pages_data)

        # Fallback Pipeline if primary parser extracted 0 rows
        if not transactions:
            generic_parser = GenericParser()
            fallback_txs = generic_parser.extract_transactions(pages_data)
            if fallback_txs:
                transactions = fallback_txs
                parser = generic_parser
                confidence = 0.70

        # Extract Sender and Recipient for each transaction
        holder_name = account_details.account_holder.value or "Self"
        for tx in transactions:
            sender_party, recipient_party = extract_party_details(
                description=tx.description,
                tx_type=tx.transaction_type,
                account_holder=holder_name
            )
            tx.sender = sender_party
            tx.recipient = recipient_party

        # Step 6: Accounting validation suite
        job_status.message = "Running accounting validation checks..."
        transactions, validation_report = validate_transactions(
            transactions=transactions,
            account_details=account_details
        )

        if not transactions:
            validation_report.warnings.append(
                "Unable to confidently detect transactions. Please upload a clearer statement or review the extracted data manually."
            )

        # Step 7: Hybrid classification
        job_status.status = "classifying"
        job_status.step_progress = 85
        job_status.message = "Classifying transaction categories..."
        
        transactions, classification_summary = hybrid_classifier.classify_transactions(transactions)

        # Final Status
        job_status.status = "completed"
        job_status.step_progress = 100
        job_status.message = "Processing complete."
        job_status.updated_at = datetime.now()

        result = StatementProcessResult(
            job_id=job_id,
            file_name=job_status.file_name,
            status="completed",
            detected_bank=detected_bank_display,
            parser_used=parser.__class__.__name__,
            layout_confidence=confidence,
            account_details=account_details,
            transactions=transactions,
            validation_report=validation_report,
            classification_summary=classification_summary,
            page_types=page_types
        )

        RESULT_STORE[job_id] = result
        
        json_path = os.path.join(PROCESSED_DATA_DIR, f"{job_id}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(result.model_dump_json(indent=2))

        return result

    except Exception as e:
        job_status.status = "failed"
        job_status.error = str(e)
        job_status.message = f"Pipeline execution failed: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statement extraction error: {str(e)}"
        )

@router.get("/result/{job_id}", response_model=StatementProcessResult)
def get_statement_result(job_id: str):
    if job_id in RESULT_STORE:
        return RESULT_STORE[job_id]
        
    json_path = os.path.join(PROCESSED_DATA_DIR, f"{job_id}.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            result = StatementProcessResult(**data)
            RESULT_STORE[job_id] = result
            return result
            
    raise HTTPException(status_code=404, detail="Result for Job ID not found.")
