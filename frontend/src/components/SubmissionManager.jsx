import React, { useState, useEffect } from 'react';
import { FileCode, Download, RefreshCw, CheckCircle, FileText } from 'lucide-react';

export function SubmissionManager() {
  const [submissionData, setSubmissionData] = useState(null);
  const [activeTab, setActiveTab] = useState('jsonl');
  const [loading, setLoading] = useState(false);

  const fetchSubmission = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/submission/view');
      const data = await res.json();
      setSubmissionData(data);
    } catch (err) {
      console.error('Fetch submission error:', err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:8080/api/submission/generate', { method: 'POST' });
      await fetchSubmission();
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, []);

  const downloadFile = (filename, content) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode color="#ec4899" size={24} />
            <span>Challenge Submission Artifacts</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Generates and previews `submission.jsonl` (30 test pairs composition output) and `README.md`.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleGenerate} disabled={loading} className="btn btn-secondary">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Regenerate Submission</span>
          </button>
          <button
            onClick={() => downloadFile('submission.jsonl', submissionData?.rows ? submissionData.rows.map(r => JSON.stringify(r)).join('\n') : '')}
            className="btn btn-primary"
          >
            <Download size={16} />
            <span>Download submission.jsonl</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('jsonl')}
            className="btn"
            style={{
              padding: '6px 16px',
              fontSize: '0.85rem',
              background: activeTab === 'jsonl' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
              color: activeTab === 'jsonl' ? '#f472b6' : 'var(--text-secondary)',
              border: activeTab === 'jsonl' ? '1px solid #ec4899' : 'none'
            }}
          >
            submission.jsonl ({submissionData?.rows?.length || 0} rows)
          </button>
          <button
            onClick={() => setActiveTab('readme')}
            className="btn"
            style={{
              padding: '6px 16px',
              fontSize: '0.85rem',
              background: activeTab === 'readme' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTab === 'readme' ? '#38bdf8' : 'var(--text-secondary)',
              border: activeTab === 'readme' ? '1px solid #06b6d4' : 'none'
            }}
          >
            README.md
          </button>
        </div>

        {/* JSONL Table View */}
        {activeTab === 'jsonl' && (
          <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px' }}>ID</th>
                  <th style={{ padding: '10px 14px' }}>Composed Body</th>
                  <th style={{ padding: '10px 14px' }}>CTA</th>
                  <th style={{ padding: '10px 14px' }}>Send As</th>
                  <th style={{ padding: '10px 14px' }}>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {submissionData?.rows?.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{row.test_id}</td>
                    <td style={{ padding: '10px 14px', maxWidth: '340px', lineHeight: '1.4' }}>{row.body}</td>
                    <td style={{ padding: '10px 14px' }}><span className="badge badge-pink">{row.cta}</span></td>
                    <td style={{ padding: '10px 14px' }}><span className="badge badge-emerald">{row.send_as}</span></td>
                    <td style={{ padding: '10px 14px', maxWidth: '280px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* README Preview View */}
        {activeTab === 'readme' && (
          <pre className="code-block" style={{ height: '520px', overflowY: 'auto' }}>
            {submissionData?.readme}
          </pre>
        )}

      </div>
    </div>
  );
}
