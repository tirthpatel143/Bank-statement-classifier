import os
import pytest
from app.extraction.text_extractor import extract_pdf_pages_text, get_full_text
from app.parsers.layout_detector import select_best_parser
from app.parsers.hdfc import HDFCParser
from app.parsers.icici import ICICIParser
from scripts.generate_sample_pdfs import generate_hdfc_sample, generate_icici_sample, generate_borderless_sample, SAMPLES_DIR

@pytest.fixture(scope="module", autouse=True)
def setup_all_samples():
    generate_hdfc_sample()
    generate_icici_sample()
    generate_borderless_sample()

def test_hdfc_parser():
    pdf_path = os.path.join(SAMPLES_DIR, "hdfc_sample_statement.pdf")
    pages_data = extract_pdf_pages_text(pdf_path)
    full_text = get_full_text(pages_data)
    
    parser, conf = select_best_parser(full_text)
    assert parser.bank_name == "HDFC Bank"
    assert conf >= 0.90
    
    acc_details = parser.extract_account_details(pages_data)
    assert acc_details.masked_account_number.endswith("7890")
    
    transactions = parser.extract_transactions(pages_data)
    assert len(transactions) >= 5

def test_icici_parser():
    pdf_path = os.path.join(SAMPLES_DIR, "icici_sample_statement.pdf")
    pages_data = extract_pdf_pages_text(pdf_path)
    full_text = get_full_text(pages_data)
    
    parser, conf = select_best_parser(full_text)
    assert parser.bank_name == "ICICI Bank"
    
    transactions = parser.extract_transactions(pages_data)
    assert len(transactions) >= 4

def test_borderless_generic_parser():
    pdf_path = os.path.join(SAMPLES_DIR, "borderless_statement.pdf")
    pages_data = extract_pdf_pages_text(pdf_path)
    full_text = get_full_text(pages_data)
    
    parser, conf = select_best_parser(full_text)
    transactions = parser.extract_transactions(pages_data)
    assert len(transactions) >= 4
