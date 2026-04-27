import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Send, 
  MessageSquare, 
  XCircle, 
  PlusCircle, 
  ExternalLink, 
  Globe, 
  DollarSign, 
  Zap,
  CheckCircle,
  Edit3
} from 'lucide-react';
import './App.css';

interface Application {
  id?: number;
  company: string;
  role: string;
  market: string;
  salary_est: string;
  status: string;
  url: string;
  date_applied: string;
  notes: string;
}

const API_BASE = 'http://localhost:3001/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

function App() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const initialFormState: Application = {
    company: '',
    role: '',
    market: 'USA/Canada',
    salary_est: '',
    status: 'pending',
    url: '',
    date_applied: new Date().toISOString().split('T')[0],
    notes: ''
  };

  const [formData, setFormData] = useState<Application>(initialFormState);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API_BASE}/applications`);
      setApps(res.data);
    } catch (err) {
      console.error('Failed to fetch apps');
    }
  };

  const startEdit = (app: Application) => {
    setEditingId(app.id!);
    setFormData(app);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleExtract = async () => {
    if (!formData.url.includes('linkedin.com')) {
      alert('Please enter a valid LinkedIn URL');
      return;
    }
    setExtracting(true);
    try {
      const res = await axios.post(`${API_BASE}/extract-linkedin`, { url: formData.url });
      setFormData(prev => ({
        ...prev,
        company: res.data.company || prev.company,
        role: res.data.role || prev.role,
        market: res.data.market || prev.market
      }));
    } catch (err) {
      alert('Failed to extract details. Please enter manually.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Create payload without the ID field for clean database updates
    const { id, ...payload } = formData;
    
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/applications/${editingId}`, payload);
        setEditingId(null);
      } else {
        await axios.post(`${API_BASE}/applications`, payload);
      }
      setFormData(initialFormState);
      fetchApps();
    } catch (err) {
      alert('Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`${API_BASE}/applications/${id}`, { status });
      fetchApps();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const stats = {
    total: apps.length,
    applied: apps.filter(a => a.status === 'applied').length,
    interviews: apps.filter(a => a.status === 'interview').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <motion.div 
      className="app-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Moving SVG Wave Background */}
      <div className="ocean">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <motion.header variants={itemVariants}>
        <div className="logo">NOMAD<span>TRACKER</span></div>
        <div className="user-context">
          <Globe size={14} />
          <span>Premium Pipeline • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
      </motion.header>

      <motion.div className="stats-grid" variants={containerVariants}>
        <motion.div className="stat-card" variants={itemVariants} whileHover={{scale: 1.05}}>
          <h3>Total Funnel</h3>
          <div className="value">{stats.total}</div>
          <Briefcase className="icon-bg" size={80} />
        </motion.div>
        <motion.div className="stat-card" variants={itemVariants} whileHover={{scale: 1.05}}>
          <h3>Active Apps</h3>
          <div className="value" style={{color: 'var(--success)'}}>{stats.applied}</div>
          <Send className="icon-bg" size={80} color="var(--success)" />
        </motion.div>
        <motion.div className="stat-card" variants={itemVariants} whileHover={{scale: 1.05}}>
          <h3>Interviews</h3>
          <div className="value" style={{color: 'var(--accent)'}}>{stats.interviews}</div>
          <MessageSquare className="icon-bg" size={80} color="var(--accent)" />
        </motion.div>
        <motion.div className="stat-card" variants={itemVariants} whileHover={{scale: 1.05}}>
          <h3>Rejections</h3>
          <div className="value" style={{color: 'var(--danger)'}}>{stats.rejected}</div>
          <XCircle className="icon-bg" size={80} color="var(--danger)" />
        </motion.div>
      </motion.div>

      <div className="main-content">
        <motion.aside className="form-card" variants={itemVariants}>
          <h2>
            {editingId ? <Edit3 size={24} color="var(--accent)" /> : <Zap size={24} color="var(--accent)" />}
            {editingId ? ' Update Entry' : ' Smart Entry'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>LinkedIn URL</label>
              <div style={{display:'flex', gap:12}}>
                <input 
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  placeholder="Drop Link here..."
                />
                <motion.button 
                  type="button" 
                  onClick={handleExtract} 
                  disabled={extracting} 
                  className="btn-secondary"
                  whileTap={{scale: 0.9}}
                >
                  {extracting ? '...' : <Zap size={18} />}
                </motion.button>
              </div>
            </div>

            <div className="input-group">
              <label>Company & Role</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <input 
                  required
                  value={formData.company} 
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  placeholder="Hopper"
                />
                <input 
                  required
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  placeholder="PM / DM"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Market & Salary</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <input 
                  value={formData.market} 
                  onChange={e => setFormData({...formData, market: e.target.value})}
                  placeholder="Remote US"
                />
                <div style={{position:'relative'}}>
                  <DollarSign size={14} style={{position:'absolute', left:14, top:18, color:'var(--text-dim)'}} />
                  <input 
                    style={{paddingLeft:34}}
                    value={formData.salary_est} 
                    onChange={e => setFormData({...formData, salary_est: e.target.value})}
                    placeholder="180k"
                  />
                </div>
              </div>
            </div>

            <div style={{display:'flex', gap:10}}>
                <motion.button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary"
                    whileHover={{scale: 1.02}}
                    whileTap={{scale: 0.98}}
                    style={{flex: 2}}
                >
                    {loading ? 'Processing...' : (editingId ? 'Update Entry' : 'Add to Pipeline')}
                </motion.button>
                {editingId && (
                    <motion.button 
                        type="button" 
                        onClick={cancelEdit} 
                        className="btn-secondary"
                        style={{flex: 1, height: 'auto'}}
                    >
                        Cancel
                    </motion.button>
                )}
            </div>
          </form>
        </motion.aside>

        <motion.section className="apps-list" variants={containerVariants}>
          <AnimatePresence>
            {apps.map(app => (
              <motion.div 
                key={app.id} 
                className="app-item"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -50 }}
                layout
              >
                <div className="app-info">
                  <h4>{app.company}</h4>
                  <div className="role-line">{app.role}</div>
                  <div className="meta-line">
                    <span>📍 {app.market}</span>
                    {app.salary_est && <span>💰 ${app.salary_est}</span>}
                    <span>📅 {app.date_applied}</span>
                  </div>
                </div>
                <div className="item-actions">
                  <motion.button 
                    className="edit-btn"
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.9}}
                    onClick={() => startEdit(app)}
                    title="Edit entry"
                  >
                    <Edit3 size={18} />
                  </motion.button>
                  <select 
                    className={`status-badge status-${app.status}`}
                    value={app.status}
                    onChange={(e) => updateStatus(app.id!, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {app.url && (
                    <motion.a 
                      href={app.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="linkedin-btn"
                      whileHover={{rotate: 15, scale: 1.1}}
                    >
                      <ExternalLink size={20} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {apps.length === 0 && (
            <motion.div 
              className="empty-state"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              style={{textAlign:'center', padding:100, color:'var(--text-dim)', background:'var(--glass-bg)', borderRadius:32, border:'1px dashed var(--glass-border)'}}
            >
              <CheckCircle size={48} style={{marginBottom:16, opacity:0.3}} />
              <p>Your premium career pipeline is clear.</p>
              <p style={{fontSize:13}}>Begin your search by adding your first target company.</p>
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}

export default App;
