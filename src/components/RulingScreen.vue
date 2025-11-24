<template>
  <div class="ruling-page">
    <!-- FENIUS header -->
    <div class="header-bar">eManuskript Produkt</div>
    <div class="title">FENIUS</div>

    <!-- Main container -->
    <div class="ruling-container">
      <!-- TOP BAR -->
      <header class="topbar card">
        <div class="title-block">
          <h1>Manuscript pricking &amp; ruling schema</h1>
          <small class="muted">
            {{ shelfmark || "—" }} • {{ siglum || "—" }} • folio
            {{ folio || "—" }} • {{ widthCm }}×{{ heightCm }} cm • Zoom
            {{ zoomPercent }}%
          </small>
        </div>
        <div class="actions">
          <button @click="saveSchema" title="Save to localStorage (Ctrl/Cmd+S)">
            Save
          </button>
          <button @click="restoreSchema" title="Restore from localStorage">
            Restore
          </button>
          <button @click="clearSchema" title="Clear all lines &amp; prickings">
            Reset
          </button>
          <button
            class="primary"
            @click="download"
            title="Export as A4 PDF"
          >
            Export PDF
          </button>
        </div>
      </header>

      <div class="layout">
        <!-- LEFT: CANVAS STAGE -->
        <section class="column stage card">
          <div class="stage-header">
            <div class="left">
              <label class="inline">
                <span>Zoom</span>
                <select
                  v-model.number="zoom"
                  @change="redrawAll"
                  title="Zoom level"
                >
                  <option :value="0.5">50%</option>
                  <option :value="0.75">75%</option>
                  <option :value="1">100%</option>
                  <option :value="1.5">150%</option>
                  <option :value="2">200%</option>
                </select>
              </label>
              <label class="inline">
                <input
                  type="checkbox"
                  v-model="snapEnabled"
                  @change="redrawAll"
                />
                <span>Snap</span>
              </label>
              <label class="inline" :class="{ disabled: !snapEnabled }">
                <span>step</span>
                <input
                  id="snapStep"
                  type="number"
                  min="0.05"
                  step="0.05"
                  v-model.number="snapStepCm"
                  :disabled="!snapEnabled"
                  @change="redrawAll"
                />
                <span>cm</span>
              </label>
            </div>
            <div class="right">
              <label class="inline">
                <input
                  type="checkbox"
                  v-model="showImage"
                  @change="redrawAll"
                />
                <span>Image</span>
              </label>
              <label class="inline" :class="{ disabled: !showImage }">
                <span>opacity</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  v-model.number="imageOpacity"
                  :disabled="!showImage"
                  @input="redrawAll"
                />
              </label>
            </div>
          </div>

          <!-- Canvas stack (zoom via CSS scale, origin top-left) -->
          <div
            class="canvas-wrap"
            :style="{
              transform: `scale(${zoom})`,
              width: baseWidthPx + 15 + 'px',
              height: baseHeightPx + 15 + 'px',
            }"
            @mousemove="moveLines"
            @click="create_click"
          >
            <!-- Rulers + axes canvas (includes the 15px top/left gutters) -->
            <canvas
              ref="rulers"
              :width="baseWidthPx + 15"
              :height="baseHeightPx + 15"
              class="layer layer-rulers"
            ></canvas>

            <!-- Background image (hidden if not shown) -->
            <canvas
              ref="bg"
              :width="baseWidthPx"
              :height="baseHeightPx"
              class="layer layer-image"
              :style="{
                top: '15px',
                left: '15px',
                opacity: showImage ? imageOpacity : 0,
                display: showImage ? 'block' : 'none',
              }"
            ></canvas>

            <!-- Main drawing layer -->
            <canvas
              ref="draw"
              :width="baseWidthPx"
              :height="baseHeightPx"
              class="layer layer-draw"
              style="top: 15px; left: 15px"
            ></canvas>

            <!-- Crosshair guides (DOM, not canvas) -->
            <div ref="hGuide" class="guide-h" v-show="showGuides"></div>
            <div ref="vGuide" class="guide-v" v-show="showGuides"></div>
          </div>

          <!-- Status bar -->
          <footer class="status">
            <div>
              pos: {{ cursorCm.x.toFixed(2) }}cm,
              {{ cursorCm.y.toFixed(2) }}cm
            </div>
            <div>mode: <b>{{ eraseMode ? "Erase" : "Draw" }}</b></div>
            <div>zoom: {{ zoomPercent }}%</div>
            <div>items: {{ lines.length }} lines, {{ prickings.length }} pricks</div>
          </footer>
        </section>

        <!-- RIGHT: CONTROLS -->
        <aside class="column controls">
          <!-- METADATA -->
          <div class="card">
            <h3>Metadata</h3>
            <ul class="form">
              <li>
                <label>Manuscript shelfmark</label>
                <input
                  v-model="shelfmark"
                  placeholder=""
                  title="Library/collection shelfmark"
                />
              </li>
              <li>
                <label>Siglum / Code</label>
                <input
                  v-model="siglum"
                  placeholder=""
                  title="Other MS designation or code"
                />
              </li>
              <li>
                <label>Folio or page</label>
                <input
                  v-model="folio"
                  placeholder=""
                  title="Folio (or page) reference"
                />
              </li>
              <li>
                <label>Ruling tool</label>
                <select v-model="tool" title="Dry-point, lead-point, or ink">
                  <option value="dry-point">dry-point</option>
                  <option value="lead-point">lead-point</option>
                  <option value="ink">ink</option>
                </select>
              </li>
              <li>
                <label>Direction</label>
                <select v-model="direction" title="Direction of ruling tool">
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="none">none</option>
                </select>
              </li>
              <li class="split">
                <div>
                  <label>Width (cm)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    v-model.number="widthCm"
                  />
                </div>
                <div>
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    v-model.number="heightCm"
                  />
                </div>
                <div class="apply">
                  <button
                    @click="applySize"
                    title="Apply page size and redraw rulers"
                  >
                    Apply
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- MODE -->
          <div class="card">
            <h3>Mode</h3>
            <div class="btnrow">
              <button :class="{ active: !eraseMode }" @click="setDraw" title="D">
                Draw
              </button>
              <button :class="{ active: eraseMode }" @click="setErase" title="E">
                Erase
              </button>
            </div>
            <small class="muted">
              Click top ruler to add vertical line; left ruler for horizontal; on
              page for a pricking.
            </small>
          </div>

          <!-- RULING -->
          <div class="card">
            <h3>Ruling</h3>
            <h4>Single line</h4>
            <ul class="form compact">
              <li class="split-2">
                <div>
                  <label>start x (cm)</label>
                  <input type="number" step="0.1" v-model.number="start_x" />
                </div>
                <div>
                  <label>end x (cm)</label>
                  <input type="number" step="0.1" v-model.number="end_x" />
                </div>
              </li>
              <li class="split-2">
                <div>
                  <label>start y (cm)</label>
                  <input type="number" step="0.1" v-model.number="start_y" />
                </div>
                <div>
                  <label>end y (cm)</label>
                  <input type="number" step="0.1" v-model.number="end_y" />
                </div>
              </li>
              <li>
                <button @click="addSingleLine">Create</button>
              </li>
            </ul>

            <h4>Multiple horizontal lines</h4>
            <ul class="form compact">
              <li class="split-3">
                <div>
                  <label>start x</label>
                  <input type="number" step="0.1" v-model.number="start_x2" />
                </div>
                <div>
                  <label>end x</label>
                  <input type="number" step="0.1" v-model.number="end_x2" />
                </div>
                <div>
                  <label># lines</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    v-model.number="number"
                  />
                </div>
              </li>
              <li class="split-2">
                <div>
                  <label>start y</label>
                  <input type="number" step="0.1" v-model.number="start_y2" />
                </div>
                <div>
                  <label>end y</label>
                  <input type="number" step="0.1" v-model.number="end_y2" />
                </div>
              </li>
              <li><button @click="addMultipleLines">Create</button></li>
            </ul>
          </div>

          <!-- PRICKING -->
          <div class="card">
            <h3>Pricking</h3>
            <h4>Single pricking</h4>
            <ul class="form compact">
              <li class="split-2">
                <div>
                  <label>x (cm)</label>
                  <input type="number" step="0.1" v-model.number="hor" />
                </div>
                <div>
                  <label>y (cm)</label>
                  <input type="number" step="0.1" v-model.number="ver" />
                </div>
              </li>
              <li><button @click="addSinglePricking">Create</button></li>
            </ul>

            <h4>Pricking group (vertical)</h4>
            <ul class="form compact">
              <li class="split-3">
                <div>
                  <label>x (cm)</label>
                  <input type="number" step="0.1" v-model.number="hor2" />
                </div>
                <div>
                  <label># pricks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    v-model.number="number2"
                  />
                </div>
                <div>
                  <label>start y</label>
                  <input type="number" step="0.1" v-model.number="start_y3" />
                </div>
              </li>
              <li class="split-1">
                <div>
                  <label>end y</label>
                  <input type="number" step="0.1" v-model.number="end_y3" />
                </div>
              </li>
              <li><button @click="addMultiplePrickings">Create</button></li>
            </ul>
          </div>

          <!-- IMAGE -->
          <div class="card">
            <h3>Image</h3>
            <ul class="form compact">
              <li>
                <input
                  id="file"
                  type="file"
                  @change="handleImageUpload"
                  accept="image/*"
                />
              </li>
              <li class="btnrow">
                <button
                  @click="remove_bg"
                  :disabled="!bgImage"
                  title="Remove background image"
                >
                  Remove
                </button>
                <button
                  @click="fitToWidth"
                  :disabled="!bgImage"
                  title="Fit image to page width"
                >
                  Fit to width
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  defineProps,
} from "vue";
import jsPDF from "jspdf";

