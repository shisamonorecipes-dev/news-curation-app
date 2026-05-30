import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// .envファイルを読み込む
dotenv.config();

// APIクライアントの初期化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const parser = new Parser();

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
    { name: '電撃オンライン', url: 'https://dengekionline.com/rss/news/' }
  ],
  "国内のニュース(政治)": [
    { name: 'NHKニュース(政治)', url: 'https://www.nhk.or.jp/rss/news/cat04.xml' },
    { name: '読売新聞(政治)', url: 'https://www.yomiuri.co.jp/politics/rss.xml' },
    { name: '朝日新聞(政治)', url: 'https://www.asahi.com/rss/politics.rdf' },
    { name: 'TBS NEWS DIG(政治)', url: 'https://newsdig.tbs.co.jp/rss/articles/-/politics' },
    { name: 'FNNプライムオンライン(政治)', url: 'https://www.fnn.jp/category/news/politics/rss' },
    { name: 'Google News (国内政治)', url: 'https://news.google.com/rss/search?q=政治+国内+-高校+-大学+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "海外のニュース(政治)": [
    { name: 'NHKニュース(国際)', url: 'https://www.nhk.or.jp/rss/news/cat06.xml' },
    { name: '読売新聞(国際)', url: 'https://www.yomiuri.co.jp/world/rss.xml' },
    { name: 'CNN Japan', url: 'https://www.cnn.co.jp/rss/world.rdf' },
    { name: 'BBC News Japan', url: 'https://www.bbc.com/japanese/index.xml' },
    { name: 'Newsweek Japan', url: 'https://www.newsweekjapan.jp/headlines.rss' },
    { name: 'AFP BB News', url: 'https://feeds.afpbb.com/afpbb/news/all' },
    { name: 'Google News (国際政治)', url: 'https://news.google.com/rss/search?q=政治+(海外+OR+国際)+-高校+-大学+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "国内の金融市場ニュース": [
    { name: '現代ビジネス', url: 'https://gendai.media/list/feed/rss' },
    { name: '東洋経済', url: 'https://toyokeizai.net/list/feed/rss' },
    { name: 'ITmedia ビジネス', url: 'https://rss.itmedia.co.jp/rss/2.0/business.xml' },
    { name: 'Google News (国内経済)', url: 'https://news.google.com/rss/search?q=国内経済+OR+日経平均+OR+金融政策+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "海外の金融市場ニュース": [
    { name: 'CoinPost', url: 'https://coinpost.jp/feed' },
    { name: 'Google News (海外金融)', url: 'https://news.google.com/rss/search?q=金融市場+海外+OR+米国株+OR+FRB+when:1d&hl=ja&gl=JP&ceid=JP:ja' },
    { name: 'Google News (世界経済)', url: 'https://news.google.com/rss/search?q=世界経済+OR+NYダウ+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "AIツールやサービス": [
    { name: 'ITmedia AI+', url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml' },
    { name: 'Ledge.ai', url: 'https://ledge.ai/feed/' },
    { name: 'AINOW', url: 'https://ainow.ai/feed/' },
    { name: 'CNET Japan', url: 'https://feeds.feedburner.com/cnet/japan' },
    { name: 'Google News (AI)', url: 'https://news.google.com/rss/search?q=生成AI+OR+ChatGPT+OR+AIツール+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "GAFAMに関連するニュース": [
    { name: 'ギズモード・ジャパン', url: 'https://www.gizmodo.jp/index.xml' },
    { name: 'ITmedia NEWS', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
    { name: 'Google News (GAFAM)', url: 'https://news.google.com/rss/search?q=Google+OR+Apple+OR+Meta+OR+Amazon+OR+Microsoft+when:1d&hl=ja&gl=JP&ceid=JP:ja' }
  ],
  "広告マーケティング(広告メディア含む)": [
    { name: 'MarkeZine', url: 'https://markezine.jp/rss/new' },
    { name: 'AdverTimes', url: 'https://www.advertimes.com/feed/' },
    { name: 'Web担当者Forum', url: 'https://webtan.impress.co.jp/rss.xml' },
    { name: 'DIGIDAY', url: 'https://digiday.jp/feed/' },
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
      const data = await parser.parseURL(safeUrl);
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
  const prompt = `
以下のニュース記事のリスト（タイトルと情報源）を分析してください。
カテゴリ: ${targetCategory}

【記事リスト】
${articles.map((a, i) => `[${i}] ${a.title} (Source: ${a.source}, Link: ${a.link})`).join('\n')}

【指示と厳格なルール】
1. 記事リストから、同じ内容やトピックを扱っている記事をグループ化してください。
2. グループ化されたトピックを取り上げているメディアの数を「話題性（sourceCount）」としてカウントしてください。
3. 【超重要】必ず「2つ以上の異なる情報源（メディア）」で取り上げられているトピックのみを選定してください。1つのサイトでしか報じられていない独自のニュースや、株価・為替の定期的な速報などの機械的なデータは【絶対に】除外してください。
4. 話題性のスコアが高い上位5つのトピックを選定してください。（※もし2メディア以上で重複している話題が5つ未満の場合は、該当する数だけ出力し、無理に5つ選ばないでください）
5. 各トピックについて、具体的な固有名詞を含め、150〜200文字程度のニュースサマリーを作成してください。
6. 必ず以下のJSON形式の配列でのみ出力してください。マークダウン（\`\`\`json）は含めず、純粋なJSONテキストのみを返してください。

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
}

main();
