import pytest
from app.schemas.models import Transaction, AccountDetails
from app.validation.transaction_checks import validate_transactions

def test_balance_sequence_validation():
    txs = [
        Transaction(
            date="2026-01-02",
            description="Swiggy",
            raw_description="Swiggy",
            debit=450.0,
            amount=450.0,
            transaction_type="debit",
            balance=49550.0
        ),
        Transaction(
            date="2026-01-05",
            description="Salary",
            raw_description="Salary",
            credit=25000.0,
            amount=25000.0,
            transaction_type="credit",
            balance=74550.0
        )
    ]
    
    acc = AccountDetails(opening_balance=50000.0)
    validated_txs, report = validate_transactions(txs, acc)
    
    assert report.total_rows == 2
    assert report.valid_rows == 2
    assert report.balance_check_pass_rate == 100.0
    assert validated_txs[0].balance_check is True
    assert validated_txs[1].balance_check is True

def test_balance_discrepancy_flag():
    txs = [
        Transaction(
            date="2026-01-02",
            description="Swiggy",
            raw_description="Swiggy",
            debit=450.0,
            amount=450.0,
            transaction_type="debit",
            balance=40000.0  # Incorrect balance sequence!
        )
    ]
    
    acc = AccountDetails(opening_balance=50000.0)
    validated_txs, report = validate_transactions(txs, acc)
    
    assert validated_txs[0].balance_check is False
    assert validated_txs[0].needs_review is True
    assert report.invalid_rows == 1
