import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import "./chess.css";

const getPieceIcon = (type, color) => {
  const icons = {
    k: { w: "♔", b: "♚" },
    q: { w: "♕", b: "♛" },
    r: { w: "♖", b: "♜" },
    b: { w: "♗", b: "♝" },
    n: { w: "♘", b: "♞" },
    p: { w: "♙", b: "♟︎" },
  };
  return icons[type][color];
};

const squareId = (row, col) => `${"abcdefgh"[col]}${8 - row}`;

const materialScore = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const evaluateBoard = (game) => {
  let score = 0;
  const board = game.board();
  for (let row of board) {
    for (let piece of row) {
      if (piece) {
        const value = materialScore[piece.type];
        score += piece.color === "b" ? value : -value;
      }
    }
  }
  return score;
};

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [message, setMessage] = useState("");
  const [difficulty, setDifficulty] = useState("medium"); // "easy", "medium", "hard"

  const currentTurn = game.turn() === "w" ? "white" : "black";

  useEffect(() => {
    setBoard(game.board());
    checkGameStatus();

    if (game.turn() === "b" && !game.isGameOver()) {
      setTimeout(makeAIMove, 400);
    }
  }, [game]);

  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      setMessage(`${currentTurn === "white" ? "Black" : "White"} wins by checkmate!`);
    } else if (game.isDraw()) {
      setMessage("Game drawn.");
    } else if (game.isStalemate()) {
      setMessage("Stalemate!");
    } else if (game.isThreefoldRepetition()) {
      setMessage("Draw by threefold repetition.");
    } else if (game.isInsufficientMaterial()) {
      setMessage("Draw by insufficient material.");
    } else {
      setMessage("");
    }
  };

  const handleSquareClick = (row, col) => {
    if (game.turn() !== "w" || game.isGameOver()) return;

    const square = squareId(row, col);
    const piece = game.get(square);

    if (selected) {
      const move = game.move({ from: selected, to: square, promotion: "q" });
      if (move) {
        setSelected(null);
        setLegalMoves([]);
        setGame(new Chess(game.fen()));
        return;
      }
      setSelected(null);
      setLegalMoves([]);
    } else if (piece && piece.color === "w") {
      setSelected(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
    }
  };

  const makeAIMove = () => {
    if (game.isGameOver()) return;

    const moves = game.moves({ verbose: true }).filter((m) => m.color === "b");

    let bestMove;
    if (difficulty === "easy") {
      bestMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === "medium") {
      // Prefer captures
      const captures = moves.filter((m) => m.captured);
      bestMove = captures.length > 0
        ? captures[Math.floor(Math.random() * captures.length)]
        : moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === "hard") {
      // Evaluate board after each move and pick best score
      let bestScore = -Infinity;
      for (let move of moves) {
        const copy = new Chess(game.fen());
        copy.move(move.san);
        const score = evaluateBoard(copy);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    if (bestMove) {
      game.move(bestMove.san);
      setGame(new Chess(game.fen()));
    }
  };

  return (
    <div>
      <h2 className="title">Chess vs AI - {currentTurn}'s Turn</h2>
      <div className="difficulty-select">
        Difficulty:{" "}
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {message && <div className="game-message">{message}</div>}

      <div className="chess-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const id = squareId(rowIndex, colIndex);
            const isSelected = selected === id;
            const isLegalMove = legalMoves.includes(id);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`chess-square ${
                  (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
                } ${isSelected ? "selected" : ""} ${
                  isLegalMove ? "highlight" : ""
                }`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {cell && (
                  <div className="chess-piece">
                    {getPieceIcon(cell.type, cell.color)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
