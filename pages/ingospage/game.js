(function () {
  const COLS = 10;
  const ROWS = 20;
  const CELL = 20;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const startScreen = document.getElementById("start-screen");
  const gameoverScreen = document.getElementById("gameover-screen");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");

  // Immer dieselbe feste Reihenfolge statt zufälliger Steine.
  const SEQUENCE = ["I", "J", "L", "O", "S", "T", "Z"];

  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };

  const COLORS = {
    I: "#4dd0e1",
    O: "#ffd54f",
    T: "#ba68c8",
    S: "#81c784",
    Z: "#e57373",
    J: "#64b5f6",
    L: "#ffb74d",
  };

  let board, current, sequenceIndex, score, dropTimer, dropInterval, running;

  function newBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function nextPieceType() {
    const type = SEQUENCE[sequenceIndex % SEQUENCE.length];
    sequenceIndex++;
    return type;
  }

  function spawnPiece() {
    const type = nextPieceType();
    const shape = SHAPES[type];
    current = {
      type,
      shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0,
    };
    if (collides(current.shape, current.x, current.y)) {
      gameOver();
    }
  }

  function rotate(shape) {
    const size = shape.length;
    const result = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[c][size - 1 - r] = shape[r][c];
      }
    }
    return result;
  }

  function collides(shape, offsetX, offsetY) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const x = offsetX + c;
        const y = offsetY + r;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    current.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const y = current.y + r;
          const x = current.x + c;
          if (y >= 0) board[y][x] = current.type;
        }
      });
    });
    clearLines();
    spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((cell) => cell)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      score += cleared * 10;
      scoreEl.textContent = score;
    }
  }

  function move(dx, dy) {
    if (!collides(current.shape, current.x + dx, current.y + dy)) {
      current.x += dx;
      current.y += dy;
      return true;
    }
    return false;
  }

  function tryRotate() {
    const rotated = rotate(current.shape);
    if (!collides(rotated, current.x, current.y)) {
      current.shape = rotated;
    }
  }

  function drop() {
    if (!move(0, 1)) {
      lockPiece();
    }
    draw();
  }

  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) drawCell(c, r, COLORS[cell]);
      });
    });

    current.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) drawCell(current.x + c, current.y + r, COLORS[current.type]);
      });
    });
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
  }

  function gameOver() {
    running = false;
    clearInterval(dropTimer);
    gameoverScreen.classList.remove("hidden");
  }

  function startGame() {
    board = newBoard();
    sequenceIndex = 0;
    score = 0;
    scoreEl.textContent = score;
    running = true;
    startScreen.classList.add("hidden");
    gameoverScreen.classList.add("hidden");
    spawnPiece();
    draw();
    clearInterval(dropTimer);
    dropInterval = 600;
    dropTimer = setInterval(drop, dropInterval);
  }

  document.addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "ArrowLeft") move(-1, 0);
    else if (e.key === "ArrowRight") move(1, 0);
    else if (e.key === "ArrowDown") drop();
    else if (e.key === "ArrowUp") tryRotate();
    else return;
    e.preventDefault();
    draw();
  });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
})();
