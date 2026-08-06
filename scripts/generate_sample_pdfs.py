import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)

def generate_hdfc_sample():
    pdf_path = os.path.join(SAMPLES_DIR, "hdfc_sample_statement.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    # Title / Header
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#004080'), spaceAfter=6)
    story.append(Paragraph("HDFC BANK LIMITED", title_style))
    story.append(Paragraph("ACCOUNT STATEMENT", styles['Heading2']))
    story.append(Spacer(1, 10))

    # Account Details Table
    acc_data = [
        ["Account Holder:", "RAHUL SHARMA", "Account No:", "50100234567890"],
        ["IFSC Code:", "HDFC0000240", "Branch:", "MUMBAI CENTRAL"],
        ["Statement Period:", "01/01/2026 To 31/01/2026", "Currency:", "INR"],
        ["Opening Balance:", "50,000.00 DR/CR", "Closing Balance:", "45,250.00"]
    ]
    t_acc = Table(acc_data, colWidths=[110, 160, 110, 160])
    t_acc.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#004080')),
        ('TEXTCOLOR', (2,0), (2,-1), colors.HexColor('#004080')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_acc)
    story.append(Spacer(1, 15))

    # Transactions Table
    tx_headers = ["Date", "Narration", "Chq/Ref No", "Value Dt", "Withdrawal Amt", "Deposit Amt", "Closing Balance"]
    tx_rows = [
        tx_headers,
        ["02/01/26", "UPI/SWIGGY/FOOD ORDER/129381", "REF1001", "02/01/26", "450.00", "", "49,550.00"],
        ["05/01/26", "SALARY DEPOSIT ACME CORP", "REF1002", "05/01/26", "", "25,000.00", "74,550.00"],
        ["10/01/26", "HPCL PETROL PUMP MUMBAI", "REF1003", "10/01/26", "2,000.00", "", "72,550.00"],
        ["15/01/26", "ELECTRICITY BILL BESCOM", "REF1004", "15/01/26", "1,800.00", "", "70,750.00"],
        ["20/01/26", "AMAZON RETAIL SHOPPING", "REF1005", "20/01/26", "5,500.00", "", "65,250.00"],
        ["25/01/26", "HDFC BANK ANNUAL SERVICE CHARGES", "REF1006", "25/01/26", "200.00", "", "65,050.00"],
        ["28/01/26", "ATM CASH WITHDRAWAL MUMBAI", "REF1007", "28/01/26", "10,000.00", "", "55,050.00"],
        ["30/01/26", "ZERODHA BROKING MUTUAL FUND SIP", "REF1008", "30/01/26", "9,800.00", "", "45,250.00"]
    ]
    t_tx = Table(tx_rows, colWidths=[55, 180, 65, 55, 65, 65, 65])
    t_tx.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#004080')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9F9F9')])
    ]))
    story.append(t_tx)
    doc.build(story)
    print(f"Generated: {pdf_path}")

def generate_icici_sample():
    pdf_path = os.path.join(SAMPLES_DIR, "icici_sample_statement.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("ICICI BANK LIMITED", styles['Heading1']))
    story.append(Paragraph("Detailed Statement of Account", styles['Heading2']))
    story.append(Spacer(1, 10))

    acc_data = [
        ["Account Holder Name:", "PRIYA PATEL", "Account Number:", "000401567890"],
        ["IFSC:", "ICIC0000004", "Branch:", "BANDRA WEST"],
        ["Period:", "01-01-2026 to 31-01-2026", "Opening Balance:", "100000.00"]
    ]
    t_acc = Table(acc_data, colWidths=[120, 150, 110, 160])
    t_acc.setStyle(TableStyle([('FONTSIZE', (0,0), (-1,-1), 9)]))
    story.append(t_acc)
    story.append(Spacer(1, 15))

    tx_rows = [
        ["S No", "Value Date", "Transaction Date", "Cheque Number", "Transaction Remarks", "Withdrawal Amount", "Deposit Amount", "Balance"],
        ["1", "03-01-2026", "03-01-2026", "-", "INF/SWIGGY/REST PAYMENT", "350.00", "", "99650.00"],
        ["2", "07-01-2026", "07-01-2026", "-", "BY CASH DEPOSIT CDM BANDRA", "", "15000.00", "114650.00"],
        ["3", "12-01-2026", "12-01-2026", "-", "UBER RIDE MUMBAI", "420.00", "", "114230.00"],
        ["4", "18-01-2026", "18-01-2026", "-", "JIO BROADBAND BILL PAYMENT", "999.00", "", "113231.00"],
        ["5", "26-01-2026", "26-01-2026", "-", "ZOMATO ORDER MUMBAI", "650.00", "", "112581.00"]
    ]
    t_tx = Table(tx_rows, colWidths=[30, 60, 60, 50, 170, 55, 55, 60])
    t_tx.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#990000')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
    ]))
    story.append(t_tx)
    doc.build(story)
    print(f"Generated: {pdf_path}")

def generate_borderless_sample():
    pdf_path = os.path.join(SAMPLES_DIR, "borderless_statement.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("GENERIC BANK STATEMENT (BORDERLESS TABLE)", styles['Heading1']))
    story.append(Paragraph("Account Holder: ANKIT SHARMA | A/C No: 112233445566 | IFSC: GENB0001234", styles['Heading3']))
    story.append(Spacer(1, 15))

    tx_rows = [
        ["Date", "Description", "Debit", "Credit", "Balance"],
        ["01/01/2026", "FLIPKART ONLINE SHOPPING", "3499.00", "", "46501.00"],
        ["04/01/2026", "REFUND FROM FLIPKART", "", "3499.00", "50000.00"],
        ["10/01/2026", "APOLLO PHARMACY MEDICINES", "850.00", "", "49150.00"],
        ["14/01/2026", "LIC INDIA PREMIUM PAYMENT", "12000.00", "", "37150.00"],
        ["22/01/2026", "BOOKMYSHOW CINEMA TICKETS", "750.00", "", "36400.00"]
    ]
    t_tx = Table(tx_rows, colWidths=[70, 240, 75, 75, 80])
    # NO GRID / BORDERLESS TABLE STYLE (Requirement testing borderless alignment)
    t_tx.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_tx)
    doc.build(story)
    print(f"Generated: {pdf_path}")

if __name__ == "__main__":
    generate_hdfc_sample()
    generate_icici_sample()
    generate_borderless_sample()
