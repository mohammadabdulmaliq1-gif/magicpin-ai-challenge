import React, { useState } from 'react';
import { Database, Search, Edit3, Check, Filter } from 'lucide-react';

export function ContextExplorer({ contexts }) {
  const [activeScope, setActiveScope] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState(null);

  const filtered = contexts.filter(c => {
    const matchScope = activeScope === 'all' || c.scope === activeScope;
    const matchSearch = c.context_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        JSON.stringify(c.payload).toLowerCase().includes(searchQuery.toLowerCase());
    return matchScope && matchSearch;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database color="#ec4899" size={24} />
            <span>4-Context Repository</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Explore and inspect persistent CategoryContext, MerchantContext, TriggerContext, and CustomerContext payloads.
          </p>
        </div>

        {/* Scope Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'category', 'merchant', 'trigger', 'customer'].map(scope => (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                textTransform: 'capitalize',
                background: activeScope === scope ? 'linear-gradient(135deg, #ec4899, #06b6d4)' : 'rgba(255,255,255,0.05)',
                color: activeScope === scope ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '20px' }}>
        
        {/* Context List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search context ID, name, or payload parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} contexts
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
            {filtered.map(item => {
              const isSelected = selectedContext?.context_id === item.context_id;
              let title = item.context_id;
              let subtitle = item.scope;

              if (item.scope === 'merchant') title = item.payload?.identity?.name || item.context_id;
              if (item.scope === 'category') title = item.payload?.display_name || item.context_id;
              if (item.scope === 'trigger') title = item.payload?.kind || item.context_id;
              if (item.scope === 'customer') title = item.payload?.identity?.name || item.context_id;

              return (
                <div
                  key={`${item.scope}_${item.context_id}`}
                  onClick={() => setSelectedContext(item)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`badge badge-${item.scope === 'category' ? 'pink' : item.scope === 'merchant' ? 'cyan' : item.scope === 'trigger' ? 'amber' : 'emerald'}`}>
                      {item.scope}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v{item.version}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    ID: {item.context_id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Context Detail Inspector */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Context Payload Detail</h3>
          {selectedContext ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scope & Context ID</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                  {selectedContext.scope.toUpperCase()} / {selectedContext.context_id}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Raw Payload Schema</div>
                <pre className="code-block" style={{ height: '480px', overflowY: 'auto' }}>
                  {JSON.stringify(selectedContext.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Select any context card on the left to inspect its complete JSON payload schema.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
