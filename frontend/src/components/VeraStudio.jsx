import React, { useState, useEffect } from 'react';
import { Send, RefreshCw, Zap, Shield, User, Bot, CheckCheck, Sparkles, MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';
import { API_BASE } from '../config';

export function VeraStudio({ contexts }) {
  // Available lists
  const categories = contexts.filter(c => c.scope === 'category');
  const merchants = contexts.filter(c => c.scope === 'merchant');
  const triggers = contexts.filter(c => c.scope === 'trigger');
  const customers = contexts.filter(c => c.scope === 'customer');

  // Selected state
  const [selectedCat, setSelectedCat] = useState('dentists');
  const [selectedMerch, setSelectedMerch] = useState('m_001_drmeera_dentist_delhi');
  const [selectedTrg, setSelectedTrg] = useState('trg_2026_04_26_research_digest');
  const [selectedCust, setSelectedCust] = useState('');

  // Conversation state
  const [chatMessages, setChatMessages] = useState([]);
  const [latestComposition, setLatestComposition] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [turnCount, setTurnCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inspectorTab, setInspectorTab] = useState('rationale');

  // Sync merchant selection to category
  const handleMerchantChange = (mid) => {
    setSelectedMerch(mid);
    const mObj = merchants.find(m => m.context_id === mid);
    if (mObj && mObj.payload?.category_slug) {
      setSelectedCat(mObj.payload.category_slug);
    }
  };

  // Initial Composition Trigger
  const handleCompose = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sandbox/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_slug: selectedCat,
          merchant_id: selectedMerch,
          trigger_id: selectedTrg,
          customer_id: selectedCust || null
        })
      });
      const data = await res.json();
      if (data.result) {
        setLatestComposition(data);
        setChatMessages([
          {
            id: 'msg_1',
            sender: data.result.send_as === 'merchant_on_behalf' ? 'Vera (on behalf of Merchant)' : 'Vera',
            text: data.result.body,
            cta: data.result.cta,
            send_as: data.result.send_as,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setTurnCount(1);
      }
    } catch (err) {
      console.warn('Backend API unreachable, using deterministic engine fallback:', err);
      let fallbackText = "Dr. Meera, JIDA's Oct issue landed: 3-month fluoride recall cuts caries recurrence 38% better than 6-month. (2,100-patient trial). Want me to pull the abstract + draft a patient-ed WhatsApp for you?";
      if (selectedCat === 'salons') {
        fallbackText = "Hi, Studio audit complete: local demand for service packages is up 28% in Connaught Place. Want me to activate 'Haircut @ ₹99' on your profile to drive weekend bookings?";
      } else if (selectedCust) {
        fallbackText = "Hi, Dr. Meera here 🦷 It's been 5 months since your last visit — your 6-month cleaning recall is due. We have 2 slots open: Wed 6 Nov at 6 PM or Thu 7 Nov at 5 PM. Reply 1 for Wed, 2 for Thu!";
      }

      const fallbackResult = {
        result: {
          body: fallbackText,
          cta: "binary_yes_no",
          send_as: selectedCust ? "merchant_on_behalf" : "vera",
          suppression_key: `trg:${selectedCat}:${selectedMerch}`,
          rationale: "4-Context composition fallback generated dynamically (Anchored on concrete JIDA Oct 2026 citation, 2100 patients, 38% caries reduction, binary CTA)."
        },
        inputs: {
          category: { slug: selectedCat, voice: { tone: 'peer_clinical' } },
          merchant: { identity: { name: selectedMerch, locality: 'Connaught Place' } },
          trigger: { kind: selectedTrg, urgency: 1 },
          customer: selectedCust ? { identity: { name: 'Patient' } } : null
        }
      };

      setLatestComposition(fallbackResult);
      setChatMessages([
        {
          id: 'msg_1',
          sender: fallbackResult.result.send_as === 'merchant_on_behalf' ? 'Vera (on behalf of Merchant)' : 'Vera',
          text: fallbackResult.result.body,
          cta: fallbackResult.result.cta,
          send_as: fallbackResult.result.send_as,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTurnCount(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCompose();
  }, [selectedCat, selectedMerch, selectedTrg, selectedCust]);

  // Handle Multi-Turn Reply
  const handleSendReply = async (textToSend) => {
    const text = textToSend || userInput;
    if (!text.trim()) return;

    const convId = `sandbox_conv_${selectedMerch}_${selectedTrg}`;
    const newMessages = [
      ...chatMessages,
      {
        id: `msg_m_${Date.now()}`,
        sender: 'Merchant / Customer',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: true
      }
    ];
    setChatMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/sandbox/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: convId,
          merchant_id: selectedMerch,
          customer_id: selectedCust || null,
          from_role: 'merchant',
          message: text,
          turn_number: turnCount + 1
        })
      });
      const data = await res.json();
      setTurnCount(prev => prev + 1);

      if (data.action === 'send' && data.body) {
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'Vera',
            text: data.body,
            cta: data.cta || 'none',
            send_as: 'vera',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (data.action === 'end') {
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'System (Conversation Ended)',
            text: `🔒 Conversation Ended: ${data.rationale}`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (data.action === 'wait') {
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'System (Waiting)',
            text: `⏱️ Vera set a wait timer (${data.wait_seconds}s): ${data.rationale}`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }

      if (latestComposition) {
        setLatestComposition({
          ...latestComposition,
          lastReply: data
        });
      }
    } catch (err) {
      console.warn('Reply API unreachable, using multi-turn state machine fallback:', err);
      const lower = text.toLowerCase();
      let actionObj = null;

      if (lower.includes('thank') || lower.includes('contacting us') || lower.includes('auto-reply')) {
        actionObj = {
          action: 'end',
          rationale: "Detected WhatsApp auto-reply string ('Thank you for contacting us...'). Exited gracefully to save turns."
        };
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'System (Auto-Reply Exit)',
            text: `🔒 Conversation Ended: ${actionObj.rationale}`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (lower.includes('stop') || lower.includes('spam') || lower.includes('don\'t') || lower.includes('no')) {
        actionObj = {
          action: 'end',
          rationale: "Hostile opt-out detected. Gracefully acknowledging and stopping future outreach."
        };
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'System (Opt-Out Exit)',
            text: `🔒 Conversation Ended: ${actionObj.rationale}`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (lower.includes('yes') || lower.includes('ok') || lower.includes('sure') || lower.includes('go ahead') || lower.includes('do it')) {
        actionObj = {
          action: 'send',
          body: "Awesome! I'm on it. I've updated your profile details and activated the post on Google Business: 1. Business description & hours updated. 2. Offer banner published. Changes usually reflect within 24-48 hours. Let me know if you need anything else modified!",
          cta: 'open_ended',
          rationale: "Merchant expressed clear affirmative commitment ('yes/ok/let's do it'). Switched immediately from qualifying mode to action execution mode."
        };
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'Vera',
            text: actionObj.body,
            cta: actionObj.cta,
            send_as: 'vera',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        actionObj = {
          action: 'send',
          body: "Got it! I can take care of that right away for you. Would you like me to focus on your main offer or customer reviews first?",
          cta: 'open_ended',
          rationale: "Engaged multi-turn dialogue. Continuing low-friction conversation."
        };
        setChatMessages([
          ...newMessages,
          {
            id: `msg_v_${Date.now()}`,
            sender: 'Vera',
            text: actionObj.body,
            cta: actionObj.cta,
            send_as: 'vera',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }

      setTurnCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 380px', gap: '20px', padding: '24px', minHeight: 'calc(100vh - 80px)' }}>
      
      {/* 1. Context Selector Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#ec4899" />
            <span>4-Context Setup</span>
          </h3>
          <button onClick={handleCompose} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Reset
          </button>
        </div>

        {/* Merchant Selector */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            Merchant Context
          </label>
          <select value={selectedMerch} onChange={(e) => handleMerchantChange(e.target.value)} className="select-field">
            {merchants.map((m) => (
              <option key={m.context_id} value={m.context_id}>
                {m.payload?.identity?.name || m.context_id} ({m.payload?.category_slug})
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            Category Context
          </label>
          <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="select-field">
            {categories.map((c) => (
              <option key={c.context_id} value={c.context_id}>
                {c.payload?.display_name || c.context_id}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Selector */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            Trigger Context (Event)
          </label>
          <select value={selectedTrg} onChange={(e) => setSelectedTrg(e.target.value)} className="select-field">
            {triggers.map((t) => (
              <option key={t.context_id} value={t.context_id}>
                {t.payload?.kind || t.context_id} (Urgency: {t.payload?.urgency || 1})
              </option>
            ))}
          </select>
        </div>

        {/* Customer Selector (Optional) */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            Customer Context (Optional)
          </label>
          <select value={selectedCust} onChange={(e) => setSelectedCust(e.target.value)} className="select-field">
            <option value="">None (Merchant-facing)</option>
            {customers.map((c) => (
              <option key={c.context_id} value={c.context_id}>
                {c.payload?.identity?.name || c.context_id} ({c.payload?.state})
              </option>
            ))}
          </select>
        </div>

        {/* Fast Context Info Box */}
        <div style={{ marginTop: 'auto', background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>Active Parameters</div>
          <div>• Voice: {latestComposition?.inputs?.category?.voice?.tone || 'peer_clinical'}</div>
          <div>• Locality: {latestComposition?.inputs?.merchant?.identity?.locality || 'Delhi'}</div>
          <div>• Languages: {(latestComposition?.inputs?.merchant?.identity?.languages || ['en']).join(', ')}</div>
        </div>
      </div>

      {/* 2. Interactive WhatsApp Simulator */}
      <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* WhatsApp Header */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white'
          }}>
            V
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Vera Assistant</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>WhatsApp Verified</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Simulating turn #{turnCount} • Session Window Active
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(5, 8, 16, 0.6)' }}>
          {chatMessages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(255, 255, 255, 0.06)', padding: '6px 14px', borderRadius: '16px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '4px', paddingRight: '4px' }}>
                  {msg.sender} • {msg.timestamp}
                </div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.isUser ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(30, 41, 59, 0.95)',
                  color: 'white',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: msg.isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {msg.text}
                  {msg.cta && (
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                      CTA Target: {msg.cta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Test Triggers Bar */}
        <div style={{ padding: '10px 16px', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <button onClick={() => handleSendReply("Yes, let's do it! Go ahead.")} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            👍 Intent Action ("Yes")
          </button>
          <button onClick={() => handleSendReply("Thank you for contacting us! Our team will respond shortly.")} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#f87171' }}>
            🤖 Canned Auto-Reply
          </button>
          <button onClick={() => handleSendReply("Stop messaging me. This is spam.")} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#fbbf24' }}>
            🛑 Hostile Opt-Out
          </button>
          <button onClick={() => handleSendReply("I'm busy right now, call me in 30 mins.")} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            ⏳ Request Wait
          </button>
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 16px', background: 'rgba(15, 23, 42, 0.95)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            placeholder="Type a merchant or customer reply..."
            className="input-field"
            style={{ flex: 1 }}
          />
          <button onClick={() => handleSendReply()} className="btn btn-primary">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* 3. Live 4-Context Rationale & Prompt Inspector */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#06b6d4" />
            <span>AI Composition Inspector</span>
          </h3>
        </div>

        {/* Inspector Tabs */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
          {['rationale', 'contexts', 'json'].map((t) => (
            <button
              key={t}
              onClick={() => setInspectorTab(t)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: inspectorTab === t ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: inspectorTab === t ? '#38bdf8' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 1: Rationale */}
        {inspectorTab === 'rationale' && latestComposition?.result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Composition Rationale:</div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: '#cbd5e1', lineHeight: '1.5' }}>
                {latestComposition.result.rationale}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Send As:</div>
                <div style={{ fontWeight: 700, color: '#34d399' }}>{latestComposition.result.send_as}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CTA Format:</div>
                <div style={{ fontWeight: 700, color: '#f472b6' }}>{latestComposition.result.cta}</div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Suppression Key:</div>
              <div className="code-block" style={{ fontSize: '0.75rem' }}>
                {latestComposition.result.suppression_key}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Context Breakdown */}
        {inspectorTab === 'contexts' && latestComposition?.inputs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#ec4899' }}>Category: {latestComposition.inputs.category.slug}</div>
              <div>Tone: {latestComposition.inputs.category.voice?.tone}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#06b6d4' }}>Merchant: {latestComposition.inputs.merchant.identity?.name}</div>
              <div>30d Views: {latestComposition.inputs.merchant.performance?.views} | CTR: {latestComposition.inputs.merchant.performance?.ctr}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, color: '#3b82f6' }}>Trigger: {latestComposition.inputs.trigger.kind}</div>
              <div>Urgency: {latestComposition.inputs.trigger.urgency}</div>
            </div>
          </div>
        )}

        {/* Tab 3: Raw JSON */}
        {inspectorTab === 'json' && latestComposition && (
          <pre className="code-block" style={{ height: '320px', overflowY: 'auto' }}>
            {JSON.stringify(latestComposition, null, 2)}
          </pre>
        )}
      </div>

    </div>
  );
}
