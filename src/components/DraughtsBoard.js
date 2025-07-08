import React, { useState, useEffect, useCallback } from "react";
import "./draughtsboard.css";

const BOARD_SIZE = 8;

const initializeBoard = () => {
  let board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[row][col] = "black";
        else if (row > 4) board[row][col] = "red";
      }
    }
  }
  return board;
};

const DraughtsBoard = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isAIsTurn, setIsAIsTurn] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  const isValidMove = (prevRow, prevCol, row, col) => {
    const piece = board[prevRow][prevCol];
    if (!piece || board[row][col]) return false;

    const rowDiff = row - prevRow;
    const colDiff = Math.abs(col - prevCol);

    if ((piece === "red" && rowDiff === -1) || (piece === "black" && rowDiff === 1)) {
      return colDiff === 1 && !board[row][col];
    }

    if (colDiff === 2 && Math.abs(rowDiff) === 2) {
      const midRow = (prevRow + row) / 2;
      const midCol = (prevCol + col) / 2;
      if (board[midRow][midCol] && board[midRow][midCol] !== piece) {
        return true;
      }
    }
    return false;
  };

  const makeMove = (prevRow, prevCol, row, col) => {
    setBoard(prevBoard => {
      const newBoard = JSON.parse(JSON.stringify(prevBoard));
      newBoard[row][col] = newBoard[prevRow][prevCol];
      newBoard[prevRow][prevCol] = null;

      if (Math.abs(row - prevRow) === 2) {
        const midRow = (prevRow + row) / 2;
        const midCol = (prevCol + col) / 2;
        newBoard[midRow][midCol] = null;
      }

      return newBoard;
    });

    setTimeout(() => setIsAIsTurn(true), 500);
  };

  const handleSquareClick = (row, col) => {
    if (isAIsTurn) return;
    if (selectedPiece) {
      const [prevRow, prevCol] = selectedPiece;
      if (isValidMove(prevRow, prevCol, row, col)) {
        makeMove(prevRow, prevCol, row, col);
        setSelectedPiece(null);
      }
    } else if (board[row][col] === "red") {
      setSelectedPiece([row, col]);
    }
  };

  const makeAIMove = useCallback(() => {
    setBoard(prevBoard => {
      const moves = [];
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (prevBoard[row][col] === "black") {
            [[row + 1, col - 1], [row + 1, col + 1]].forEach(([newRow, newCol]) => {
              if (newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && !prevBoard[newRow][newCol]) {
                moves.push({ from: [row, col], to: [newRow, newCol] });
              }
            });
          }
        }
      }

      if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = JSON.parse(JSON.stringify(prevBoard));
        newBoard[move.to[0]][move.to[1]] = "black";
        newBoard[move.from[0]][move.from[1]] = null;
        return newBoard;
      }

      return prevBoard;
    });
    setIsAIsTurn(false);
  }, []);

  useEffect(() => {
    if (isAIsTurn) {
      setTimeout(makeAIMove, difficulty === "hard" ? 500 : 1000);
    }
  }, [isAIsTurn, difficulty, makeAIMove]);

  return (
    <div className="game-container">
      <h2>Draughts Game</h2>
      <div className="options">
        <label>Select Difficulty: </label>
        <select onChange={(e) => setDifficulty(e.target.value)} value={difficulty}>
          <option value="easy">Easy</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="draughts-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`square ${((rowIndex + colIndex) % 2 === 0) ? "light" : "dark"}`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {cell && <div className={`piece ${cell === "red" ? "red-piece" : "black-piece"}`}></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DraughtsBoard;
