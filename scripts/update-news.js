import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

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
  const fetchPromise = parser.parseURL(url);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`RSS fetch timeout exceeded ${timeoutMs}ms`)), timeoutMs);
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
    { name: 'Gamer', url: 'https://www.gamer.ne.jp/news/rss/' }
  ],
  "国内のニュース(政治)": [
    { name: 'NHKニュース(政治)', url: 'https://www.nhk.or.jp/rss/news/cat04.xml' },
    { name: '読売新聞(政治)', url: 'https://www.yomiuri.co.jp/politics/rss.xml' },
    { name: '朝日新聞(政治)', url: 'https://www.asahi.com/rss/politics.rdf' },
    { name: 'TBS NEWS DIG(政治)', url: 'https://newsdig.tbs.co.jp/rss/articles/-/politics' },
    { name: 'FNNプライムオンライン(政治)', url: 'https://www.fnn.jp/category/news/politics/rss' },
    { name: '毎日新聞(政治)', url: 'https://mainichi.jp/rss/etc/seiji.xml' },
    { name: '産経新聞(政治)', url: 'https://www.sankei.com/rss/news/politics.xml' },
    { name: 'Google News (国内政治)', url: 'https://news.google.com/rss/search?q=政治+国内+-高校+-大学+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "海外のニュース(政治)": [
    { name: 'CNN Japan', url: 'https://www.cnn.co.jp/rss/world.rdf' },
    { name: 'BBC News Japan', url: 'https://www.bbc.com/japanese/index.xml' },
    { name: 'Newsweek Japan', url: 'https://www.newsweekjapan.jp/headlines.rss' },
    { name: 'AFP BB News', url: 'https://feeds.afpbb.com/afpbb/news/all' },
    { name: 'クーリエ・ジャポン', url: 'https://courrier.jp/news/feed/' },
    { name: 'WSJ (Politics)', url: 'https://news.google.com/rss/search?q=site:jp.wsj.com+政治+OR+国際+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "国内の金融市場ニュース": [
    { name: '現代ビジネス', url: 'https://gendai.media/list/feed/rss' },
    { name: '東洋経済オンライン', url: 'https://toyokeizai.net/list/feed/rss' },
    { name: 'ITmedia ビジネス', url: 'https://rss.itmedia.co.jp/rss/2.0/business.xml' },
    { name: 'DIAMOND online', url: 'https://diamond.jp/list/feed/rss' },
    { name: 'PRESIDENT Online', url: 'https://president.jp/list/feed/rss' },
    { name: 'マネーポストWEB', url: 'https://www.moneypost.jp/feed' },
    { name: 'Google News (国内経済)', url: 'https://news.google.com/rss/search?q=国内経済+OR+日経平均+OR+金融政策+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "海外の金融市場ニュース": [
    { name: 'The Wall Street Journal', url: 'https://news.google.com/rss/search?q=site:jp.wsj.com+金融+OR+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Bloomberg', url: 'https://news.google.com/rss/search?q=site:www.bloomberg.co.jp+金融+OR+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Reuters Japan', url: 'https://news.google.com/rss/search?q=site:jp.reuters.com+金融+OR+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Forbes JAPAN', url: 'https://news.google.com/rss/search?q=site:forbesjapan.com+金融+OR+経済+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'CoinPost', url: 'https://coinpost.jp/feed' },
    { name: 'CoinDesk Japan', url: 'https://www.coindeskjapan.com/feed/' }
  ],
  "AIツールやサービス": [
    { name: 'ITmedia AI+', url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml' },
    { name: 'Ledge.ai', url: 'https://ledge.ai/feed/' },
    { name: 'AINOW', url: 'https://ainow.ai/feed/' },
    { name: 'CNET Japan', url: 'https://feeds.feedburner.com/cnet/japan' },
    { name: 'PC Watch', url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf' },
    { name: 'ASCII.jp', url: 'https://ascii.jp/macmac/rss.xml' },
    { name: 'Google News (AI)', url: 'https://news.google.com/rss/search?q=生成AI+OR+ChatGPT+OR+AIツール+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "GAFAMに関連するニュース": [
    { name: 'ギズモード・ジャパン', url: 'https://www.gizmodo.jp/index.xml' },
    { name: 'ITmedia NEWS', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
    { name: 'Business Insider Japan', url: 'https://www.businessinsider.jp/feed/index.xml' },
    { name: 'WIRED.jp', url: 'https://wired.jp/feed/rss/' },
    { name: 'Google News (GAFAM)', url: 'https://news.google.com/rss/search?q=Google+OR+Apple+OR+Meta+OR+Amazon+OR+Microsoft+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "広告マーケティング(広告メディア含む)": [
    { name: 'MarkeZine', url: 'https://markezine.jp/rss/new' },
    { name: 'AdverTimes', url: 'https://www.advertimes.com/feed/' },
    { name: 'Web担当者Forum', url: 'https://webtan.impress.co.jp/rss.xml' },
    { name: 'DIGIDAY', url: 'https://digiday.jp/feed/' },
    { name: 'ferret', url: 'https://ferret-plus.com/rss' },
    { name: 'PR EDGE', url: 'https://predge.jp/feed/' },
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
  for (const feed of FEEDS) {
    try {
      const safeUrl = encodeURI(feed.url);
      const data = await fetchFeedWithTimeout(safeUrl, 15000);
      const recentItems = data.items.slice(0, 100);
      recentItems.forEach(item => {
        if (!existingUrls.has(item.link)) {
          articles.push({ source: feed.name, title: item.title, link: item.link });
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
  if (targetCategory.includes('金融市場')) {
    categoryRule = '4. 【カテゴリ制限】純粋な金融政策、株価動向、為替市場、企業業績、マクロ経済に関するトピックに厳しく限定してください。AIやテクノロジー主体の話題は除外してください。\n';
  } else {
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
${categoryRule}5. 話題性のスコアが高い上位5つのトピックを選定してください。（※もし2メディア以上で重複している話題が5つ未満の場合は、該当する数だけ出力し、無理に5つ選ばないでください）
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
    console.log(`🎉 AIによる要約が完了しました（${trends.length}件のトピック）`);
  } catch (error) {
    console.error('\n❌ AI処理エラー:', error);
    return;
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
  } catch (error) {
    console.error('\n💥 全体の処理中に予期せぬ致命的なエラーが発生しました:', error);
    process.exit(1);
  }
}

main();
