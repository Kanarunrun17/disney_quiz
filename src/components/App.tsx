import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import CategoryPage from './CategoryPage';
import TriviaPage from './TriviaPage';
import CategoryTriviasPage from './CategoryTriviasPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <a className="navbar-brand" href="/">ディズニー トリビア</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a className="nav-link" href="/categories">カテゴリ</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/category/:categoryName" element={<CategoryTriviasPage />} />
            <Route path="/trivia/:id" element={<TriviaPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;