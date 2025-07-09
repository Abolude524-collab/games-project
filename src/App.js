import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import ChessBoard from "./components/ChessBoard";
import DraughtsBoard from "./components/DraughtsBoard";
import TicTacToe from "./components/TicTacToe";
import "./App.css"; // Make sure this file exists

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <h1 className="app-title">Multiplayer Board Games</h1>
        
        <nav className="navigation">
          <ul className="nav-list">
            <li><Link to="/chess" className="nav-button chess">Chess</Link></li>
            <li><Link to="/draughts" className="nav-button draughts">Draughts</Link></li>
            <li><Link to="/tictactoe" className="nav-button tictactoe">Tic-Tac-Toe</Link></li>
          </ul>
        </nav>

        <div className="game-container">
          <Routes>
            <Route path="/chess" element={<ChessBoard />} />
            <Route path="/draughts" element={<DraughtsBoard />} />
            <Route path="/tictactoe" element={<TicTacToe />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