/* --------------------- Props (metadata from previous screen) --------------------- */
const props = defineProps({
  shelfmark: { type: String, default: "" },
  siglum: { type: String, default: "" },
  folio: { type: String, default: "" },
  widthCm: { type: Number, default: 15 },
  heightCm: { type: Number, default: 20 },
});

/* --------------------- Constants & helpers --------------------- */
const PX_PER_CM = 37.8;
const SCALE_FACTOR = 0.5; // keep your original “/2” look
const PAGE_BASE_WIDTH_CM = 20; // base A4 width area drawn on canvas

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snapVal = (v, step) => Math.round(v / step) * step;

/* --------------------- State --------------------- */
const shelfmark = ref(props.shelfmark || "");
const siglum = ref(props.siglum || "");
const folio = ref(props.folio || "");
const tool = ref("dry-point");
const direction = ref("none");

const widthCm = ref(props.widthCm || 15);
const heightCm = ref(props.heightCm || 20);

const zoom = ref(1);
const zoomPercent = computed(() => Math.round(zoom.value * 100));

const snapEnabled = ref(true);
const snapStepCm = ref(0.1);

const showImage = ref(false);
const imageOpacity = ref(0.6);
const bgImage = ref(null); // HTMLImageElement

const eraseMode = ref(false);
const showGuides = ref(true);

