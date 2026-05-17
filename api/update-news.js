import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  try {
    // 認証ヘッダーの確認（第三者による不正なAPI呼び出しを防ぐため）
    // Vercel Cronは自動的に「Bearer <CRON_SECRET>」ヘッダーを付与します。
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const parser = new Parser();

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

    const targetCategory = "ゲーム業界";
    const FEEDS = CATEGORY_FEEDS[targetCategory];

    const articles = [];
    for (const feed of FEEDS) {
      try {
        const data = await parser.parseURL(feed.url);
        const recentItems = data.items.slice(0, 15);
        recentItems.forEach(item => {
          articles.push({ source: feed.name, title: item.title, link: item.link });
        });
      } catch (err) {
        console.error(`Fetch error for ${feed.name}:`, err.message);
      }
    }

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
5. 必ず以下のJSON形式の配列でのみ出力してください。マークダウン（\`\`\`json\`\`\`など）は一切含めず、純粋なJSONテキストのみを返してください。

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

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    });

    let jsonText = aiResponse.text;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
    }
    const trends = JSON.parse(jsonText);

    const recordsToInsert = trends.map(trend => ({
      category: targetCategory,
      title: trend.title,
      summary: trend.summary,
      score: trend.score,
      source_count: trend.source_count || trend.sourceCount || 1,
      links: trend.links
    }));

    const { data, error } = await supabase.from('trends').insert(recordsToInsert).select();

    if (error) throw error;

    return response.status(200).json({ success: true, message: `Successfully updated ${data.length} trends.` });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return response.status(500).json({ success: false, error: error.message });
  }
}
