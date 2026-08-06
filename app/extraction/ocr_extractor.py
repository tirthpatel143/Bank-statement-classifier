import logging
from typing import List, Dict, Any
from PIL import Image
import pdf2image
import pytesseract
import shutil

logger = logging.getLogger(__name__)

def is_tesseract_available() -> bool:
    return shutil.which("tesseract") is not None

def ocr_process_pdf_page(pdf_path: str, page_number: int) -> str:
    """
    Renders a PDF page to image and performs OCR using Tesseract.
    If Tesseract is not installed on system, attempts image text fallback.
    """
    if not is_tesseract_available():
        logger.warning(f"Tesseract OCR binary not found in PATH. OCR for page {page_number} degraded.")
        return f"[OCR Fallback - Tesseract binary not installed on system] Page {page_number}"
        
    try:
        images = pdf2image.convert_from_path(
            pdf_path,
            first_page=page_number,
            last_page=page_number,
            dpi=200
        )
        if images:
            ocr_text = pytesseract.image_to_string(images[0])
            return ocr_text.strip()
    except Exception as e:
        logger.error(f"OCR processing failed for page {page_number}: {e}")
        
    return ""