/* Cursor display */
const cursorCm = ref({ x: 0, y: 0 });

/* Ruling / pricking forms */
const start_x = ref(0);
const start_y = ref(0);
const end_x = ref(0);
const end_y = ref(0);

const start_x2 = ref(0);
const end_x2 = ref(0);
const start_y2 = ref(0);
const end_y2 = ref(0);
const number = ref(2);

const hor = ref(0);
const ver = ref(0);

const hor2 = ref(0);
const start_y3 = ref(0);
const end_y3 = ref(0);
const number2 = ref(2);

/* Shapes (model) */
const lines = ref([]); // {x1,y1,x2,y2} in cm
const prickings = ref([]); // {x,y} in cm

/* Undo/Redo */
const undoStack = ref([]);
const redoStack = ref([]);

/* Canvas refs */
const rulers = ref(null);
const bg = ref(null);
const draw = ref(null);
const hGuide = ref(null);
const vGuide = ref(null);

/* Background fit mode ('width' for this app) */
const bgFitMode = ref("width");

/* --------------------- Geometry --------------------- */
const baseWidthPx = computed(() =>
  Math.round(PAGE_BASE_WIDTH_CM * PX_PER_CM * SCALE_FACTOR)
);
const baseHeightPx = computed(() =>
  Math.round(baseWidthPx.value * (heightCm.value / widthCm.value))
);

