from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
import re
from datetime import datetime
from app.schemas.models import AccountDetails, FieldDetail, Transaction

def mask_account_number(acc_num: Optional[str]) -> str:
    if not acc_num or acc_num in ["Unknown", "Not Specified", "N/A"]:
        return "XXXX XXXX 0000"
    cleaned = re.sub(r'[\s\-]', '', str(acc_num))
    if len(cleaned) <= 4:
        return "XXXX XXXX " + cleaned
    last_four = cleaned[-4:]
    return "XXXX XXXX " + last_four

def clean_amount(val: Any) -> Tuple[Optional[float], Optional[str]]:
    if val is None:
        return None, None
    s = str(val).strip().upper()
    if not s or s in ["-", "--", "NIL", "NONE"]:
        return None, None
        
    type_override = None
    if "DR" in s:
        type_override = "debit"
        s = s.replace("DR", "")
    elif "CR" in s:
        type_override = "credit"
        s = s.replace("CR", "")
        
    cleaned = re.sub(r'[₹$Rs,]', '', s).strip()
    
    is_neg = False
    if cleaned.startswith("-"):
        is_neg = True
        cleaned = cleaned[1:].strip()
    elif cleaned.endswith("-"):
        is_neg = True
        cleaned = cleaned[:-1].strip()
        
    try:
        amt = round(float(cleaned), 2)
        if is_neg:
            type_override = "debit"
        return amt, type_override
    except ValueError:
        return None, None

