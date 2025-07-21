import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import ChessBoard from "./components/ChessBoard";
import DraughtsBoard from "./components/DraughtsBoard";
import TicTacToe from "./components/TicTacToe";
import Chess3D from "./Chess3D";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <h1 className="app-title">Multiplayer Board Games</h1>
        <p className="app-description">
          Play classic strategy games like <strong>Chess</strong>, <strong>Draughts</strong>, and <strong>Tic-Tac-Toe</strong> directly in your browser. 
          Challenge a smart AI opponent or enjoy solo play. With multiple difficulty levels, 3D visuals, and sound effects, 
          each game delivers a rich and engaging experience for players of all skill levels.
        </p>

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
            <Route path="/chess3D" element={<Chess3D />} />
            <Route path="/tictactoe" element={<TicTacToe />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
