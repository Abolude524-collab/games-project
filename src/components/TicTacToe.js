// File: TicTacToe.js
import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import styled from "@emotion/styled";
import confetti from "canvas-confetti";

const socket = io("https://backend-gamesproject.onrender.com");
const initialBoard = Array(9).fill(null);

// Styled Components
const Container = styled.div`
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 2rem;
  max-width: 600px;
  margin: auto;
  text-align: center;
  background-color: #f9f9ff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 50, 0.1);
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 110px);
  grid-gap: 10px;
  justify-content: center;
  margin: 2rem auto;
`;

const Cell = styled.button`
  width: 110px;
  height: 110px;
  font-size: 2.5rem;
  font-weight: bold;
  color: ${(props) => (props.children === "X" ? "#007bff" : "#ffcc00")};
  background-color: ${(props) => (props.highlight ? "#f0f0f0" : "#ffffff")};
  border: 3px solid #333;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background-color: #e6f0ff;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
    background-color: #d6e0ff;
  }
`;

const Status = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const ScoreBoard = styled.div`
  margin-top: 1.5rem;
  font-size: 1.2rem;
  color: #555;
`;

const Button = styled.button`
  margin: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: 0.3s ease;

  &:hover {
    background-color: #0056d6;
  }
`;

const Input = styled.input`
  margin: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

const Select = styled.select`
  margin: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

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
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRematch, setOpponentRematch] = useState(false);
  const [isExited, setIsExited] = useState(false);

  const checkWinner = useCallback((b) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    return b.every(Boolean) ? "draw" : null;
  }, []);

  const getBestMove = (board, player) => {
    const opponent = player === "X" ? "O" : "X";

    const minimax = (newBoard, depth, isMaximizing) => {
      const result = checkWinner(newBoard);
      if (result === player) return 10 - depth;
      if (result === opponent) return depth - 10;
      if (result === "draw") return 0;

      const scores = [];
      for (let i = 0; i < newBoard.length; i++) {
        if (!newBoard[i]) {
          newBoard[i] = isMaximizing ? player : opponent;
          const score = minimax(newBoard, depth + 1, !isMaximizing);
          scores.push(score);
          newBoard[i] = null;
        }
      }
      return isMaximizing ? Math.max(...scores) : Math.min(...scores);
    };

    let bestScore = -Infinity;
    let bestMove = null;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = player;
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const makeAIMove = (currentBoard) => {
    let move;
    if (difficulty === "hard") {
      move = getBestMove(currentBoard, "O");
    } else {
      const empty = currentBoard.map((v, i) => v === null ? i : null).filter(i => i !== null);
      move = empty[Math.floor(Math.random() * empty.length)];
    }

    if (move !== null) {
      const newBoard = [...currentBoard];
      newBoard[move] = "O";
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

  useEffect(() => {
    const savedScore = localStorage.getItem("tictactoeScore");
    if (savedScore) setScore(JSON.parse(savedScore));
  }, []);

  useEffect(() => {
    if (winner && winner !== "draw") {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [winner]);

  useEffect(() => {
    localStorage.setItem("tictactoeScore", JSON.stringify(score));
  }, [score]);

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

    socket.on("rematch", () => {
      setOpponentRematch(true);
      if (rematchRequested) resetGame();
    });

    socket.on("exit", () => {
      setIsExited(true);
      setGameStarted(false);
    });

    return () => {
      socket.off("symbol");
      socket.off("startGame");
      socket.off("update");
      socket.off("rematch");
      socket.off("exit");
    };
  }, [gameMode, symbol, checkWinner, playerName, rematchRequested]);

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

  const resetGame = () => {
    setBoard(initialBoard);
    setWinner(null);
    setTurn("X");
    setIsPlayerTurn(symbol === "X");
    setRematchRequested(false);
    setOpponentRematch(false);
  };

  const requestRematch = () => {
    setRematchRequested(true);
    socket.emit("rematch", { room });
    if (opponentRematch) resetGame();
  };

  const exitGame = () => {
    socket.emit("exit", { room });
    setGameStarted(false);
    setIsExited(true);
  };

  const renderWinnerMessage = () => {
    if (winner === "draw") return "It's a Draw!";
    if (gameMode === "singleplayer") {
      return winner === "X" ? "You Win! 🎉" : "You Lose!";
    }
    return `${winner} Wins! 🎉`;
  };

  return (
    <Container>
      <h2>Tic Tac Toe</h2>

      <div>
        <label>
          Game Mode:
          <Select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
            <option value="singleplayer">Singleplayer</option>
            <option value="multiplayer">Multiplayer</option>
          </Select>
        </label>

        {gameMode === "singleplayer" && (
          <label>
            Difficulty:
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="hard">Hard</option>
            </Select>
          </label>
        )}

        {gameMode === "multiplayer" && (
          <>
            <Input placeholder="Enter Room Name" value={room} onChange={(e) => setRoom(e.target.value)} />
            <Input placeholder="Enter Your Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <Button onClick={joinRoom}>Join Room</Button>
          </>
        )}
      </div>

      <Board>
        {board.map((cell, index) => (
          <Cell key={index} onClick={() => handleClick(index)}>{cell}</Cell>
        ))}
      </Board>

      <Status>
        {isExited
          ? "Opponent Left the Game"
          : winner
          ? renderWinnerMessage()
          : `Turn: ${turn}`}
      </Status>

      <ScoreBoard>
        <p>Score - X: {score.X} | O: {score.O}</p>
      </ScoreBoard>

      {winner && (
        <div>
          {gameMode === "multiplayer" && <Button onClick={requestRematch}>Request Rematch</Button>}
          <Button onClick={resetGame}>Play Again</Button>
        </div>
      )}

      {gameStarted && <Button onClick={exitGame}>Exit</Button>}
      <Button onClick={resetGame}>Reset Game</Button>
    </Container>
  );
};

export default TicTacToe;
