import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import "./tictactoe.css";

const socket = io("https://backend-gamesproject.onrender.com");
const initialBoard = Array(9).fill(null);

const TicTacToe = () => {
  const [board, setBoard] = useState(initialBoard);
  const [symbol, setSymbol] = useState("X");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState("X");
  const [gameMode, setGameMode] = useState("singleplayer");
  const [difficulty, setDifficulty] = useState("easy");
  const [room, setRoom] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState("");

  useEffect(() => {
    const savedScore = localStorage.getItem("tictactoeScore");
    if (savedScore) setScore(JSON.parse(savedScore));
  }, []);

  useEffect(() => {
    localStorage.setItem("tictactoeScore", JSON.stringify(score));
  }, [score]);

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

  useEffect(() => {
    if (gameMode !== "multiplayer") return;

    socket.on("symbol", ({ symbol }) => {
      setSymbol(symbol);
      setIsPlayerTurn(symbol === "X");
      setTurn("X");
    });

    socket.on("startGame", ({ playerNames, currentTurn, board }) => {
      setBoard(board);
      setGameStarted(true);
      setOpponentName(Object.values(playerNames).find((n) => n !== playerName));
    });

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

    socket.on("end", ({ winner: win }) => {
      setWinner(win);
      if (win && win !== "draw") {
        setScore((prev) => ({ ...prev, [win]: prev[win] + 1 }));
      }
    });

    return () => {
      socket.off("symbol");
      socket.off("startGame");
      socket.off("update");
      socket.off("end");
    };
  }, [gameMode, symbol, checkWinner, playerName]);

  const joinRoom = () => {
    if (room.trim() && playerName.trim()) {
      socket.emit("joinRoom", { room: room.trim(), name: playerName.trim() });
    }
  };

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

  const makeAIMove = (currentBoard) => {
    const ai = "O";
    const human = "X";
    const emptyIndices = currentBoard.map((v, i) => (v ? null : i)).filter((v) => v !== null);

    let move;
    if (difficulty === "hard") {
      move = findBestMove([...currentBoard], ai);
    } else if (difficulty === "medium") {
      const preferredMoves = [4, 0, 2, 6, 8].filter((i) => emptyIndices.includes(i));
      move = preferredMoves.length > 0 ? preferredMoves[0] : emptyIndices[0];
    } else {
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
        setTurn("X");
      }
    }
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setWinner(null);
    setTurn("X");
    setIsPlayerTurn(symbol === "X");
  };

  return (
    <div className="tictactoe-container">
      <h2>Tic Tac Toe</h2>

      <div>
        <label>
          Game Mode:
          <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
            <option value="singleplayer">Singleplayer</option>
            <option value="multiplayer">Multiplayer</option>
          </select>
        </label>

        {gameMode === "singleplayer" && (
          <label>
            Difficulty:
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        )}

        {gameMode === "multiplayer" && (
          <>
            <input
              type="text"
              placeholder="Enter Room Name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button onClick={joinRoom}>Join Room</button>
          </>
        )}
      </div>

      <div className="board">
        {board.map((cell, index) => (
          <button
            key={index}
            className="cell"
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="status">
        {winner ? (
          winner === "draw" ? (
            <p>It's a Draw!</p>
          ) : (
            <p>{winner} Wins!</p>
          )
        ) : (
          <p>Turn: {turn}</p>
        )}
      </div>

      <div className="scoreboard">
        <p>Score - X: {score.X} | O: {score.O}</p>
      </div>

      <button onClick={resetGame}>Reset Game</button>
    </div>
  );
};

export default TicTacToe;
