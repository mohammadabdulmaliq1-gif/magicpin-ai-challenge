import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VeraStudio } from './components/VeraStudio';
import { ContextExplorer } from './components/ContextExplorer';
import { JudgeSuite } from './components/JudgeSuite';
import { SubmissionManager } from './components/SubmissionManager';
import { HealthDashboard } from './components/HealthDashboard';
import { API_BASE } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [healthData, setHealthData] = useState(null);
  const [contexts, setContexts] = useState([]);

  // Fetch Health status
  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/healthz`);
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Health fetch error:', err);
    }
  };

  // Fetch All Contexts
  const fetchContexts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contexts`);
      const data = await res.json();
      if (data.contexts) {
        setContexts(data.contexts);
      }
    } catch (err) {
      console.error('Contexts fetch error:', err);
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
