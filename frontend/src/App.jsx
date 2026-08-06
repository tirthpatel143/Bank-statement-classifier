import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Download, 
  RefreshCw, Layers, ShieldCheck, Tag, Search, Filter, Save, Sparkles, Building2, CreditCard, DollarSign
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters & Edit state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);
  const [editableTxs, setEditableTxs] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [retraining, setRetraining] = useState(false);

  const categoriesList = [
    "ALL", "Food", "Fuel", "Salary", "Utilities", "Shopping", "Transport", 
    "Healthcare", "Insurance", "Entertainment", "Education", "Investment", 
    "Bank Charges", "Cash Withdrawal", "Cash Deposit", "Transfer", "Loan/EMI", "Rent", "Refund", "Other"
  ];

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (selectedFile) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file (.pdf).');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 50 MB.');
      return;
    }
    setFile(selectedFile);
    uploadAndProcess(selectedFile);
  };

  // Upload & process PDF pipeline
  const uploadAndProcess = async (fileToUpload) => {
    const targetFile = fileToUpload || file;
    if (!targetFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', targetFile);

    try {
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const statusData = await uploadRes.json();
      setJobStatus(statusData);

      const processRes = await fetch(`${API_BASE}/process/${statusData.job_id}`, {
        method: 'POST'
      });

      if (!processRes.ok) {
        const errData = await processRes.json();
        throw new Error(errData.detail || 'Extraction pipeline failed');
      }

      const resultData = await processRes.json();
      setResult(resultData);
      setEditableTxs(resultData.transactions);
      setJobStatus(prev => ({ ...prev, status: 'completed', step_progress: 100 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cell edit
  const handleCellEdit = (index, field, value) => {
    const updated = [...editableTxs];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'debit') {
      const d = parseFloat(value);
      if (!isNaN(d) && d > 0) {
        updated[index].amount = Math.round(d * 100) / 100;
        updated[index].transaction_type = 'debit';
        updated[index].credit = null;
      }
    } else if (field === 'credit') {
      const c = parseFloat(value);
      if (!isNaN(c) && c > 0) {
        updated[index].amount = Math.round(c * 100) / 100;
        updated[index].transaction_type = 'credit';
        updated[index].debit = null;
      }
    }

    setEditableTxs(updated);
    setHasChanges(true);
  };

  // Save changes to backend
  const saveTransactionEdits = async () => {
    if (!result) return;
    setSavingEdits(true);
    try {
      const res = await fetch(`${API_BASE}/transactions/update/${result.job_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTxs)
      });
      if (!res.ok) throw new Error('Failed to update transactions');
      const updatedResult = await res.json();
      setResult(updatedResult);
      setEditableTxs(updatedResult.transactions);
      setHasChanges(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdits(false);
    }
  };

  // Trigger feedback retraining
  const handleRetrain = async () => {
    if (!result) return;
    setRetraining(true);
    try {
      const overrides = editableTxs.map(t => ({
        transaction_id: t.transaction_id,
        category: t.category
      }));
      const res = await fetch(`${API_BASE}/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides })
      });
      const resData = await res.json();
      alert(`Model Feedback Submitted! ${resData.message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetraining(false);
    }
  };

  // Download handlers
  const downloadExcel = () => {
    if (!result) return;
    window.open(`${API_BASE}/export/excel/${result.job_id}`, '_blank');
  };

  const downloadCSV = () => {
    if (!result) return;
    window.open(`${API_BASE}/export/csv/${result.job_id}`, '_blank');
  };

  // Calculate Precision Rounded Summary Metrics
  const totalDebit = Math.round(editableTxs.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0) * 100) / 100;
  const totalCredit = Math.round(editableTxs.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0) * 100) / 100;
  const rowsNeedingReviewCount = editableTxs.filter(t => t.needs_review).length;

  // Filtered transactions list
  const filteredTxs = editableTxs.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.date.includes(searchQuery) ||
                          (tx.raw_description && tx.raw_description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || tx.category === selectedCategory;
    const matchesReview = !showNeedsReviewOnly || tx.needs_review;
    return matchesSearch && matchesCat && matchesReview;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem', overflowX: 'hidden' }}>
      
      {/* Top Navbar Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', padding: '0.65rem', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}>
            <Building2 size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#064e3b' }}>
              Bank Statement Processing Platform
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Professional PDF Extraction • Layout Detection • Accounting Validation • Multi-Format Export
            </p>
          </div>
        </div>

        <div className="badge badge-info" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          <ShieldCheck size={16} /> Ready & Operational
        </div>
      </header>

      {/* Main Upload Dropzone View if No Result */}
      {!result && (
        <div style={{ maxWidth: '660px', margin: '3rem auto' }}>
          <div 
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              id="fileInput"
              type="file" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={(e) => e.target.files[0] && processSelectedFile(e.target.files[0])}
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ background: '#d1fae5', padding: '1.25rem', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <Upload size={38} color="#059669" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#064e3b' }}>
              {file ? file.name : "Upload Bank Statement PDF"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              {file ? `${(file.size / (1024*1024)).toFixed(2)} MB • PDF Document` : "Drag and drop or browse to upload. Supports HDFC, ICICI, SBI, Axis, Kotak & Borderless PDFs (Up to 50 MB)"}
            </p>

            <button 
              className="glass-button" 
              style={{ margin: '0 auto' }} 
              onClick={(e) => { 
                e.stopPropagation(); 
                document.getElementById('fileInput').click(); 
              }} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} /> Processing Statement...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Browse & Process PDF
                </>
              )}
            </button>
          </div>

          {/* Progress Indicator */}
          {loading && jobStatus && (
            <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: '#064e3b' }}>
                <span>Status: {jobStatus.status.toUpperCase()}</span>
                <span>{jobStatus.step_progress}%</span>
              </div>
              <div className="progress-bar-bg" style={{ marginBottom: '0.75rem' }}>
                <div className="progress-bar-fill" style={{ width: `${jobStatus.step_progress}%` }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {jobStatus.message}
              </p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#fee2e2', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Result Dashboard View */}
      {result && (
        <div>
          
          {/* Top Controls Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="glass-button-secondary" onClick={() => { setResult(null); setFile(null); }}>
                ← Upload Another PDF
              </button>
              <div className="badge badge-info" style={{ padding: '0.55rem 0.95rem' }}>
                Bank Detected: <strong>{result.detected_bank}</strong> ({result.parser_used})
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {hasChanges && (
                <button className="glass-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={saveTransactionEdits} disabled={savingEdits}>
                  <Save size={18} /> {savingEdits ? 'Saving...' : 'Save Table Edits'}
                </button>
              )}
              
              <button className="glass-button-secondary" onClick={handleRetrain} disabled={retraining}>
                <RefreshCw size={16} /> Retrain ML
              </button>

              <button className="glass-button" onClick={downloadExcel}>
                <Download size={18} /> Export Excel (.xlsx)
              </button>

              <button className="glass-button-secondary" onClick={downloadCSV}>
                <FileText size={18} /> Export CSV
              </button>
            </div>
          </div>

          {/* Account Details & Summary Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            {/* Card 1: Account Information */}
            <div className="glass-panel" style={{ padding: '1.25rem', wordBreak: 'break-word' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                <CreditCard size={20} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Account Details</h3>
              </div>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Bank Name:</span> <strong>{result.account_details.bank_name.value}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Account Holder:</span> <strong>{result.account_details.account_holder.value}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Masked Acc No:</span> <strong className="mono" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{result.account_details.masked_account_number}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>IFSC Code:</span> <strong className="mono">{result.account_details.ifsc.value || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Card 2: Statement Financial Overview */}
            <div className="glass-panel" style={{ padding: '1.25rem', wordBreak: 'break-word' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                <DollarSign size={20} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Statement Totals</h3>
              </div>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Total Transactions:</span> <strong>{editableTxs.length} rows</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total Debit:</span> <strong style={{ color: '#dc2626' }}>₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total Credit:</span> <strong style={{ color: '#059669' }}>₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Closing Balance:</span> <strong className="mono">₹{(parseFloat(result.account_details.closing_balance || (editableTxs.length > 0 ? editableTxs[editableTxs.length - 1].balance : 0)) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
              </div>
            </div>

            {/* Card 3: Validation Suite */}
            <div className="glass-panel" style={{ padding: '1.25rem', wordBreak: 'break-word' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                <ShieldCheck size={20} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Validation Suite</h3>
              </div>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Balance Pass Rate:</span> <strong style={{ color: result.validation_report.balance_check_pass_rate >= 95 ? '#059669' : '#d97706' }}>{result.validation_report.balance_check_pass_rate}%</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Valid Rows:</span> <strong>{result.validation_report.valid_rows} / {result.validation_report.total_rows}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Rows Needing Review:</span> <strong style={{ color: rowsNeedingReviewCount > 0 ? '#d97706' : '#059669' }}>{rowsNeedingReviewCount}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Duplicates Flagged:</span> <strong>{result.validation_report.duplicate_count}</strong></div>
              </div>
            </div>

            {/* Card 4: Page Inspector */}
            <div className="glass-panel" style={{ padding: '1.25rem', maxHeight: '220px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                <Layers size={20} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>PDF Page Inspector</h3>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {result.page_types.map(pt => (
                  <div key={pt.page_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Page {pt.page_number}</span>
                    <span className={`badge ${pt.page_type === 'text' ? 'badge-success' : 'badge-warning'}`}>
                      {pt.page_type.toUpperCase()} ({pt.character_count} chars)
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Warnings Banner if any */}
          {result.validation_report.warnings.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#fef3c7', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', color: '#92400e' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Accounting Validation Alerts:
              </strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.35rem', fontSize: '0.875rem' }}>
                {result.validation_report.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction Search & Filter Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Search descriptions, raw text, or dates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-cell"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--text-muted)" />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-cell"
                  style={{ width: '160px' }}
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={showNeedsReviewOnly}
                  onChange={(e) => setShowNeedsReviewOnly(e.target.checked)}
                />
                <span style={{ color: showNeedsReviewOnly ? '#d97706' : 'var(--text-main)' }}>
                  Needs Review Only ({editableTxs.filter(t => t.needs_review).length})
                </span>
              </label>
            </div>
          </div>

          {/* Interactive Editable Transactions Data Grid */}
          <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Date</th>
                  <th style={{ minWidth: '240px' }}>Description</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Debit</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Credit</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Balance</th>
                  <th style={{ width: '150px' }}>Category</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Method</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map((tx, idx) => {
                  const methodDisplay = tx.classification_method === 'rule' ? 'Rule' : (tx.classification_method === 'ml' ? 'ML model' : 'Manual');
                  const statusDisplay = (tx.row_valid && tx.balance_check && !tx.needs_review) ? 'Valid' : 'Needs Review';

                  return (
                    <tr key={tx.transaction_id} className={tx.needs_review ? 'needs-review' : ''}>
                      
                      {/* Date */}
                      <td>
                        <input 
                          type="text" 
                          value={tx.date} 
                          onChange={(e) => handleCellEdit(idx, 'date', e.target.value)}
                          className="input-cell mono"
                          style={{ fontSize: '0.8rem' }}
                        />
                      </td>

                      {/* Description */}
                      <td>
                        <input 
                          type="text" 
                          value={tx.description} 
                          onChange={(e) => handleCellEdit(idx, 'description', e.target.value)}
                          className="input-cell"
                          style={{ fontWeight: 500 }}
                        />
                      </td>

                      {/* Debit */}
                      <td>
                        <input 
                          type="number" 
                          value={tx.debit !== null && tx.debit !== undefined ? tx.debit : ''} 
                          onChange={(e) => handleCellEdit(idx, 'debit', e.target.value)}
                          placeholder="—"
                          className="input-cell mono"
                          style={{ textAlign: 'right', color: tx.debit ? '#dc2626' : 'var(--text-muted)', fontWeight: tx.debit ? 600 : 400 }}
                        />
                      </td>

                      {/* Credit */}
                      <td>
                        <input 
                          type="number" 
                          value={tx.credit !== null && tx.credit !== undefined ? tx.credit : ''} 
                          onChange={(e) => handleCellEdit(idx, 'credit', e.target.value)}
                          placeholder="—"
                          className="input-cell mono"
                          style={{ textAlign: 'right', color: tx.credit ? '#059669' : 'var(--text-muted)', fontWeight: tx.credit ? 600 : 400 }}
                        />
                      </td>

                      {/* Balance */}
                      <td>
                        <input 
                          type="number" 
                          value={tx.balance} 
                          onChange={(e) => handleCellEdit(idx, 'balance', parseFloat(e.target.value) || 0)}
                          className="input-cell mono"
                          style={{ textAlign: 'right', fontWeight: 600 }}
                        />
                      </td>

                      {/* Category Select */}
                      <td>
                        <select 
                          value={tx.category || 'Other'} 
                          onChange={(e) => handleCellEdit(idx, 'category', e.target.value)}
                          className="input-cell"
                        >
                          {categoriesList.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* Method Column */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${tx.classification_method === 'rule' ? 'badge-info' : tx.classification_method === 'ml' ? 'badge-success' : 'badge-warning'}`}>
                          {methodDisplay}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td style={{ textAlign: 'center' }}>
                        {statusDisplay === 'Valid' ? (
                          <span className="badge badge-success" title="Balance check & row structure valid"><CheckCircle2 size={14} /> Valid</span>
                        ) : (
                          <span className="badge badge-warning" title={tx.validation_issues.join(' | ')}><AlertTriangle size={14} /> Needs Review</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Category Summary Section */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={20} color="var(--accent-primary)" /> Category Breakdown Summary
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {result.classification_summary.map(cs => (
                <div key={cs.category} style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, color: '#064e3b' }}>
                    <span>{cs.category}</span>
                    <span className="badge badge-info">{cs.count} tx</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div>Debit: <strong style={{ color: '#dc2626' }}>₹{cs.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                    <div>Credit: <strong style={{ color: '#059669' }}>₹{cs.total_credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
