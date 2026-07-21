import React from 'react';
import { Bot, MessageSquare, Database, Scale, FileCode, Activity } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, healthData }) {
  const tabs = [
    { id: 'studio', label: 'Vera Studio', icon: MessageSquare },
    { id: 'contexts', label: 'Context Hub', icon: Database },
    { id: 'judge', label: 'Judge Harness', icon: Scale },
    { id: 'submission', label: 'Submissions', icon: FileCode },
    { id: 'health', label: 'System Health', icon: Activity },
  ];

  const loadedCount = healthData?.contexts_loaded 
    ? (healthData.contexts_loaded.category + healthData.contexts_loaded.merchant + healthData.contexts_loaded.customer + healthData.contexts_loaded.trigger) 
    : 0;

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      background: 'rgba(10, 14, 24, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ec4899, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)'
        }}>
          <Bot size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>magicpin Vera</span>
            <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>Bot AI Portal</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Merchant AI Assistant Challenge • 4-Context Harness
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(6, 182, 212, 0.25))' : 'transparent',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#06b6d4' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live System Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '20px'
        }}>
          <div className="status-dot"></div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
            API Online • {loadedCount} Contexts
          </span>
        </div>
      </div>
    </nav>
  );
}
