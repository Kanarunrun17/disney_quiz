import { ArticleList } from '@/components/article-card';
import { Chip } from '@/components/chip';
import { getArticles, getArticlesByCategory } from '@/lib/content';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { categories } from '@content';

export default function HomePage() {
  const articles = getArticles();
  const usedCategories = categories.filter((c) => getArticlesByCategory(c.id).length > 0);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-2xl font-bold md:text-3xl">{SITE_NAME}</h1>
        <p className="mt-3 leading-relaxed text-muted">{SITE_DESCRIPTION}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {usedCategories.map((c) => (
            <li key={c.id}>
              <Chip href={`/categories/${c.id}`}>{c.name}</Chip>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">新着の記事</h2>
        <ArticleList articles={articles} />
      </section>
    </div>
  );
}
