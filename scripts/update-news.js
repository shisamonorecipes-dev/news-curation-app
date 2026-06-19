import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Node.jsのプロセス全体を守る絶対的な安全装置（どんなエラーでも強制終了させない）
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Global] 未処理のPromiseエラーを検知しましたが、プロセスを継続します:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ [Global] 予期せぬ例外を検知しましたが、プロセスを継続します:', error);
});

// .envファイルを読み込む
dotenv.config();

// APIクライアントの初期化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

// 安全なタイムアウト付き取得関数
async function fetchFeedWithTimeout(url, timeoutMs = 15000) {
  let isResolved = false;

  // Promise生成直後にcatchを繋ぐことで、後からのエラーによる強制終了を完全に防ぐ
  const fetchPromise = parser.parseURL(url)
    .then(result => {
      isResolved = true;
      return result;
    })
    .catch(err => {
      // 既にタイムアウト等で決着がついていれば、遅れてきたエラーは完全に無視（握りつぶす）
      if (isResolved) return;
      isResolved = true;
      throw err;
    });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`RSS fetch timeout exceeded ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

// Supabaseクライアントの初期化
import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORY_FEEDS = {
  "ゲーム業界": [
    { name: '4Gamer', url: 'https://www.4gamer.net/rss/index.xml' },
    { name: 'Automaton', url: 'https://automaton-media.com/feed/' },
    { name: 'Game*Spark', url: 'https://www.gamespark.jp/rss/index.rdf' },
    { name: 'ファミ通', url: 'https://www.famitsu.com/rss/fcom_all.xml' },
    { name: '電撃オンライン', url: 'https://dengekionline.com/rss/news/' },
    { name: 'INSIDE', url: 'https://www.inside-games.jp/rss/index.rdf' },
    { name: 'IGN Japan', url: 'https://jp.ign.com/feed.xml' },
    { name: 'Gamer', url: 'https://www.gamer.ne.jp/news/rss/' },
    { name: '電ファミニコゲーマー', url: 'https://news.denfaminicogamer.jp/feed' },
    { name: 'KAI-YOU', url: 'https://kai-you.net/feed' },
    { name: 'GameBusiness.jp', url: 'https://www.gamebusiness.jp/rss/index.rdf' },
    { name: 'gamebiz', url: 'https://gamebiz.jp/feed' },
    { name: 'GAME Watch', url: 'https://game.watch.impress.co.jp/data/rss/1.0/gmw/feed.rdf' },
    { name: '窓の杜 (Game)', url: 'https://news.google.com/rss/search?q=site:forest.watch.impress.co.jp+ゲーム+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'リアルサウンド テック (Game)', url: 'https://news.google.com/rss/search?q=site:realsound.jp/tech+ゲーム+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "国内のニュース(政治)": [
    { name: 'NHKニュース(政治)', url: 'https://www.nhk.or.jp/rss/news/cat04.xml' },
    { name: '読売新聞(政治)', url: 'https://www.yomiuri.co.jp/politics/rss.xml' },
    { name: '朝日新聞(政治)', url: 'https://www.asahi.com/rss/politics.rdf' },
    { name: 'TBS NEWS DIG(政治)', url: 'https://newsdig.tbs.co.jp/rss/articles/-/politics' },
    { name: 'FNNプライムオンライン(政治)', url: 'https://www.fnn.jp/category/news/politics/rss' },
    { name: '毎日新聞(政治)', url: 'https://mainichi.jp/rss/etc/seiji.xml' },
    { name: '産経新聞(政治)', url: 'https://www.sankei.com/rss/news/politics.xml' },
    { name: '共同通信(政治)', url: 'https://nordot.app/rss/category/politics' },
    { name: '時事通信', url: 'https://www.jiji.com/rss/jiji_seiji.xml' },
    { name: '東京新聞(政治)', url: 'https://www.tokyo-np.co.jp/rss/politics.xml' },
    { name: '日テレNEWS', url: 'https://news.google.com/rss/search?q=日テレNEWS+政治+OR+国内+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'テレ朝news', url: 'https://news.google.com/rss/search?q=テレ朝news+政治+OR+国内+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: '現代ビジネス', url: 'https://gendai.media/list/feed/rss' },
    { name: 'プレジデントオンライン', url: 'https://president.jp/list/feed/rss' },
    { name: 'Newsweek日本版 (国内)', url: 'https://news.google.com/rss/search?q=ニューズウィーク+国内+OR+日本+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Google News (国内政治)', url: 'https://news.google.com/rss/search?q=政治+国内+-高校+-大学+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "海外のニュース(政治)": [
    { name: 'CNN Japan', url: 'https://www.cnn.co.jp/rss/world.rdf' },
    { name: 'BBC News Japan', url: 'https://www.bbc.com/japanese/index.xml' },
    { name: 'Newsweek Japan', url: 'https://www.newsweekjapan.jp/headlines.rss' },
    { name: 'AFP BB News', url: 'https://feeds.afpbb.com/afpbb/news/all' },
    { name: 'クーリエ・ジャポン', url: 'https://courrier.jp/news/feed/' },
    { name: 'swissinfo (スイス連邦放送)', url: 'https://www.swissinfo.ch/jpn/rss' },
    { name: 'Reuters World', url: 'https://news.google.com/rss/search?q=ロイター+国際+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
    { name: 'The Washington Post', url: 'https://feeds.washingtonpost.com/rss/world' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Politico', url: 'https://rss.politico.com/politics-news.xml' },
    { name: 'Axios', url: 'https://api.axios.com/feed/' },
    { name: 'Google News (米国政治)', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en' },
    { name: 'Google News (国際)', url: 'https://news.google.com/rss/search?q=国際+OR+海外+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "国内の金融市場ニュース": [
    { name: '東洋経済オンライン', url: 'https://toyokeizai.net/list/feed/rss' },
    { name: '日経ビジネス', url: 'https://business.nikkei.com/rss/index.rdf' },
    { name: 'DIAMOND online', url: 'https://diamond.jp/list/feed/rss' },
    { name: 'PRESIDENT Online', url: 'https://president.jp/list/feed/rss' },
    { name: 'ITmedia ビジネス', url: 'https://rss.itmedia.co.jp/rss/2.0/business.xml' },
    { name: '現代ビジネス', url: 'https://gendai.media/list/feed/rss' },
    { name: '週刊エコノミスト Online', url: 'https://weekly-economist.mainichi.jp/feed/' },
    { name: 'NewsPicks', url: 'https://news.google.com/rss/search?q=NewsPicks+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'ITmedia エグゼクティブ', url: 'https://rss.itmedia.co.jp/rss/2.0/executive.xml' },
    { name: 'MONEY PLUS', url: 'https://media.moneyforward.com/feed' },
    { name: 'ZUU online', url: 'https://zuuonline.com/feed' },
    { name: '幻冬舎ゴールドオンライン', url: 'https://gentosha-go.com/feed' },
    { name: 'マネーポストWEB', url: 'https://www.moneypost.jp/feed' },
    { name: '株探', url: 'https://kabutan.jp/rss/news' },
    { name: 'MINKABU', url: 'https://minkabu.jp/news/feed' },
    { name: 'Google News (国内経済)', url: 'https://news.google.com/rss/search?q=国内経済+OR+日経平均+OR+金融政策+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "海外の金融市場ニュース": [
    { name: 'The Wall Street Journal', url: 'https://news.google.com/rss/search?q=ウォール・ストリート・ジャーナル+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Bloomberg', url: 'https://news.google.com/rss/search?q=ブルームバーグ+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Reuters Japan', url: 'https://news.google.com/rss/search?q=ロイター+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Forbes JAPAN', url: 'https://forbesjapan.com/feeds/rss' },
    { name: 'Business Insider', url: 'https://www.businessinsider.jp/feed/index.xml' },
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?profile=10000664' },
    { name: 'Financial Times', url: 'https://news.google.com/rss/search?q=Financial+Times+Economy+when:1d&hl=en-US&gl=US&ceid=US:en' },
    { name: 'The Economist', url: 'https://news.google.com/rss/search?q=The+Economist+Finance+when:1d&hl=en-US&gl=US&ceid=US:en' },
    { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
    { name: 'Yahoo Finance US', url: 'https://finance.yahoo.com/news/rssindex' },
    { name: 'CoinPost', url: 'https://coinpost.jp/feed' },
    { name: 'CoinDesk Japan', url: 'https://www.coindeskjapan.com/feed/' },
    { name: 'CoinTelegraph Japan', url: 'https://jp.cointelegraph.com/rss' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.jp/feed/' },
    { name: 'Google News (米国経済)', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en' }
  ],
  "AIツールやサービス": [
    { name: 'ITmedia AI+', url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml' },
    { name: 'Ledge.ai', url: 'https://ledge.ai/feed/' },
    { name: 'AINOW', url: 'https://ainow.ai/feed/' },
    { name: 'IoT NEWS', url: 'https://iotnews.jp/feed' },
    { name: 'CNET Japan', url: 'https://feeds.feedburner.com/cnet/japan' },
    { name: 'PC Watch', url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf' },
    { name: 'ASCII.jp', url: 'https://ascii.jp/macmac/rss.xml' },
    { name: '＠IT', url: 'https://rss.itmedia.co.jp/rss/2.0/atmarkit.xml' },
    { name: 'WIRED.jp', url: 'https://wired.jp/feed/rss/' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.jp/feed/' },
    { name: 'TechCrunch Japan', url: 'https://news.google.com/rss/search?q=site:jp.techcrunch.com+AI+OR+スタートアップ+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'ZDNET Japan', url: 'https://japan.zdnet.com/rss/news/index.rdf' },
    { name: 'TechTargetジャパン', url: 'https://news.google.com/rss/search?q=site:techtarget.itmedia.co.jp+AI+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Business Insider Japan', url: 'https://www.businessinsider.jp/feed/index.xml' },
    { name: 'Forbes JAPAN', url: 'https://forbesjapan.com/feeds/rss' },
    { name: 'Google News (AI)', url: 'https://news.google.com/rss/search?q=生成AI+OR+ChatGPT+OR+AIツール+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "GAFAMに関連するニュース": [
    { name: 'ギズモード・ジャパン', url: 'https://www.gizmodo.jp/index.xml' },
    { name: 'ITmedia NEWS', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
    { name: 'Business Insider Japan', url: 'https://www.businessinsider.jp/feed/index.xml' },
    { name: 'WIRED.jp', url: 'https://wired.jp/feed/rss/' },
    { name: 'ケータイWatch', url: 'https://k-tai.watch.impress.co.jp/data/rss/1.0/ktw/feed.rdf' },
    { name: 'CNET Japan', url: 'https://feeds.feedburner.com/cnet/japan' },
    { name: 'Forbes JAPAN', url: 'https://forbesjapan.com/feeds/rss' },
    { name: 'PC Watch', url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf' },
    { name: 'ASCII.jp', url: 'https://ascii.jp/macmac/rss.xml' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'ZDNET Japan', url: 'https://japan.zdnet.com/rss/news/index.rdf' },
    { name: '9to5Mac', url: 'https://9to5mac.com/feed/' },
    { name: '窓の杜', url: 'https://forest.watch.impress.co.jp/data/rss/1.0/for/feed.rdf' },
    { name: 'Google News (GAFAM)', url: 'https://news.google.com/rss/search?q=Google+OR+Apple+OR+Meta+OR+Amazon+OR+Microsoft+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "広告マーケティング(広告メディア含む)": [
    { name: 'MarkeZine', url: 'https://markezine.jp/rss/new' },
    { name: 'AdverTimes', url: 'https://www.advertimes.com/feed/' },
    { name: 'Web担当者Forum', url: 'https://webtan.impress.co.jp/rss.xml' },
    { name: 'DIGIDAY', url: 'https://digiday.jp/feed/' },
    { name: 'ferret', url: 'https://ferret-plus.com/rss' },
    { name: 'PR EDGE', url: 'https://predge.jp/feed/' },
    { name: '販促会議', url: 'https://mag.sendenkaigi.com/hansoku/rss.xml' },
    { name: 'LISKUL', url: 'https://liskul.com/feed' },
    { name: 'U-Site', url: 'https://u-site.jp/feed' },
    { name: 'ITmedia マーケティング', url: 'https://rss.itmedia.co.jp/rss/2.0/marketing.xml' },
    { name: 'Marketing Native', url: 'https://marketingnative.jp/feed/' },
    { name: 'Agenda note', url: 'https://agenda-note.com/feed/' },
    { name: 'AdZine', url: 'https://adzine.jp/feed/' },
    { name: 'Google News (マーケティング)', url: 'https://news.google.com/rss/search?q=広告マーケティング+OR+デジタル広告+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ]
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processCategory(targetCategory) {
  console.log(`\n🚀【${targetCategory}】のニュース取得プロセスを開始します...`);
  
  const FEEDS = CATEGORY_FEEDS[targetCategory];
  if (!FEEDS) return console.error(`❌ カテゴリ「${targetCategory}」が見つかりません。`);

  // 直近2日間のトレンドから保存済みURLを取得
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);
  const { data: existingTrends } = await supabase
    .from('trends')
    .select('links')
    .eq('category', targetCategory)
    .gte('created_at', yesterday.toISOString());
  
  const existingUrls = new Set();
  if (existingTrends) {
    existingTrends.forEach(trend => {
      if (Array.isArray(trend.links)) {
        trend.links.forEach(link => existingUrls.add(link.url));
      }
    });
  }

  // 1. RSSから記事取得
  console.log('🔄 1. ニュース記事を取得中...');
  const articles = [];
  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const feed of FEEDS) {
    try {
      const safeUrl = encodeURI(feed.url);
      const data = await fetchFeedWithTimeout(safeUrl, 15000);
      
      // 万が一の巨大RSSに備え、一旦25件でスライスしてから日付判定
      const recentItems = data.items.slice(0, 25);
      let addedCount = 0;

      recentItems.forEach(item => {
        let isRecent = false;
        if (item.isoDate || item.pubDate) {
          const itemTime = new Date(item.isoDate || item.pubDate).getTime();
          if (!isNaN(itemTime) && (now - itemTime) <= oneDayMs) {
            isRecent = true;
          }
        } else {
          // 日付が存在しない特殊なRSSの場合は、最新の数件だけを救済する
          if (addedCount < 3) isRecent = true;
        }

        if (isRecent && !existingUrls.has(item.link)) {
          articles.push({ source: feed.name, title: item.title, link: item.link });
          addedCount++;
        }
      });
    } catch (error) {
      console.error(`❌ ${feed.name} 取得エラー:`, error.message);
    }
  }

  console.log(`✅ 計 ${articles.length} 件の新しい記事を取得しました（重複を除外済み）。`);

  if (articles.length === 0) {
    console.log('✨ 新しいニュースはありませんでした。終了します。');
    return;
  }

  // 2. Geminiによる要約とスコアリング
  console.log('🔄 2. AI(Gemini)に分析・要約を依頼中...');
  
  let categoryRule = '';
  
  // 金融市場（国内・海外で完全分離）
  if (targetCategory === '国内の金融市場ニュース') {
    categoryRule = '4. 【カテゴリ制限】日本国内の金融政策（日銀等）、国内企業の業績、日経平均株価、日本国内のマクロ経済に関するトピックに厳格に限定してください。海外の金融ニュース、AI・テクノロジー、政治、ゲーム、広告マーケティング主体の話題は完全に除外してください。\n';
  } else if (targetCategory === '海外の金融市場ニュース') {
    categoryRule = '4. 【カテゴリ制限】海外の金融政策（FRB等）、海外企業の業績、米国株・暗号資産、グローバルなマクロ経済に関するトピックに厳格に限定してください。日本国内の金融ニュース、AI・テクノロジー、政治、ゲーム、広告マーケティング主体の話題は完全に除外してください。\n';
  } 
  // GAFAM・AIツール（相互の重複を完全排除）
  else if (targetCategory.includes('GAFAM')) {
    categoryRule = '4. 【カテゴリ制限】「Google、Apple、Meta、Amazon、Microsoft」の企業動向、ビジネス戦略、ハードウェア製品（スマホ等）に関するトピックに厳格に限定してください。【超重要】同じGoogleやMicrosoftでも、「Gemini」や「Copilot」「ChatGPT」など【生成AIツールに関するニュースは完全に除外】してください（それらはAIカテゴリの担当です）。純粋な金融、政治、ゲーム、広告マーケの話題も完全に除外してください。\n';
  } else if (targetCategory.includes('AIツール')) {
    categoryRule = '4. 【カテゴリ制限】「AI（人工知能）、機械学習、LLM、生成AIツール（Gemini, Copilot, ChatGPT等）」の技術やサービスに関するトピックに厳格に限定してください。GoogleやMicrosoftのニュースであっても、AIに関連するものであれば積極的に取り上げてください。AIと無関係なスマホ等のハードウェア発表、純粋な金融、政治、ゲーム、広告マーケの話題は完全に除外してください。\n';
  } 
  // 政治・一般ニュース（国内・海外で完全分離）
  else if (targetCategory === '国内のニュース(政治)') {
    categoryRule = '4. 【カテゴリ制限】日本国内の政治、政策、選挙、日本国内の社会問題に関するトピックに厳格に限定してください。海外の政治・国際情勢、AI・テクノロジー・エンタメ・ゲーム・純粋な金融・広告マーケティングの話題は完全に除外してください。\n';
  } else if (targetCategory === '海外のニュース(政治)') {
    categoryRule = '4. 【カテゴリ制限】海外の政治、国際情勢、外交、海外の選挙や社会問題に関するトピックに厳格に限定してください。日本国内の政治や社会問題、AI・テクノロジー・エンタメ・ゲーム・純粋な金融・広告マーケティングの話題は完全に除外してください。\n';
  } 
  // 広告マーケティング
  else if (targetCategory.includes('広告マーケティング')) {
    categoryRule = '4. 【カテゴリ制限】広告、マーケティング、PR、デジタルマーケティングに関するトピックに厳格に限定してください。純粋な金融、政治、ゲーム、単なるAIツールの発表（マーケティング活用を含まないもの）は完全に除外してください。\n';
  }
  // ゲーム
  else if (targetCategory.includes('ゲーム')) {
    categoryRule = '4. 【カテゴリ制限】ゲーム業界、新作ゲーム、eスポーツに関するトピックに厳格に限定してください。純粋な金融、政治、一般的なAIツール、広告マーケティングの話題は完全に除外してください。\n';
  }
  // その他
  else {
    categoryRule = '4. 【カテゴリ制限】該当カテゴリに最もふさわしい、業界全体のトレンドとなる重要なニュースを選定してください。\n';
  }

  const prompt = `
以下のニュース記事のリスト（タイトルと情報源）を分析してください。
カテゴリ: ${targetCategory}

【記事リスト】
${articles.map((a, i) => `[${i}] ${a.title} (Source: ${a.source}, Link: ${a.link})`).join('\n')}

【指示と厳格なルール】
1. 記事リストから、同じ内容やトピックを扱っている記事をグループ化してください。
2. グループ化されたトピックを取り上げているメディアの数を「話題性（sourceCount）」としてカウントしてください。
3. 【超重要】必ず「2つ以上の異なる情報源（メディア）」で取り上げられているトピックのみを選定してください。1つのサイトでしか報じられていない独自のニュースや、株価・為替の定期的な速報などの機械的なデータは【絶対に】除外してください。
${categoryRule}5. 話題性のスコアが高い上位3つのトピックを選定してください。（※もし2メディア以上で重複している話題が3つ未満の場合は、該当する数だけ出力し、無理に3つ選ばないでください）
6. 各トピックについて、具体的な固有名詞を含め、150〜200文字程度のニュースサマリーを作成してください。
7. 必ず以下のJSON形式の配列でのみ出力してください。マークダウン（\`\`\`json）は含めず、純粋なJSONテキストのみを返してください。

[
  {
    "title": "トピックのわかりやすい見出し",
    "summary": "150〜200文字の具体的なサマリー...",
    "score": 85,
    "source_count": 3,
    "links": [
      { "name": "メディア名", "url": "抽出した記事の実際のURL" }
    ]
  }
]
`;

  let trends = [];
  let aiSuccess = false;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.2 }
      });

      let jsonText = response.text;
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
      }
      trends = JSON.parse(jsonText);
      aiSuccess = true;
      console.log(`🎉 AIによる要約が完了しました（${trends.length}件のトピック）`);
      break; // 成功したらループを抜ける
    } catch (error) {
      if (attempt < maxRetries) {
        console.error(`\n⚠️ AI処理エラー (試行 ${attempt}/${maxRetries}):`, error.message);
        console.log(`⏳ APIの混雑を避けるため、60秒後に再試行します...`);
        await sleep(60000); // 1分待機してリトライ
      } else {
        console.error('\n❌ AI処理エラー (最終):', error.message);
        // GitHub ActionsのSummary画面に警告として表示
        console.log(`::warning title=AI Processing Failed in [${targetCategory}]::${error.message}`);
      }
    }
  }

  if (!aiSuccess) {
    console.log(`ℹ️ [${targetCategory}] はAIサーバー高負荷のため生成をスキップし、UI通知用の空レコードを保存します。`);
    const errorRecord = {
      category: targetCategory,
      title: "現在、AIサーバーが大変混み合っています。",
      summary: "この時間帯のニュース要約は、AIサーバーの高負荷（503エラー等）により一時的にスキップされました。次回の自動更新をお待ちください。",
      score: 0,
      source_count: 0,
      links: []
    };
    const { error: insertError } = await supabase.from('trends').insert([errorRecord]);
    if (insertError) console.error('❌ Supabaseエラー通知保存エラー:', insertError.message);
    return; // 保存したら次のカテゴリへ諦める
  }

  // トピックが0件の場合はダミーレコードを作成してUIに通知する
  if (trends.length === 0) {
    console.log(`ℹ️ [${targetCategory}] は新しいトレンド（重複ニュース）がなかったため、UI表示用の空レコードを保存して次に進みます。`);
    trends.push({
      title: "この時間帯は目立った記事がありませんでした。",
      summary: "直近のニュースを分析しましたが、複数のメディアで共通して報じられているような大きな話題は見つかりませんでした。",
      score: 0,
      source_count: 0,
      links: []
    });
  }

  // 3. Supabaseに保存
  console.log('🔄 3. データベース(Supabase)に保存中...');
  
  // 保存用にデータを整形
  const recordsToInsert = trends.map(trend => ({
    category: targetCategory,
    title: trend.title,
    summary: trend.summary,
    score: trend.score,
    source_count: trend.source_count || trend.sourceCount || 1,
    links: trend.links
  }));

  const { data, error } = await supabase
    .from('trends')
    .insert(recordsToInsert)
    .select();

  if (error) {
    console.error('❌ Supabase保存エラー:', error.message);
  } else {
    console.log('✅ データベースに正常に保存されました！');
    console.log(`   保存された最新トピック: ${data[0].title}`);
  }
}

async function main() {
  console.log('🌟 全カテゴリの自動更新処理を開始します...');
  // モニタリング用：GitHub ActionsのSummary画面に使用モデルをNoticeとして出力
  console.log('::notice title=AI Model Info::Running with [gemini-2.5-flash with 3x Retry] for monitoring and stability');
  try {
    const categories = Object.keys(CATEGORY_FEEDS);
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      await processCategory(category);
      
      // APIレートリミット対策として、次のカテゴリ実行前に3秒待機する（最後以外）
      if (i < categories.length - 1) {
        console.log('⏳ APIの制限を避けるため、3秒待機します...\n');
        await sleep(3000);
      }
    }
    
    console.log('\n✨ すべてのカテゴリのニュース更新が完了しました！');
    process.exit(0); // ゾンビプロセスによるGitHub Actionsの6時間ハングアップを確実に防ぐための強制終了
  } catch (error) {
    console.error('\n💥 全体の処理中に予期せぬ致命的なエラーが発生しました:', error);
    process.exit(1);
  }
}

main();
