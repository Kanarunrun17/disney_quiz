import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { allTrivias } from '../data/all_data';

const CategoryTriviasPage = () => {
  const { categoryName } = useParams<{ categoryName: string }>();

  const filteredTrivias = allTrivias.filter((trivia) => trivia.category === categoryName);

  if (!categoryName || filteredTrivias.length === 0) {
    return (
      <div className="container mt-5">
        <h2>トリビアが見つかりません</h2>
        <Link to="/categories">カテゴリ選択に戻る</Link>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">{categoryName} のトリビア一覧</h1>
      <div className="list-group">
        {filteredTrivias.map((trivia) => (
          <Link
            key={trivia.id}
            to={`/trivia/${trivia.id}`}
            className="list-group-item list-group-item-action"
          >
            {trivia.title}
          </Link>
        ))}
      </div>
      <Link to="/categories" className="btn btn-secondary mt-4">
        他のカテゴリを見る
      </Link>
    </div>
  );
};

export default CategoryTriviasPage;