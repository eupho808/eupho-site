const CANVAS_KEY = 'fs_canvas';
let strokes = [];
let drawing = false;
let currentColor = '#4a3f35';
let currentSize = 3;
let last = null;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('home-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const colorInput = document.getElementById('canvas-color');
  const sizeInput = document.getElementById('canvas-size');
  const clearBtn = document.getElementById('canvas-clear');
  const saveBtn = document.getElementById('canvas-save');
  const status = document.getElementById('canvas-status');

  function setSize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    redraw(ctx);
  }
  setSize();
  window.addEventListener('resize', setSize);

  colorInput.addEventListener('input', (e) => { currentColor = e.target.value; });
  sizeInput.addEventListener('input', (e) => { currentSize = parseInt(e.target.value, 10); });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e) {
    drawing = true;
    last = getPos(e);
    const stroke = { color: currentColor, size: currentSize, points: [last] };
    strokes.push(stroke);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const stroke = strokes[strokes.length - 1];
    stroke.points.push(pos);
    drawSegment(ctx, last, pos, stroke.color, stroke.size);
    last = pos;
  }

  function end() {
    drawing = false;
    last = null;
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  clearBtn.addEventListener('click', () => {
    strokes = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveLocal();
    status.textContent = 'cleared';
    status.className = 'upload-status';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });

  saveBtn.addEventListener('click', () => {
    saveLocal();
    status.textContent = 'saved locally';
    status.className = 'upload-status success';
    setTimeout(() => { status.className = 'upload-status'; status.textContent = ''; }, 2000);
  });

  load(ctx);
});

function drawSegment(ctx, a, b, color, size) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function redraw(ctx) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(stroke => {
    for (let i = 1; i < stroke.points.length; i++) {
      drawSegment(ctx, stroke.points[i - 1], stroke.points[i], stroke.color, stroke.size);
    }
  });
}

function saveLocal() {
  localStorage.setItem(CANVAS_KEY, JSON.stringify(strokes));
}

function load(ctx) {
  const local = localStorage.getItem(CANVAS_KEY);
  if (local) {
    try {
      strokes = JSON.parse(local);
    } catch (e) {
      strokes = [];
    }
  }
  redraw(ctx);
}
