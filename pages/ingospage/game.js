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
  const muteBtn = document.getElementById("mute-btn");

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

  // Sound: alles per Web Audio API synthetisiert, keine externen Dateien nötig.
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let melodyTimer = null;
  let melodyIndex = 0;

  const NOTE_FREQ = {
    A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
    F5: 698.46, G5: 783.99, A5: 880.0,
  };

  // Die nervige Tetris-Melodie (Korobeiniki), als [Note, Dauer in ms].
  const MELODY = [
    ["E5", 200], ["B4", 100], ["C5", 100], ["D5", 200], ["C5", 100], ["B4", 100],
    ["A4", 200], ["A4", 100], ["C5", 100], ["E5", 200], ["D5", 100], ["C5", 100],
    ["B4", 300], ["C5", 100], ["D5", 200], ["E5", 200],
    ["C5", 200], ["A4", 200], ["A4", 200], [null, 200],
    ["D5", 300], ["F5", 100], ["A5", 200], ["G5", 100], ["F5", 100],
    ["E5", 300], ["C5", 100], ["E5", 100], ["D5", 100], ["C5", 100], ["B4", 100],
    ["B4", 100], ["C5", 100], ["D5", 200], ["E5", 200],
    ["C5", 200], ["A4", 200], ["A4", 200], [null, 200],
  ];

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0 : 0.15;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, duration, type, startTime) {
    if (!audioCtx) return;
    const t = startTime || audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  function sfxMove() { beep(220, 0.05); }
  function sfxRotate() { beep(330, 0.06); }
  function sfxLock() { beep(140, 0.08); }
  function sfxLineClear(count) {
    [523.25, 659.25, 783.99, 1046.5]
      .slice(0, count)
      .forEach((f, i) => beep(f, 0.12, "square", audioCtx.currentTime + i * 0.08));
  }
  function sfxGameOver() {
    [523.25, 466.16, 415.3, 349.23].forEach((f, i) =>
      beep(f, 0.25, "sawtooth", audioCtx.currentTime + i * 0.2)
    );
  }

  function playMelodyStep() {
    if (!running) return;
    const [note, duration] = MELODY[melodyIndex % MELODY.length];
    if (note) beep(NOTE_FREQ[note], (duration / 1000) * 0.9);
    melodyIndex++;
    melodyTimer = setTimeout(playMelodyStep, duration);
  }

  function startMusic() {
    ensureAudio();
    melodyIndex = 0;
    clearTimeout(melodyTimer);
    playMelodyStep();
  }

  function stopMusic() {
    clearTimeout(melodyTimer);
  }

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
    sfxLock();
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
      sfxLineClear(cleared);
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
      sfxRotate();
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
    stopMusic();
    sfxGameOver();
    gameoverScreen.classList.remove("hidden");
  }

  function startGame() {
    ensureAudio();
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
    startMusic();
  }

  document.addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "ArrowLeft") { if (move(-1, 0)) sfxMove(); }
    else if (e.key === "ArrowRight") { if (move(1, 0)) sfxMove(); }
    else if (e.key === "ArrowDown") drop();
    else if (e.key === "ArrowUp") tryRotate();
    else return;
    e.preventDefault();
    draw();
  });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.15;
    muteBtn.textContent = muted ? "🔇" : "🔊";
  });
})();
