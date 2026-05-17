import React, { useState, useEffect } from 'react';
import { Play, Pause, ExternalLink, Clock, Flame, ListMusic, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './index.css';

// Supabase初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [playingId, setPlayingId] = useState(null); // 'all' or article.id
  const [activeCategory, setActiveCategory] = useState('ゲーム業界');
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

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
      
      const { data, error } = await supabase
        .from('trends')
        .select('*')
        .eq('category', activeCategory)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error("データの取得に失敗しました:", error);
      } else {
        // 同じバッチで作成されたものをスコア順に並び替え
        const sortedData = (data || []).sort((a, b) => b.score - a.score);
        setArticles(sortedData);
      }
      setLoading(false);
    }
    
    fetchTrends();
  }, [activeCategory]);

  // 相対時間を計算する関数（例: "2時間前"）
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

  // 個別記事の再生・停止
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

  // 全記事の連続再生・停止
  const togglePlayAll = () => {
    if (!speechSynthesis) return;

    if (playingId === 'all') {
      speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      speechSynthesis.cancel();
      setPlayingId('all');

      articles.forEach((article, index) => {
        const text = `${article.title}。${article.summary}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = playbackRate;
        
        if (index === articles.length - 1) {
          utterance.onend = () => setPlayingId(null);
        }
        
        speechSynthesis.speak(utterance);
      });
    }
  };

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
        <section className="trending-section">
          <div className="section-header">
            <Flame className="icon-flame" />
            <h2>Trending Now</h2>
            <div className="controls-right">
              <button 
                className={`play-all-btn ${playingId === 'all' ? 'playing' : ''}`}
                onClick={togglePlayAll}
                disabled={loading || articles.length === 0}
              >
                {playingId === 'all' ? <Pause size={16} /> : <ListMusic size={16} />}
                <span>{playingId === 'all' ? '全停止' : 'すべて再生'}</span>
              </button>
              
              <select 
                className="rate-select" 
                value={playbackRate} 
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                title="全体の再生速度"
              >
                <option value={1.0}>速度 1.0x</option>
                <option value={1.25}>速度 1.25x</option>
                <option value={1.5}>速度 1.5x</option>
                <option value={2.0}>速度 2.0x</option>
              </select>
            </div>
          </div>

          <div className="articles-grid">
            {loading ? (
              <div className="loading-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                <p>最新のトレンドを取得中...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <p>このカテゴリのニュースはまだ取得されていません。</p>
              </div>
            ) : (
              articles.map(article => (
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
                  
                  {/* 参考URLのリスト */}
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
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