def parse_date_string(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    s = date_str.strip()
    
    formats = [
        "%d/%m/%Y", "%d/%m/%y",
        "%d-%m-%Y", "%d-%m-%y",
        "%d %b %Y", "%d-%b-%Y", "%d-%b-%y",
        "%d %B %Y", "%Y-%m-%d",
        "%b %d, %Y"
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    return None

def extract_dynamic_account_details(pages_data: List[Dict[str, Any]], default_bank: str = "Generic Bank") -> AccountDetails:
    """
    Fully dynamic account details extractor that parses real values from the PDF text.
    Extracts PDF-specific bank name, account holder name, account number, IFSC code, branch, and statement period.
    """
    full_text = "\n".join([p["text"] for p in pages_data])
    first_page_lines = [line.strip() for line in pages_data[0]["text"].split("\n") if line.strip()] if pages_data else []
    header_text = "\n".join(first_page_lines[:30])

    # 1. Bank Name Detection
    detected_bank = default_bank
    text_upper = full_text.upper()
    if "STATE BANK OF INDIA" in text_upper or "STATE BANK" in text_upper or "SBI STATEMENT" in text_upper or "SBIN" in text_upper:
        detected_bank = "State Bank of India"
    elif "HDFC BANK" in text_upper or "HDFCBANK" in text_upper:
        detected_bank = "HDFC Bank Limited"
    elif "ICICI BANK" in text_upper or "ICICIBANK" in text_upper:
        detected_bank = "ICICI Bank Limited"
    elif "AXIS BANK" in text_upper or "UTIB" in text_upper:
        detected_bank = "Axis Bank Limited"
    elif "KOTAK" in text_upper or "KKBK" in text_upper:
        detected_bank = "Kotak Mahindra Bank"
    elif "BANK OF BARODA" in text_upper:
        detected_bank = "Bank of Baroda"
    elif "PUNJAB NATIONAL BANK" in text_upper or "PNB" in text_upper:
        detected_bank = "Punjab National Bank"
    elif "CANARA BANK" in text_upper:
        detected_bank = "Canara Bank"
    elif "UNION BANK" in text_upper:
        detected_bank = "Union Bank of India"

    # 2. Dynamic Account Holder Name Extraction
    holder_name = None
    name_patterns = [
        r'(?:Account\s*Name|A/C\s*Name|In\s*Account\s*Of|Title\s*of\s*Account|Name\s*of\s*Account\s*Holder|Account\s*Holder(?:\s*Name)?|Customer\s*Name|Holder\s*Name)[\s.:]+([A-Za-z\s.]{3,50})(?:\n|\r|$)',
        r'Name\s*:\s*([A-Za-z\s.]{3,50})(?:\n|\r|$)',
        r'(?:Mr\.|Mrs\.|Ms\.|Shri|Smt|M/S)\s+([A-Za-z\s.]{3,50})(?:\n|\r|$)',
        r'To[\s,]*\n\s*([A-Z\s.]{3,50})\n'
    ]
    
    for pat in name_patterns:
        match = re.search(pat, header_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            candidate = re.sub(r'(?:Address|Branch|Account|IFSC|Date|Period|A/C|CIF|MICR|Tel|Email).*$', '', candidate, flags=re.IGNORECASE).strip()
            if len(candidate) > 2 and not any(kw in candidate.upper() for kw in ["ACCOUNT", "STATEMENT", "BANK", "BRANCH", "NUMBER", "DATE", "PERIOD", "CLOSING", "OPENING", "STATE", "INDIA", "SAVINGS", "CURRENT"]):
                holder_name = candidate
                break

    if not holder_name:
        for line in first_page_lines[:20]:
            if re.match(r'^(?:Mr\.|Mrs\.|Ms\.|Shri|Smt\.)?\s*[A-Z\s.]{3,40}$', line):
                if not any(kw in line.upper() for kw in ["STATEMENT", "BANK", "ACCOUNT", "LIMITED", "BRANCH", "PAGE", "TRANSACTION", "CLOSING", "OPENING", "STATE", "INDIA", "SAVINGS", "CURRENT", "BALANCE", "DATE", "FROM", "TO"]):
                    holder_name = line
                    break

    if not holder_name:
        for idx_l, line in enumerate(first_page_lines[:25]):
            if any(kw in line.upper() for kw in ["ADDRESS", "ACCOUNT NO", "ACCOUNT NUMBER", "CIF"]):
                if idx_l > 0:
                    prev_line = first_page_lines[idx_l - 1]
                    if len(prev_line) > 2 and not any(kw in prev_line.upper() for kw in ["STATEMENT", "BANK", "PAGE", "TRANSACTION"]):
                        holder_name = prev_line
                        break

    if not holder_name:
        holder_name = "Account Holder"

    # 3. Dynamic Account Number Extraction
    acc_num = None
    acc_patterns = [
        r'(?:Account\s*(?:No|Num|Number)|A/C\s*(?:No|Num|Number)|Acc\s*No)[\s.:]*([A-Z0-9X*]{8,20})',
        r'Account\s*Details[\s\n.:]*([0-9]{9,18})',
        r'\b(\d{10,18})\b'
    ]
    for pat in acc_patterns:
        matches = re.finditer(pat, header_text, re.IGNORECASE)
        for m in matches:
            val = m.group(1).strip()
            if (val.isdigit() or re.match(r'^[X*\d]{8,20}$', val)) and len(val) >= 8 and not val.startswith("202"):
                acc_num = val
                break
        if acc_num:
            break
            
    if not acc_num:
        matches = re.finditer(r'\b(\d{10,18})\b', full_text)
        for m in matches:
            val = m.group(1).strip()
            if not val.startswith("202") and len(val) >= 10:
                acc_num = val
                break

    if not acc_num:
        acc_num = "XXXXXXXX1234"

    # 4. Header-Scoped IFSC Code Extraction
    ifsc_code = None
    bank_ifsc_prefixes = {
        "State Bank of India": ["SBIN0"],
        "HDFC Bank Limited": ["HDFC0"],
        "ICICI Bank Limited": ["ICIC0"],
        "Axis Bank Limited": ["UTIB0"],
        "Kotak Mahindra Bank": ["KKBK0"],
        "Bank of Baroda": ["BARB0"],
        "Punjab National Bank": ["PUNB0"],
        "Canara Bank": ["CNRB0"],
        "Union Bank of India": ["UBIN0"]
    }

    target_prefixes = bank_ifsc_prefixes.get(detected_bank, [])
    for pref in target_prefixes:
        match = re.search(r'\b(' + pref + r'[A-Z0-9]{6})\b', header_text)
        if match:
            ifsc_code = match.group(1)
            break

    if not ifsc_code:
        # Search page 1 header text ONLY (never transaction rows)
        match = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', header_text)
        if match:
            ifsc_code = match.group(1)

    # 5. Dynamic Branch Name Extraction
    branch_match = re.search(r'(?:Branch|Branch\s*Name)[\s.:]+([A-Za-z0-9\s,.-]{3,30})(?:\n|\r|$)', header_text, re.IGNORECASE)
    branch_name = branch_match.group(1).strip() if branch_match else None

    # 6. Dynamic Statement Period Extraction
    start_date, end_date = None, None
    period_match = re.search(r'(?:Statement\s*Period|Period|From)[\s.:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s*(?:To|to|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})', full_text, re.IGNORECASE)
    if period_match:
        start_date = parse_date_string(period_match.group(1))
        end_date = parse_date_string(period_match.group(2))

    # 7. Dynamic Opening & Closing Balances Extraction
    open_bal_match = re.search(r'(?:Opening\s*Balance|B/F|Bal\s*b/f)[\s.:]*[₹$]?\s*([\d,]+\.?\d*)', full_text, re.IGNORECASE)
    close_bal_match = re.search(r'(?:Closing\s*Balance|C/F|Bal\s*c/f)[\s.:]*[₹$]?\s*([\d,]+\.?\d*)', full_text, re.IGNORECASE)
    
    open_bal, _ = clean_amount(open_bal_match.group(1)) if open_bal_match else (None, None)
    close_bal, _ = clean_amount(close_bal_match.group(1)) if close_bal_match else (None, None)

    return AccountDetails(
        account_holder=FieldDetail(value=holder_name, page=1, confidence=0.90),
        account_number=FieldDetail(value=acc_num, page=1, confidence=0.95),
        masked_account_number=mask_account_number(acc_num),
        ifsc=FieldDetail(value=ifsc_code, page=1, confidence=0.95) if ifsc_code else FieldDetail(value="N/A", confidence=0.5),
        bank_name=FieldDetail(value=detected_bank, page=1, confidence=0.95),
        branch=FieldDetail(value=branch_name, page=1, confidence=0.85) if branch_name else FieldDetail(value="N/A", confidence=0.5),
        statement_period_start=start_date,
        statement_period_end=end_date,
        opening_balance=open_bal,
        closing_balance=close_bal
    )

class BankParser(ABC):
    @property
    @abstractmethod
    def bank_name(self) -> str:
        pass

    @abstractmethod
    def can_parse(self, text: str) -> bool:
        pass

    @abstractmethod
    def extract_account_details(self, pages_data: List[Dict[str, Any]]) -> AccountDetails:
        pass

    @abstractmethod
    def extract_transactions(self, pages_data: List[Dict[str, Any]]) -> List[Transaction]:
        pass
