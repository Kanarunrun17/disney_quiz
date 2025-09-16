import React from 'react';
import { Link } from 'react-router-dom';
import { triviaData } from './data';

const CategoryPage = () => {
  return (
    <div className="container mt-5">
      <h1 className="mb-4">カテゴリを選択</h1>
      <div className="list-group">
        {Object.keys(triviaData).map((key) => (
          <Link
            key={key}
            to={`/trivia/${key}`}
            className="list-group-item list-group-item-action"
          >
            {triviaData[key as keyof typeof triviaData].title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
