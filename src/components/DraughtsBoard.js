import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti"; // 🎉 Added
import clickSoundFile from "../sounds/click.mp3";
import moveSoundFile from "../sounds/move.mp3";
import redPiece from "../images/red.png";
import whitePiece from "../images/white.png";
import redKing from "../images/red-king.png";
import whiteKing from "../images/white-king.png";
import "./draughtsboard.css";

const BOARD_ROWS = 12;
const BOARD_COLS = 10;

const initializeBoard = () => {
  const board = Array(BOARD_ROWS)
    .fill(null)
    .map(() => Array(BOARD_COLS).fill(null));

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 4) board[row][col] = { color: "black", king: false };
        else if (row > 7) board[row][col] = { color: "red", king: false };
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
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ red: 20, black: 20 });

  const clickSound = new Audio(clickSoundFile);
  const moveSound = new Audio(moveSoundFile);

  const difficultyWeights = {
    easy: 0,
    medium: 0.25,
    hard: 0.5,
    insane: 1,
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    if (!piece || board[toRow]?.[toCol]) return false;

    const direction = piece.king ? [1, -1] : [piece.color === "red" ? -1 : 1];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1 && direction.includes(rowDiff)) {
      return true;
    }

    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const midRow = (fromRow + toRow) / 2;
      const midCol = (fromCol + toCol) / 2;
      const middle = board[midRow][midCol];
      if (middle && middle.color !== piece.color) return true;
    }

    return false;
  };

  const getAllMoves = useCallback((boardState, color) => {
    const moves = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const piece = boardState[row][col];
        if (piece?.color === color) {
          const directions = piece.king ? [1, -1] : [color === "red" ? -1 : 1];
          directions.forEach((dr) => {
            [-1, 1].forEach((dc) => {
              const newRow = row + dr;
              const newCol = col + dc;
              const jumpRow = row + dr * 2;
              const jumpCol = col + dc * 2;

              if (
                newRow >= 0 && newRow < BOARD_ROWS &&
                newCol >= 0 && newCol < BOARD_COLS &&
                !boardState[newRow][newCol] &&
                isValidMove(row, col, newRow, newCol)
              ) {
                moves.push({ from: [row, col], to: [newRow, newCol] });
              }

              if (
                jumpRow >= 0 && jumpRow < BOARD_ROWS &&
                jumpCol >= 0 && jumpCol < BOARD_COLS &&
                !boardState[jumpRow][jumpCol] &&
                isValidMove(row, col, jumpRow, jumpCol)
              ) {
                moves.push({ from: [row, col], to: [jumpRow, jumpCol] });
              }
            });
          });
        }
      }
    }
    return moves;
  }, [board]);

  const applyMove = (fromRow, fromCol, toRow, toCol, currentBoard) => {
    const newBoard = JSON.parse(JSON.stringify(currentBoard));
    const piece = newBoard[fromRow][fromCol];
    if (!piece) return { board: newBoard, nextTurn: true };

    newBoard[toRow][toCol] = { ...piece };
    newBoard[fromRow][fromCol] = null;
    moveSound.play();

    if (Math.abs(toRow - fromRow) === 2) {
      const midRow = (fromRow + toRow) / 2;
      const midCol = (fromCol + toCol) / 2;
      const captured = newBoard[midRow][midCol];
      if (captured) {
        setScore((prev) => {
          const updated = { ...prev, [captured.color]: prev[captured.color] - 1 };
          if (updated[captured.color] === 0) {
            setGameOver(true);
            const winningSide = captured.color === "red" ? "Black" : "Red";
            setWinner(winningSide);

            // 🎉 Trigger confetti if Red wins (player)
            if (winningSide === "Red") {
              confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
              });
            }
          }
          return updated;
        });
      }
      newBoard[midRow][midCol] = null;

      const nextJumps = getAllMoves(newBoard, piece.color).filter(
        (m) => m.from[0] === toRow && m.from[1] === toCol && Math.abs(m.to[0] - m.from[0]) === 2
      );
      if (nextJumps.length > 0) return { board: newBoard, nextTurn: false };
    }

    const promotionRow = piece.color === "red" ? 0 : BOARD_ROWS - 1;
    if (toRow === promotionRow) {
      newBoard[toRow][toCol].king = true;
    }

    return { board: newBoard, nextTurn: true };
  };

  const makeMove = (prevRow, prevCol, row, col) => {
    setBoard((prevBoard) => {
      const result = applyMove(prevRow, prevCol, row, col, prevBoard);
      if (result.nextTurn) setTimeout(() => setIsAIsTurn(true), 500);
      return result.board;
    });
  };

  const handleSquareClick = (row, col) => {
    if (isAIsTurn || gameOver) return;
    clickSound.play();
    if (selectedPiece) {
      const [prevRow, prevCol] = selectedPiece;
      if (isValidMove(prevRow, prevCol, row, col)) {
        makeMove(prevRow, prevCol, row, col);
        setSelectedPiece(null);
      } else {
        setSelectedPiece(null);
      }
    } else if (board[row][col]?.color === "red") {
      setSelectedPiece([row, col]);
    }
  };

  const makeAIMove = useCallback(() => {
    setBoard((prevBoard) => {
      const moves = getAllMoves(prevBoard, "black");
      if (moves.length === 0) {
        setGameOver(true);
        setWinner("Red");

        // 🎉 Red wins by blocking — trigger confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });

        return prevBoard;
      }

      const weightedMoves = moves.map((m) => {
        const isCapture = Math.abs(m.to[0] - m.from[0]) === 2;
        const weight = isCapture ? 1 : difficultyWeights[difficulty];
        return { ...m, weight };
      });

      weightedMoves.sort((a, b) => b.weight - a.weight);
      const bestMove = weightedMoves[0];

      const result = applyMove(bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1], prevBoard);
      return result.board;
    });
    setIsAIsTurn(false);
  }, [getAllMoves, difficulty]);

  useEffect(() => {
    if (isAIsTurn && !gameOver) {
      setTimeout(makeAIMove, 400);
    }
  }, [isAIsTurn, makeAIMove, gameOver]);

  const restartGame = () => {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setIsAIsTurn(false);
    setGameOver(false);
    setScore({ red: 20, black: 20 });
    setWinner(null);
  };

  return (
    <div className="game-container">
      <h2>Draughts Game</h2>
      {gameOver && winner && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{winner === "Red" ? "You Win! 🎉" : "You Lose 😞"}</h3>
            <button onClick={restartGame}>Play Again</button>
          </div>
        </div>
      )}
      <div className="scoreboard">
        <span>Red: {score.red}</span>
        <span>Black: {score.black}</span>
      </div>
      <div className="options">
        <label>Select Difficulty: </label>
        <select onChange={(e) => setDifficulty(e.target.value)} value={difficulty}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="insane">Insane</option>
        </select>
        <button onClick={restartGame}>Restart 🔄</button>
      </div>
      <div className="draughts-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`square ${(rowIndex + colIndex) % 2 === 0 ? "light" : "dark"} ${
                selectedPiece?.[0] === rowIndex && selectedPiece?.[1] === colIndex
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {cell && (
                <img
                  src={cell.king ? (cell.color === "red" ? redKing : whiteKing) : cell.color === "red" ? redPiece : whitePiece}
                  alt={cell.king ? "King" : cell.color}
                  className={`piece ${cell.king ? "king" : ""}`}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DraughtsBoard;
