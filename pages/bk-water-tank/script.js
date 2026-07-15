// BK's Water Tank - simulated mixing tank driven by live weather data.
//
// Warm source = current air temp at Lake Constance (Open-Meteo forecast API).
// Cold source (lake approximation) = 60% of the trailing 7-day mean air temp
// blended with 40% of a fixed seasonal baseline, to mimic the lake's thermal
// inertia relative to the air. Open-Meteo's Marine API doesn't cover inland
// lakes, so there's no direct lake-temperature source to call.
(function () {
  const LAT = 47.66; // Constance / Bodensee
  const LON = 9.17;
  const SEASONAL_BASELINE_C = 20; // rough summer lake-temp placeholder
  const FALLBACK_WARM_C = 24;
  const FALLBACK_COLD_C = 19;

  const CONTAINER_VOLUME_L = 20;
  const SIM_SPEEDUP = 20; // simulation clock runs 20x real time
  const TICK_MS = 200;
  const HISTORY_LIMIT = 300;

  const HEATER_MAX_POWER_W = 3000; // household-heater-sized cap, placeholder
  const WATER_SPECIFIC_HEAT_J_PER_KGK = 4186;
  const WATER_DENSITY_KG_PER_L = 1;

  const STORAGE_KEY = "bk-water-tank-settings";
  const FETCH_TIMEOUT_MS = 8000;
  const FETCH_RETRY_MS = 30_000;
  const FETCH_REFRESH_MS = 5 * 60_000;

  const targetSlider = document.getElementById("target-slider");
  const flowSlider = document.getElementById("flow-slider");
  const targetValue = document.getElementById("target-value");
  const flowValue = document.getElementById("flow-value");
  const dataNotice = document.getElementById("data-notice");
  const rangeWarning = document.getElementById("range-warning");
  const readoutContainer = document.getElementById("readout-container");
  const readoutWarm = document.getElementById("readout-warm");
  const readoutCold = document.getElementById("readout-cold");
  const readoutRatio = document.getElementById("readout-ratio");
  const readoutHeater = document.getElementById("readout-heater");
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  let warmTemp = FALLBACK_WARM_C;
  let coldTemp = FALLBACK_COLD_C;
  let containerTemp = FALLBACK_COLD_C;
  let simMinutes = 0;
  let history = [];

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved.target === "number") targetSlider.value = saved.target;
      if (saved && typeof saved.flow === "number") flowSlider.value = saved.flow;
    } catch {
      // ignore malformed/missing storage
    }
  }

  function saveSettings() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ target: parseFloat(targetSlider.value), flow: parseFloat(flowSlider.value) })
    );
  }

  async function fetchSourceTemps() {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m&daily=temperature_2m_mean&past_days=7&forecast_days=1&timezone=auto`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const warm = data.current.temperature_2m;
      const dailyMeans = data.daily.temperature_2m_mean.slice(0, 7);
      const weeklyAvg = dailyMeans.reduce((sum, v) => sum + v, 0) / dailyMeans.length;
      const cold = 0.6 * weeklyAvg + 0.4 * SEASONAL_BASELINE_C;
      return { warm, cold };
    } finally {
      clearTimeout(timeout);
    }
  }

  function scheduleFetch() {
    fetchSourceTemps()
      .then(({ warm, cold }) => {
        warmTemp = warm;
        coldTemp = cold;
        dataNotice.hidden = true;
        setTimeout(scheduleFetch, FETCH_REFRESH_MS);
      })
      .catch(() => {
        dataNotice.textContent = "Live data unavailable — using fallback values.";
        dataNotice.hidden = false;
        setTimeout(scheduleFetch, FETCH_RETRY_MS);
      });
  }

  // Blends warm/cold to hit target; if even 100% warm falls short, engages a
  // capped heater on the inflow to make up the difference (see the "How it
  // works" section on the page for the equations).
  function computeInflow(warm, cold, target, flowLmin) {
    const range = warm - cold;
    const blendRatio = range === 0 ? 1 : Math.min(1, Math.max(0, (target - cold) / range));
    const blendedTemp = blendRatio * warm + (1 - blendRatio) * cold;
    const belowRange = target < Math.min(warm, cold);
    const needsHeater = target > warm;

    if (!needsHeater) {
      return { ratio: blendRatio, inflowTemp: blendedTemp, heaterPowerW: 0, achievable: !belowRange };
    }

    const massFlowKgS = (flowLmin * WATER_DENSITY_KG_PER_L) / 60;
    const deltaTNeeded = target - warm;
    const powerNeededW = massFlowKgS * WATER_SPECIFIC_HEAT_J_PER_KGK * deltaTNeeded;
    const powerW = Math.min(powerNeededW, HEATER_MAX_POWER_W);
    const deltaTActual = massFlowKgS > 0 ? powerW / (massFlowKgS * WATER_SPECIFIC_HEAT_J_PER_KGK) : 0;

    return {
      ratio: 1,
      inflowTemp: warm + deltaTActual,
      heaterPowerW: powerW,
      achievable: powerW >= powerNeededW - 1e-6,
    };
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawChart(target) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    const temps = history.map((p) => p.temp).concat([target, warmTemp, coldTemp]);
    const min = Math.min(...temps) - 1;
    const max = Math.max(...temps) + 1;
    const range = max - min || 1;
    const minT = history.length ? history[0].t : 0;
    const maxT = history.length ? history[history.length - 1].t : 1;
    const tRange = maxT - minT || 1;

    const toX = (t) => ((t - minT) / tRange) * width;
    const toY = (temp) => height - ((temp - min) / range) * height;

    // target line
    ctx.strokeStyle = "#c94040";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, toY(target));
    ctx.lineTo(width, toY(target));
    ctx.stroke();
    ctx.setLineDash([]);

    // container temp curve
    if (history.length > 1) {
      ctx.strokeStyle = "#2b8be2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach((p, i) => {
        const x = toX(p.t);
        const y = toY(p.temp);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  function tick() {
    const target = parseFloat(targetSlider.value);
    const flow = parseFloat(flowSlider.value);
    const inflow = computeInflow(warmTemp, coldTemp, target, flow);

    rangeWarning.hidden = inflow.achievable;
    if (!inflow.achievable) {
      rangeWarning.textContent =
        "Target unreachable with current source temperatures, even at full heater power — clamped to nearest extreme.";
    }

    const k = flow / CONTAINER_VOLUME_L; // per simulated minute
    const simDtMinutes = (TICK_MS / 1000 / 60) * SIM_SPEEDUP;
    containerTemp = inflow.inflowTemp + (containerTemp - inflow.inflowTemp) * Math.exp(-k * simDtMinutes);
    simMinutes += simDtMinutes;

    history.push({ t: simMinutes, temp: containerTemp });
    if (history.length > HISTORY_LIMIT) history.shift();

    targetValue.textContent = `${target.toFixed(1)} °C`;
    flowValue.textContent = `${flow.toFixed(1)} L/min`;
    readoutContainer.textContent = `${containerTemp.toFixed(1)} °C`;
    readoutWarm.textContent = `${warmTemp.toFixed(1)} °C`;
    readoutCold.textContent = `${coldTemp.toFixed(1)} °C`;
    readoutRatio.textContent = `${(inflow.ratio * 100).toFixed(0)}%`;
    readoutHeater.textContent = `${(inflow.heaterPowerW / 1000).toFixed(2)} kW`;

    drawChart(target);
  }

  loadSettings();
  targetSlider.addEventListener("input", saveSettings);
  flowSlider.addEventListener("input", saveSettings);
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  containerTemp = coldTemp;
  scheduleFetch();
  setInterval(tick, TICK_MS);
  tick();
})();

// Snakes Game
(function () {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const MOVE_SPEED_MS = 150;

  const canvas = document.getElementById("snakes-canvas");
  const ctx = canvas.getContext("2d");
  const scoreDisplay = document.getElementById("snakes-score");
  const gameOverDiv = document.getElementById("snakes-game-over");
  const finalScoreDisplay = document.getElementById("snakes-final-score");
  const playAgainBtn = document.getElementById("snakes-play-again");
  const tankBtn = document.getElementById("tank-btn");
  const snakesBtn = document.getElementById("snakes-btn");
  const tankMode = document.getElementById("tank-mode");
  const snakesMode = document.getElementById("snakes-mode");

  let snake = [{ x: 10, y: 10 }];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = randomFood();
  let score = 0;
  let gameRunning = false;
  let gameOver = false;
  let moveTimer = null;

  function randomFood() {
    let newFood;
    do {
      newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (snake.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }

  function draw() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? "#2b8be2" : "#64b5f6";
      ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });

    // Draw food
    ctx.fillStyle = "#ff9800";
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  }

  function moveSnake() {
    direction = nextDirection;
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame();
      return;
    }

    // Check self collision
    if (snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      endGame();
      return;
    }

    snake.unshift(newHead);

    // Check food collision
    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
      food = randomFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = randomFood();
    score = 0;
    gameOver = false;
    gameRunning = true;
    scoreDisplay.textContent = `Score: 0`;
    gameOverDiv.hidden = true;
    draw();

    if (moveTimer) clearInterval(moveTimer);
    moveTimer = setInterval(moveSnake, MOVE_SPEED_MS);
  }

  function endGame() {
    gameRunning = false;
    gameOver = true;
    if (moveTimer) clearInterval(moveTimer);
    finalScoreDisplay.textContent = `Final Score: ${score}`;
    gameOverDiv.hidden = false;
  }

  function switchMode(toSnakes) {
    if (toSnakes) {
      tankMode.hidden = true;
      snakesMode.hidden = false;
      tankBtn.classList.remove("active");
      snakesBtn.classList.add("active");
      if (!gameRunning && !gameOver) startGame();
    } else {
      tankMode.hidden = false;
      snakesMode.hidden = true;
      tankBtn.classList.add("active");
      snakesBtn.classList.remove("active");
      if (moveTimer) clearInterval(moveTimer);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (!gameRunning || snakesMode.hidden) return;

    switch (e.key) {
      case "ArrowUp":
        if (direction.y === 0) nextDirection = { x: 0, y: -1 };
        e.preventDefault();
        break;
      case "ArrowDown":
        if (direction.y === 0) nextDirection = { x: 0, y: 1 };
        e.preventDefault();
        break;
      case "ArrowLeft":
        if (direction.x === 0) nextDirection = { x: -1, y: 0 };
        e.preventDefault();
        break;
      case "ArrowRight":
        if (direction.x === 0) nextDirection = { x: 1, y: 0 };
        e.preventDefault();
        break;
    }
  });

  tankBtn.addEventListener("click", () => switchMode(false));
  snakesBtn.addEventListener("click", () => switchMode(true));
  playAgainBtn.addEventListener("click", startGame);
})();
