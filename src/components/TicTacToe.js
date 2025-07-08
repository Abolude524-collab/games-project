import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import "./tictactoe.css";

const socket = io("http://localhost:4000");

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [room, setRoom] = useState("");
  const [gameMode, setGameMode] = useState("multiplayer"); // "multiplayer" or "singleplayer"
  const [difficulty, setDifficulty] = useState("easy"); // "easy", "medium", "hard"
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [playerSymbol, setPlayerSymbol] = useState("X"); // For both modes

  // Join Room
  const joinRoom = () => {
    if (room) {
      socket.emit("joinRoom", room);
    }
  };

  useEffect(() => {
    socket.on("assignSymbol", (symbol) => {
      setPlayerSymbol(symbol); // 'X' or 'O'
    });

    socket.on("updateGame", (game) => {
      setBoard(game.board);
      setIsXTurn(game.isXTurn);
    });

    return () => {
      socket.off("assignSymbol");
      socket.off("updateGame");
    };
  }, []);

  const checkWinner = useCallback((board) => {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return board.includes(null) ? null : "draw";
  }, []);

  const minimax = (board, isMaximizing, player, opponent) => {
    const result = checkWinner(board);
    if (result === player) return 1;
    if (result === opponent) return -1;
    if (result === "draw") return 0;

    let bestScore = isMaximizing ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = isMaximizing ? player : opponent;
        let score = minimax(board, !isMaximizing, player, opponent);
        board[i] = null;
        bestScore = isMaximizing ? Math.max(score, bestScore) : Math.min(score, bestScore);
      }
    }
    return bestScore;
  };

  const findBestMove = (board, player) => {
    const opponent = player === "O" ? "X" : "O";
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = player;
        let score = minimax(board, false, player, opponent);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";
    setBoard(newBoard);
    setIsXTurn(!isXTurn);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
      if (result !== "draw") {
        setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
      }
    }

    if (gameMode === "multiplayer" && room) {
      socket.emit("makeMove", { room, index });
    }
  };

  const makeAIMove = useCallback(() => {
    if (winner || isXTurn) return;

    let availableMoves = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null);
    let aiMove;

    if (difficulty === "hard") {
      aiMove = findBestMove([...board], "O");
    } else if (difficulty === "medium") {
      aiMove = availableMoves.length > 1 ? availableMoves[1] : availableMoves[0];
    } else {
      aiMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (aiMove !== undefined) {
      board[aiMove] = "O";
      setBoard([...board]);

      const result = checkWinner(board);
      if (result) {
        setWinner(result);
        if (result !== "draw") {
          setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
        }
      }
      setIsXTurn(true);
    }
  }, [board, checkWinner, difficulty, winner, isXTurn]);

  useEffect(() => {
    if (gameMode === "singleplayer" && !isXTurn && !winner) {
      setTimeout(makeAIMove, 500);
    }
  }, [board, isXTurn, gameMode, winner, makeAIMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinner(null);
  };

  return (
    <div className="tic-tac-toe">
      <h2>Tic-Tac-Toe</h2>

      <div className="scoreboard">
        <h3>Score</h3>
        <p>X: {score.X} | O: {score.O}</p>
      </div>

      <div>
        <label>Mode: </label>
        <select
          onChange={(e) => {
            const mode = e.target.value;
            setGameMode(mode);
            setPlayerSymbol("X"); // Default to X in singleplayer
          }}
          value={gameMode}
        >
          <option value="multiplayer">Multiplayer</option>
          <option value="singleplayer">Singleplayer</option>
        </select>

        {gameMode === "singleplayer" && (
          <>
            <label>Difficulty: </label>
            <select onChange={(e) => setDifficulty(e.target.value)} value={difficulty}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </>
        )}
      </div>

      <div className="board">
        {board.map((cell, index) => (
          <div key={index} className="cell" onClick={() => handleClick(index)}>
            {cell}
          </div>
        ))}
      </div>

      {winner && (
        <h3>
          {winner === "draw"
            ? "It's a draw!"
            : winner === playerSymbol
            ? "You win!"
            : "You lose!"}
        </h3>
      )}

      <button onClick={resetGame}>Reset Game</button>

      {gameMode === "multiplayer" && (
        <>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </>
      )}
    </div>
  );
};

export default TicTacToe;
