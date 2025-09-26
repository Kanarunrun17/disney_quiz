import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { allTrivias } from '../data/all_data';

const TriviaPage = () => {
  const { id } = useParams<{ id: string }>();
  const triviaId = parseInt(id || '', 10);

  const trivia = allTrivias.find((t) => t.id === triviaId);

  if (!trivia) {
    return (
      <div className="container mt-5">
        <h2>トリビアが見つかりません</h2>
        <Link to="/">ホームに戻る</Link>
      </div>
    );
  }

  const renderBodyWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">{trivia.title}</h1>
      {trivia.photo && (
        <img src={trivia.photo} alt={trivia.title} className="img-fluid mb-3" />
      )}
      <p style={{ whiteSpace: 'pre-wrap' }}>{renderBodyWithLinks(trivia.body)}</p>
      <p className="text-end text-muted">{trivia.date}</p>
      <Link to={`/category/${trivia.category}`} className="btn btn-secondary mt-4 me-2">
        {trivia.category} の他のトリビアを見る
      </Link>
      <Link to="/" className="btn btn-outline-secondary mt-4">
        ホームに戻る
      </Link>
    </div>
  );
};

export default TriviaPage;