const cmToPxX = (x) => (x / widthCm.value) * baseWidthPx.value;
const cmToPxY = (y) => (y / heightCm.value) * baseHeightPx.value;
const pxToCmX = (px) => (px / baseWidthPx.value) * widthCm.value;
const pxToCmY = (px) => (px / baseHeightPx.value) * heightCm.value;

/* --------------------- Drawing --------------------- */
function drawRulers() {
  const c = rulers.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  // border lines (page area)
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(15, 15, baseWidthPx.value, baseHeightPx.value);
  ctx.stroke();

  ctx.font = "8px Arial";
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";

  // top ruler ticks (x)
  ctx.beginPath();
  for (
    let px = 0;
    px <= baseWidthPx.value;
    px += Math.round(PX_PER_CM * SCALE_FACTOR)
  ) {
    const cm = pxToCmX(px);
    const isMajor = Math.abs(cm - Math.round(cm)) < 1e-6;
    const yTop = 0;
    const xPos = 15 + px;
    ctx.moveTo(xPos, yTop + (isMajor ? 0 : 7));
    ctx.lineTo(xPos, 14);
    if (isMajor) ctx.fillText(cm.toFixed(0), xPos + 2, 10);
  }
  ctx.stroke();

  // left ruler ticks (y)
  ctx.beginPath();
  for (
    let py = 0;
    py <= baseHeightPx.value;
    py += Math.round(PX_PER_CM * SCALE_FACTOR)
  ) {
    const cm = pxToCmY(py);
    const isMajor = Math.abs(cm - Math.round(cm)) < 1e-6;
    const xLeft = 0;
    const yPos = 15 + py;
    ctx.moveTo(xLeft + (isMajor ? 0 : 7), yPos);
    ctx.lineTo(14, yPos);
    if (isMajor) ctx.fillText(cm.toFixed(0), 2, yPos + 10);
  }
  ctx.stroke();
}

function drawBackground() {
  const c = bg.value;
  const ctx = c?.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  if (bgImage.value && showImage.value) {
    if (bgFitMode.value === "width") {
      const w = c.width;
      const ratio = bgImage.value.height / bgImage.value.width;
      const h = Math.round(w * ratio);
      ctx.drawImage(bgImage.value, 0, 0, w, h);
    } else {
      // fallback (contain)
      const scale = Math.min(
        c.width / bgImage.value.width,
        c.height / bgImage.value.height
      );
      const w = Math.round(bgImage.value.width * scale);
      const h = Math.round(bgImage.value.height * scale);
      ctx.drawImage(bgImage.value, 0, 0, w, h);
    }
  }
}

function drawShapes() {
  const c = draw.value;
  const ctx = c?.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineWidth = 1;

  // lines
  ctx.beginPath();
  for (const L of lines.value) {
    ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
  }
  ctx.stroke();

  // prickings
  for (const P of prickings.value) {
    ctx.fillRect(cmToPxX(P.x) - 2, cmToPxY(P.y) - 0.5, 5, 1); // 5px x 1px
  }
}

