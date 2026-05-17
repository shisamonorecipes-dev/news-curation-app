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
    { name: 'Game*Spark', url: 'https://www.gamespark.jp/rss/index.rdf' }
  ]
};

async function main(targetCategory = "ゲーム業界") {
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
      const data = await parser.parseURL(feed.url);
      const recentItems = data.items.slice(0, 15);
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
以下のゲーム関連ニュース記事のリスト（タイトルと情報源）を分析してください。
カテゴリ: ${targetCategory}

【記事リスト】
${articles.map((a, i) => `[${i}] ${a.title} (Source: ${a.source}, Link: ${a.link})`).join('\n')}

【指示】
1. 同じ内容やトピックを扱っている記事をグループ化してください。
2. グループ化されたトピックを取り上げているメディアの数を「話題性（sourceCount）」としてカウントしてください。スコアは独自に1〜100で設定してください（複数サイトで取り上げられているほど高く）。
3. 話題性のスコアが高い上位5つのトピックを選定してください。
4. 各トピックについて、具体的な固有名詞を含め、150〜200文字程度のニュースサマリーを作成してください。
5. 必ず以下のJSON形式の配列でのみ出力してください。マークダウン（\`\`\`json）は含めず、純粋なJSONテキストのみを返してください。

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

main();
