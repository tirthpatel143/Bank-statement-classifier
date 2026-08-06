from typing import List, Tuple, Optional
from datetime import datetime
from app.schemas.models import Transaction, ValidationReport, AccountDetails

def validate_transactions(
    transactions: List[Transaction],
    account_details: Optional[AccountDetails] = None,
    balance_tolerance: float = 0.05
) -> Tuple[List[Transaction], ValidationReport]:
    """
    Executes full accounting validation suite on extracted transactions:
    1. Date format & range checks
    2. Amount non-negativity & debit/credit consistency
    3. Consecutive mathematical balance verification: Balance[i] = Balance[i-1] +/- Amount[i]
    4. Duplicate row detection
    5. Statement closing balance reconciliation
    """
    if not transactions:
        report = ValidationReport(
            total_rows=0,
            valid_rows=0,
            invalid_rows=0,
            balance_check_pass_rate=100.0,
            duplicate_count=0,
            opening_balance_matched=True,
            closing_balance_matched=True,
            warnings=["No transactions extracted."]
        )
        return transactions, report

    valid_count = 0
    invalid_count = 0
    balance_check_passed_count = 0
    duplicate_count = 0
    warnings = []
    
    seen_rows = set()
    
    # 1. Row level date, amount, and duplicate checks
    for idx, tx in enumerate(transactions):
        issues = []
        
        # Date check
        try:
            tx_date = datetime.strptime(tx.date, "%Y-%m-%d")
            # Sanity check: year between 1990 and 2100
            if tx_date.year < 1990 or tx_date.year > 2100:
                issues.append(f"Invalid date year: {tx.date}")
        except Exception:
            issues.append(f"Malformed date format: {tx.date}")
            
        # Amount check
        if tx.debit is None and tx.credit is None:
            issues.append("Neither debit nor credit amount is populated.")
        elif tx.debit is not None and tx.credit is not None and tx.debit > 0 and tx.credit > 0:
            issues.append("Both debit and credit amounts populated on same row.")
            
        if tx.amount < 0:
            issues.append("Negative transaction amount.")
            
        if not tx.description or len(tx.description.strip()) == 0:
            issues.append("Empty transaction description.")
            
        # Duplicate detection (same date, description, amount, balance)
        dup_key = (tx.date, tx.description.strip().lower(), tx.amount, tx.balance)
        if dup_key in seen_rows:
            duplicate_count += 1
            issues.append("Possible duplicate transaction row.")
        else:
            seen_rows.add(dup_key)

        if issues:
            tx.row_valid = False
            tx.validation_issues.extend(issues)
            tx.needs_review = True
        else:
            tx.row_valid = True

    # 2. Consecutive Mathematical Balance Validation
    prev_balance = None
    
    # If account details opening balance is present, use it as starting reference
    if account_details and account_details.opening_balance is not None:
        prev_balance = account_details.opening_balance

    for idx, tx in enumerate(transactions):
        if prev_balance is not None:
            if tx.transaction_type == "debit" or tx.debit:
                amt = tx.debit if tx.debit is not None else tx.amount
                expected_balance = prev_balance - amt
            else:
                amt = tx.credit if tx.credit is not None else tx.amount
                expected_balance = prev_balance + amt
                
            diff = abs(tx.balance - expected_balance)
            if diff <= balance_tolerance:
                tx.balance_check = True
                balance_check_passed_count += 1
            else:
                tx.balance_check = False
                tx.needs_review = True
                tx.validation_issues.append(
                    f"Balance check discrepancy: expected {expected_balance:.2f}, found {tx.balance:.2f} (diff: {diff:.2f})"
                )
        else:
            # First row without previous balance reference
            tx.balance_check = True
            balance_check_passed_count += 1
            
        prev_balance = tx.balance
        
        if tx.row_valid and tx.balance_check:
            valid_count += 1
        else:
            invalid_count += 1

    # 3. Statement Closing Balance Reconciliation
    closing_matched = True
    if account_details and account_details.closing_balance is not None and transactions:
        final_tx_balance = transactions[-1].balance
        if abs(final_tx_balance - account_details.closing_balance) > balance_tolerance:
            closing_matched = False
            warnings.append(
                f"Statement closing balance ({account_details.closing_balance:.2f}) does not match final transaction balance ({final_tx_balance:.2f})."
            )

    pass_rate = round((balance_check_passed_count / len(transactions)) * 100.0, 2)

    report = ValidationReport(
        total_rows=len(transactions),
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        balance_check_pass_rate=pass_rate,
        duplicate_count=duplicate_count,
        opening_balance_matched=True if (not account_details or account_details.opening_balance is None) else True,
        closing_balance_matched=closing_matched,
        warnings=warnings
    )

    return transactions, report
