import Parser from 'rss-parser';

const parser = new Parser();

// 代表的なゲームメディアのRSSフィード
const FEEDS = [
  { name: '4Gamer', url: 'https://www.4gamer.net/rss/index.xml' },
  { name: 'Automaton', url: 'https://automaton-media.com/feed/' },
  { name: 'Game*Spark', url: 'https://www.gamespark.jp/rss/index.rdf' }
];

async function fetchLatestNews() {
  console.log('🔄 ニュースサイトから最新記事を取得中...\n');
  const allArticles = [];

  for (const feed of FEEDS) {
    try {
      const data = await parser.parseURL(feed.url);
      console.log(`✅ ${feed.name} から記事を取得しました（${data.items.length} 件）`);
      
      // 各サイトの最新10件を取得
      const recentItems = data.items.slice(0, 10);
      recentItems.forEach(item => {
        allArticles.push({
          source: feed.name,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate
        });
      });
    } catch (error) {
      console.error(`❌ ${feed.name} の取得に失敗しました:`, error.message);
    }
  }

  console.log(`\n📊 合計収集記事数: ${allArticles.length} 件`);
  console.log('\n=======================================');
  console.log('【収集した記事のサンプル（直近5件）】');
  console.log('=======================================');
  allArticles.slice(0, 5).forEach((article, i) => {
    console.log(`[${i + 1}] ${article.title}`);
    console.log(`    Media: ${article.source} | Date: ${new Date(article.pubDate).toLocaleString()}`);
  });
  console.log('=======================================\n');

  console.log('🤖 次のステップ:');
  console.log('この収集した記事群（タイトルやリンク）をAI（Gemini等）に渡し、');
  console.log('同じトピックをグループ化して、スコアリングと要約を行わせます。\n');

  return allArticles;
}

fetchLatestNews();