function redrawAll() {
  drawRulers();
  drawBackground();
  drawShapes();
}

/* --------------------- Actions & commands --------------------- */
function pushUndo() {
  undoStack.value.push(
    JSON.stringify({ lines: lines.value, prickings: prickings.value })
  );
  // clear redo after new change
  redoStack.value = [];
}

function undo() {
  if (!undoStack.value.length) return;
  const prev = undoStack.value.pop();
  redoStack.value.push(
    JSON.stringify({ lines: lines.value, prickings: prickings.value })
  );
  const state = JSON.parse(prev);
  lines.value = state.lines;
  prickings.value = state.prickings;
  redrawAll();
}
function redo() {
  if (!redoStack.value.length) return;
  const next = redoStack.value.pop();
  undoStack.value.push(
    JSON.stringify({ lines: lines.value, prickings: prickings.value })
  );
  const state = JSON.parse(next);
  lines.value = state.lines;
  prickings.value = state.prickings;
  redrawAll();
}

function setDraw() {
  eraseMode.value = false;
}
function setErase() {
  eraseMode.value = true;
}

/* --------------------- Event handlers --------------------- */
function applySize() {
  widthCm.value = clamp(widthCm.value || 1, 1, 1000);
  heightCm.value = clamp(heightCm.value || 1, 1, 1000);
  nextTickRedraw();
}

function snapPoint(cm) {
  if (!snapEnabled.value) return cm;
  return snapVal(cm, snapStepCm.value);
}

/* mouse helpers (account for zoom & 15px rulers) */
function toLocalCoords(e) {
  const wrap = rulers.value; // has full size + rulers
  const rect = wrap.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;
  return { x, y };
}
function insidePage(x, y) {
  return (
    x >= 15 &&
    y >= 15 &&
    x <= 15 + baseWidthPx.value &&
    y <= 15 + baseHeightPx.value
  );
}

function moveLines(e) {
  const pos = toLocalCoords(e);
  const x = pos.x;
  const y = pos.y;

  // guides
  if (y > 15 && y < 15 + baseHeightPx.value) {
    hGuide.value.style.display = "block";
    hGuide.value.style.width = baseWidthPx.value + "px";
    hGuide.value.style.top = y + "px";
    hGuide.value.style.left = "15px";
  }
  if (x > 15 && x < 15 + baseWidthPx.value) {
    vGuide.value.style.display = "block";
    vGuide.value.style.height = baseHeightPx.value + "px";
    vGuide.value.style.left = x + "px";
    vGuide.value.style.top = "15px";
  }

  // cursor cm (relative to page)
  const xPagePx = clamp(x - 15, 0, baseWidthPx.value);
  const yPagePx = clamp(y - 15, 0, baseHeightPx.value);
  cursorCm.value = { x: pxToCmX(xPagePx), y: pxToCmY(yPagePx) };
}

