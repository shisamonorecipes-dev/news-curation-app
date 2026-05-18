import React, { useState, useEffect } from 'react';
import { Play, Pause, ExternalLink, Clock, Flame, ListMusic, Loader2, ArrowLeft, History } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './index.css';

// Supabase初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ゲーム業界');
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [viewMode, setViewMode] = useState('latest'); // 'latest' | 'archive_months' | 'archive_days' | 'archive_times' | 'archive_detail'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const categories = ['ゲーム業界', 'eスポーツ', 'インディー', '金融市場'];

  useEffect(() => {
    setSpeechSynthesis(window.speechSynthesis);
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Supabaseからデータを取得
  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      setViewMode('latest'); // カテゴリ切り替え時は最新に戻す
      
      const { data, error } = await supabase
        .from('trends')
        .select('*')
        .eq('category', activeCategory)
        .order('created_at', { ascending: false })
        .limit(1000); // アーカイブ階層化のため1000件取得

      if (error) {
        console.error("データの取得に失敗しました:", error);
      } else {
        setArticles(data || []);
      }
      setLoading(false);
    }
    
    fetchTrends();
  }, [activeCategory]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '不明';
    const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' });
    const diff = new Date().getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return rtf.format(-minutes, 'minute');
    } else if (hours < 24) {
      return rtf.format(-hours, 'hour');
    } else {
      const days = Math.floor(hours / 24);
      return rtf.format(-days, 'day');
    }
  };

  const togglePlay = (id, text) => {
    if (!speechSynthesis) return;

    if (playingId === id) {
      speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = playbackRate;
      utterance.onend = () => setPlayingId(null);
      speechSynthesis.speak(utterance);
      setPlayingId(id);
    }
  };

  const togglePlayAll = (targetArticles) => {
    if (!speechSynthesis) return;

    if (playingId === 'all') {
      speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      speechSynthesis.cancel();
      setPlayingId('all');

      targetArticles.forEach((article, index) => {
        const text = `${article.title}。${article.summary}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = playbackRate;
        
        if (index === targetArticles.length - 1) {
          utterance.onend = () => setPlayingId(null);
        }
        
        speechSynthesis.speak(utterance);
      });
    }
  };

  const renderArticle = (article) => (
    <article key={article.id} className="article-card glass-panel">
      <div className="card-header">
        <div className="meta">
          <div className="meta-item">
            <Clock size={14} />
            <span>{getRelativeTime(article.created_at)}</span>
          </div>
          <span className="source-badge">{article.source_count}サイトで話題</span>
        </div>
        <div className="score">
          <Flame size={14} /> {article.score}
        </div>
      </div>

      <h3 className="article-title">{article.title}</h3>
      
      <div className="reference-links">
        <span className="ref-label">参考元:</span>
        {Array.isArray(article.links) && article.links.map((link, i) => (
          <a key={i} href={link.url} className="ref-link" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} /> {link.name}
          </a>
        ))}
      </div>

      <p className="article-summary">{article.summary}</p>

      <div className="card-actions">
        <div className="play-controls">
          <button 
            className={`play-btn ${playingId === article.id ? 'playing' : ''}`}
            onClick={() => togglePlay(article.id, article.summary)}
          >
            {playingId === article.id ? <Pause size={18} /> : <Play size={18} />}
            <span>{playingId === article.id ? '停止' : '読み上げ'}</span>
          </button>
          
          <select 
            className="rate-select small" 
            value={playbackRate} 
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            title="再生速度"
          >
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>
        </div>
      </div>
    </article>
  );

  // 記事の分類（直近1回分=5件を「最新」、それ以降を「過去」）
  const latestArticles = articles.slice(0, 5).sort((a, b) => b.score - a.score);
  const pastArticles = articles.slice(5);

  const archiveTree = {};
  pastArticles.forEach(article => {
    const d = new Date(article.created_at);
    const yearMonth = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const monthDay = `${d.getMonth() + 1}月${d.getDate()}日`;
    const timeLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}時`;

    if (!archiveTree[yearMonth]) archiveTree[yearMonth] = { count: 0, days: {} };
    archiveTree[yearMonth].count++;

    if (!archiveTree[yearMonth].days[monthDay]) archiveTree[yearMonth].days[monthDay] = { count: 0, times: {} };
    archiveTree[yearMonth].days[monthDay].count++;

    if (!archiveTree[yearMonth].days[monthDay].times[timeLabel]) archiveTree[yearMonth].days[monthDay].times[timeLabel] = [];
    archiveTree[yearMonth].days[monthDay].times[timeLabel].push(article);
  });

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="logo text-gradient">Curation.AI</h1>
        <p className="subtitle">話題のニュースをAIがピックアップ</p>
      </header>

      <nav className="categories">
        {categories.map(cat => (
          <button 
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main>
        {loading ? (
          <div className="loading-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
            <p>最新のトレンドを取得中...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p>このカテゴリのニュースはまだ取得されていません。</p>
          </div>
        ) : viewMode === 'latest' ? (
          // === 最新モードの表示 ===
          <div className="view-latest">
            <section className="trending-section">
              <div className="section-header">
                <Flame className="icon-flame" />
                <h2>Trending Now</h2>
                <div className="controls-right">
                  <button 
                    className={`play-all-btn ${playingId === 'all' ? 'playing' : ''}`}
                    onClick={() => togglePlayAll(latestArticles)}
                  >
                    {playingId === 'all' ? <Pause size={16} /> : <ListMusic size={16} />}
                    <span>{playingId === 'all' ? '全停止' : 'すべて再生'}</span>
                  </button>
                </div>
              </div>
              <div className="articles-grid">
                {latestArticles.map(renderArticle)}
              </div>
            </section>

            {Object.keys(archiveTree).length > 0 && (
              <div className="archive-link-container" style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '3rem' }}>
                <button 
                  className="archive-button" 
                  onClick={() => {
                    setViewMode('archive_months');
                    window.scrollTo(0, 0);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '14px 32px',
                    borderRadius: '30px',
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.background = 'var(--primary)'; 
                    e.currentTarget.style.color = '#fff'; 
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; 
                    e.currentTarget.style.color = 'var(--text-secondary)'; 
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  過去のアーカイブはこちら
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'archive_months' ? (
          // === アーカイブ 月一覧 ===
          <div className="view-archive-list">
            <div className="archive-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className="back-button"
                onClick={() => setViewMode('latest')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
                  padding: '8px 16px', borderRadius: '20px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <ArrowLeft size={16} /> トップへ戻る
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>過去のアーカイブ一覧</h2>
            </div>
            
            <div className="archive-links-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto', marginBottom: '4rem' }}>
              {Object.keys(archiveTree).length === 0 ? (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>過去のアーカイブはまだありません。</p>
              ) : (
                Object.keys(archiveTree).map(month => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setViewMode('archive_days');
                      window.scrollTo(0, 0);
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '1.2rem 1.5rem', borderRadius: '12px', color: 'var(--text-primary)',
                      fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span>{month}の記事</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{archiveTree[month].count}件</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : viewMode === 'archive_days' ? (
          // === アーカイブ 日一覧 ===
          <div className="view-archive-list">
            <div className="archive-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className="back-button"
                onClick={() => setViewMode('archive_months')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
                  padding: '8px 16px', borderRadius: '20px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <ArrowLeft size={16} /> 一覧へ戻る
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{selectedMonth}のアーカイブ</h2>
            </div>
            
            <div className="archive-links-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto', marginBottom: '4rem' }}>
              {Object.keys(archiveTree[selectedMonth]?.days || {}).map(day => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode('archive_times');
                    window.scrollTo(0, 0);
                  }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1.2rem 1.5rem', borderRadius: '12px', color: 'var(--text-primary)',
                    fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{day}の記事</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{archiveTree[selectedMonth].days[day].count}件</span>
                </button>
              ))}
            </div>
          </div>
        ) : viewMode === 'archive_times' ? (
          // === アーカイブ 時間一覧 ===
          <div className="view-archive-list">
            <div className="archive-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className="back-button"
                onClick={() => setViewMode('archive_days')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
                  padding: '8px 16px', borderRadius: '20px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <ArrowLeft size={16} /> 戻る
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{selectedDay}のアーカイブ</h2>
            </div>
            
            <div className="archive-links-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto', marginBottom: '4rem' }}>
              {Object.keys(archiveTree[selectedMonth]?.days[selectedDay]?.times || {}).map(timeLabel => (
                <button
                  key={timeLabel}
                  onClick={() => {
                    setSelectedTime(timeLabel);
                    setViewMode('archive_detail');
                    window.scrollTo(0, 0);
                  }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1.2rem 1.5rem', borderRadius: '12px', color: 'var(--text-primary)',
                    fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{timeLabel}の記事</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{archiveTree[selectedMonth].days[selectedDay].times[timeLabel].length}件</span>
                </button>
              ))}
            </div>
          </div>
        ) : viewMode === 'archive_detail' ? (
          // === アーカイブ詳細モードの表示 ===
          <div className="view-archive-detail">
            <div className="archive-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className="back-button"
                onClick={() => setViewMode('archive_times')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
                  padding: '8px 16px', borderRadius: '20px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <ArrowLeft size={16} /> 一覧へ戻る
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{selectedTime}</h2>
            </div>
            
            <div className="articles-grid">
              {(archiveTree[selectedMonth]?.days[selectedDay]?.times[selectedTime] || []).map(renderArticle)}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
