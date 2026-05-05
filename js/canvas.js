const CANVAS_SCALE = 2;
const PRINT_COLOR  = '#1a6b3a';  // Green print on yellow home jersey
const NAME_FONT    = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const NUM_FONT     = "'Bebas Neue', 'Barlow Condensed', sans-serif";

const IMG_FRONT  = './images/home-jersey-front.png';
const IMG_BACK   = './images/home-jersey-back.png';
const IMG_DETAIL = './images/home-jersey-detail.jpg';

const views = [
  { src: IMG_FRONT,  label: 'Front View',             isBack: false },
  { src: IMG_BACK,   label: 'Back View — Customized', isBack: true  },
  { src: IMG_DETAIL, label: 'Detail Close-up',         isBack: false },
];

// State
let state = {
  currentView:  0,
  playerName:   '',
  playerNumber: '10',
  playerSize:   'M',
};

// DOM refs (set on DOMContentLoaded)
let mainImg, canvas, ctx, viewBadge, hintEl;

// Preload back image for instant canvas draw
const backImage = new Image();
backImage.src = IMG_BACK;

document.addEventListener('DOMContentLoaded', () => {
  mainImg   = document.getElementById('mainProductImg');
  canvas    = document.getElementById('customCanvas');
  viewBadge = document.getElementById('viewBadge');
  hintEl    = document.getElementById('previewHint');

  if (canvas) {
    ctx = canvas.getContext('2d');
  }

  // Wait for fonts then draw if we're on the back view
  document.fonts.ready.then(() => {
    if (views[state.currentView].isBack) drawBack();
  });

  // Auto-show back view on load to demonstrate customisation
  setTimeout(() => switchView(1), 400);
});

/**
 * Switch gallery view
 */
function switchView(idx) {
  if (!mainImg || !canvas || !ctx) return;
  state.currentView = idx;

  // Update thumb active state
  document.querySelectorAll('.gallery__thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  // Update badge text
  if (viewBadge) viewBadge.textContent = views[idx].label;

  if (views[idx].isBack) {
    mainImg.classList.add('hidden');
    canvas.classList.add('active');
    drawBack();
  } else {
    canvas.classList.remove('active');
    mainImg.classList.remove('hidden');
    mainImg.src = views[idx].src;
    mainImg.alt = views[idx].label;
  }
}

/**
 * Draw the back jersey with name + number overlay on canvas
 */
function drawBack() {
  if (!canvas || !ctx) return;
  const stage = document.getElementById('galleryStage');
  if (!stage) return;

  const W = stage.offsetWidth;
  const H = stage.offsetHeight;

  canvas.width  = W * CANVAS_SCALE;
  canvas.height = H * CANVAS_SCALE;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(CANVAS_SCALE, CANVAS_SCALE);

  const render = (img) => {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#ebebeb';
    ctx.fillRect(0, 0, W, H);

    // Letterbox-fit image with padding
    const pad = 16;
    const scaleX = (W - pad * 2) / img.naturalWidth;
    const scaleY = (H - pad * 2) / img.naturalHeight;
    const sc     = Math.min(scaleX, scaleY);
    const dw     = img.naturalWidth  * sc;
    const dh     = img.naturalHeight * sc;
    const dx     = (W - dw) / 2;
    const dy     = (H - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);

    // ── TEXT OVERLAY ──
    const nameDisplay = (state.playerName.trim().toUpperCase()) || 'YOUR NAME';
    const numDisplay  = String(state.playerNumber || '10');
    const cx          = dx + dw * 0.5;

    // NAME — positioned at ~26.5% down
    let nameFontSize = dw * 0.115;
    if (nameDisplay.length > 10) nameFontSize *= 0.82;
    if (nameDisplay.length > 12) nameFontSize *= 0.78;
    if (nameDisplay.length > 14) nameFontSize *= 0.70;

    ctx.save();
    ctx.font         = `900 ${nameFontSize}px ${NAME_FONT}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = PRINT_COLOR;
    ctx.shadowColor  = 'rgba(0,0,0,0.20)';
    ctx.shadowBlur   = 3 * CANVAS_SCALE;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1.5;
    ctx.globalAlpha  = 0.95;
    ctx.transform(1, 0, -0.01, 1, 0, 0);
    ctx.fillText(nameDisplay, cx + dy * 0.01, dy + dh * 0.265);
    ctx.restore();

    // NUMBER — positioned at ~52% down
    let numFontSize = dh * 0.37;
    if (numDisplay.length > 1) numFontSize = dh * 0.33;
    if (numDisplay.length > 2) numFontSize = dh * 0.26;

    ctx.save();
    ctx.font         = `900 ${numFontSize}px ${NUM_FONT}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = PRINT_COLOR;
    ctx.shadowColor  = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur   = 4 * CANVAS_SCALE;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.globalAlpha  = 0.95;
    ctx.fillText(numDisplay, cx, dy + dh * 0.525);
    ctx.restore();
  };

  if (backImage.complete && backImage.naturalWidth > 0) {
    render(backImage);
  } else {
    backImage.onload = () => render(backImage);
  }
}

/**
 * Called on every name input keystroke
 */
function onNameInput(value) {
  state.playerName = value;
  switchView(1);
  showHint();
}

/**
 * Called when a number chip is clicked or custom number entered
 */
function onNumberChange(num, chipEl, isCustom = false) {
  if (isCustom && !num) return;
  state.playerNumber = String(num);

  const chips = document.querySelectorAll('.num-pill');
  chips.forEach(c => c.classList.remove('active'));

  if (!isCustom && chipEl) {
    const customInput = document.getElementById('customNumInput');
    if (customInput) customInput.value = '';
    chipEl.classList.add('active');
  }

  switchView(1);
  showHint();
}

/**
 * Called when a size chip is clicked
 */
function onSizeChange(el) {
  document.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  state.playerSize = el.textContent.trim();
}

/**
 * Show the "live preview updated" hint briefly
 */
let hintTimer;
function showHint() {
  if (!hintEl) return;
  hintEl.classList.add('visible');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hintEl.classList.remove('visible'), 3000);
}

// Redraw canvas on window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (views[state.currentView].isBack) drawBack();
  }, 150);
});
