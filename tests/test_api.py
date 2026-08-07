import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from scripts.generate_sample_pdfs import generate_hdfc_sample, SAMPLES_DIR

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_samples():
    generate_hdfc_sample()

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_upload_and_process_flow():
    pdf_path = os.path.join(SAMPLES_DIR, "hdfc_sample_statement.pdf")
    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("hdfc_sample_statement.pdf", f, "application/pdf")}
        )
    assert response.status_code == 200
    job_data = response.json()
    job_id = job_data["job_id"]
    assert job_data["status"] == "uploaded"
    
    # Process statement
    proc_resp = client.post(f"/api/process/{job_id}")
    assert proc_resp.status_code == 200
    result_data = proc_resp.json()
    assert result_data["detected_bank"].startswith("HDFC Bank")
    assert len(result_data["transactions"]) >= 5
    
    # Export Excel
    excel_resp = client.get(f"/api/export/excel/{job_id}")
    assert excel_resp.status_code == 200
    assert excel_resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    # Export CSV
    csv_resp = client.get(f"/api/export/csv/{job_id}")
    assert csv_resp.status_code == 200
    assert "date,description,sender,recipient,debit,credit,balance,category,classification_method,status" in csv_resp.text
