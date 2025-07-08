import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import ChessBoard from "./components/ChessBoard";
import DraughtsBoard from "./components/DraughtsBoard";
import TicTacToe from "./components/TicTacToe";

export default function App() {
  return (
    <Router>
      <div className="flex flex-col items-center p-4">
        <h1 className="text-3xl font-bold mb-4">Multiplayer Board Games</h1>
        <nav className="mb-4">
          <ul className="flex space-x-4">
            <li><Link to="/chess" className="px-4 py-2 bg-blue-500 text-white rounded">Chess</Link></li>
            <li><Link to="/draughts" className="px-4 py-2 bg-green-500 text-white rounded">Draughts</Link></li>
            <li><Link to="/tictactoe" className="px-4 py-2 bg-red-500 text-white rounded">Tic-Tac-Toe</Link></li>
          </ul>
        </nav>
        <div className="w-full max-w-4xl p-4 bg-gray-100 rounded-lg shadow-lg">
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
