import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import WaveBackground from './components/WaveBackground';
import './App.css';

const StarField = () => {
  const [stars, setStars] = useState<any[]>([]);
  useEffect(() => {
    const s = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2
    }));
    setStars(s);
  }, []);
  return (
    <div className="star-field">
      {stars.map((s, i) => (
        <div key={i} className="star" style={{ 
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          // @ts-ignore
          '--duration': `${s.duration}s` 
        }} />
      ))}
    </div>
  );
};

export default function App() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/applications').then(res => setApps(res.data));
  }, []);

  const stats = {
    total: apps.length,
    applied: apps.filter(a => a.status === 'applied').length,
    interviews: apps.filter(a => a.status === 'interview').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <StarField />
      
      <header className="hero">
        <h1>NomadTracker</h1>
        <p>Premium Career Pipeline for Global Nomads</p>
        <WaveBackground />
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div className="card"><h3>Total</h3><div className="value stat-indigo">{stats.total}</div></div>
          <div className="card"><h3>Applied</h3><div className="value stat-cyan">{stats.applied}</div></div>
          <div className="card"><h3>Interview</h3><div className="value stat-emerald">{stats.interviews}</div></div>
          <div className="card"><h3>Rejected</h3><div className="value stat-rose">{stats.rejected}</div></div>
        </div>

        <div className="card">
          <h2>Application Record</h2>
          {apps.map(app => (
            <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ margin: 0 }}>{app.company}</h4>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>{app.role}</p>
              </div>
              <span className={`status-badge status-${app.status}`}>
                {app.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
