import os
import hashlib
import uuid
from datetime import datetime
from typing import Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, status
import pypdf
from app.schemas.models import ProcessingStatus

router = APIRouter()

RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "raw")
os.makedirs(RAW_DATA_DIR, exist_ok=True)

# In-memory status store
JOB_STORE: Dict[str, ProcessingStatus] = {}
HASH_STORE: Dict[str, str] = {}  # hash -> job_id

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

@router.post("/upload", response_model=ProcessingStatus)
async def upload_pdf(file: UploadFile = File(...)):
    """
    1. Upload and validate PDF file:
       - Extension & MIME type check
       - File size limit (50 MB)
       - Password/encryption check
       - File hash duplicate check
       - Internal status tracking initialization
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension. Only PDF files (.pdf) are supported."
        )

    if file.content_type and "pdf" not in file.content_type.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{file.content_type}'. Must be application/pdf."
        )

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum allowed size of 50 MB."
        )

    # Calculate SHA-256 Hash to prevent duplicate processing
    file_hash = hashlib.sha256(content).hexdigest()

    if file_hash in HASH_STORE:
        existing_job_id = HASH_STORE[file_hash]
        if existing_job_id in JOB_STORE:
            existing_status = JOB_STORE[existing_job_id]
            existing_status.message = "Duplicate file upload detected. Returning existing job record."
            return existing_status

    job_id = str(uuid.uuid4())
    stored_filename = f"{job_id}_{file_hash[:8]}.pdf"
    file_path = os.path.join(RAW_DATA_DIR, stored_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Check for encryption/password protection
    try:
        reader = pypdf.PdfReader(file_path)
        if reader.is_encrypted:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Encrypted or password-protected PDFs are rejected unless decrypted."
            )
        total_pages = len(reader.pages)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF header or corrupted file: {str(e)}"
        )

    job_status = ProcessingStatus(
        job_id=job_id,
        file_hash=file_hash,
        file_name=file.filename,
        status="uploaded",
        step_progress=10,
        message="File uploaded and security validated.",
        total_pages=total_pages,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    JOB_STORE[job_id] = job_status
    HASH_STORE[file_hash] = job_id

    return job_status

@router.get("/status/{job_id}", response_model=ProcessingStatus)
def get_job_status(job_id: str):
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job ID not found.")
    return JOB_STORE[job_id]
