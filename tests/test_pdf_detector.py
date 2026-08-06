import os
import pytest
from app.extraction.pdf_detector import detect_pdf_page_types
from scripts.generate_sample_pdfs import generate_hdfc_sample, SAMPLES_DIR

@pytest.fixture(scope="module", autouse=True)
def setup_samples():
    generate_hdfc_sample()

def test_pdf_page_detection():
    pdf_path = os.path.join(SAMPLES_DIR, "hdfc_sample_statement.pdf")
    page_types = detect_pdf_page_types(pdf_path)
    assert len(page_types) > 0
    assert page_types[0].page_type == "text"
    assert page_types[0].character_count > 50
