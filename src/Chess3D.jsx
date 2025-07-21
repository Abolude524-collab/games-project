// Chess3D.jsx
import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stats } from "@react-three/drei";
import { useSpring, a } from "@react-spring/three";
import { Chess } from "chess.js";

const TILE_SIZE = 1;
const BOARD_OFFSET = 3.5;
const files = "abcdefgh";

const squareId = (x, z) => `${files[x]}${8 - z}`;
const coordsFromSquare = (sq) => [files.indexOf(sq[0]), 8 - parseInt(sq[1])];

const PIECE_MODELS = {
  p: { w: "/models/wP.glb", b: "/models/bP.glb" },
  r: { w: "/models/wR.glb", b: "/models/bR.glb" },
  n: { w: "/models/wN.glb", b: "/models/bN.glb" },
  b: { w: "/models/wB.glb", b: "/models/bB.glb" },
  q: { w: "/models/wQ.glb", b: "/models/bQ.glb" },
  k: { w: "/models/wK.glb", b: "/models/bK.glb" },
};

const Piece = ({ type, color, square }) => {
  const gltf = useGLTF(PIECE_MODELS[type][color]);
  const [x, z] = coordsFromSquare(square);

  const { position } = useSpring({
    position: [x - BOARD_OFFSET, 0.3, z - BOARD_OFFSET],
    config: { mass: 1, tension: 200, friction: 30 },
  });

  return <a.primitive object={gltf.scene.clone()} scale={0.4} position={position} />;
};

const Square = ({ x, z, isHighlight, onClick }) => {
  const color = (x + z) % 2 === 0 ? "#f0d9b5" : "#b58863";
  const highlightColor = isHighlight ? "#a8dadc" : color;

  return (
    <mesh position={[x - BOARD_OFFSET, 0, z - BOARD_OFFSET]} onClick={onClick}>
      <boxGeometry args={[TILE_SIZE, 0.1, TILE_SIZE]} />
      <meshStandardMaterial color={highlightColor} />
    </mesh>
  );
};

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [pieces, setPieces] = useState(game.board());

  const updatePieces = () => setPieces(game.board());

  const handleClick = (x, z) => {
    const square = squareId(x, z);
    const piece = game.get(square);

    if (selected) {
      const move = game.move({ from: selected, to: square, promotion: "q" });
      if (move) {
        updatePieces();
        setSelected(null);
        setLegalMoves([]);
        setTimeout(makeAIMove, 500);
      } else {
        setSelected(null);
        setLegalMoves([]);
      }
    } else if (piece && piece.color === "w") {
      setSelected(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
    }
  };

  const makeAIMove = () => {
    const moves = game.moves({ verbose: true }).filter((m) => m.color === "b");
    const captures = moves.filter((m) => m.captured);
    const move = captures.length > 0
      ? captures[Math.floor(Math.random() * captures.length)]
      : moves[Math.floor(Math.random() * moves.length)];

    if (move) {
      game.move(move.san);
      updatePieces();
    }
  };

  return (
    <>
      {/* Squares */}
      {Array.from({ length: 8 }).map((_, z) =>
        Array.from({ length: 8 }).map((_, x) => {
          const id = squareId(x, z);
          const isHighlight = legalMoves.includes(id);
          return (
            <Square key={id} x={x} z={z} isHighlight={isHighlight} onClick={() => handleClick(x, z)} />
          );
        })
      )}

      {/* Pieces */}
      {pieces.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (!cell) return null;
          const square = squareId(colIndex, rowIndex);
          return (
            <Suspense fallback={null} key={square}>
              <Piece type={cell.type} color={cell.color} square={square} />
            </Suspense>
          );
        })
      )}
    </>
  );
};

const Chess3D = () => {
  return (
    <Canvas camera={{ position: [6, 8, 6], fov: 50 }} shadows>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
      <ChessBoard />
      <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={15} />
      <Stats />
    </Canvas>
  );
};

export default Chess3D;

useGLTF.preload("/models/wP.glb"); // preload example