function create_click(e) {
  const pos = toLocalCoords(e);
  const x = pos.x;
  const y = pos.y;

  // clicking within top ruler (y < 15) => vertical line
  if (!eraseMode.value && x > 15 && y > 0 && y < 15) {
    const xCm = snapPoint(pxToCmX(x - 15));
    pushUndo();
    lines.value = [
      ...lines.value,
      { x1: xCm, y1: 0, x2: xCm, y2: heightCm.value },
    ];
    return redrawAll();
  }

  // clicking within left ruler (x < 15) => horizontal line
  if (!eraseMode.value && y > 15 && x > 0 && x < 15) {
    const yCm = snapPoint(pxToCmY(y - 15));
    pushUndo();
    lines.value = [
      ...lines.value,
      { x1: 0, y1: yCm, x2: widthCm.value, y2: yCm },
    ];
    return redrawAll();
  }

  // inside page area
  if (insidePage(x, y)) {
    const xCm = snapPoint(pxToCmX(x - 15));
    const yCm = snapPoint(pxToCmY(y - 15));

    if (!eraseMode.value) {
      // add pricking
      pushUndo();
      prickings.value = [...prickings.value, { x: xCm, y: yCm }];
      return redrawAll();
    } else {
      // erase nearest item (within threshold)
      const threshCm = Math.max(widthCm.value, heightCm.value) * 0.02; // ~2%
      let removed = false;

      // try prickings
      const pi = prickings.value.findIndex(
        (p) => Math.hypot(p.x - xCm, p.y - yCm) <= threshCm
      );
      if (pi >= 0) {
        pushUndo();
        prickings.value.splice(pi, 1);
        removed = true;
      }

      // try lines (distance point->segment)
      if (!removed) {
        const idx = lines.value.findIndex(
          (L) => pointToSegmentDist(xCm, yCm, L) <= threshCm / 2
        );
        if (idx >= 0) {
          pushUndo();
          lines.value.splice(idx, 1);
          removed = true;
        }
      }
      if (removed) redrawAll();
    }
  }
}

function pointToSegmentDist(x, y, L) {
  const { x1, y1, x2, y2 } = L;
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = x - x1;
  const wy = y - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(x - x1, y - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(x - x2, y - y2);
  const b = c1 / c2;
  const px = x1 + b * vx;
  const py = y1 + b * vy;
  return Math.hypot(x - px, y - py);
}

/* --------------------- Controls (forms -> shapes) --------------------- */
function addSingleLine() {
  pushUndo();
  lines.value = [
    ...lines.value,
    {
      x1: snapPoint(start_x.value),
      y1: snapPoint(start_y.value),
      x2: snapPoint(end_x.value),
      y2: snapPoint(end_y.value),
    },
  ];
  redrawAll();
}
function addMultipleLines() {
  const n = Math.max(1, Math.floor(number.value || 1));
  const y0 = start_y2.value;
  const y1 = end_y2.value;
  const step = n === 1 ? 0 : (y1 - y0) / (n - 1);
  pushUndo();
  const newLines = [];
  for (let i = 0; i < n; i++) {
    const y = snapPoint(y0 + i * step);
    newLines.push({
      x1: snapPoint(start_x2.value),
      y1: y,
      x2: snapPoint(end_x2.value),
      y2: y,
    });
  }
  lines.value = [...lines.value, ...newLines];
  redrawAll();
}

function addSinglePricking() {
  pushUndo();
  prickings.value = [
    ...prickings.value,
    { x: snapPoint(hor.value), y: snapPoint(ver.value) },
  ];
  redrawAll();
}
function addMultiplePrickings() {
  const n = Math.max(1, Math.floor(number2.value || 1));
  const y0 = start_y3.value;
  const y1 = end_y3.value;
  const step = n === 1 ? 0 : (y1 - y0) / (n - 1);
  pushUndo();
  const newPr = [];
  for (let i = 0; i < n; i++) {
    const y = snapPoint(y0 + i * step);
    newPr.push({ x: snapPoint(hor2.value), y });
  }
  prickings.value = [...prickings.value, ...newPr];
  redrawAll();
}

/* --------------------- Image handling --------------------- */
function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      bgImage.value = img;
      showImage.value = true;
      redrawAll();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}
function remove_bg() {
  bgImage.value = null;
  redrawAll();
}
function fitToWidth() {
  bgFitMode.value = "width";
  redrawAll();
}

/* --------------------- Save / Restore / Clear --------------------- */
const STORAGE_KEY = "manuscript-ruling-schema-v1";

