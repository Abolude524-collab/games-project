import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import styled from "@emotion/styled";

const socket = io("https://backend-gamesproject.onrender.com");
const initialBoard = Array(9).fill(null);

// Styled Components (same as your version)
const Container = styled.div`
  font-family: sans-serif;
  padding: 2rem;
  max-width: 500px;
  margin: auto;
  text-align: center;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-gap: 5px;
  justify-content: center;
  margin: 2rem auto;
`;

const Cell = styled.button`
  width: 100px;
  height: 100px;
  font-size: 2rem;
  cursor: pointer;
  border: 2px solid #000;
  background-color: ${(props) => (props.highlight ? "#f0f0f0" : "white")};
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e0e0ff;
  }
`;

const Status = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
`;

const ScoreBoard = styled.div`
  margin-top: 1rem;
`;

const Button = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
`;

const Input = styled.input`
  margin: 0.5rem;
  padding: 0.3rem;
`;

const Select = styled.select`
  margin: 0.5rem;
  padding: 0.3rem;
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

  useEffect(() => {
    const savedScore = localStorage.getItem("tictactoeScore");
    if (savedScore) setScore(JSON.parse(savedScore));
  }, []);

  useEffect(() => {
    localStorage.setItem("tictactoeScore", JSON.stringify(score));
  }, [score]);

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

  const getWinner = (b) => checkWinner(b); // used in AI functions

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
  
  const findForkMove = (board, player) => {
  const emptyIndices = board.map((val, i) => val === null ? i : null).filter(i => i !== null);
  for (let i of emptyIndices) {
    const newBoard = [...board];
    newBoard[i] = player;
    let winningPaths = 0;
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (let [a, b, c] of lines) {
      const line = [newBoard[a], newBoard[b], newBoard[c]];
      if (line.filter(val => val === player).length === 2 && line.includes(null)) {
        winningPaths++;
      }
    }
    if (winningPaths >= 2) return i;
  }
  return null;
};

const getBestMove = (board, aiPlayer) => {
  const humanPlayer = aiPlayer === "X" ? "O" : "X";
  const emptyIndices = board.map((val, i) => val === null ? i : null).filter(i => i !== null);

  for (let i of emptyIndices) {
    const newBoard = [...board];
    newBoard[i] = aiPlayer;
    if (getWinner(newBoard) === aiPlayer) return i;
  }

  for (let i of emptyIndices) {
    const newBoard = [...board];
    newBoard[i] = humanPlayer;
    if (getWinner(newBoard) === humanPlayer) return i;
  }

  const forkMove = findForkMove(board, aiPlayer);
  if (forkMove !== null) return forkMove;

  const oppFork = findForkMove(board, humanPlayer);
  if (oppFork !== null) return oppFork;

  if (board[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  const sides = [1, 3, 5, 7].filter(i => board[i] === null);
  if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)];

  return null;
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
              <option value="medium">Medium</option>
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
          ? winner === "draw"
            ? "It's a Draw!"
            : `${winner} Wins!`
          : `Turn: ${turn}`}
      </Status>

      <ScoreBoard>
        <p>Score - X: {score.X} | O: {score.O}</p>
      </ScoreBoard>

      {winner && <Button onClick={requestRematch}>Request Rematch</Button>}
      {gameStarted && <Button onClick={exitGame}>Exit</Button>}
      <Button onClick={resetGame}>Reset Game</Button>
    </Container>
  );
};

export default TicTacToe;
