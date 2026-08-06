from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class FieldDetail(BaseModel):
    value: Optional[str] = None
    page: int = 1
    confidence: float = 1.0

class AccountDetails(BaseModel):
    account_holder: FieldDetail = Field(default_factory=lambda: FieldDetail(value="Unknown"))
    account_number: FieldDetail = Field(default_factory=lambda: FieldDetail(value="XXXXXXXX0000"))
    masked_account_number: str = "XXXXXXXX0000"
    ifsc: FieldDetail = Field(default_factory=lambda: FieldDetail(value=None))
    bank_name: FieldDetail = Field(default_factory=lambda: FieldDetail(value="Unknown Bank"))
    branch: FieldDetail = Field(default_factory=lambda: FieldDetail(value=None))
    statement_period_start: Optional[str] = None
    statement_period_end: Optional[str] = None
    opening_balance: Optional[float] = None
    closing_balance: Optional[float] = None
    currency: str = "INR"

class Transaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    value_date: Optional[str] = None
    description: str
    raw_description: str
    debit: Optional[float] = None
    credit: Optional[float] = None
    amount: float
    transaction_type: str  # "debit" or "credit"
    balance: float
    currency: str = "INR"
    category: Optional[str] = "Other"
    classification_method: Optional[str] = None  # "rule", "ml", "manual"
    classification_confidence: Optional[float] = None
    matched_keywords: List[str] = Field(default_factory=list)
    source_page: int = 1
    extraction_confidence: float = 1.0
    row_valid: bool = True
    balance_check: bool = True
    needs_review: bool = False
    validation_issues: List[str] = Field(default_factory=list)

class ValidationReport(BaseModel):
    total_rows: int = 0
    valid_rows: int = 0
    invalid_rows: int = 0
    balance_check_pass_rate: float = 100.0
    duplicate_count: int = 0
    opening_balance_matched: bool = True
    closing_balance_matched: bool = True
    warnings: List[str] = Field(default_factory=list)

class CategorySummary(BaseModel):
    category: str
    count: int
    total_debit: float
    total_credit: float

class PageTypeInfo(BaseModel):
    page_number: int
    page_type: str  # "text" or "image"
    character_count: int

class ProcessingStatus(BaseModel):
    job_id: str
    file_hash: str
    file_name: str
    status: str  # "uploaded", "validating", "extracting", "classifying", "completed", "needs_review", "failed"
    step_progress: int = 0  # 0 to 100
    message: str = "Initialized"
    total_pages: int = 0
    detected_bank: Optional[str] = None
    page_types: List[PageTypeInfo] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    error: Optional[str] = None

class StatementProcessResult(BaseModel):
    job_id: str
    file_name: str
    status: str
    detected_bank: str
    parser_used: str
    layout_confidence: float
    account_details: AccountDetails
    transactions: List[Transaction]
    validation_report: ValidationReport
    classification_summary: List[CategorySummary]
    page_types: List[PageTypeInfo]

class CategoryOverride(BaseModel):
    transaction_id: str
    category: str

class RetrainRequest(BaseModel):
    overrides: List[CategoryOverride]