function saveSchema() {
  const payload = {
    meta: {
      shelfmark: shelfmark.value,
      siglum: siglum.value,
      folio: folio.value,
      tool: tool.value,
      direction: direction.value,
      widthCm: widthCm.value,
      heightCm: heightCm.value,
    },
    shapes: { lines: lines.value, prickings: prickings.value },
    view: {
      zoom: zoom.value,
      snapEnabled: snapEnabled.value,
      snapStepCm: snapStepCm.value,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreSchema() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    shelfmark.value = data.meta?.shelfmark || shelfmark.value;
    siglum.value = data.meta?.siglum || siglum.value;
    folio.value = data.meta?.folio || folio.value;
    tool.value = data.meta?.tool || "dry-point";
    direction.value = data.meta?.direction || "none";
    widthCm.value = data.meta?.widthCm || widthCm.value;
    heightCm.value = data.meta?.heightCm || heightCm.value;

    lines.value = data.shapes?.lines || [];
    prickings.value = data.shapes?.prickings || [];

    zoom.value = data.view?.zoom || 1;
    snapEnabled.value = !!data.view?.snapEnabled;
    snapStepCm.value = data.view?.snapStepCm ?? 0.1;

    redrawAll();
  } catch (_e) {
    // Silently ignore parsing errors
  }
}

function clearSchema() {
  pushUndo();
  lines.value = [];
  prickings.value = [];
  redrawAll();
}

/* --------------------- Export PDF --------------------- */
function width_size() {
  // keep your classic scaling logic for A4 fit
  let width_pdf = PAGE_BASE_WIDTH_CM;
  let height_pdf = PAGE_BASE_WIDTH_CM * (heightCm.value / widthCm.value);
  while (height_pdf > 28.2857142857) {
    height_pdf /= 1.2;
    width_pdf /= 1.2;
  }
  return width_pdf;
}
function height_size() {
  let height_pdf = PAGE_BASE_WIDTH_CM * (heightCm.value / widthCm.value);
  while (height_pdf > 28.2857142857) height_pdf /= 1.2;
  return height_pdf;
}

function download() {
  // Render current draw layer + border onto a temp canvas to export
  const temp = document.createElement("canvas");
  temp.width = baseWidthPx.value;
  temp.height = baseHeightPx.value;
  const tctx = temp.getContext("2d");

  // optional: light border, then shapes
  tctx.strokeStyle = "#000";
  tctx.lineWidth = 1;
  tctx.strokeRect(0, 0, temp.width, temp.height);

  // draw shapes same as drawShapes()
  tctx.beginPath();
  for (const L of lines.value) {
    tctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    tctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
  }
  tctx.stroke();
  for (const P of prickings.value) {
    tctx.fillRect(cmToPxX(P.x) - 2, cmToPxY(P.y) - 0.5, 5, 1);
  }

  const img = temp.toDataURL("image/png", 1.0);

  const pdf = new jsPDF("p", "cm", "a4");
  // Metadata page
  pdf.text(1, 29.7 * 0.25, "manuscript shelfmark:", { align: "left" });
  pdf.text(7, 29.7 * 0.25, shelfmark.value || "", { align: "left" });

  pdf.text(
    1,
    29.7 * 0.3,
    "Other MS Designation, Siglum or Code:",
    { align: "left" }
  );
  pdf.text(10.5, 29.7 * 0.3, siglum.value || "", { align: "left" });

  pdf.text(1, 29.7 * 0.35, `folio: ${folio.value || ""}`, { align: "left" });
  pdf.text(1, 29.7 * 0.4, `height: ${heightCm.value}`, { align: "left" });
  pdf.text(1, 29.7 * 0.45, `width: ${widthCm.value}`, { align: "left" });
  pdf.text(1, 29.7 * 0.5, `ruling tool: ${tool.value}`, { align: "left" });
  pdf.text(
    1,
    29.7 * 0.55,
    `direction of ruling tool: ${direction.value}`,
    { align: "left" }
  );

  // Canvas page
  pdf.addPage();
  pdf.addImage(img, "png", 0.5, 0.5, width_size(), height_size());
  pdf.save("download.pdf");
}

/* --------------------- Lifecycle & utilities --------------------- */
function nextTickRedraw() {
  // small async to let canvas size attrs settle
  requestAnimationFrame(() => requestAnimationFrame(redrawAll));
}

onMounted(() => {
  redrawAll();
  window.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
});

function onKey(e) {
  // Save
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    return saveSchema();
  }
  // Undo / Redo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) return redo();
    return undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    return redo();
  }
  // Modes
  if (e.key.toLowerCase() === "d") setDraw();
  if (e.key.toLowerCase() === "e") setErase();
}

