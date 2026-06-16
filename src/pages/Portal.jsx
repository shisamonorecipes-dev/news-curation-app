import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Landmark, Globe2, TrendingUp, Cpu, Building2, Megaphone, Info } from 'lucide-react';

export const CATEGORIES = [
  { id: 'game', name: 'ゲーム業界', icon: Gamepad2, color: '#9b87f5' },
  { id: 'politics-jp', name: '国内のニュース(政治)', icon: Landmark, color: '#F97316' },
  { id: 'politics-global', name: '海外のニュース(政治)', icon: Globe2, color: '#0EA5E9' },
  { id: 'finance-jp', name: '国内の金融市場ニュース', icon: TrendingUp, color: '#10B981' },
  { id: 'finance-global', name: '海外の金融市場ニュース', icon: TrendingUp, color: '#14B8A6' },
  { id: 'ai-tech', name: 'AIツールやサービス', icon: Cpu, color: '#D946EF' },
  { id: 'big-tech', name: 'GAFAMに関連するニュース', icon: Building2, color: '#3B82F6' },
  { id: 'marketing', name: '広告マーケティング(広告メディア含む)', icon: Megaphone, color: '#F43F5E' },
];

export default function Portal() {
  return (
    <div className="portal-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <header className="header" style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
        <h1 className="logo text-gradient" style={{ fontSize: 'clamp(1.6rem, 6vw, 3rem)', marginBottom: '1rem', lineHeight: '1.2' }}>ししゃものニュース.AI</h1>
        <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>話題のニュースをAIがピックアップ</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>見たいニュースのカテゴリをクリック(またはタップ)してください</p>
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

      <section className="portal-notes" style={{ 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '16px', padding: '2rem', marginTop: '4rem', color: 'var(--text-muted)',
        fontSize: '0.9rem', lineHeight: '1.6'
      }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Info size={18} color="var(--primary)" /> このサイトについて
        </h3>
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>🕒 ニュースの更新時間</h4>
          <p style={{ margin: 0 }}>毎日、日本時間の 6:00 と 18:00 頃にAIが自動で最新ニュースを収集・要約しています。<br/><span style={{ fontSize: '0.85rem', opacity: 0.8 }}>※システムの順番待ち状況により、数十分〜数時間ほど遅れる場合があります。</span></p>
        </div>
        <div>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>🤖 記事の選定ロジック</h4>
          <p style={{ margin: 0 }}>各カテゴリに関連する複数の信頼できるニュースソースから最新記事を取得し、その中から「複数のサイトで同時に話題になっている記事（トレンドスコアが高いもの）」をAIが厳選・要約して掲載しています。</p>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>⚖️ 著作権および情報の取り扱いについて</h4>
          <p style={{ margin: 0 }}>当サイトは、各メディアが報じる「事実（ファクト）」をAIが抽出し、独自の文章として再構成（要約）して配信しています。元記事の文章をそのまま複製したり、引用する二次利用は行っておりません。また、各要約には必ず出典元リンクを明示させていただいているため、適切な出典の明示を遵守させていただいております。</p>
        </div>
      </section>
    </div>
  );
}
