import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Portal from './pages/Portal';
import CategoryPage from './pages/CategoryPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>
        
        <footer className="footer" style={{ textAlign: 'center', padding: '3rem 1rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
          <div className="footer-links" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <a href="https://legal.shisamonorecipes.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>利用規約</a>
            <a href="https://legal.shisamonorecipes.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>プライバシーポリシー</a>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            &copy; 2026 ししゃものレシピ. All rights reserved.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
