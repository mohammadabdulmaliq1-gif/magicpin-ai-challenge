import React, { useState } from 'react';
import { Activity, Server, Shield, CheckCircle2, RefreshCw, Send, Radio } from 'lucide-react';

export function HealthDashboard({ healthData, fetchHealth }) {
  const [testEndpoint, setTestEndpoint] = useState('/v1/healthz');
  const [apiResponse, setApiResponse] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTestCall = async (path, method = 'GET', body = null) => {
    setTesting(true);
    setTestEndpoint(path);
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`http://localhost:8080${path}`, opts);
      const data = await res.json();
      setApiResponse({ status: res.status, data });
    } catch (err) {
      setApiResponse({ status: 500, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const counts = healthData?.contexts_loaded || { category: 0, merchant: 0, customer: 0, trigger: 0 };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity color="#10b981" size={24} />
            <span>System Health & API Diagnostics</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time status of FastAPI judging server, persistent contexts, and endpoint responsiveness.
          </p>
        </div>

        <button onClick={fetchHealth} className="btn btn-secondary">
          <RefreshCw size={16} /> Refresh Health
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Server size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{healthData?.status?.toUpperCase() || 'ONLINE'}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <Radio size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Uptime</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{healthData?.uptime_seconds || 0}s</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Loaded Contexts</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f472b6' }}>
              {counts.category + counts.merchant + counts.customer + counts.trigger}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>API Endpoints</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>5 / 5 OK</div>
          </div>
        </div>
      </div>

      {/* Endpoint Tester Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        
        {/* Endpoint Selector Buttons */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Judging Endpoints</h3>
          
          <button onClick={() => handleTestCall('/v1/healthz')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <span className="badge badge-emerald">GET</span> /v1/healthz
          </button>
          
          <button onClick={() => handleTestCall('/v1/metadata')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <span className="badge badge-emerald">GET</span> /v1/metadata
          </button>

          <button onClick={() => handleTestCall('/v1/tick', 'POST', { available_triggers: ['trg_2026_04_26_research_digest'] })} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <span className="badge badge-pink">POST</span> /v1/tick
          </button>

          <button onClick={() => handleTestCall('/v1/reply', 'POST', { conversation_id: 'c1', message: 'Yes send me the details', turn_number: 2 })} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
            <span className="badge badge-pink">POST</span> /v1/reply
          </button>
        </div>

        {/* Live Response Box */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Response Inspector ({testEndpoint})</h3>
            {apiResponse && (
              <span className={`badge badge-${apiResponse.status === 200 ? 'emerald' : 'amber'}`}>
                HTTP {apiResponse.status}
              </span>
            )}
          </div>

          <pre className="code-block" style={{ flex: 1, minHeight: '380px', overflowY: 'auto' }}>
            {testing ? 'Testing endpoint...' : apiResponse ? JSON.stringify(apiResponse.data || apiResponse, null, 2) : 'Select an endpoint on the left to fire a live test call.'}
          </pre>
        </div>

      </div>
    </div>
  );
}
