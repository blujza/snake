const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const restartBtn = document.getElementById("restart");

const CELL = 20;
const BOARD_SIZE = 400; // logical (CSS) pixels
const COLS = BOARD_SIZE / CELL;
const ROWS = BOARD_SIZE / CELL;

// Render at native device resolution so shapes stay crisp on HiDPI screens.
const dpr = window.devicePixelRatio || 1;
canvas.width = BOARD_SIZE * dpr;
canvas.height = BOARD_SIZE * dpr;
canvas.style.width = BOARD_SIZE + "px";
canvas.style.height = BOARD_SIZE + "px";
ctx.scale(dpr, dpr);

const BASE_TICK_MS = 170;
const MIN_TICK_MS = 70;
const SPEED_STEP_MS = 6;

let snake, direction, nextDirection, food, score, highscore, gameOver, paused, loopId, tickMs;

function currentTickMs() {
  const foodsEaten = score / 10;
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - foodsEaten * SPEED_STEP_MS);
}

function restartLoop() {
  tickMs = currentTickMs();
  if (loopId) clearInterval(loopId);
  loopId = setInterval(tick, tickMs);
}

function init() {
  snake = [
    { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
    { x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 2) },
    { x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 2) },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = direction;
  score = 0;
  gameOver = false;
  paused = false;
  highscore = Number(localStorage.getItem("snake-highscore") || 0);
  scoreEl.textContent = score;
  highscoreEl.textContent = highscore;
  placeFood();
  restartLoop();
}

function placeFood() {
  let candidate;
  do {
    candidate = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === candidate.x && s.y === candidate.y));
  food = candidate;
}

function tick() {
  if (gameOver || paused) return;

  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (
    head.x < 0 ||
    head.x >= COLS ||
    head.y < 0 ||
    head.y >= ROWS ||
    snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    placeFood();
    if (currentTickMs() !== tickMs) restartLoop();
  } else {
    snake.pop();
  }

  draw();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawSnake() {
  const len = snake.length;

  // Body: each link overlaps the next so corners round into a continuous tube.
  for (let i = len - 1; i >= 1; i--) {
    const seg = snake[i];
    const t = 1 - i / len;
    const shade = Math.round(120 + t * 60);
    ctx.fillStyle = `rgb(30, ${shade}, ${Math.round(shade * 0.65)})`;
    roundedRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 7);

    const next = snake[i - 1];
    if (Math.abs(next.x - seg.x) + Math.abs(next.y - seg.y) === 1) {
      const jx = Math.min(seg.x, next.x) * CELL + (seg.x === next.x ? 1 : CELL - 5);
      const jy = Math.min(seg.y, next.y) * CELL + (seg.y === next.y ? 1 : CELL - 5);
      const jw = seg.x === next.x ? CELL - 2 : CELL + 4;
      const jh = seg.y === next.y ? CELL - 2 : CELL + 4;
      roundedRect(jx, jy, jw, jh, 5);
    }
  }

  // Head
  const head = snake[0];
  ctx.fillStyle = "#4ade80";
  roundedRect(head.x * CELL, head.y * CELL, CELL, CELL, 9);

  const cx = head.x * CELL + CELL / 2;
  const cy = head.y * CELL + CELL / 2;
  const eyeOffsetX = direction.x !== 0 ? direction.x * 4 : 5;
  const eyeOffsetY = direction.y !== 0 ? direction.y * 4 : 5;
  const perpX = direction.y !== 0 ? 4 : 0;
  const perpY = direction.x !== 0 ? 4 : 0;

  ctx.fillStyle = "#0d1117";
  ctx.beginPath();
  ctx.arc(cx + eyeOffsetX + perpX, cy + eyeOffsetY + perpY, 2, 0, Math.PI * 2);
  ctx.arc(cx + eyeOffsetX - perpX, cy + eyeOffsetY - perpY, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawApple() {
  const cx = food.x * CELL + CELL / 2;
  const cy = food.y * CELL + CELL / 2;
  const r = CELL / 2 - 3;

  // body
  ctx.fillStyle = "#f03e3e";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, r, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // highlight
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.4, cy - r * 0.2, r * 0.3, r * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // stem
  ctx.strokeStyle = "#7a4a20";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + 1, cy - r - 3);
  ctx.stroke();

  // leaf
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - r - 2, 3, 1.6, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  drawApple();
  drawSnake();

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", BOARD_SIZE / 2, BOARD_SIZE / 2 - 10);
    ctx.font = "14px system-ui";
    ctx.fillText("Nyomj Újraindítást", BOARD_SIZE / 2, BOARD_SIZE / 2 + 16);
  } else if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Szünet", BOARD_SIZE / 2, BOARD_SIZE / 2);
  }
}

function endGame() {
  gameOver = true;
  clearInterval(loopId);
  if (score > highscore) {
    highscore = score;
    localStorage.setItem("snake-highscore", String(highscore));
    highscoreEl.textContent = highscore;
  }
  draw();
}

const KEY_MAP = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

window.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    if (gameOver) {
      init();
    } else {
      paused = !paused;
      draw();
    }
    return;
  }

  const dir = KEY_MAP[e.key];
  if (!dir) return;
  e.preventDefault();

  const isOpposite = dir.x === -direction.x && dir.y === -direction.y;
  if (!isOpposite) nextDirection = dir;
});

restartBtn.addEventListener("click", init);

init();
draw();
