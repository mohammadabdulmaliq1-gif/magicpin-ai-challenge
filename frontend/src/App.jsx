import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VeraStudio } from './components/VeraStudio';
import { ContextExplorer } from './components/ContextExplorer';
import { JudgeSuite } from './components/JudgeSuite';
import { SubmissionManager } from './components/SubmissionManager';
import { HealthDashboard } from './components/HealthDashboard';
import { API_BASE } from './config';

export const SEED_CONTEXTS = [
  {
    scope: "category",
    context_id: "dentists",
    version: 1,
    payload: { slug: "dentists", display_name: "Dental Clinics", voice: { tone: "peer_clinical" } }
  },
  {
    scope: "category",
    context_id: "salons",
    version: 1,
    payload: { slug: "salons", display_name: "Salons & Spas", voice: { tone: "stylish_peer" } }
  },
  {
    scope: "merchant",
    context_id: "m_001_drmeera_dentist_delhi",
    version: 1,
    payload: {
      merchant_id: "m_001_drmeera_dentist_delhi",
      category_slug: "dentists",
      identity: { name: "Dr. Meera Dental Clinic", owner_first_name: "Meera", locality: "Connaught Place", city: "Delhi", languages: ["en", "hi"] },
      performance: { views: 4500, calls: 120, ctr: 0.035 }
    }
  },
  {
    scope: "merchant",
    context_id: "m_002_glamour_salon_mumbai",
    version: 1,
    payload: {
      merchant_id: "m_002_glamour_salon_mumbai",
      category_slug: "salons",
      identity: { name: "Glamour Studio & Spa", owner_first_name: "Rita", locality: "Bandra", city: "Mumbai", languages: ["en"] },
      performance: { views: 8200, calls: 310, ctr: 0.048 }
    }
  },
  {
    scope: "trigger",
    context_id: "trg_2026_04_26_research_digest",
    version: 1,
    payload: { id: "trg_2026_04_26_research_digest", kind: "research_digest", urgency: 1 }
  },
  {
    scope: "trigger",
    context_id: "trg_2026_04_27_missed_searches",
    version: 1,
    payload: { id: "trg_2026_04_27_missed_searches", kind: "missed_searches", urgency: 2 }
  },
  {
    scope: "customer",
    context_id: "c_001_rahul_sharma",
    version: 1,
    payload: { customer_id: "c_001_rahul_sharma", identity: { name: "Rahul Sharma" }, state: "recall_due" }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [healthData, setHealthData] = useState({
    status: 'ok (demo)',
    uptime_seconds: 3600,
    contexts_loaded: { category: 2, merchant: 2, trigger: 2, customer: 1 }
  });
  const [contexts, setContexts] = useState(SEED_CONTEXTS);

  // Fetch Health status
  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/healthz`);
      const data = await res.json();
      if (data) setHealthData(data);
    } catch (err) {
      // Retain demo health status on offline mode
    }
  };

  // Fetch All Contexts
  const fetchContexts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contexts`);
      const data = await res.json();
      if (data && data.contexts && data.contexts.length > 0) {
        setContexts(data.contexts);
      } else {
        setContexts(SEED_CONTEXTS);
      }
    } catch (err) {
      setContexts(SEED_CONTEXTS);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchContexts();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} healthData={healthData} />

      <main style={{ flex: 1 }}>
        {activeTab === 'studio' && <VeraStudio contexts={contexts} />}
        {activeTab === 'contexts' && <ContextExplorer contexts={contexts} />}
        {activeTab === 'judge' && <JudgeSuite />}
        {activeTab === 'submission' && <SubmissionManager />}
        {activeTab === 'health' && <HealthDashboard healthData={healthData} fetchHealth={fetchHealth} />}
      </main>
    </div>
  );
}
