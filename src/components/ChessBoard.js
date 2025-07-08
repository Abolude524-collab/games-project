import React, { useState } from "react";
import "./chess.css";

const BOARD_SIZE = 8;

// Initial Chess Board Setup
const initializeBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  const setupRow = (row, color) => {
    board[row] = [
      { type: "rook", color },
      { type: "knight", color },
      { type: "bishop", color },
      { type: "queen", color },
      { type: "king", color },
      { type: "bishop", color },
      { type: "knight", color },
      { type: "rook", color },
    ];
  };

  setupRow(0, "black");
  setupRow(7, "white");

  // Pawns
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[1][col] = { type: "pawn", color: "black" };
    board[6][col] = { type: "pawn", color: "white" };
  }

  return board;
};

const ChessBoard = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Function to check if a move is valid
  const isValidMove = (startRow, startCol, endRow, endCol, piece) => {
    if (!piece) return false; // No piece selected
    if (board[endRow][endCol] && board[endRow][endCol].color === piece.color) return false; // Cannot capture own piece

    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);

    switch (piece.type) {
      case "pawn":
        if (piece.color === "white") {
          if (startRow === 6 && endRow === 4 && startCol === endCol && !board[5][endCol] && !board[4][endCol]) return true; // 2 steps first move
          if (endRow === startRow - 1 && startCol === endCol && !board[endRow][endCol]) return true; // 1 step forward
          if (endRow === startRow - 1 && colDiff === 1 && board[endRow][endCol] && board[endRow][endCol].color !== piece.color) return true; // Capture diagonally
        } else {
          if (startRow === 1 && endRow === 3 && startCol === endCol && !board[2][endCol] && !board[3][endCol]) return true; // 2 steps first move
          if (endRow === startRow + 1 && startCol === endCol && !board[endRow][endCol]) return true; // 1 step forward
          if (endRow === startRow + 1 && colDiff === 1 && board[endRow][endCol] && board[endRow][endCol].color !== piece.color) return true; // Capture diagonally
        }
        return false;

      case "rook":
        return startRow === endRow || startCol === endCol; // Moves in straight lines

      case "bishop":
        return rowDiff === colDiff; // Moves diagonally

      case "queen":
        return startRow === endRow || startCol === endCol || rowDiff === colDiff; // Rook + Bishop movement

      case "king":
        return rowDiff <= 1 && colDiff <= 1; // Moves one square in any direction

      case "knight":
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2); // L-shaped moves

      default:
        return false;
    }
  };

  const handleSquareClick = (row, col) => {
    if (selectedPiece) {
      const [prevRow, prevCol] = selectedPiece;
      const piece = board[prevRow][prevCol];

      if (isValidMove(prevRow, prevCol, row, col, piece)) {
        const newBoard = board.map((r) => [...r]);
        newBoard[prevRow][prevCol] = null; // Remove piece from old position
        newBoard[row][col] = piece; // Place piece in new position

        setBoard(newBoard);
        setSelectedPiece(null);
      }
    } else if (board[row][col]) {
      setSelectedPiece([row, col]);
    }
  };

  return (
    <div>
      <h2 className="title">Chess Game</h2>
      <div className="chess-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`chess-square ${(rowIndex + colIndex) % 2 === 0 ? "light" : "dark"}`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {cell && (
                <div className={`chess-piece ${cell.color}-${cell.type}`}>
                  {cell.type[0].toUpperCase()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
