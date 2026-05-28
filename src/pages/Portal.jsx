import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Landmark, Globe2, TrendingUp, Cpu, Wrench, Building2, Megaphone, Newspaper } from 'lucide-react';

export const CATEGORIES = [
  { id: 'game', name: 'ゲーム業界', icon: Gamepad2, color: '#9b87f5' },
  { id: 'politics-jp', name: '国内のニュース(政治)', icon: Landmark, color: '#F97316' },
  { id: 'politics-global', name: '海外のニュース(政治)', icon: Globe2, color: '#0EA5E9' },
  { id: 'finance-jp', name: '国内の金融市場ニュース', icon: TrendingUp, color: '#10B981' },
  { id: 'finance-global', name: '海外の金融市場ニュース', icon: TrendingUp, color: '#14B8A6' },
  { id: 'ai-tech', name: 'AIのツールやサービス、仕様変更などに関わるニュース', icon: Cpu, color: '#D946EF' },
  { id: 'big-tech', name: 'GAFAMに関連するニュース', icon: Building2, color: '#3B82F6' },
  { id: 'marketing', name: '広告マーケティング(広告メディア含む)に関わるニュース', icon: Megaphone, color: '#F43F5E' },
];

export default function Portal() {
  return (
    <div className="portal-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <header className="header" style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
        <h1 className="logo text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Curation.AI</h1>
        <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>話題のニュースをAIがピックアップ</p>
      </header>

      <div className="portal-grid-layout" style={{ marginBottom: '4rem' }}>
        {CATEGORIES.map((cat) => (
          <Link 
            key={cat.id} 
            to={`/category/${cat.id}`} 
            className="portal-card glass-panel"
            style={{ 
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
              padding: '1.5rem', textDecoration: 'none', color: 'var(--text-primary)',
              transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px', height: '100%'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = cat.color;
              e.currentTarget.style.boxShadow = `0 8px 15px -8px ${cat.color}66`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ flexShrink: 0, width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginRight: '1rem' }}>
              <cat.icon size={24} color={cat.color} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', lineHeight: '1.4', textAlign: 'left', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{cat.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
