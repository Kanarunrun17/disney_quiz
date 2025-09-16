import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { triviaData, TriviaCategory } from './data';

const TriviaPage = () => {
  const { category } = useParams<{ category: TriviaCategory }>();

  if (!category || !triviaData[category]) {
    return (
      <div className="container mt-5">
        <h2>カテゴリが見つかりません</h2>
        <Link to="/categories">カテゴリ選択に戻る</Link>
      </div>
    );
  }

  const { title, questions } = triviaData[category];

  return (
    <div className="container mt-5">
      <h1 className="mb-4">{title} のトリビア</h1>
      <div className="accordion" id="triviaAccordion">
        {questions.map((item, index) => (
          <div className="accordion-item" key={index}>
            <h2 className="accordion-header" id={`heading${index}`}>
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapse${index}`}
                aria-expanded="false"
                aria-controls={`collapse${index}`}
              >
                {`問題 ${index + 1}: ${item.q}`}
              </button>
            </h2>
            <div
              id={`collapse${index}`}
              className="accordion-collapse collapse"
              aria-labelledby={`heading${index}`}
              data-bs-parent="#triviaAccordion"
            >
              <div className="accordion-body">
                <strong>答え:</strong> {item.a}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link to="/categories" className="btn btn-secondary mt-4">
        他のカテゴリを見る
      </Link>
    </div>
  );
};

export default TriviaPage;
