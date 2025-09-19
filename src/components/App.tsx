import React from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './HomePage';
import CategoryPage from './CategoryPage';
import TriviaPage from './TriviaPage';
import CategoryTriviasPage from './CategoryTriviasPage';
import './Responsive.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">ディズニー トリビア</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/categories">カテゴリ</Link>
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