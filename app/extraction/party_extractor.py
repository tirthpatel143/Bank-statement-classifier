import re
from typing import Tuple, Optional

def extract_party_details(description: str, tx_type: str, account_holder: str = "Self") -> Tuple[str, str]:
    """
    Extracts Sender (Party who sent money) and Recipient (Party who received money) 
    from transaction description based on transaction type (credit vs debit).
    
    Returns: (sender_name, recipient_name)
    """
    desc_upper = description.upper().strip()
    holder_display = account_holder if account_holder and account_holder not in ["Unknown", "Account Holder", "Not Specified in PDF Header"] else "Self (Account Holder)"

    sender = "Self"
    recipient = "Self"

    if tx_type == "credit":
        # Money incoming: Recipient is the Account Holder (Self)
        recipient = holder_display
        
        # Extract Sender from credit description
        if "SALARY" in desc_upper:
            match = re.search(r'SALARY\s+(?:DEPOSIT|CREDIT)?\s*(?:FROM)?\s*([A-Z0-9\s]{3,30})', desc_upper)
            sender = match.group(1).strip() if match else "Employer / ACME Corp"
        elif "BY TRANSFER FROM" in desc_upper:
            match = re.search(r'BY\s+TRANSFER\s+FROM\s+([A-Z\s.]{3,35})', desc_upper)
            sender = match.group(1).strip() if match else "Transfer Sender"
        elif "INWARD REMITTANCE" in desc_upper:
            match = re.search(r'INWARD\s+REMITTANCE\s+(?:FROM)?\s*([A-Z\s.]{3,35})', desc_upper)
            sender = match.group(1).strip() if match else "Inward Remitter"
        elif "NEFT CR" in desc_upper:
            match = re.search(r'NEFT\s+CR-[A-Z0-9]+-([A-Z\s.]{3,30})-', desc_upper)
            sender = match.group(1).strip() if match else "NEFT Sender"
        elif "UPI/" in desc_upper:
            # Pattern: UPI/SENDER_NAME/REF_NO or UPI/REF_NO/SENDER_NAME
            parts = desc_upper.split("/")
            if len(parts) >= 2:
                candidate = parts[1].strip()
                if not candidate.isdigit() and len(candidate) > 2 and candidate not in ["FOOD ORDER", "REFUND", "PAYMENT"]:
                    sender = candidate
                elif len(parts) >= 3 and not parts[2].isdigit():
                    sender = parts[2].strip()
                else:
                    sender = "UPI Sender"
            else:
                sender = "UPI Sender"
        elif "REFUND" in desc_upper or "CASHBACK" in desc_upper:
            clean_desc = re.sub(r'^(?:UPI|REF|REFUND|CASHBACK|PAYMENT|BY)[/\s-]*', '', desc_upper).strip()
            sender = clean_desc if clean_desc else "Merchant Refund"
        else:
            # Clean generic description
            clean_desc = re.sub(r'^(?:BY|CR|TRANSFER|NEFT|RTGS|IMPS|UPI)[/\s-]*', '', desc_upper)
            clean_desc = re.sub(r'\s+REF\d+.*$', '', clean_desc).strip()
            sender = clean_desc if clean_desc else "Incoming Remitter"

    else: # debit
        # Money outgoing: Sender is the Account Holder (Self)
        sender = holder_display
        
        # Extract Recipient from debit description
        if "TRANSFER TO" in desc_upper or "TO TRANSFER" in desc_upper:
            match = re.search(r'(?:TRANSFER\s+TO|TO\s+TRANSFER)\s+([A-Z\s.]{3,35})', desc_upper)
            recipient = match.group(1).strip() if match else "Transfer Beneficiary"
        elif "ATM" in desc_upper and "WITHDRAWAL" in desc_upper:
            recipient = "ATM Cash Withdrawal"
        elif "BILL" in desc_upper or "BESCOM" in desc_upper or "ELECTRICITY" in desc_upper:
            match = re.search(r'(?:BILL\s+PAYMENT\s+)?([A-Z0-9\s]{3,30})(?:\s+BILL|\s+REF|$)', desc_upper)
            recipient = match.group(1).strip() if match else "Utility Provider"
        elif "PETROL" in desc_upper or "FUEL" in desc_upper or "HPCL" in desc_upper or "BPCL" in desc_upper or "IOCL" in desc_upper:
            match = re.search(r'([A-Z0-9\s]{3,30}\s+(?:PETROL|PUMP|FUEL|STATION))', desc_upper)
            recipient = match.group(1).strip() if match else "Fuel Pump / HPCL"
        elif "UPI/" in desc_upper:
            parts = desc_upper.split("/")
            if len(parts) >= 2:
                candidate = parts[1].strip()
                if not candidate.isdigit() and len(candidate) > 2 and candidate not in ["FOOD ORDER", "PAYMENT"]:
                    recipient = candidate
                elif len(parts) >= 3 and not parts[2].isdigit():
                    recipient = parts[2].strip()
                else:
                    recipient = "UPI Merchant / Recipient"
            else:
                recipient = "UPI Recipient"
        elif "POS " in desc_upper or "PAYMENT TO" in desc_upper:
            match = re.search(r'(?:POS\s+|PAYMENT\s+TO\s+)([A-Z0-9\s.]{3,30})', desc_upper)
            recipient = match.group(1).strip() if match else "Merchant POS"
        else:
            clean_desc = re.sub(r'^(?:TO|DR|DEBIT|TRANSFER|NEFT|RTGS|IMPS|UPI)[/\s-]*', '', desc_upper)
            clean_desc = re.sub(r'\s+REF\d+.*$', '', clean_desc).strip()
            recipient = clean_desc if clean_desc else "Merchant / Recipient"

    # Sanitize outputs
    sender = re.sub(r'\s+', ' ', sender).title()
    recipient = re.sub(r'\s+', ' ', recipient).title()

    return sender, recipient
