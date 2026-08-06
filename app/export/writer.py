import io
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from typing import List, Dict, Any, Optional
from app.schemas.models import StatementProcessResult, Transaction

def export_to_excel(result: StatementProcessResult) -> bytes:
    """
    Generates a multi-sheet formatted Excel workbook containing:
    Sheet 1: Transactions
    Sheet 2: Account Details
    Sheet 3: Validation Report
    Sheet 4: Category Summary
    """
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    border_side = Side(border_style="thin", color="D9D9D9")
    thin_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")
    right_align = Alignment(horizontal="right", vertical="center")

    # -------------------------------------------------------------
    # Sheet 1: Transactions
    # -------------------------------------------------------------
    ws_tx = wb.create_sheet(title="Transactions")
    tx_headers = [
        "Date", "Description", "Debit", "Credit", "Balance",
        "Category", "Method", "Status"
    ]
    ws_tx.append(tx_headers)

    for cell in ws_tx[1]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align

    for tx in result.transactions:
        method = "Rule" if tx.classification_method == "rule" else ("ML model" if tx.classification_method == "ml" else "Manual")
        status = "Valid" if (tx.row_valid and tx.balance_check and not tx.needs_review) else "Needs Review"
        row = [
            tx.date,
            tx.description,
            tx.debit if tx.debit is not None else "",
            tx.credit if tx.credit is not None else "",
            tx.balance,
            tx.category or "Other",
            method,
            status
        ]
        ws_tx.append(row)

    for row in ws_tx.iter_rows(min_row=2, max_row=ws_tx.max_row, min_col=1, max_col=8):
        row[0].alignment = center_align
        row[1].alignment = left_align
        row[2].number_format = "#,##0.00"
        row[2].alignment = right_align
        row[3].number_format = "#,##0.00"
        row[3].alignment = right_align
        row[4].number_format = "#,##0.00"
        row[4].alignment = right_align
        row[5].alignment = center_align
        row[6].alignment = center_align
        row[7].alignment = center_align
        for cell in row:
            cell.border = thin_border

    # -------------------------------------------------------------
    # Sheet 2: Account Details
    # -------------------------------------------------------------
    ws_acc = wb.create_sheet(title="Account Details")
    ws_acc.append(["Field", "Value"])
    for cell in ws_acc[1]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align

    acc = result.account_details
    acc_rows = [
        ["Bank Name", acc.bank_name.value or "Unknown"],
        ["Account Holder", acc.account_holder.value or "Unknown"],
        ["Masked Account Number", acc.masked_account_number],
        ["IFSC Code", acc.ifsc.value or "N/A"],
        ["Branch", acc.branch.value or "N/A"],
        ["Statement Period Start", acc.statement_period_start or "N/A"],
        ["Statement Period End", acc.statement_period_end or "N/A"],
        ["Opening Balance", acc.opening_balance if acc.opening_balance is not None else "N/A"],
        ["Closing Balance", acc.closing_balance if acc.closing_balance is not None else "N/A"]
    ]
    for r in acc_rows:
        ws_acc.append(r)

    for row in ws_acc.iter_rows(min_row=2, max_row=ws_acc.max_row, min_col=1, max_col=2):
        row[0].alignment = left_align
        row[1].alignment = left_align
        for cell in row:
            cell.border = thin_border

    # -------------------------------------------------------------
    # Sheet 3: Validation Report
    # -------------------------------------------------------------
    ws_val = wb.create_sheet(title="Validation Report")
    ws_val.append(["Validation Metric / Warning", "Status / Details"])
    for cell in ws_val[1]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align

    val = result.validation_report
    val_rows = [
        ["Total Transactions Extracted", str(val.total_rows)],
        ["Valid Rows", str(val.valid_rows)],
        ["Rows Requiring Review", str(val.invalid_rows)],
        ["Balance Pass Rate", f"{val.balance_check_pass_rate}%"],
        ["Duplicate Rows Detected", str(val.duplicate_count)],
        ["Closing Balance Match Status", "PASS" if val.closing_balance_matched else "MISMATCH / WARN"]
    ]
    for r in val_rows:
        ws_val.append(r)

    if val.warnings:
        ws_val.append([])
        ws_val.append(["System Warning Log", "Message"])
        for w in val.warnings:
            ws_val.append(["Warning", w])

    for row in ws_val.iter_rows(min_row=2, max_row=ws_val.max_row, min_col=1, max_col=2):
        row[0].alignment = left_align
        row[1].alignment = left_align
        for cell in row:
            cell.border = thin_border

    # -------------------------------------------------------------
    # Sheet 4: Category Summary
    # -------------------------------------------------------------
    ws_cls = wb.create_sheet(title="Category Summary")
    ws_cls.append(["Category", "Transaction Count", "Total Debit", "Total Credit"])
    for cell in ws_cls[1]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align

    for cs in result.classification_summary:
        ws_cls.append([cs.category, cs.count, cs.total_debit, cs.total_credit])

    for row in ws_cls.iter_rows(min_row=2, max_row=ws_cls.max_row, min_col=1, max_col=4):
        row[0].alignment = left_align
        row[1].alignment = center_align
        row[2].number_format = "#,##0.00"
        row[2].alignment = right_align
        row[3].number_format = "#,##0.00"
        row[3].alignment = right_align
        for cell in row:
            cell.border = thin_border

    # Auto-adjust column widths
    for sheet in wb.worksheets:
        for col in sheet.columns:
            max_len = 0
            col_letter = col[0].column_letter
            for cell in col:
                val_str = str(cell.value or '')
                max_len = max(max_len, len(val_str))
            sheet.column_dimensions[col_letter].width = max(max_len + 4, 12)

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream.getvalue()

def export_to_csv(transactions: List[Transaction]) -> str:
    """
    Exports transaction list to exact CSV format requested:
    date,description,debit,credit,balance,category,classification_method,status
    """
    data = []
    for tx in transactions:
        method = "Rule" if tx.classification_method == "rule" else ("ML model" if tx.classification_method == "ml" else "Manual")
        status = "Valid" if (tx.row_valid and tx.balance_check and not tx.needs_review) else "Needs Review"
        data.append({
            "date": tx.date,
            "description": tx.description,
            "debit": tx.debit if tx.debit is not None else "",
            "credit": tx.credit if tx.credit is not None else "",
            "balance": tx.balance,
            "category": tx.category or "Other",
            "classification_method": method,
            "status": status
        })
    df = pd.DataFrame(data)
    return df.to_csv(index=False)
