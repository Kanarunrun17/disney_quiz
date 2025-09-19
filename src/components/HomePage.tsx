import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="container text-center mt-5">
      <h1 className="display-3">ディズニー トリビアへようこそ！</h1>
      <p className="lead">ディズニーの世界に関する知識を試してみましょう。</p>
      <hr className="my-4" />
      <p>準備ができたら、下のボタンを押してカテゴリを選んでください。</p>
      <Link className="btn btn-primary btn-lg" to="/categories" role="button">
        トリビアを始める
      </Link>
    </div>
  );
};

export default HomePage;