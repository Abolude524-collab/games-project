import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import "./tictactoe.css";

const socket = io("http://localhost:4000");

const initialBoard = Array(9).fill(null);

const TicTacToe = () => {
  // Game state
  const [board, setBoard] = useState(initialBoard);
  const [symbol, setSymbol] = useState("X");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [turn, setTurn] = useState("X");
  const [gameMode, setGameMode] = useState("singleplayer"); // "singleplayer" or "multiplayer"
  const [difficulty, setDifficulty] = useState("easy");
  const [room, setRoom] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState("");

  // Load score from localStorage on mount
  useEffect(() => {
    const savedScore = localStorage.getItem("tictactoeScore");
    if (savedScore) setScore(JSON.parse(savedScore));
  }, []);

  // Save score on update
  useEffect(() => {
    localStorage.setItem("tictactoeScore", JSON.stringify(score));
  }, [score]);

  // Check winner or draw
  const checkWinner = useCallback((b) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],

      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],

      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return b[a];
      }
    }
    if (b.every(Boolean)) return "draw";
    return null;
  }, []);

  // --- Multiplayer socket events setup ---
  useEffect(() => {
    if (gameMode !== "multiplayer") return;

    // On joining room, server sends symbol X or O
    socket.on("symbol", ({ symbol }) => {
      setSymbol(symbol);
      setIsPlayerTurn(symbol === "X"); // X always starts
      setTurn("X");
    });

    // Start game event with opponent info
    socket.on("start", ({ message, opponent }) => {
      setOpponentName(opponent);
      setMessage(message);
      setGameStarted(true);
      setBoard(initialBoard);
      setWinner(null);
      setTurn("X");
    });

    // Receive board update & turn change from server
    socket.on("update", ({ board: newBoard, turn: newTurn }) => {
      setBoard(newBoard);
      setTurn(newTurn);
      setIsPlayerTurn(newTurn === symbol);
      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result);
        if (result !== "draw") {
          setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
        }
      }
    });

    // Game ended by server
    socket.on("end", ({ winner: win }) => {
      setWinner(win);
      if (win && win !== "draw") {
        setScore((prev) => ({ ...prev, [win]: prev[win] + 1 }));
      }
    });

    // Cleanup listeners on unmount or mode change
    return () => {
      socket.off("symbol");
      socket.off("start");
      socket.off("update");
      socket.off("end");
    };
  }, [gameMode, symbol, checkWinner]);

  // Join multiplayer room
  const joinRoom = () => {
    if (room.trim() && playerName.trim()) {
      socket.emit("join", { room: room.trim(), name: playerName.trim() });
    }
  };

  // Handle user click on a cell
  const handleClick = (index) => {
    if (board[index] || winner) return;

    if (gameMode === "singleplayer") {
      if (!isPlayerTurn) return;
      const newBoard = [...board];
      newBoard[index] = "X";
      setBoard(newBoard);
      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result);
        if (result !== "draw") {
          setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
        }
      } else {
        setIsPlayerTurn(false);
        setTurn("O");
        setTimeout(() => makeAIMove(newBoard), 500);
      }
    } else {
      if (!isPlayerTurn || !gameStarted) return;
      socket.emit("move", { room, index });
    }
  };

  // Minimax Algorithm
  const minimax = (board, isMax, ai, human) => {
    const result = checkWinner(board);
    if (result === ai) return 10;
    if (result === human) return -10;
    if (result === "draw") return 0;

    if (isMax) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = ai;
          let score = minimax(board, false, ai, human);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          board[i] = human;
          let score = minimax(board, true, ai, human);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  // Find best move for AI
  const findBestMove = (board, ai) => {
    const human = ai === "O" ? "X" : "O";
    let bestScore = -Infinity;
    let move = null;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = ai;
        const score = minimax(board, false, ai, human);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  // AI move with difficulty levels
  const makeAIMove = (currentBoard) => {
    const ai = "O";
    const human = "X";
    const emptyIndices = currentBoard
      .map((v, i) => (v ? null : i))
      .filter((v) => v !== null);

    let move;
    if (difficulty === "hard") {
      move = findBestMove([...currentBoard], ai);
    } else if (difficulty === "medium") {
      // Choose center or corners preferentially
      const preferredMoves = [4, 0, 2, 6, 8].filter((i) =>
        emptyIndices.includes(i)
      );
      move = preferredMoves.length > 0 ? preferredMoves[0] : emptyIndices[0];
    } else {
      // easy: random move
      move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    if (move !== undefined) {
      const newBoard = [...currentBoard];
      newBoard[move] = ai;
      setBoard(newBoard);
      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result);
        if (result !== "draw") {
          setScore((prev) => ({ ...prev, [result]: prev[result] + 1 }));
        }
      } else {
        setIsPlayerTurn(true);
        setTurn(human);
      }
    }
  };

  // Reset game for both modes
  const resetGame = () => {
    setBoard(initialBoard);
    setWinner(null);
    setTurn("X");
    if (gameMode === "singleplayer") setIsPlayerTurn(true);
    else if (gameMode === "multiplayer") socket.emit("reset", room);
  };

  return (
    <div className="tic-tac-toe">
      <h2>Tic Tac Toe</h2>

      <div className="mode-select">
        <label>Mode: </label>
        <select
          value={gameMode}
          onChange={(e) => {
            setGameMode(e.target.value);
            resetGame();
            setGameStarted(false);
            setMessage("");
            setOpponentName("");
            setRoom("");
            setPlayerName("");
          }}
        >
          <option value="singleplayer">Singleplayer</option>
          <option value="multiplayer">Multiplayer</option>
        </select>

        {gameMode === "singleplayer" && (
          <>
            <label>Difficulty: </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </>
        )}
      </div>

      {/* Multiplayer join */}
      {gameMode === "multiplayer" && !gameStarted && (
        <div className="join-room">
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom} disabled={!room || !playerName}>
            Join Room
          </button>
          <p>{message}</p>
        </div>
      )}

      {/* Game Board */}
      {(gameMode === "singleplayer" || gameStarted) && (
        <>
          <div className="status">
            {winner
              ? winner === "draw"
                ? "Game ended in a draw!"
                : `Winner: ${winner}`
              : `Turn: ${turn}`}
          </div>
          <div className="board">
            {board.map((cell, i) => (
              <div
                key={i}
                className={`cell ${cell ? "filled" : ""}`}
                onClick={() => handleClick(i)}
              >
                {cell}
              </div>
            ))}
          </div>
          <button onClick={resetGame}>Reset Game</button>
          <div className="scoreboard">
            <p>Score X: {score.X}</p>
            <p>Score O: {score.O}</p>
          </div>
          {gameMode === "multiplayer" && opponentName && (
            <p>Opponent: {opponentName}</p>
          )}
        </>
      )}
    </div>
  );
};

export default TicTacToe;
