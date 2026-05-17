import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';
import * as dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const parser = new Parser();

const FEEDS = [
  { name: '4Gamer', url: 'https://www.4gamer.net/rss/index.xml' },
  { name: 'Automaton', url: 'https://automaton-media.com/feed/' },
  { name: 'Game*Spark', url: 'https://www.gamespark.jp/rss/index.rdf' }
];

async function main() {
  console.log('🔄 1. ニュース記事を取得中...');
  const articles = [];
  for (const feed of FEEDS) {
    try {
      const data = await parser.parseURL(feed.url);
      const recentItems = data.items.slice(0, 15); // 各サイト15件取得
      recentItems.forEach(item => {
        articles.push({
          source: feed.name,
          title: item.title,
          link: item.link
        });
      });
    } catch (error) {
      console.error(`❌ ${feed.name} 取得エラー:`, error.message);
    }
  }

  console.log(`✅ 計 ${articles.length} 件の記事を取得しました。`);
  console.log('🔄 2. AI(Gemini)に分析・クラスタリング・要約を依頼中...');

  const prompt = `
以下のゲーム関連ニュース記事のリスト（タイトルと情報源）を分析してください。

【記事リスト】
${articles.map((a, i) => `[${i}] ${a.title} (Source: ${a.source}, Link: ${a.link})`).join('\n')}

【指示】
1. 同じ内容やトピックを扱っている記事をグループ化してください。
2. グループ化されたトピックを取り上げているメディアの数を「話題性（sourceCount）」としてカウントしてください。スコアは独自に1〜100で設定してください（複数サイトで取り上げられているほど高く）。
3. 話題性のスコアが高い上位3つのトピックを選定してください。
4. 各トピックについて、具体的な固有名詞（ゲーム名、ハードウェア名、人物名、日時など）を必ず含め、150〜200文字程度のニュースサマリーを作成してください。
5. 必ず以下のJSON形式の配列でのみ出力してください。マークダウン（\`\`\`json）は含めず、純粋なJSONテキストのみを返してください。

[
  {
    "id": 1,
    "title": "トピックのわかりやすい見出し",
    "summary": "150〜200文字の具体的なサマリー...",
    "time": "たった今",
    "score": 85,
    "sourceCount": 3,
    "links": [
      { "name": "メディア名", "url": "抽出した記事の実際のURL" }
    ]
  }
]
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    console.log('\n🎉 分析完了！生成されたトレンド結果:\n');
    let jsonText = response.text;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
    }
    
    const result = JSON.parse(jsonText);
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ AIの処理中にエラーが発生しました:');
    console.error(error);
  }
}

main();
