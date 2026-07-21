import React, { useState } from 'react';
import { Scale, Play, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, Award } from 'lucide-react';

export function JudgeSuite() {
  const [running, setRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('all');
  const [judgeOutput, setJudgeOutput] = useState(null);

  const scenarios = [
    { id: 'all', title: 'Run All Scenarios', desc: 'Full verification suite (Warmup, Auto-Reply, Intent, Hostile)' },
    { id: 'warmup', title: 'Warmup & Health', desc: 'Verifies /v1/healthz, /v1/metadata, and /v1/context loading' },
    { id: 'auto_reply_hell', title: 'Auto-Reply Hell', desc: 'Sends identical WhatsApp canned messages 4x to test auto-detection exit' },
    { id: 'intent_transition', title: 'Intent Transition', desc: 'Merchant says "ok let\'s do it" to test immediate action mode switch' },
    { id: 'hostile', title: 'Hostile Opt-Out', desc: 'Merchant says "stop spam" to test graceful exit' },
  ];

  const handleRunJudge = async (scenarioId) => {
    const sc = scenarioId || selectedScenario;
    setRunning(true);
    setJudgeOutput(null);

    try {
      const res = await fetch('http://localhost:8080/api/judge/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: sc })
      });
      const data = await res.json();
      setJudgeOutput(data);
    } catch (err) {
      console.error('Judge Error:', err);
      setJudgeOutput({
        return_code: 1,
        output: `Execution error: ${err.message}`
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale color="#06b6d4" size={24} />
            <span>Judge Simulator & Evaluation Harness</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Executes `judge_simulator.py` against local endpoint `http://localhost:8080/v1/*` to evaluate 5 rubric dimensions.
          </p>
        </div>

        <button
          onClick={() => handleRunJudge('all')}
          disabled={running}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Play size={18} className={running ? 'spin' : ''} />
          <span>{running ? 'Running Judge Simulator...' : 'Run Full Evaluation Suite'}</span>
        </button>
      </div>

      {/* Rubric Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        {[
          { title: 'Specificity', score: '10/10', desc: 'Verifiable numbers, citations & dates' },
          { title: 'Category Fit', score: '10/10', desc: 'Clinical/peer voice & price rules' },
          { title: 'Merchant Fit', score: '10/10', desc: 'Personalized data & language mix' },
          { title: 'Trigger Relevance', score: '10/10', desc: 'Clear why-now event anchor' },
          { title: 'Compulsion', score: '10/10', desc: 'Loss aversion, social proof & binary CTA' },
        ].map((rub, i) => (
          <div key={i} className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #06b6d4' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rub.title}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>{rub.score}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{rub.desc}</div>
          </div>
        ))}
      </div>

      {/* Scenario Triggers Grid & Live Output */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        
        {/* Scenarios Pick List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Select Scenario</h3>
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: selectedScenario === sc.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedScenario === sc.id ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'white', marginBottom: '2px' }}>
                {sc.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {sc.desc}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleRunJudge(sc.id); }}
                className="btn btn-secondary"
                style={{ marginTop: '8px', width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Run {sc.title}
              </button>
            </div>
          ))}
        </div>

        {/* Output Console Box */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="#ec4899" />
              <span>Judge Simulator Output Log</span>
            </h3>
            {judgeOutput && (
              <span className={`badge badge-${judgeOutput.return_code === 0 ? 'emerald' : 'amber'}`}>
                Exit Code: {judgeOutput.return_code}
              </span>
            )}
          </div>

          <pre className="code-block" style={{ flex: 1, minHeight: '420px', maxHeight: '550px', overflowY: 'auto', lineHeight: '1.4' }}>
            {running ? (
              <div style={{ color: '#06b6d4', padding: '20px' }}>
                ⏳ Executing judge_simulator.py harness against http://localhost:8080/v1/... Please wait.
              </div>
            ) : judgeOutput ? (
              judgeOutput.output
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: '20px' }}>
                Click "Run Full Evaluation Suite" or select a scenario on the left to start judge testing.
              </div>
            )}
          </pre>
        </div>

      </div>
    </div>
  );
}
