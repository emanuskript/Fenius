<template>
  <div class="ruling-page">
    <!-- Header -->
    <div class="header-bar">eManuskript Produkt</div>
    <div class="title">FENIUS</div>

    <!-- Centered compact metadata summary -->
    <div class="meta-summary">
      <div class="meta-main">
        <div class="meta-row">
          <span class="meta-item"><strong>City/Repository:</strong> {{ cityRepository || "—" }}</span>
          <span class="meta-item"><strong>Shelfmark:</strong> {{ shelfmark || "—" }}</span>
          <span class="meta-item"><strong>Siglum:</strong> {{ siglum || "—" }}</span>
          <span class="meta-item"><strong>Folio:</strong> {{ folio || "—" }}</span>
          <span class="meta-item" v-if="quire"><strong>Quire:</strong> {{ quire }}</span>
        </div>
        <div class="meta-row meta-row-secondary">
          <span>{{ widthCm }} × {{ heightCm }} cm</span>
          <span>• {{ tool }}</span>
          <span>• {{ directionLabel }}</span>
        </div>
      </div>
      <div class="meta-right">
        <span class="mode-pill">Mode: {{ modeLabel }}</span>
      </div>
    </div>

    <!-- Main layout -->
    <div class="ruling-layout">
      <!-- LEFT SIDEBAR: basic tools -->
      <aside class="side side-left">
        <!-- Mode -->
        <section class="panel">
          <h3>
            Mode
            <span class="help-icon" title="Choose your interaction mode">
              <span class="tooltip">Draw: Add lines/prickings by clicking rulers or using forms. Erase: Click features to delete them. Select: Click features to view/edit properties.</span>
            </span>
          </h3>
          <div class="mode-buttons">
            <button :class="{ active: mode === 'draw' }" @click="setMode('draw')">Draw</button>
            <button :class="{ active: mode === 'erase' }" @click="setMode('erase')">Erase</button>
            <button :class="{ active: mode === 'select' }" @click="setMode('select')">Select</button>
          </div>
          <div class="btn-row">
            <button @click="undo" :disabled="!canUndo">Undo</button>
            <button @click="redo" :disabled="!canRedo">Redo</button>
          </div>
          <div class="btn-row">
            <button @click="clearAll" class="btn-danger">Clear All</button>
          </div>
          <p class="hint">
            Click on rulers to add lines, inside the page to add prickings.
          </p>
        </section>

        <!-- Lines -->
        <section class="panel">
          <h3>
            Lines
            <span class="help-icon" title="Draw ruling lines on the page">
              <span class="tooltip">Draw horizontal or vertical ruling lines by entering coordinates or clicking on the rulers.</span>
            </span>
          </h3>
          <h4>
            Single horizontal line
            <span class="help-icon" title="Draw a single horizontal line">
              <span class="tooltip">Enter start x, end x, and y coordinate. The line will be drawn horizontally at the specified y value.</span>
            </span>
          </h4>
          <div class="field-row three">
            <div>
              <label class="field-label">start x (cm)</label>
              <input type="number" step="0.1" v-model.number="start_x" class="number-input" />
            </div>
            <div>
              <label class="field-label">end x (cm)</label>
              <input type="number" step="0.1" v-model.number="end_x" class="number-input" />
            </div>
            <div>
              <label class="field-label">y (cm)</label>
              <input type="number" step="0.1" v-model.number="start_y" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addSingleLine">Add line</button>

          <h4>
            Multiple horizontals
            <span class="help-icon" title="Draw multiple evenly-spaced horizontal lines">
              <span class="tooltip">Create a series of evenly-spaced horizontal lines. Enter start/end x coordinates, number of lines (#), and the y-range they should span.</span>
            </span>
          </h4>
          <div class="field-row three">
            <div>
              <label class="field-label">start x</label>
              <input type="number" step="0.1" v-model.number="start_x2" class="number-input" />
            </div>
            <div>
              <label class="field-label">end x</label>
              <input type="number" step="0.1" v-model.number="end_x2" class="number-input" />
            </div>
            <div>
              <label class="field-label">#</label>
              <input type="number" min="1" step="1" v-model.number="number" class="number-input" />
            </div>
          </div>
          <div class="field-row two">
            <div>
              <label class="field-label">start y</label>
              <input type="number" step="0.1" v-model.number="start_y2" class="number-input" />
            </div>
            <div>
              <label class="field-label">end y</label>
              <input type="number" step="0.1" v-model.number="end_y2" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addMultipleLines">Add series</button>
        </section>

        <!-- Circles -->
        <section class="panel">
          <h3>
            Circles/Ovals
            <span class="help-icon" title="Mark compass impressions">
              <span class="tooltip">Draw circles or ovals to mark compass impressions. Equal radii create a circle, different radii create an oval.</span>
            </span>
          </h3>
          <h4>
            Single circle
            <span class="help-icon" title="Draw a circle or oval">
              <span class="tooltip">Enter center position (x, y) and radii. Use equal rx and ry for a perfect circle, or different values for an oval.</span>
            </span>
          </h4>
          <div class="field-row two">
            <div>
              <label class="field-label">center x (cm)</label>
              <input type="number" step="0.1" v-model.number="circle_x" class="number-input" />
            </div>
            <div>
              <label class="field-label">center y (cm)</label>
              <input type="number" step="0.1" v-model.number="circle_y" class="number-input" />
            </div>
          </div>
          <div class="field-row two">
            <div>
              <label class="field-label">radius x (cm)</label>
              <input type="number" step="0.1" v-model.number="circle_rx" class="number-input" />
            </div>
            <div>
              <label class="field-label">radius y (cm)</label>
              <input type="number" step="0.1" v-model.number="circle_ry" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addSingleCircle">Add circle</button>
          <p class="hint">Equal radii = circle, different = oval</p>
        </section>

        <!-- Prickings -->
        <section class="panel">
          <h3>
            Prickings
            <span class="help-icon" title="Mark pricking holes">
              <span class="tooltip">Add pricking marks by entering coordinates or clicking inside the page area in Draw mode.</span>
            </span>
          </h3>
          <label class="field-label">Pricking type</label>
          <select v-model="prickingType" class="field-input">
            <option value="pierced">Pierced</option>
            <option value="slit">Slit</option>
            <option value="other">Other</option>
          </select>
          <h4>
            Single pricking
            <span class="help-icon" title="Add a single pricking mark">
              <span class="tooltip">Enter x and y coordinates to place a single pricking mark.</span>
            </span>
          </h4>
          <div class="field-row two">
            <div>
              <label class="field-label">x (cm)</label>
              <input type="number" step="0.1" v-model.number="hor" class="number-input" />
            </div>
            <div>
              <label class="field-label">y (cm)</label>
              <input type="number" step="0.1" v-model.number="ver" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addSinglePricking">Add pricking</button>

          <h4>
            Vertical group
            <span class="help-icon" title="Add multiple prickings in a vertical line">
              <span class="tooltip">Create a series of evenly-spaced prickings along a vertical line. Enter x position, number of prickings (#), and the y-range.</span>
            </span>
          </h4>
          <div class="field-row three">
            <div>
              <label class="field-label">x (cm)</label>
              <input type="number" step="0.1" v-model.number="hor2" class="number-input" />
            </div>
            <div>
              <label class="field-label">#</label>
              <input type="number" min="1" step="1" v-model.number="number2" class="number-input" />
            </div>
          </div>
          <div class="field-row two">
            <div>
              <label class="field-label">start y (cm)</label>
              <input type="number" step="0.1" v-model.number="start_y3" class="number-input" />
            </div>
            <div>
              <label class="field-label">end y (cm)</label>
              <input type="number" step="0.1" v-model.number="end_y3" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addMultiplePrickings">Add group</button>
        </section>
      </aside>

      <!-- CENTER: canvas -->
      <main class="center">
        <div class="stage-header">
          <div class="inline-group">
            <label class="inline">
              <span>Zoom</span>
              <select v-model.number="zoom" @change="redrawAll">
                <option :value="0.75">75%</option>
                <option :value="1">100%</option>
                <option :value="1.5">150%</option>
                <option :value="2">200%</option>
              </select>
            </label>
            <label class="inline">
              <input type="checkbox" v-model="snapEnabled" @change="redrawAll" />
              <span>Snap</span>
            </label>
            <label class="inline" :class="{ disabled: !snapEnabled }">
              <span>step</span>
              <input
                type="number"
                min="0.05"
                step="0.05"
                v-model.number="snapStepCm"
                :disabled="!snapEnabled"
                @change="redrawAll"
              />
              <span>cm</span>
            </label>
            <label class="inline">
              <input type="checkbox" v-model="showIntersectionMeasurements" @change="redrawAll" />
              <span>Show intersection measurements</span>
            </label>
          </div>
          <div class="inline-group">
            <label class="inline">
              <input type="checkbox" v-model="showImage" @change="redrawAll" />
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

        <div
          class="canvas-wrap"
          ref="canvasWrap"
          :style="{
            transform: `scale(${zoom})`,
            width: baseWidthPxPlusGutter + 'px',
            height: baseHeightPxPlusGutter + 'px'
          }"
          @mousemove="moveGuides"
          @mouseleave="hideGuides"
          @click="handleCanvasClick"
        >
          <!-- Rulers -->
          <canvas
            ref="rulers"
            :width="baseWidthPxPlusGutter"
            :height="baseHeightPxPlusGutter"
            class="layer layer-rulers"
          ></canvas>

          <!-- Background image -->
          <canvas
            ref="bg"
            :width="bgCanvasWidth"
            :height="bgCanvasHeight"
            class="layer layer-image"
            :style="{
              top: '15px',
              left: '15px',
              width: baseWidthPx + 'px',
              height: baseHeightPx + 'px',
              opacity: showImage ? imageOpacity : 0,
              display: showImage ? 'block' : 'none'
            }"
          ></canvas>

          <!-- Drawing layer -->
          <canvas
            ref="draw"
            :width="baseWidthPx"
            :height="baseHeightPx"
            class="layer layer-draw"
            style="top: 15px; left: 15px;"
          ></canvas>

          <!-- Guides -->
          <div ref="hGuide" class="guide-h"></div>
          <div ref="vGuide" class="guide-v"></div>
        </div>

        <!-- Status bar -->
        <footer class="status-bar">
          <div>pos: {{ cursorCm.x.toFixed(2) }} cm, {{ cursorCm.y.toFixed(2) }} cm</div>
          <div>zoom: {{ zoomPercent }}%</div>
          <div>lines: {{ lines.length }}</div>
          <div>prickings: {{ prickings.length }}</div>
          <div>circles: {{ circles.length }}</div>
        </footer>
      </main>

      <!-- RIGHT SIDEBAR: selection, image, notes, export -->
      <aside class="side side-right">
        <!-- Selected feature -->
        <section class="panel">
          <h3>Selected</h3>
          <div v-if="selectedKind === 'line' && selectedLine">
            <label class="field-label">Coordinates (cm)</label>
            <div class="field-row two">
              <div>
                <label class="field-label-small">x1</label>
                <input 
                  type="number" 
                  step="0.1" 
                  :value="selectedLine.x1"
                  @input="updateSelectedLineCoord('x1', $event.target.value)"
                  class="number-input"
                />
              </div>
              <div>
                <label class="field-label-small">y1</label>
                <input 
                  type="number" 
                  step="0.1" 
                  :value="selectedLine.y1"
                  @input="updateSelectedLineCoord('y1', $event.target.value)"
                  class="number-input"
                />
              </div>
            </div>
            <div class="field-row two">
              <div>
                <label class="field-label-small">x2</label>
                <input 
                  type="number" 
                  step="0.1" 
                  :value="selectedLine.x2"
                  @input="updateSelectedLineCoord('x2', $event.target.value)"
                  class="number-input"
                />
              </div>
              <div>
                <label class="field-label-small">y2</label>
                <input 
                  type="number" 
                  step="0.1" 
                  :value="selectedLine.y2"
                  @input="updateSelectedLineCoord('y2', $event.target.value)"
                  class="number-input"
                />
              </div>
            </div>

            <label class="field-label">Quick adjust</label>
            <div class="adjust-buttons">
              <button class="adjust-btn" @click="shortenLineLeft">← Shorten</button>
              <button class="adjust-btn" @click="shortenLineRight">Shorten →</button>
              <button class="adjust-btn" @click="shortenLineTop">↑ Shorten</button>
              <button class="adjust-btn" @click="shortenLineBottom">Shorten ↓</button>
            </div>
            <div class="adjust-buttons">
              <button class="adjust-btn" @click="extendLineLeft">← Extend</button>
              <button class="adjust-btn" @click="extendLineRight">Extend →</button>
              <button class="adjust-btn" @click="extendLineTop">↑ Extend</button>
              <button class="adjust-btn" @click="extendLineBottom">Extend ↓</button>
            </div>
            <p class="hint">Each click adjusts by {{ snapStepCm }} cm</p>

            <label class="field-label">Type</label>
            <select
              class="field-input"
              :value="selectedLine.role"
              @change="updateSelectedLineRole($event.target.value)"
            >
              <option v-for="opt in lineRoleOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <label class="field-label">Custom Color</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="selectedLine.customColor || getLineColor(selectedLine)"
                @input="updateSelectedLineColor($event.target.value)"
                class="color-input"
              />
              <button
                v-if="selectedLine.customColor"
                @click="clearSelectedLineColor"
                class="clear-color-btn"
              >
                Reset
              </button>
            </div>

            <label class="field-inline">
              <input
                type="checkbox"
                :checked="selectedLine.hypothetical"
                @change="updateSelectedLineHypothetical($event.target.checked)"
              />
              hypothetical
            </label>

            <label class="field-label">Note</label>
            <textarea
              class="field-textarea"
              :value="selectedLine.note"
              @input="updateSelectedLineNote($event.target.value)"
            ></textarea>
          </div>

          <div v-else-if="selectedKind === 'pricking' && selectedPricking">
            <label class="field-label">Position (cm)</label>
            <div class="field-row two">
              <div>
                <label class="field-label-small">x</label>
                <input 
                  type="number" 
                  step="0.1" 
                  :value="selectedPricking.x"
                  @input="updateSelectedPrickingCoord('x', $event.target.value)"
                  class="number-input"
                />
              </div>
              <div>
                <label class="field-label-small">y</label>
                <input 
                  type="number" 
                  step="0.1" 
                  :value="selectedPricking.y"
                  @input="updateSelectedPrickingCoord('y', $event.target.value)"
                  class="number-input"
                />
              </div>
            </div>

            <label class="field-label">Type</label>
            <select
              class="field-input"
              :value="selectedPricking.role"
              @change="updateSelectedPrickingRole($event.target.value)"
            >
              <option v-for="opt in prickingRoleOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <label class="field-label">Pricking Type</label>
            <select
              class="field-input"
              :value="selectedPricking.prickingType || 'pierced'"
              @change="updateSelectedPrickingType($event.target.value)"
            >
              <option value="pierced">Pierced</option>
              <option value="slit">Slit</option>
              <option value="other">Other</option>
            </select>

            <label class="field-label">Custom Color</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="selectedPricking.customColor || getPrickingColor(selectedPricking)"
                @input="updateSelectedPrickingColor($event.target.value)"
                class="color-input"
              />
              <button
                v-if="selectedPricking.customColor"
                @click="clearSelectedPrickingColor"
                class="clear-color-btn"
              >
                Reset
              </button>
            </div>

            <label class="field-inline">
              <input
                type="checkbox"
                :checked="selectedPricking.hypothetical"
                @change="updateSelectedPrickingHypothetical($event.target.checked)"
              />
              hypothetical
            </label>

            <label class="field-label">Note</label>
            <textarea
              class="field-textarea"
              :value="selectedPricking.note"
              @input="updateSelectedPrickingNote($event.target.value)"
            ></textarea>
          </div>

          <div v-else-if="selectedKind === 'circle' && selectedCircle">
            <label class="field-label">Center (cm)</label>
            <div class="field-row two">
              <span>x: {{ selectedCircle.cx.toFixed(2) }}</span>
              <span>y: {{ selectedCircle.cy.toFixed(2) }}</span>
            </div>

            <label class="field-label">Radius (cm)</label>
            <div class="field-row two">
              <span>rx: {{ selectedCircle.rx.toFixed(2) }}</span>
              <span>ry: {{ selectedCircle.ry.toFixed(2) }}</span>
            </div>

            <label class="field-inline">
              <input
                type="checkbox"
                :checked="selectedCircle.hypothetical"
                @change="updateSelectedCircleHypothetical($event.target.checked)"
              />
              hypothetical
            </label>

            <label class="field-label">Note</label>
            <textarea
              class="field-textarea"
              :value="selectedCircle.note"
              @input="updateSelectedCircleNote($event.target.value)"
            ></textarea>
          </div>

          <div v-else class="empty-selected">
            Click near a line, pricking, or circle in <strong>Select</strong> mode.
          </div>

          <!-- Selection summary / unselect -->
          <div v-if="selectedLine || selectedPricking || selectedCircle" class="selected-summary">
            <div class="selected-summary-top">
              <div class="selected-chip" :style="{ backgroundColor: selectedColor }"></div>
              <div class="selected-text">
                {{ selectedKind === 'line' ? 'Line' : selectedKind === 'pricking' ? 'Pricking' : 'Circle' }}
                <span class="selected-id">{{ selectedIdLabel }}</span>
              </div>
            </div>
            <div class="btn-row small-row">
              <button @click="clearSelection">Unselect</button>
              <button @click="clearSelection">Done</button>
            </div>
          </div>
        </section>

        <!-- Image -->
        <section class="panel">
          <h3>Image</h3>
          <input type="file" accept="image/*" @change="handleImageUpload" class="file-input" />
          <div class="btn-row">
            <button @click="removeBackground" :disabled="!bgImage">Remove</button>
            <button @click="fitToWidth" :disabled="!bgImage">Fit to width</button>
          </div>
          
          <div v-if="bgImage" class="image-controls">
            <h4>Adjust Image</h4>
            <div class="field-row">
              <div>
                <label class="field-label">Scale</label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="3" 
                  step="0.01" 
                  v-model.number="bgScale" 
                  @input="redrawAll"
                  :disabled="bgLocked"
                />
                <span class="range-value">{{ bgScale.toFixed(2) }}</span>
              </div>
            </div>
            <div class="field-row two">
              <div>
                <label class="field-label">Offset X</label>
                <input 
                  type="number" 
                  step="1" 
                  v-model.number="bgOffsetX" 
                  @input="redrawAll"
                  class="number-input"
                  :disabled="bgLocked"
                />
              </div>
              <div>
                <label class="field-label">Offset Y</label>
                <input 
                  type="number" 
                  step="1" 
                  v-model.number="bgOffsetY" 
                  @input="redrawAll"
                  class="number-input"
                  :disabled="bgLocked"
                />
              </div>
            </div>
            <div class="btn-row">
              <button @click="resetImageTransform" :disabled="bgLocked">Reset</button>
              <button @click="bgLocked = !bgLocked" :class="{ active: bgLocked }">
                {{ bgLocked ? 'Unlock' : 'Lock' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Notes -->
        <section class="panel">
          <h3>Notes</h3>
          <textarea
            class="field-textarea"
            v-model="globalNotes"
            placeholder="Optional comments about ruling, damage, corrections…"
          ></textarea>
        </section>

        <!-- Export -->
        <section class="panel">
          <h3>Export</h3>
          <button @click="showExportModal = true" class="export-btn">Export</button>
        </section>
      </aside>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="modal-content" @click.stop>
        <h2>Export Options</h2>
        
        <div class="export-options">
          <label class="field-inline">
            <input type="checkbox" v-model="includeImageInPdf" />
            include image in PDF
          </label>
          <label class="field-inline">
            <input type="checkbox" v-model="includeNotesInPdf" />
            include notes in PDF
          </label>
          <label class="field-inline">
            <input type="checkbox" v-model="includeImageInImage" />
            include image in PNG/TIFF
          </label>
        </div>

        <div class="export-buttons">
          <button @click="exportPdf(); showExportModal = false;" class="export-option-btn">
            <strong>PDF</strong>
            <span>with details & legend</span>
          </button>
          <button @click="exportPng(); showExportModal = false;" class="export-option-btn">
            <strong>PNG</strong>
            <span>image only</span>
          </button>
          <button @click="exportTiff(); showExportModal = false;" class="export-option-btn">
            <strong>TIFF</strong>
            <span>image only</span>
          </button>
          <button @click="exportJson(); showExportModal = false;" class="export-option-btn">
            <strong>JSON</strong>
            <span>data export</span>
          </button>
        </div>

        <button @click="showExportModal = false" class="modal-close-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import jsPDF from "jspdf";

/* -------- Metadata from route -------- */
const route = useRoute();

const cityRepository = ref(route.query.cityRepository || "");
const shelfmark = ref(route.query.shelfmark || "");
const siglum = ref(route.query.siglum || "");
const folio = ref(route.query.folio || "");
const quire = ref(route.query.quire || "");
const widthCm = ref(Number(route.query.widthCm) || 15);
const heightCm = ref(Number(route.query.heightCm) || 20);
const tool = ref(route.query.tool || "dry-point");
const direction = ref(route.query.direction || "none");

/* -------- Constants & helpers -------- */
const PAGE_BASE_WIDTH_CM = 20;
const PX_PER_CM = 37.8;
const SCALE_FACTOR = 0.6; // slightly larger base canvas
const IMAGE_DPI_SCALE = 2; // Higher resolution for image quality
const AUTOSAVE_KEY = "feniusRulingAutosave";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snapVal = (v, step) => Math.round(v / step) * step;

let lineIdCounter = 1;
let prickingIdCounter = 1;
let circleIdCounter = 1;

function makeLine(data) {
  return {
    id: data.id || "L" + lineIdCounter++,
    x1: data.x1,
    y1: data.y1,
    x2: data.x2,
    y2: data.y2,
    role: data.role || "other",
    hypothetical: !!data.hypothetical,
    note: data.note || "",
  };
}

function makePricking(data) {
  return {
    id: data.id || "P" + prickingIdCounter++,
    x: data.x,
    y: data.y,
    role: data.role || "other",
    prickingType: data.prickingType || "pierced",
    hypothetical: !!data.hypothetical,
    note: data.note || "",
  };
}

function makeCircle(data) {
  return {
    id: data.id || "C" + circleIdCounter++,
    cx: data.cx,
    cy: data.cy,
    rx: data.rx,
    ry: data.ry,
    hypothetical: !!data.hypothetical,
    note: data.note || "",
  };
}

/* Color helpers for screen + PDF */
function getLineColor(line) {
  if (line.customColor) return line.customColor;
  if (line.hypothetical) return "#808080"; // grey for reconstructed
  switch (line.role) {
    case "text-horizontal":
      return "#0088ff"; // strong blue
    case "text-vertical":
      return "#00d0ff"; // cyan
    case "bounding":
      return "#ff8800"; // orange
    case "margin":
      return "#e645ff"; // magenta
    case "column":
      return "#00d0b8"; // teal
    default:
      return "#000000"; // black
  }
}

function getPrickingColor(pricking) {
  if (pricking.customColor) return pricking.customColor;
  if (pricking.hypothetical) return "#808080";
  // Different color for "other" type prickings
  if (pricking.prickingType === "other") return "#ffa500"; // orange for "other"
  switch (pricking.role) {
    case "margin":
      return "#e645ff"; // magenta
    case "column":
      return "#00d0b8"; // teal
    default:
      return "#000000";
  }
}

/* -------- State -------- */
const zoom = ref(1);
const zoomPercent = computed(() => Math.round(zoom.value * 100));

const snapEnabled = ref(true);
const snapStepCm = ref(0.1);
const showIntersectionMeasurements = ref(false);
const showImage = ref(false);
const imageOpacity = ref(0.6);
const bgImage = ref(null);
const bgFitMode = ref("width");
const bgScale = ref(1.0);
const bgOffsetX = ref(0);
const bgOffsetY = ref(0);
const bgLocked = ref(false);

const mode = ref("draw"); // draw | erase | select
const modeLabel = computed(() => {
  if (mode.value === "erase") return "Erase";
  if (mode.value === "select") return "Select";
  return "Draw";
});

const directionLabel = computed(() => {
  if (direction.value === ">") return "> applied from above";
  if (direction.value === "<") return "< applied from below";
  return direction.value;
});

const cursorCm = ref({ x: 0, y: 0 });

const lines = ref([]);
const prickings = ref([]);
const circles = ref([]);

const selectedFeature = ref({ kind: null, id: null });
const selectedKind = computed(() => selectedFeature.value.kind);
const selectedLine = computed(() => {
  if (selectedFeature.value.kind !== "line") return null;
  return lines.value.find((l) => l.id === selectedFeature.value.id) || null;
});
const selectedPricking = computed(() => {
  if (selectedFeature.value.kind !== "pricking") return null;
  return prickings.value.find((p) => p.id === selectedFeature.value.id) || null;
});
const selectedCircle = computed(() => {
  if (selectedFeature.value.kind !== "circle") return null;
  return circles.value.find((c) => c.id === selectedFeature.value.id) || null;
});

const selectedColor = computed(() => {
  if (selectedLine.value) return getLineColor(selectedLine.value);
  if (selectedPricking.value) return getPrickingColor(selectedPricking.value);
  if (selectedCircle.value) return "#ff0088"; // pink for circles
  return "#4b5563";
});
const selectedIdLabel = computed(() => {
  if (selectedLine.value) return selectedLine.value.id;
  if (selectedPricking.value) return selectedPricking.value.id;
  if (selectedCircle.value) return selectedCircle.value.id;
  return "—";
});

const lineRoleOptions = [
  { value: "text-horizontal", label: "Text line" },
  { value: "bounding", label: "Bounding line" },
  { value: "margin", label: "Margin guideline" },
  { value: "column", label: "Column boundary" },
  { value: "other", label: "Other" },
];

const prickingRoleOptions = [
  { value: "margin", label: "Margin pricking" },
  { value: "column", label: "Column pricking" },
  { value: "other", label: "Other" },
];

const globalNotes = ref("");

/* Manual forms */
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

/* Pricking type */
const prickingType = ref("pierced");

/* Circle form fields */
const circle_x = ref(null);
const circle_y = ref(null);
const circle_rx = ref(null);
const circle_ry = ref(null);

/* Ghost previews for forms */
const ghostSingleLine = ref(null);
const ghostSingleCircle = ref(null);
const ghostMultiLines = ref([]);
const ghostSinglePricking = ref(null);
const ghostMultiPrickings = ref([]);

/* Undo / redo */
const undoStack = ref([]);
const redoStack = ref([]);
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

/* Export options */
const includeImageInPdf = ref(true);
const includeNotesInPdf = ref(true);
const includeImageInImage = ref(true);
const showExportModal = ref(false);

/* Canvas refs / geometry */
const canvasWrap = ref(null);
const rulers = ref(null);
const bg = ref(null);
const draw = ref(null);
const hGuide = ref(null);
const vGuide = ref(null);

const baseWidthPx = computed(() => Math.round(PAGE_BASE_WIDTH_CM * PX_PER_CM * SCALE_FACTOR));
const baseHeightPx = computed(() =>
  Math.round(baseWidthPx.value * (heightCm.value / widthCm.value))
);
const baseWidthPxPlusGutter = computed(() => baseWidthPx.value + 15);
const baseHeightPxPlusGutter = computed(() => baseHeightPx.value + 15);

// High-res dimensions for background image canvas
const bgCanvasWidth = computed(() => baseWidthPx.value * IMAGE_DPI_SCALE);
const bgCanvasHeight = computed(() => baseHeightPx.value * IMAGE_DPI_SCALE);

const cmToPxX = (x) => (x / widthCm.value) * baseWidthPx.value;
const cmToPxY = (y) => (y / heightCm.value) * baseHeightPx.value;
const pxToCmX = (px) => (px / baseWidthPx.value) * widthCm.value;
const pxToCmY = (px) => (px / baseHeightPx.value) * heightCm.value;

/* -------- Drawing -------- */
function drawRulers() {
  const c = rulers.value;
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  // dark background behind rulers + page
  ctx.fillStyle = "#0b1724";
  ctx.fillRect(0, 0, c.width, c.height);

  // page border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(15, 15, baseWidthPx.value, baseHeightPx.value);
  ctx.stroke();

  ctx.font = "10px Arial";
  ctx.fillStyle = "#ffffff";

  const stepPx = Math.round(PX_PER_CM * SCALE_FACTOR);
  const fiveStepPx = stepPx * 5;

  // top ruler with 5cm markers
  ctx.beginPath();
  // Draw 1cm ticks
  for (let cm = 0; cm <= widthCm.value; cm += 1) {
    const xPos = 15 + cmToPxX(cm);
    ctx.moveTo(xPos, 7);
    ctx.lineTo(xPos, 14);
  }
  ctx.stroke();

  // Draw 5cm ticks and labels
  ctx.beginPath();
  for (let cm = 0; cm <= widthCm.value; cm += 5) {
    const xPos = 15 + cmToPxX(cm);
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, 14);
    ctx.fillText(String(cm), xPos + 2, 10);
  }
  ctx.stroke();

  // left ruler with 5cm markers
  ctx.beginPath();
  // Draw 1cm ticks
  for (let cm = 0; cm <= heightCm.value; cm += 1) {
    const yPos = 15 + cmToPxY(cm);
    ctx.moveTo(7, yPos);
    ctx.lineTo(14, yPos);
  }
  ctx.stroke();

  // Draw 5cm ticks and labels
  ctx.beginPath();
  for (let cm = 0; cm <= heightCm.value; cm += 5) {
    const yPos = 15 + cmToPxY(cm);
    ctx.moveTo(0, yPos);
    ctx.lineTo(14, yPos);
    ctx.fillText(String(cm), 2, yPos + 10);
  }
  ctx.stroke();
}

function drawBackground() {
  const c = bg.value;
  const ctx = c?.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  if (!bgImage.value || !showImage.value) return;

  // High-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Scale for high-DPI canvas
  const dpiScale = IMAGE_DPI_SCALE;
  
  let baseScale;
  if (bgFitMode.value === "width") {
    baseScale = (c.width / dpiScale) / bgImage.value.width;
  } else {
    baseScale = Math.min((c.width / dpiScale) / bgImage.value.width, (c.height / dpiScale) / bgImage.value.height);
  }

  const finalScale = baseScale * bgScale.value * dpiScale;
  const w = Math.round(bgImage.value.width * finalScale);
  const h = Math.round(bgImage.value.height * finalScale);
  const x = bgOffsetX.value * dpiScale;
  const y = bgOffsetY.value * dpiScale;

  ctx.drawImage(bgImage.value, x, y, w, h);
}

function drawShapes() {
  const c = draw.value;
  const ctx = c?.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);

  // ----- Lines -----
  ctx.lineWidth = 1;
  for (const L of lines.value) {
    const isSelected =
      selectedFeature.value.kind === "line" &&
      selectedFeature.value.id === L.id;

    const baseColor = getLineColor(L);

    ctx.save();
    if (L.hypothetical) {
      ctx.setLineDash([4, 3]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = isSelected ? "#00ffd5" : baseColor;
    ctx.beginPath();
    ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
    ctx.stroke();
    ctx.restore();
  }

  // ----- Prickings -----
  for (const P of prickings.value) {
    const isSelected =
      selectedFeature.value.kind === "pricking" &&
      selectedFeature.value.id === P.id;

    const baseColor = getPrickingColor(P);
    const px = cmToPxX(P.x);
    const py = cmToPxY(P.y);

    const color = isSelected ? "#00ffd5" : baseColor;
    
    // Draw different shapes based on pricking type
    if (P.prickingType === "slit") {
      // Slit: vertical line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px, py + 4);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else if (P.prickingType === "pierced" || !P.prickingType) {
      // Pierced: circle (default)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Other: rectangle
      ctx.fillStyle = color;
      ctx.fillRect(px - 3, py - 1, 6, 2);
    }
  }

  // ----- Circles -----
  ctx.lineWidth = 1.5;
  for (const C of circles.value) {
    const isSelected =
      selectedFeature.value.kind === "circle" &&
      selectedFeature.value.id === C.id;

    ctx.save();
    if (C.hypothetical) {
      ctx.setLineDash([4, 3]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = isSelected ? "#00ffd5" : "#ff0088"; // pink
    ctx.beginPath();
    ctx.ellipse(
      cmToPxX(C.cx),
      cmToPxY(C.cy),
      cmToPxX(C.rx),
      cmToPxY(C.ry),
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke();
    ctx.restore();
  }

  // ----- Ghost previews -----
  // ghost lines
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "#9ca3af";
  if (ghostSingleLine.value) {
    const L = ghostSingleLine.value;
    ctx.beginPath();
    ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
    ctx.stroke();
  }
  for (const L of ghostMultiLines.value) {
    ctx.beginPath();
    ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
    ctx.stroke();
  }
  ctx.restore();

  // ghost prickings
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#9ca3af";
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 2;
  if (ghostSinglePricking.value) {
    const P = ghostSinglePricking.value;
    const px = cmToPxX(P.x);
    const py = cmToPxY(P.y);
    if (prickingType.value === 'slit') {
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px, py + 4);
      ctx.stroke();
    } else if (prickingType.value === 'pierced') {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(px - 3, py - 1, 6, 2);
    }
  }
  for (const P of ghostMultiPrickings.value) {
    const px = cmToPxX(P.x);
    const py = cmToPxY(P.y);
    if (prickingType.value === 'slit') {
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px, py + 4);
      ctx.stroke();
    } else if (prickingType.value === 'pierced') {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(px - 3, py - 1, 6, 2);
    }
  }
  ctx.restore();

  // ghost circles
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1.5;
  if (ghostSingleCircle.value) {
    const C = ghostSingleCircle.value;
    ctx.beginPath();
    ctx.ellipse(
      cmToPxX(C.cx),
      cmToPxY(C.cy),
      cmToPxX(C.rx),
      cmToPxY(C.ry),
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  }
  ctx.restore();

  // ----- Intersection Measurements -----
  if (showIntersectionMeasurements.value) {
    const intersections = getIntersections();
    ctx.save();
    ctx.font = "12px Arial";
    ctx.lineWidth = 3;
    
    intersections.forEach(point => {
      const px = cmToPxX(point.x);
      const py = cmToPxY(point.y);
      
      // Draw a small circle at intersection
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff0000";
      ctx.fill();
      
      // Draw measurement text with white outline
      const text = `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(text, px + 6, py - 6);
      ctx.fillStyle = "#ff0000";
      ctx.fillText(text, px + 6, py - 6);
    });
    ctx.restore();
  }
}

function redrawAll() {
  drawRulers();
  drawBackground();
  drawShapes();
}

/* -------- Undo / redo -------- */
function pushUndoSnapshot() {
  undoStack.value.push(JSON.stringify({ lines: lines.value, prickings: prickings.value, circles: circles.value }));
  redoStack.value = [];
}

function undo() {
  if (!undoStack.value.length) return;
  const prev = undoStack.value.pop();
  redoStack.value.push(JSON.stringify({ lines: lines.value, prickings: prickings.value, circles: circles.value }));
  const state = JSON.parse(prev);
  lines.value = state.lines || [];
  prickings.value = state.prickings || [];
  circles.value = state.circles || [];
  selectedFeature.value = { kind: null, id: null };
  redrawAll();
}

function redo() {
  if (!redoStack.value.length) return;
  const next = redoStack.value.pop();
  undoStack.value.push(JSON.stringify({ lines: lines.value, prickings: prickings.value, circles: circles.value }));
  const state = JSON.parse(next);
  lines.value = state.lines || [];
  prickings.value = state.prickings || [];
  circles.value = state.circles || [];
  selectedFeature.value = { kind: null, id: null };
  redrawAll();
}

function clearAll() {
  if (!confirm('Clear all lines and prickings? This cannot be undone.')) return;
  lines.value = [];
  prickings.value = [];
  circles.value = [];
  selectedFeature.value = { kind: null, id: null };
  undoStack.value = [];
  redoStack.value = [];
  globalNotes.value = "";
  localStorage.removeItem(AUTOSAVE_KEY);
  redrawAll();
}

/* -------- Modes & mouse helpers -------- */
function setMode(m) {
  mode.value = m;
}

function clearSelection() {
  selectedFeature.value = { kind: null, id: null };
  redrawAll();
}

function toLocalCoords(e) {
  const wrap = canvasWrap.value;
  if (!wrap) return null;
  const rect = wrap.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;
  return { x, y };
}

function insidePage(x, y) {
  return x >= 15 && y >= 15 && x <= 15 + baseWidthPx.value && y <= 15 + baseHeightPx.value;
}

function moveGuides(e) {
  const pos = toLocalCoords(e);
  if (!pos) return;
  const x = pos.x;
  const y = pos.y;

  const hEl = hGuide.value;
  const vEl = vGuide.value;
  if (!hEl || !vEl) return;

  if (y > 15 && y < 15 + baseHeightPx.value) {
    hEl.style.display = "block";
    hEl.style.width = baseWidthPx.value + "px";
    hEl.style.top = y + "px";
    hEl.style.left = "15px";
  } else {
    hEl.style.display = "none";
  }

  if (x > 15 && x < 15 + baseWidthPx.value) {
    vEl.style.display = "block";
    vEl.style.height = baseHeightPx.value + "px";
    vEl.style.left = x + "px";
    vEl.style.top = "15px";
  } else {
    vEl.style.display = "none";
  }

  const xPagePx = clamp(x - 15, 0, baseWidthPx.value);
  const yPagePx = clamp(y - 15, 0, baseHeightPx.value);
  cursorCm.value = { x: pxToCmX(xPagePx), y: pxToCmY(yPagePx) };
}

function hideGuides() {
  if (hGuide.value) hGuide.value.style.display = "none";
  if (vGuide.value) vGuide.value.style.display = "none";
}

/* Snap & distance helpers */
function snapPoint(cm) {
  if (!snapEnabled.value) return cm;
  return snapVal(cm, snapStepCm.value);
}

// Calculate intersection point between two line segments
function getLineIntersection(line1, line2) {
  const x1 = line1.x1, y1 = line1.y1, x2 = line1.x2, y2 = line1.y2;
  const x3 = line2.x1, y3 = line2.y1, x4 = line2.x2, y4 = line2.y2;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null; // Lines are parallel
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  return null;
}

// Get all intersection points from lines
function getIntersections() {
  const intersections = [];
  const linesArray = lines.value;
  
  for (let i = 0; i < linesArray.length; i++) {
    for (let j = i + 1; j < linesArray.length; j++) {
      const intersection = getLineIntersection(linesArray[i], linesArray[j]);
      if (intersection) {
        intersections.push(intersection);
      }
    }
  }
  
  return intersections;
}

function pointToSegmentDist(x, y, L) {
  const { x1, y1, x2, y2 } = L;
  const vx = x2 - x1,
    vy = y2 - y1;
  const wx = x - x1,
    wy = y - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(x - x1, y - y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(x - x2, y - y2);
  const b = c1 / c2;
  const px = x1 + b * vx;
  const py = y1 + b * vy;
  return Math.hypot(x - px, y - py);
}

function pointToEllipseDist(x, y, C) {
  // Approximate distance from point to ellipse perimeter
  const dx = x - C.cx;
  const dy = y - C.cy;
  const distFromCenter = Math.hypot(dx, dy);
  
  // Angle from center to point
  const angle = Math.atan2(dy, dx);
  
  // Point on ellipse at this angle
  const ex = C.cx + C.rx * Math.cos(angle);
  const ey = C.cy + C.ry * Math.sin(angle);
  
  // Distance from point to ellipse perimeter
  return Math.abs(distFromCenter - Math.hypot(ex - C.cx, ey - C.cy));
}

/* -------- Canvas click -------- */
function handleCanvasClick(e) {
  const pos = toLocalCoords(e);
  if (!pos) return;
  const x = pos.x;
  const y = pos.y;

  const xPagePx = clamp(x - 15, 0, baseWidthPx.value);
  const yPagePx = clamp(y - 15, 0, baseHeightPx.value);
  const xCm = pxToCmX(xPagePx);
  const yCm = pxToCmY(yPagePx);

  // Draw mode
  if (mode.value === "draw") {
    // top ruler -> vertical line
    if (x > 15 && y > 0 && y < 15) {
      const xLineCm = snapPoint(pxToCmX(x - 15));
      pushUndoSnapshot();
      lines.value = [
        ...lines.value,
        makeLine({ x1: xLineCm, y1: 0, x2: xLineCm, y2: heightCm.value, role: "text-vertical" }),
      ];
      redrawAll();
      return;
    }

    // left ruler -> horizontal line
    if (y > 15 && x > 0 && x < 15) {
      const yLineCm = snapPoint(pxToCmY(y - 15));
      pushUndoSnapshot();
      lines.value = [
        ...lines.value,
        makeLine({ x1: 0, y1: yLineCm, x2: widthCm.value, y2: yLineCm, role: "text-horizontal" }),
      ];
      redrawAll();
      return;
    }

    // inside page -> pricking
    if (insidePage(x, y)) {
      pushUndoSnapshot();
      prickings.value = [
        ...prickings.value,
        makePricking({ x: snapPoint(xCm), y: snapPoint(yCm), role: "margin", prickingType: prickingType.value }),
      ];
      redrawAll();
      return;
    }
  }

  // Erase mode
  if (mode.value === "erase" && insidePage(x, y)) {
    const threshCm = Math.max(widthCm.value, heightCm.value) * 0.03;
    let removed = false;

    // prickings first
    let bestPr = { idx: -1, dist: threshCm };
    prickings.value.forEach((p, idx) => {
      const d = Math.hypot(p.x - xCm, p.y - yCm);
      if (d < bestPr.dist) bestPr = { idx, dist: d };
    });
    if (bestPr.idx >= 0) {
      pushUndoSnapshot();
      prickings.value.splice(bestPr.idx, 1);
      removed = true;
    }

    // lines
    if (!removed) {
      let bestLn = { idx: -1, dist: threshCm / 2 };
      lines.value.forEach((L, idx) => {
        const d = pointToSegmentDist(xCm, yCm, L);
        if (d < bestLn.dist) bestLn = { idx, dist: d };
      });
      if (bestLn.idx >= 0) {
        pushUndoSnapshot();
        lines.value.splice(bestLn.idx, 1);
        removed = true;
      }
    }

    // circles
    if (!removed) {
      let bestCi = { idx: -1, dist: threshCm / 2 };
      circles.value.forEach((C, idx) => {
        const d = pointToEllipseDist(xCm, yCm, C);
        if (d < bestCi.dist) bestCi = { idx, dist: d };
      });
      if (bestCi.idx >= 0) {
        pushUndoSnapshot();
        circles.value.splice(bestCi.idx, 1);
        removed = true;
      }
    }
    if (removed) redrawAll();
    return;
  }

  // Select mode
  if (mode.value === "select" && insidePage(x, y)) {
    const threshCm = Math.max(widthCm.value, heightCm.value) * 0.03;
    let best = { kind: null, id: null, dist: threshCm };

    for (const p of prickings.value) {
      const d = Math.hypot(p.x - xCm, p.y - yCm);
      if (d < best.dist) best = { kind: "pricking", id: p.id, dist: d };
    }
    for (const L of lines.value) {
      const d = pointToSegmentDist(xCm, yCm, L);
      if (d < best.dist) best = { kind: "line", id: L.id, dist: d };
    }
    for (const C of circles.value) {
      const d = pointToEllipseDist(xCm, yCm, C);
      if (d < best.dist) best = { kind: "circle", id: C.id, dist: d };
    }

    if (best.kind) {
      selectedFeature.value = { kind: best.kind, id: best.id };
    } else {
      selectedFeature.value = { kind: null, id: null };
    }
    redrawAll();
  }
}

/* -------- Manual ruling / pricking -------- */
function addSingleLine() {
  pushUndoSnapshot();
  lines.value = [
    ...lines.value,
    makeLine({
      x1: snapPoint(start_x.value),
      y1: snapPoint(start_y.value),
      x2: snapPoint(end_x.value),
      y2: snapPoint(start_y.value), // Use same y value for horizontal line
      role: "text-horizontal",
    }),
  ];
  ghostSingleLine.value = null;
  redrawAll();
}

function addMultipleLines() {
  const n = Math.max(1, Math.floor(number.value || 1));
  const y0 = start_y2.value;
  const y1 = end_y2.value;
  const step = n === 1 ? 0 : (y1 - y0) / (n - 1);
  const newLines = [];
  for (let i = 0; i < n; i++) {
    const y = snapPoint(y0 + i * step);
    newLines.push(
      makeLine({
        x1: snapPoint(start_x2.value),
        y1: y,
        x2: snapPoint(end_x2.value),
        y2: y,
        role: "text-horizontal",
      })
    );
  }
  pushUndoSnapshot();
  lines.value = [...lines.value, ...newLines];
  ghostMultiLines.value = [];
  redrawAll();
}

function addSinglePricking() {
  pushUndoSnapshot();
  prickings.value = [
    ...prickings.value,
    makePricking({ x: snapPoint(hor.value), y: snapPoint(ver.value), role: "margin", prickingType: prickingType.value }),
  ];
  ghostSinglePricking.value = null;
  redrawAll();
}

function addMultiplePrickings() {
  const n = Math.max(1, Math.floor(number2.value || 1));
  const y0 = start_y3.value;
  const y1 = end_y3.value;
  const step = n === 1 ? 0 : (y1 - y0) / (n - 1);
  const newPr = [];
  for (let i = 0; i < n; i++) {
    const y = snapPoint(y0 + i * step);
    newPr.push(makePricking({ x: snapPoint(hor2.value), y, role: "margin", prickingType: prickingType.value }));
  }
  pushUndoSnapshot();
  prickings.value = [...prickings.value, ...newPr];
  ghostMultiPrickings.value = [];
  redrawAll();
}

function addSingleCircle() {
  pushUndoSnapshot();
  circles.value = [
    ...circles.value,
    makeCircle({
      cx: snapPoint(circle_x.value),
      cy: snapPoint(circle_y.value),
      rx: snapPoint(circle_rx.value),
      ry: snapPoint(circle_ry.value),
    }),
  ];
  ghostSingleCircle.value = null;
  redrawAll();
}

/* -------- Ghost previews (watch form fields) -------- */
watch([start_x, start_y, end_x], () => {
  const x1 = start_x.value;
  const y = start_y.value;
  const x2 = end_x.value;
  if (
    Number.isFinite(x1) &&
    Number.isFinite(y) &&
    Number.isFinite(x2)
  ) {
    ghostSingleLine.value = {
      x1: snapPoint(x1),
      y1: snapPoint(y),
      x2: snapPoint(x2),
      y2: snapPoint(y), // Use same y for both endpoints (horizontal line)
    };
  } else {
    ghostSingleLine.value = null;
  }
  redrawAll();
});

watch([start_x2, end_x2, start_y2, end_y2, number], () => {
  const n = Math.max(1, Math.floor(number.value || 0));
  const y0 = start_y2.value;
  const y1 = end_y2.value;
  if (!Number.isFinite(y0) || !Number.isFinite(y1) || !n) {
    ghostMultiLines.value = [];
    redrawAll();
    return;
  }
  const step = n === 1 ? 0 : (y1 - y0) / (n - 1);
  const arr = [];
  for (let i = 0; i < n; i++) {
    const y = snapPoint(y0 + i * step);
    arr.push({
      x1: snapPoint(start_x2.value),
      y1: y,
      x2: snapPoint(end_x2.value),
      y2: y,
    });
  }
  ghostMultiLines.value = arr;
  redrawAll();
});

watch([hor, ver], () => {
  const x = hor.value;
  const y = ver.value;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    ghostSinglePricking.value = { x: snapPoint(x), y: snapPoint(y) };
  } else {
    ghostSinglePricking.value = null;
  }
  redrawAll();
});

watch([hor2, start_y3, end_y3, number2], () => {
  const n = Math.max(1, Math.floor(number2.value || 0));
  const y0 = start_y3.value;
  const y1 = end_y3.value;
  if (!Number.isFinite(y0) || !Number.isFinite(y1) || !n) {
    ghostMultiPrickings.value = [];
    redrawAll();
    return;
  }
  const step = n === 1 ? 0 : (y1 - y0) / (n - 1);
  const arr = [];
  for (let i = 0; i < n; i++) {
    const y = snapPoint(y0 + i * step);
    arr.push({ x: snapPoint(hor2.value), y });
  }
  ghostMultiPrickings.value = arr;
  redrawAll();
});

watch([circle_x, circle_y, circle_rx, circle_ry], () => {
  const cx = circle_x.value;
  const cy = circle_y.value;
  const rx = circle_rx.value;
  const ry = circle_ry.value;
  if (
    Number.isFinite(cx) &&
    Number.isFinite(cy) &&
    Number.isFinite(rx) && rx > 0 &&
    Number.isFinite(ry) && ry > 0
  ) {
    ghostSingleCircle.value = {
      cx: snapPoint(cx),
      cy: snapPoint(cy),
      rx: snapPoint(rx),
      ry: snapPoint(ry),
    };
  } else {
    ghostSingleCircle.value = null;
  }
  redrawAll();
});

/* -------- Selected feature updates -------- */
function updateSelectedLineCoord(coord, val) {
  const l = selectedLine.value;
  if (l) {
    const num = parseFloat(val);
    if (Number.isFinite(num)) {
      l[coord] = num;
      redrawAll();
    }
  }
}

// Quick adjust functions for lines
function shortenLineLeft() {
  const l = selectedLine.value;
  if (l) {
    l.x1 = Math.min(l.x1 + snapStepCm.value, l.x2);
    redrawAll();
  }
}
function shortenLineRight() {
  const l = selectedLine.value;
  if (l) {
    l.x2 = Math.max(l.x2 - snapStepCm.value, l.x1);
    redrawAll();
  }
}
function shortenLineTop() {
  const l = selectedLine.value;
  if (l) {
    l.y1 = Math.min(l.y1 + snapStepCm.value, l.y2);
    redrawAll();
  }
}
function shortenLineBottom() {
  const l = selectedLine.value;
  if (l) {
    l.y2 = Math.max(l.y2 - snapStepCm.value, l.y1);
    redrawAll();
  }
}
function extendLineLeft() {
  const l = selectedLine.value;
  if (l) {
    l.x1 = Math.max(l.x1 - snapStepCm.value, 0);
    redrawAll();
  }
}
function extendLineRight() {
  const l = selectedLine.value;
  if (l) {
    l.x2 = Math.min(l.x2 + snapStepCm.value, widthCm.value);
    redrawAll();
  }
}
function extendLineTop() {
  const l = selectedLine.value;
  if (l) {
    l.y1 = Math.max(l.y1 - snapStepCm.value, 0);
    redrawAll();
  }
}
function extendLineBottom() {
  const l = selectedLine.value;
  if (l) {
    l.y2 = Math.min(l.y2 + snapStepCm.value, heightCm.value);
    redrawAll();
  }
}

function updateSelectedLineRole(val) {
  const l = selectedLine.value;
  if (l) {
    l.role = val;
    redrawAll();
  }
}
function updateSelectedLineColor(val) {
  const l = selectedLine.value;
  if (l) {
    l.customColor = val;
    redrawAll();
  }
}
function clearSelectedLineColor() {
  const l = selectedLine.value;
  if (l) {
    delete l.customColor;
    redrawAll();
  }
}
function updateSelectedLineHypothetical(val) {
  const l = selectedLine.value;
  if (l) {
    l.hypothetical = val;
    redrawAll();
  }
}
function updateSelectedLineNote(val) {
  const l = selectedLine.value;
  if (l) l.note = val;
}

function updateSelectedPrickingCoord(coord, val) {
  const p = selectedPricking.value;
  if (p) {
    const num = parseFloat(val);
    if (Number.isFinite(num)) {
      p[coord] = num;
      redrawAll();
    }
  }
}
function updateSelectedPrickingRole(val) {
  const p = selectedPricking.value;
  if (p) {
    p.role = val;
    redrawAll();
  }
}
function updateSelectedPrickingType(val) {
  const p = selectedPricking.value;
  if (p) {
    p.prickingType = val;
    redrawAll();
  }
}
function updateSelectedPrickingColor(val) {
  const p = selectedPricking.value;
  if (p) {
    p.customColor = val;
    redrawAll();
  }
}
function clearSelectedPrickingColor() {
  const p = selectedPricking.value;
  if (p) {
    delete p.customColor;
    redrawAll();
  }
}
function updateSelectedPrickingHypothetical(val) {
  const p = selectedPricking.value;
  if (p) {
    p.hypothetical = val;
    redrawAll();
  }
}
function updateSelectedPrickingNote(val) {
  const p = selectedPricking.value;
  if (p) p.note = val;
}

function updateSelectedCircleHypothetical(val) {
  const c = selectedCircle.value;
  if (c) {
    c.hypothetical = val;
    redrawAll();
  }
}
function updateSelectedCircleNote(val) {
  const c = selectedCircle.value;
  if (c) c.note = val;
}

/* -------- Image handling -------- */
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
function removeBackground() {
  bgImage.value = null;
  redrawAll();
}
function fitToWidth() {
  bgFitMode.value = "width";
  bgScale.value = 1.0;
  bgOffsetX.value = 0;
  bgOffsetY.value = 0;
  redrawAll();
}

function resetImageTransform() {
  bgScale.value = 1.0;
  bgOffsetX.value = 0;
  bgOffsetY.value = 0;
  redrawAll();
}

/* -------- Autosave -------- */
function saveAutosave() {
  try {
    const payload = {
      meta: {
        cityRepository: cityRepository.value,
        shelfmark: shelfmark.value,
        siglum: siglum.value,
        folio: folio.value,
        quire: quire.value,
        widthCm: widthCm.value,
        heightCm: heightCm.value,
        tool: tool.value,
        direction: direction.value,
      },
      shapes: {
        lines: lines.value,
        prickings: prickings.value,
        circles: circles.value,
      },
      view: {
        zoom: zoom.value,
        snapEnabled: snapEnabled.value,
        snapStepCm: snapStepCm.value,
      },
      notes: globalNotes.value,
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function restoreAutosave() {
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.meta) {
      cityRepository.value = data.meta.cityRepository ?? cityRepository.value;
      shelfmark.value = data.meta.shelfmark ?? shelfmark.value;
      siglum.value = data.meta.siglum ?? siglum.value;
      folio.value = data.meta.folio ?? folio.value;
      quire.value = data.meta.quire ?? quire.value;
      widthCm.value = data.meta.widthCm ?? widthCm.value;
      heightCm.value = data.meta.heightCm ?? heightCm.value;
      tool.value = data.meta.tool ?? tool.value;
      direction.value = data.meta.direction ?? direction.value;
    }
    if (data.shapes) {
      lines.value = (data.shapes.lines || []).map((L) => makeLine(L));
      prickings.value = (data.shapes.prickings || []).map((P) => makePricking(P));
      circles.value = (data.shapes.circles || []).map((C) => makeCircle(C));
    }
    if (data.view) {
      zoom.value = data.view.zoom ?? zoom.value;
      snapEnabled.value = data.view.snapEnabled ?? snapEnabled.value;
      snapStepCm.value = data.view.snapStepCm ?? snapStepCm.value;
    }
    if (data.notes) {
      globalNotes.value = data.notes;
    }
  } catch {
    // ignore
  }
}

/* -------- Export (with legend, strong colors & feature notes) -------- */
function width_size() {
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

// helper for jsPDF colors
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

// render schema into temp canvas for PDF (thicker, saturated)
function renderSchemaToCanvasForPdf(ctx, includeImage) {
  const w = baseWidthPx.value;
  const h = baseHeightPx.value;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, h);

  if (includeImage && bg.value) {
    ctx.drawImage(bg.value, 0, 0, w, h);
  }

  // Lines (thicker)
  for (const L of lines.value) {
    const color = getLineColor(L);
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = L.hypothetical ? 1 : 2;
    ctx.strokeStyle = color;
    if (L.hypothetical) {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
    ctx.stroke();
    ctx.restore();
  }

  // Prickings (thicker)
  for (const P of prickings.value) {
    const color = getPrickingColor(P);
    const px = cmToPxX(P.x);
    const py = cmToPxY(P.y);
    
    // Draw different shapes based on pricking type
    if (P.prickingType === "slit") {
      // Slit: vertical line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px, py + 4);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else if (P.prickingType === "pierced" || !P.prickingType) {
      // Pierced: circle (default)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Other: rectangle
      ctx.fillStyle = color;
      ctx.fillRect(px - 3, py - 1, 6, 2);
    }
  }

  // Circles (compass impressions)
  ctx.lineWidth = 2;
  for (const C of circles.value) {
    ctx.save();
    ctx.strokeStyle = "#ff0088"; // pink
    if (C.hypothetical) {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.ellipse(
      cmToPxX(C.cx),
      cmToPxY(C.cy),
      cmToPxX(C.rx),
      cmToPxY(C.ry),
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke();
    ctx.restore();
  }

  // Intersection Measurements (if enabled)
  if (showIntersectionMeasurements.value) {
    const intersections = getIntersections();
    ctx.save();
    ctx.font = "14px Arial";
    ctx.lineWidth = 4;
    
    intersections.forEach(point => {
      const px = cmToPxX(point.x);
      const py = cmToPxY(point.y);
      
      // Draw a small circle at intersection
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff0000";
      ctx.fill();
      
      // Draw measurement text with white outline
      const text = `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(text, px + 8, py - 8);
      ctx.fillStyle = "#ff0000";
      ctx.fillText(text, px + 8, py - 8);
    });
    ctx.restore();
  }
}

function exportPdf() {
  const pdf = new jsPDF("p", "cm", "a4");
  let y = 2;

  // ---------- METADATA ----------
  pdf.setFontSize(13);
  pdf.setTextColor(0, 0, 0);
  pdf.text(1, y, `Shelfmark: ${shelfmark.value || ""}`); y += 0.7;
  pdf.text(1, y, `Siglum: ${siglum.value || ""}`); y += 0.7;
  pdf.text(1, y, `Folio: ${folio.value || ""}`); y += 0.7;
  if (quire.value) {
    pdf.text(1, y, `Quire: ${quire.value}`); y += 0.7;
  }
  pdf.text(1, y, `Size: ${widthCm.value} × ${heightCm.value} cm`); y += 0.7;
  pdf.text(1, y, `Ruling tool: ${tool.value}, direction: ${direction.value}`); y += 0.7;
  
  if (showIntersectionMeasurements.value) {
    const intersections = getIntersections();
    pdf.text(1, y, `Line intersections: ${intersections.length}`); y += 0.7;
  }
  
  y += 0.3;

  const pageHeight = 29.7;
  const marginBottom = 1.5;
  const maxY = pageHeight - marginBottom;

  function ensureSpace(needed) {
    if (y + needed > maxY) {
      pdf.addPage();
      y = 2;
    }
  }

  // ---------- GLOBAL NOTES ----------
  if (includeNotesInPdf.value && globalNotes.value.trim()) {
    pdf.setFontSize(12);
    ensureSpace(2);
    pdf.text(1, y, "Notes:");
    y += 0.6;

    const wrapped = pdf.splitTextToSize(globalNotes.value, 17);
    ensureSpace(wrapped.length * 0.5 + 0.5);
    pdf.text(1, y, wrapped);
    y += wrapped.length * 0.5 + 0.7;
  }

  // ---------- FEATURE NOTES ----------
  const featureNotes = [];
  lines.value.forEach((L, idx) => {
    if (L.note && L.note.trim()) {
      featureNotes.push({
        kind: "Line",
        id: L.id || `L${idx + 1}`,
        role: L.role || "other",
        note: L.note.trim(),
      });
    }
  });
  prickings.value.forEach((P, idx) => {
    if (P.note && P.note.trim()) {
      featureNotes.push({
        kind: "Pricking",
        id: P.id || `P${idx + 1}`,
        role: P.role || "other",
        note: P.note.trim(),
      });
    }
  });
  circles.value.forEach((C, idx) => {
    if (C.note && C.note.trim()) {
      featureNotes.push({
        kind: "Circle",
        id: C.id || `C${idx + 1}`,
        role: "compass",
        note: C.note.trim(),
      });
    }
  });

  if (featureNotes.length) {
    pdf.setFontSize(12);
    ensureSpace(1);
    pdf.text(1, y, "Feature notes:");
    y += 0.6;
    pdf.setFontSize(11);

    for (const fn of featureNotes) {
      const prefix = `${fn.kind} ${fn.id} (${fn.role}): `;
      const text = prefix + fn.note;
      const wrapped = pdf.splitTextToSize(text, 17);
      ensureSpace(wrapped.length * 0.5 + 0.6);
      pdf.text(1, y, wrapped);
      y += wrapped.length * 0.5 + 0.4;
    }
  }

  // ---------- COLOR LEGEND ----------
  ensureSpace(4);
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(1, y, "Legend:");
  y += 0.6;

  const legendEntries = [
    { label: "Text lines (horizontal)",        color: "#0088ff" },
    { label: "Bounding lines",                color: "#ff8800" },
    { label: "Margin guidelines / prickings", color: "#e645ff" },
    { label: "Column boundaries / prickings", color: "#00d0b8" },
    { label: "Circles (compass impressions)", color: "#ff0088" },
    { label: "Hypothetical (reconstructed)",  color: "#808080" },
  ];

  // Add pricking type legend entries if those types exist
  const hasPiercedPricking = prickings.value.some(p => !p.prickingType || p.prickingType === 'pierced');
  const hasSlitPricking = prickings.value.some(p => p.prickingType === 'slit');
  const hasOtherPricking = prickings.value.some(p => p.prickingType === 'other');

  if (hasPiercedPricking) {
    legendEntries.push({ label: "Pierced pricking (circle)", color: "#ffa500", shape: 'pierced' });
  }
  if (hasSlitPricking) {
    legendEntries.push({ label: "Slit pricking (vertical line)", color: null, shape: 'slit' });
  }
  if (hasOtherPricking) {
    legendEntries.push({ label: "Other pricking (rectangle)", color: null, shape: 'other' });
  }

  pdf.setLineWidth(0.06);
  for (const entry of legendEntries) {
    ensureSpace(0.8);
    if (entry.shape) {
      // Draw pricking type shape
      pdf.setDrawColor(0, 0, 0);
      if (entry.shape === 'pierced') {
        const { r, g, b } = hexToRgb(entry.color);
        pdf.setFillColor(r, g, b);
        pdf.circle(1.075, y, 0.075, 'F');
      } else if (entry.shape === 'slit') {
        pdf.line(1.075, y - 0.1, 1.075, y + 0.1);
      } else if (entry.shape === 'other') {
        pdf.rect(1, y - 0.05, 0.15, 0.05, 'F');
      }
    } else {
      // Draw colored line
      const { r, g, b } = hexToRgb(entry.color);
      pdf.setDrawColor(r, g, b);
      pdf.line(1, y, 3, y);
    }
    pdf.setTextColor(0, 0, 0);
    pdf.text(3.4, y + 0.1, entry.label);
    y += 0.7;
  }
  pdf.setDrawColor(0, 0, 0);

  // ---------- SECOND PAGE: SCHEMA ----------
  pdf.addPage();
  const temp = document.createElement("canvas");
  temp.width = baseWidthPx.value + 15;
  temp.height = baseHeightPx.value + 15;
  const ctx = temp.getContext("2d");

  // Draw ruler background
  ctx.fillStyle = "#0b1724";
  ctx.fillRect(0, 0, temp.width, temp.height);

  // Draw rulers
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px Arial";
  ctx.lineWidth = 1;

  const stepPx = Math.round(PX_PER_CM * SCALE_FACTOR);

  // Top ruler
  ctx.beginPath();
  // 1cm ticks
  for (let cm = 0; cm <= widthCm.value; cm += 1) {
    const xPos = 15 + cmToPxX(cm);
    ctx.moveTo(xPos, 7);
    ctx.lineTo(xPos, 14);
  }
  ctx.stroke();

  // 5cm ticks and labels
  ctx.beginPath();
  for (let cm = 0; cm <= widthCm.value; cm += 5) {
    const xPos = 15 + cmToPxX(cm);
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, 14);
    ctx.fillText(String(cm), xPos + 2, 10);
  }
  ctx.stroke();

  // Left ruler
  ctx.beginPath();
  // 1cm ticks
  for (let cm = 0; cm <= heightCm.value; cm += 1) {
    const yPos = 15 + cmToPxY(cm);
    ctx.moveTo(7, yPos);
    ctx.lineTo(14, yPos);
  }
  ctx.stroke();

  // 5cm ticks and labels
  ctx.beginPath();
  for (let cm = 0; cm <= heightCm.value; cm += 5) {
    const yPos = 15 + cmToPxY(cm);
    ctx.moveTo(0, yPos);
    ctx.lineTo(14, yPos);
    ctx.fillText(String(cm), 2, yPos + 10);
  }
  ctx.stroke();

  // Save context and translate for content
  ctx.save();
  ctx.translate(15, 15);
  
  renderSchemaToCanvasForPdf(ctx, includeImageInPdf.value);
  
  ctx.restore();

  const img = temp.toDataURL("image/png", 1.0);
  pdf.addImage(img, "PNG", 0.5, 0.5, width_size(), height_size());

  const filename = (shelfmark.value || "ruling-schema") + ".pdf";
  pdf.save(filename);
}

function exportJson() {
  const payload = {
    meta: {
      cityRepository: cityRepository.value,
      shelfmark: shelfmark.value,
      siglum: siglum.value,
      folio: folio.value,
      quire: quire.value,
      widthCm: widthCm.value,
      heightCm: heightCm.value,
      tool: tool.value,
      direction: direction.value,
    },
    shapes: {
      lines: lines.value,
      prickings: prickings.value,
      circles: circles.value,
    },
    notes: globalNotes.value,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (shelfmark.value || "ruling-schema") + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPng() {
  const temp = document.createElement("canvas");
  temp.width = baseWidthPx.value;
  temp.height = baseHeightPx.value;
  const ctx = temp.getContext("2d");

  renderSchemaToCanvasForPdf(ctx, includeImageInImage.value);

  temp.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (shelfmark.value || "ruling-schema") + ".png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png", 1.0);
}

function exportTiff() {
  // Note: Modern browsers don't natively support TIFF export
  // We'll export as high-quality PNG with .tif extension
  // For true TIFF, a library like tiff.js would be needed
  const temp = document.createElement("canvas");
  temp.width = baseWidthPx.value;
  temp.height = baseHeightPx.value;
  const ctx = temp.getContext("2d");

  renderSchemaToCanvasForPdf(ctx, includeImageInImage.value);

  temp.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (shelfmark.value || "ruling-schema") + ".tif";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png", 1.0);
}

/* -------- Keyboard shortcuts -------- */
function onKey(e) {
  // Save (to autosave)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    saveAutosave();
    return;
  }
  // Undo / redo
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
  if (e.key.toLowerCase() === "d") setMode("draw");
  if (e.key.toLowerCase() === "e") setMode("erase");
  if (e.key.toLowerCase() === "s") setMode("select");
}

/* -------- Lifecycle -------- */
onMounted(() => {
  redrawAll();
  window.addEventListener("keydown", onKey);
  setupTooltips();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
});

/* -------- Tooltip positioning -------- */
function setupTooltips() {
  // Position tooltips on hover to ensure they appear correctly with fixed positioning
  document.querySelectorAll('.help-icon').forEach(icon => {
    icon.addEventListener('mouseenter', (e) => {
      const tooltip = icon.querySelector('.tooltip');
      if (!tooltip) return;
      
      const rect = icon.getBoundingClientRect();
      tooltip.style.top = rect.top + rect.height / 2 + 'px';
      tooltip.style.left = rect.right + 'px';
      tooltip.style.transform = 'translateY(-50%)';
    });
  });
}
</script>

<style scoped>
.ruling-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: linear-gradient(to bottom, #3a4b60, #112233);
  color: #ffffff;
  font-size: 14px;
}

.header-bar {
  background: #c0c2c3;
  color: #000;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 18px;
}

.title {
  text-align: center;
  margin: 10px 0 4px;
  font-size: 28px;
  color: #a0a0a0;
}

/* Meta summary directly under FENIUS */
.meta-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 24px 8px;
  font-size: 13px;
  color: #dee5f2;
  gap: 12px;
  position: relative;
}

.meta-main {
  text-align: center;
}

.meta-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-row-secondary {
  margin-top: 2px;
  opacity: 0.9;
}

.meta-item strong {
  font-weight: 600;
  color: #ffffff;
}

.meta-right {
  position: absolute;
  right: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.mode-pill {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* Layout */
.ruling-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 12px;
  padding: 8px 12px 12px;
  box-sizing: border-box;
}

/* Sidebars */
.side {
  padding: 8px;
  background: #1b2738;
  border-radius: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 170px);
}

.side::-webkit-scrollbar {
  width: 6px;
}
.side::-webkit-scrollbar-track {
  background: transparent;
}
.side::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
}

/* Panels */
.panel {
  margin-bottom: 10px;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 10px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.panel h3 {
  font-size: 15px;
  margin: 0 0 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel h4 {
  font-size: 13px;
  margin: 6px 0 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Help tooltips */
.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #60a5fa;
  font-size: 11px;
  font-weight: 700;
  cursor: help;
  position: relative;
  flex-shrink: 0;
  overflow: visible;
}

.help-icon::before {
  content: '?';
}

.help-icon .tooltip {
  visibility: hidden;
  opacity: 0;
  position: fixed;
  background: #1e293b;
  color: #f1f5f9;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 400;
  white-space: normal;
  width: 220px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  z-index: 10000;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  line-height: 1.4;
  margin-left: 8px;
}

.help-icon .tooltip::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: #1e293b;
}

.help-icon:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

/* Text */
.hint {
  font-size: 12px;
  color: #cbd5f5;
  margin-top: 6px;
}

/* Buttons & inputs */
button {
  font: inherit;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #243b5a;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
button:hover:not(:disabled) {
  background: #365778;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
button.active {
  background: #f97316;
  border-color: #f97316;
  color: #111827;
}
button.btn-danger {
  background: #dc2626;
  border-color: #dc2626;
}
button.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}
.small-btn {
  margin-top: 6px;
  font-size: 13px;
  padding-inline: 12px;
}
.btn-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.btn-row.small-row {
  justify-content: flex-start;
}

/* Adjust buttons */
.adjust-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: 6px;
}
.adjust-btn {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
}

.mode-buttons {
  display: flex;
  gap: 6px;
}

/* Fields */
.field-label {
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
  display: block;
}
.field-label-small {
  font-size: 11px;
  font-weight: 500;
  display: block;
  margin-bottom: 2px;
  color: #cbd5e0;
}

.field-input,
.number-input,
.field-textarea,
select {
  width: 100%;
  padding: 6px 8px;
  margin-top: 3px;
  background: #1f2a3a;
  border-radius: 6px;
  border: 1px solid #4b5563;
  color: #ffffff;
  font-size: 13px;
  box-sizing: border-box;
}
.number-input {
  text-align: center;
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 6px;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.field-row {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.field-row.two > * {
  flex: 1;
}
.field-row.three > * {
  flex: 1;
}

/* Center canvas */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stage-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.inline-group {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.inline input[type="number"] {
  width: 4rem;
}
.inline.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.canvas-wrap {
  position: relative;
  transform-origin: 0 0;
  user-select: none;
  background: #0b1724;
  border-radius: 6px;
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
  border-top: 1px solid #00ffd5;
  z-index: 4;
  display: none;
  pointer-events: none;
}
.guide-v {
  position: absolute;
  width: 1px;
  top: 15px;
  height: 0;
  left: 0;
  border-left: 1px solid #00ffd5;
  z-index: 4;
  display: none;
  pointer-events: none;
}

/* Status bar */
.status-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  margin-top: 6px;
  padding: 2px 4px 0;
  color: #d0d6e5;
}

/* Selected empty */
.empty-selected {
  font-size: 13px;
  color: #cbd5f5;
}

/* Selection summary */
.selected-summary {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(148, 163, 184, 0.4);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selected-summary-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-chip {
  width: 26px;
  height: 6px;
  border-radius: 999px;
  background: #9ca3af;
}

.selected-text {
  font-size: 12px;
  color: #e5e7eb;
}

.selected-id {
  font-weight: 600;
  margin-left: 4px;
}

/* File input */
.file-input {
  font-size: 13px;
  margin-bottom: 6px;
}

/* Image controls */
.image-controls {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #2d3748;
}
.image-controls h4 {
  font-size: 13px;
  margin: 0 0 8px 0;
  color: #cbd5e0;
}
.range-value {
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  color: #a0aec0;
  min-width: 40px;
}
input[type="range"] {
  width: 100%;
  max-width: 150px;
}

/* Disabled helper */
.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Export Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-content h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #e5e7eb;
  text-align: center;
}

.export-options {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2d3748;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.export-option-btn {
  padding: 14px 16px;
  background: #2d3748;
  color: #e5e7eb;
  border: 1px solid #4a5568;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.export-option-btn:hover {
  background: #4a5568;
  border-color: #718096;
}

.export-option-btn strong {
  font-size: 16px;
  color: #fff;
}

.export-option-btn span {
  font-size: 12px;
  color: #a0aec0;
}

.modal-close-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #a0aec0;
  border: 1px solid #4a5568;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #2d3748;
  color: #e5e7eb;
}

.export-btn {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #2c5aa0;
}

/* Color Picker */
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.color-input {
  width: 60px;
  height: 35px;
  border: 1px solid #4a5568;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.clear-color-btn {
  padding: 6px 12px;
  background: #2d3748;
  color: #e5e7eb;
  border: 1px solid #4a5568;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-color-btn:hover {
  background: #4a5568;
}
</style>
