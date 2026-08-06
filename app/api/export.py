from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from typing import List
import io

from app.api.process import RESULT_STORE, PROCESSED_DATA_DIR, get_statement_result
from app.export.writer import export_to_excel, export_to_csv
from app.validation.transaction_checks import validate_transactions
from app.classification.hybrid import HybridClassifier
from app.schemas.models import Transaction, StatementProcessResult, CategorySummary

router = APIRouter()

@router.get("/export/excel/{job_id}")
def download_excel(job_id: str):
    result = get_statement_result(job_id)
    excel_bytes = export_to_excel(result)
    
    filename = f"Bank_Statement_{job_id[:8]}.xlsx"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

@router.get("/export/csv/{job_id}")
def download_csv(job_id: str):
    result = get_statement_result(job_id)
    csv_str = export_to_csv(result.transactions)
    
    filename = f"Transactions_{job_id[:8]}.csv"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers=headers
    )

@router.post("/transactions/update/{job_id}", response_model=StatementProcessResult)
def update_transactions(job_id: str, updated_transactions: List[Transaction]):
    """
    Saves inline edits made by user in the UI table (e.g. edited date, description, amount, category).
    Re-runs validation & recalculates summary statistics.
    """
    result = get_statement_result(job_id)
    
    # Update transactions list
    result.transactions = updated_transactions
    
    # Re-validate balances
    re_validated_txs, new_val_report = validate_transactions(
        transactions=result.transactions,
        account_details=result.account_details
    )
    result.transactions = re_validated_txs
    result.validation_report = new_val_report
    
    # Re-calculate category stats
    cat_counts = {}
    for tx in result.transactions:
        cat = tx.category or "Other"
        if cat not in cat_counts:
            cat_counts[cat] = {"count": 0, "debit": 0.0, "credit": 0.0}
        cat_counts[cat]["count"] += 1
        if tx.transaction_type == "debit" or tx.debit:
            cat_counts[cat]["debit"] += (tx.debit or tx.amount)
        else:
            cat_counts[cat]["credit"] += (tx.credit or tx.amount)
            
    result.classification_summary = [
        CategorySummary(
            category=c,
            count=d["count"],
            total_debit=round(d["debit"], 2),
            total_credit=round(d["credit"], 2)
        )
        for c, d in cat_counts.items()
    ]

    RESULT_STORE[job_id] = result
    
    # Persist updated JSON
    import os
    json_path = os.path.join(PROCESSED_DATA_DIR, f"{job_id}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        f.write(result.model_dump_json(indent=2))

    return result
