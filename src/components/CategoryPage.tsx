import React from 'react';
import { Link } from 'react-router-dom';
import { allTrivias } from '../data/all_data';

const CategoryPage = () => {
  const categories = Array.from(new Set(allTrivias.map((trivia) => trivia.category)));

  return (
    <div className="container mt-5">
      <h1 className="mb-4">カテゴリを選択</h1>
      <div className="list-group">
        {categories.map((category) => (
          <Link
            key={category}
            to={`/category/${category}`}
            className="list-group-item list-group-item-action"
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;