/* Autosave (debounced) */
let saveTimer = null;
watch(
  [
    lines,
    prickings,
    shelfmark,
    siglum,
    folio,
    tool,
    direction,
    widthCm,
    heightCm,
  ],
  () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveSchema, 500);
  },
  { deep: true }
);
</script>

<style scoped>
/* ===== Fenius wrapper look ===== */
.ruling-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(to bottom, #3a4b60, #112233);
}

.header-bar {
  background: #c0c2c3;
  color: black;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 18px;
}

.title {
  text-align: center;
  margin: 16px 0;
  font-size: 32px;
  color: #a0a0a0;
}

/* Main container (aligned with bookbinding style, but wider) */
.ruling-container {
  max-width: 1200px;
  margin: 24px auto 32px;
  padding: 0 16px 32px;
}

/* ===== Layout & Cards ===== */
.layout {
  display: grid;
  grid-template-columns: 1.25fr 0.9fr;
  gap: 1rem;
  margin-top: 0.75rem;
}

.card {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  background: #fff;
  padding: 0.75rem;
  color: #2c3e50;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.topbar .title-block h1 {
  margin: 0;
  font-size: 1.25rem;
}
.muted {
  color: #6b7280;
}

.actions button + button {
  margin-left: 0.5rem;
}
button.primary {
  background: #2c7be5;
  color: #fff;
}

.column.stage {
  display: flex;
  flex-direction: column;
}
.stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.stage-header .inline {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-right: 0.5rem;
}
.stage-header .inline input[type="number"] {
  width: 5rem;
}
.stage-header .inline.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ===== Canvas stack ===== */
.canvas-wrap {
  position: relative;
  transform-origin: 0 0;
  user-select: none;
}
.layer {
  position: absolute;
  left: 0;
  top: 0;
}
.layer-rulers {
  z-index: 1;
}
.layer-image {
  z-index: 2;
}
.layer-draw {
  z-index: 3;
}

.guide-h {
  position: absolute;
  height: 1px;
  left: 15px;
  width: 0;
  top: 0;
  border-top: 1px solid #0a0a0a;
  z-index: 4;
}
.guide-v {
  position: absolute;
  width: 1px;
  top: 15px;
  height: 0;
  left: 0;
  border-left: 1px solid #0a0a0a;
  z-index: 4;
}

/* ===== Status bar ===== */
.status {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.5rem;
  color: #334155;
  font-size: 0.9rem;
}

/* ===== Controls ===== */
.controls {
  display: grid;
  gap: 0.75rem;
}

h3 {
  margin: 0 0 0.5rem 0;
}
h4 {
  margin: 0.5rem 0 0.25rem 0;
  font-size: 0.95rem;
  color: #374151;
}

.form {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.4rem;
}
.form.compact {
  gap: 0.3rem;
}
.form li {
  display: block;
}
label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.15rem;
  color: #374151;
}
input,
select,
button {
  font: inherit;
  padding: 0.45rem 0.55rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  outline: none;
}
input:focus,
select:focus {
  border-color: #2c7be5;
  box-shadow: 0 0 0 2px rgba(44, 123, 229, 0.15);
}

.split {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
}
.split-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.split-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}
.split-1 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.btnrow {
  display: flex;
  gap: 0.5rem;
}
button {
  cursor: pointer;
  background: #f3f4f6;
}
button:hover {
  background: #e5e7eb;
}
button.active {
  background: #2c7be5;
  color: white;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apply button {
  width: 100%;
}
</style>
