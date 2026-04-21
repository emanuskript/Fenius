<template>
  <div class="ruling-page">
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
              <span class="tooltip">Draw: Add lines/prickings by clicking rulers or using forms. Erase: Drag a rectangular eraser over features or erase a coordinate-defined area. Select: Click features to view/edit properties.</span>
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

        <section class="panel">
          <h3>
            Eraser
            <span class="help-icon" title="Erase features with a rectangular tool">
              <span class="tooltip">In Erase mode, drag the rectangular eraser over the page. Lines will be split where the eraser passes through them. You can also erase a fixed area by entering coordinates below.</span>
            </span>
          </h3>
          <div class="field-row two">
            <div>
              <label class="field-label">width (cm)</label>
              <input type="number" min="0.1" step="0.1" v-model.number="eraserWidthCm" class="number-input" />
            </div>
            <div>
              <label class="field-label">height (cm)</label>
              <input type="number" min="0.1" step="0.1" v-model.number="eraserHeightCm" class="number-input" />
            </div>
          </div>

          <h4>Erase area</h4>
          <div class="field-row two">
            <div>
              <label class="field-label">x (cm)</label>
              <input type="number" step="0.1" v-model.number="eraseAreaX" class="number-input" />
            </div>
            <div>
              <label class="field-label">y (cm)</label>
              <input type="number" step="0.1" v-model.number="eraseAreaY" class="number-input" />
            </div>
          </div>
          <div class="field-row two">
            <div>
              <label class="field-label">width (cm)</label>
              <input type="number" min="0.1" step="0.1" v-model.number="eraseAreaWidth" class="number-input" />
            </div>
            <div>
              <label class="field-label">height (cm)</label>
              <input type="number" min="0.1" step="0.1" v-model.number="eraseAreaHeight" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="eraseByCoordinates">Erase area</button>
          <p class="hint">The on-screen eraser is centered on the mouse. The manual area uses the top-left corner and size.</p>
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
          <div class="field-row one">
            <div>
              <label class="field-label">spacing (cm)</label>
              <input type="number" min="0.1" step="0.1" v-model.number="line_spacing2" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addMultipleLines">Add series</button>
          <p class="hint">Set either an end y range or an explicit spacing. Existing lines can still be adjusted individually in Select mode.</p>
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
              <span class="tooltip">Enter center position, radii, and optional rotation. After adding, use Select mode to drag the center or axis handles on the canvas.</span>
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
          <div class="field-row one">
            <div>
              <label class="field-label">rotation (°)</label>
              <input type="number" step="1" v-model.number="circle_angle" class="number-input" />
            </div>
          </div>
          <button class="small-btn" @click="addSingleCircle">Add circle</button>
          <p class="hint">Equal radii = circle, different = oval. Rotate after adding with Select mode.</p>
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
          :class="{ 'erase-mode': mode === 'erase' }"
          ref="canvasWrap"
          :style="{
            transform: `scale(${zoom})`,
            width: baseWidthPxPlusGutter + 'px',
            height: baseHeightPxPlusGutter + 'px'
          }"
          @mousemove="handleCanvasMouseMove"
          @mouseleave="handleCanvasMouseLeave"
          @mousedown="handleCanvasMouseDown"
          @mouseup="handleCanvasMouseUp"
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
          <div
            v-if="eraserCursor.visible"
            class="eraser-cursor"
            :style="eraserCursorStyle"
          ></div>
        </div>

        <!-- Status bar -->
        <footer class="status-bar">
          <div>pos: {{ cursorCm.x.toFixed(2) }} cm, {{ cursorCm.y.toFixed(2) }} cm</div>
          <div>snap: 1 mm</div>
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
                @change="updateSelectedLineColor($event.target.value)"
                class="color-input"
              />
              <input
                type="text"
                :value="selectedLine.customColor || getLineColor(selectedLine)"
                @input="updateSelectedLineColor($event.target.value)"
                class="field-input color-hex-input"
                placeholder="#000000"
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
                @change="updateSelectedPrickingColor($event.target.value)"
                class="color-input"
              />
              <input
                type="text"
                :value="selectedPricking.customColor || getPrickingColor(selectedPricking)"
                @input="updateSelectedPrickingColor($event.target.value)"
                class="field-input color-hex-input"
                placeholder="#000000"
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
              <div>
                <label class="field-label-small">x</label>
                <input
                  type="number"
                  step="0.1"
                  :value="selectedCircle.cx"
                  @input="updateSelectedCircleCoord('cx', $event.target.value)"
                  class="number-input"
                />
              </div>
              <div>
                <label class="field-label-small">y</label>
                <input
                  type="number"
                  step="0.1"
                  :value="selectedCircle.cy"
                  @input="updateSelectedCircleCoord('cy', $event.target.value)"
                  class="number-input"
                />
              </div>
            </div>

            <label class="field-label">Radius (cm)</label>
            <div class="field-row two">
              <div>
                <label class="field-label-small">rx</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  :value="selectedCircle.rx"
                  @input="updateSelectedCircleCoord('rx', $event.target.value)"
                  class="number-input"
                />
              </div>
              <div>
                <label class="field-label-small">ry</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  :value="selectedCircle.ry"
                  @input="updateSelectedCircleCoord('ry', $event.target.value)"
                  class="number-input"
                />
              </div>
            </div>

            <label class="field-label">Rotation</label>
            <div class="field-row one">
              <div>
                <label class="field-label-small">angle (°)</label>
                <input
                  type="number"
                  step="1"
                  :value="selectedCircle.angle || 0"
                  @input="updateSelectedCircleAngle($event.target.value)"
                  class="number-input"
                />
              </div>
            </div>
            <p class="hint">Drag the teal center handle to move, the pink handle to rotate/resize the long axis, and the blue handle to resize the short axis.</p>

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
          <div class="file-input-row">
            <button type="button" class="file-select-btn" @click="openImagePicker">Choose file</button>
            <span class="file-name" :title="selectedImageName || 'No file chosen'">
              {{ selectedImageName || "No file chosen" }}
            </span>
          </div>
          <input
            ref="imageFileInput"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="file-input"
          />
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
          <label class="field-inline">
            <input type="checkbox" v-model="includeRulingGridInExport" />
            include ruling grid/rulers in export
          </label>
          <label class="field-inline">
            <input type="checkbox" v-model="includeIntersectionMeasurementsInExport" />
            include intersection measurements in export
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
const MILLIMETRE_STEP_CM = 0.1;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snapVal = (v, step) => Number((Math.round(v / step) * step).toFixed(4));

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
    customColor: data.customColor || "",
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
    customColor: data.customColor || "",
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
    angle: Number.isFinite(data.angle) ? data.angle : 0,
    customColor: data.customColor || "",
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

const snapStepCm = ref(MILLIMETRE_STEP_CM);
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
  if (direction.value === ">") return "> applied from recto";
  if (direction.value === "<") return "< applied from verso";
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
const line_spacing2 = ref(null);
const number = ref(2);

const hor = ref(0);
const ver = ref(0);
const hor2 = ref(0);
const start_y3 = ref(0);
const end_y3 = ref(0);
const number2 = ref(2);

/* Pricking type */
const prickingType = ref("pierced");

/* Eraser controls */
const eraserWidthCm = ref(0.5);
const eraserHeightCm = ref(0.5);
const eraseAreaX = ref(0);
const eraseAreaY = ref(0);
const eraseAreaWidth = ref(0.5);
const eraseAreaHeight = ref(0.5);

/* Circle form fields */
const circle_x = ref(null);
const circle_y = ref(null);
const circle_rx = ref(null);
const circle_ry = ref(null);
const circle_angle = ref(0);

/* Ghost previews for forms */
const ghostSingleLine = ref(null);
const ghostSingleCircle = ref(null);
const ghostMultiLines = ref([]);
const ghostSinglePricking = ref(null);
const ghostMultiPrickings = ref([]);
const showGhostSingleLine = ref(false);
const showGhostSingleCircle = ref(false);
const showGhostMultiLines = ref(false);
const showGhostSinglePricking = ref(false);
const showGhostMultiPrickings = ref(false);

/* Undo / redo */
const undoStack = ref([]);
const redoStack = ref([]);
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

/* Export options */
const includeImageInPdf = ref(true);
const includeNotesInPdf = ref(true);
const includeImageInImage = ref(true);
const includeRulingGridInExport = ref(true);
const includeIntersectionMeasurementsInExport = ref(true);
const showExportModal = ref(false);

/* Canvas refs / geometry */
const canvasWrap = ref(null);
const rulers = ref(null);
const bg = ref(null);
const draw = ref(null);
const hGuide = ref(null);
const vGuide = ref(null);
const imageFileInput = ref(null);
const selectedImageName = ref("");

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
const CIRCLE_HANDLE_RADIUS_PX = 7;

const activeCircleDrag = ref(null);
const activeEraseDrag = ref({ active: false, hasSnapshot: false });
const suppressCanvasClick = ref(false);
const eraserCursor = ref({ visible: false, leftPx: 15, topPx: 15 });
const eraserCursorStyle = computed(() => ({
  left: `${eraserCursor.value.leftPx}px`,
  top: `${eraserCursor.value.topPx}px`,
  width: `${cmToPxX(Math.max(0.1, eraserWidthCm.value))}px`,
  height: `${cmToPxY(Math.max(0.1, eraserHeightCm.value))}px`,
}));

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

  ctx.font = "9px Arial";
  ctx.textBaseline = "middle";

  const drawTick = (x1, y1, x2, y2, color, width = 1) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const widthMm = Math.round(widthCm.value * 10);
  for (let mm = 0; mm <= widthMm; mm++) {
    const cm = mm / 10;
    const xPos = 15 + cmToPxX(cm);
    if (mm % 10 === 0) {
      drawTick(xPos, 3, xPos, 14, "#ffffff", 1);
    } else if (mm % 5 === 0) {
      drawTick(xPos, 6, xPos, 14, "rgba(255, 255, 255, 0.9)", 1);
    } else {
      drawTick(xPos, 10, xPos, 14, "rgba(255, 255, 255, 0.6)", 0.75);
    }
  }

  ctx.fillStyle = "#ffffff";
  for (let cm = 0; cm <= Math.floor(widthCm.value + 0.0001); cm += 1) {
    const xPos = 15 + cmToPxX(cm);
    ctx.fillText(String(cm), xPos + 2, 7);
  }

  const heightMm = Math.round(heightCm.value * 10);
  for (let mm = 0; mm <= heightMm; mm++) {
    const cm = mm / 10;
    const yPos = 15 + cmToPxY(cm);
    if (mm % 10 === 0) {
      drawTick(3, yPos, 14, yPos, "#ffffff", 1);
    } else if (mm % 5 === 0) {
      drawTick(6, yPos, 14, yPos, "rgba(255, 255, 255, 0.9)", 1);
    } else {
      drawTick(10, yPos, 14, yPos, "rgba(255, 255, 255, 0.6)", 0.75);
    }
  }

  ctx.fillStyle = "#ffffff";
  for (let cm = 0; cm <= Math.floor(heightCm.value + 0.0001); cm += 1) {
    const yPos = 15 + cmToPxY(cm);
    ctx.fillText(String(cm), 2, yPos + 1);
  }
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
      getCircleAngleRad(C),
      0,
      2 * Math.PI
    );
    ctx.stroke();
    ctx.restore();
  }

  if (selectedCircle.value) {
    const handles = getCircleHandlePositionsPx(selectedCircle.value);

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.moveTo(handles.center.x, handles.center.y);
    ctx.lineTo(handles.major.x, handles.major.y);
    ctx.moveTo(handles.center.x, handles.center.y);
    ctx.lineTo(handles.minor.x, handles.minor.y);
    ctx.stroke();
    ctx.restore();

    const drawHandle = (point, color) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(point.x, point.y, CIRCLE_HANDLE_RADIUS_PX, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    drawHandle(handles.center, "#00ffd5");
    drawHandle(handles.major, "#ff0088");
    drawHandle(handles.minor, "#38bdf8");
  }

  // ----- Ghost previews -----
  // ghost lines
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "#9ca3af";
  if (showGhostSingleLine.value && ghostSingleLine.value) {
    const L = ghostSingleLine.value;
    ctx.beginPath();
    ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
    ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
    ctx.stroke();
  }
  if (showGhostMultiLines.value) {
    for (const L of ghostMultiLines.value) {
      ctx.beginPath();
      ctx.moveTo(cmToPxX(L.x1), cmToPxY(L.y1));
      ctx.lineTo(cmToPxX(L.x2), cmToPxY(L.y2));
      ctx.stroke();
    }
  }
  ctx.restore();

  // ghost prickings
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#9ca3af";
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 2;
  if (showGhostSinglePricking.value && ghostSinglePricking.value) {
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
  if (showGhostMultiPrickings.value) {
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
  }
  ctx.restore();

  // ghost circles
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1.5;
  if (showGhostSingleCircle.value && ghostSingleCircle.value) {
    const C = ghostSingleCircle.value;
    ctx.beginPath();
    ctx.ellipse(
      cmToPxX(C.cx),
      cmToPxY(C.cy),
      cmToPxX(C.rx),
      cmToPxY(C.ry),
      getCircleAngleRad(C),
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
      
      // Draw measurement text
      const text = `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
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
  if (!confirm('Clear all lines, prickings, and circles/ovals? This cannot be undone.')) return;
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
  activeEraseDrag.value = { active: false, hasSnapshot: false };
  activeCircleDrag.value = null;
  hideGuides();
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
  const xPagePx = clamp(x - 15, 0, baseWidthPx.value);
  const yPagePx = clamp(y - 15, 0, baseHeightPx.value);
  const rawXcm = pxToCmX(xPagePx);
  const rawYcm = pxToCmY(yPagePx);
  const snappedXcm = snapPoint(rawXcm);
  const snappedYcm = snapPoint(rawYcm);
  const snapDisplay = mode.value === "draw";

  if (mode.value === "erase") {
    hideGuides();
    updateEraserCursor(pos);
    cursorCm.value = { x: rawXcm, y: rawYcm };
    return;
  }

  eraserCursor.value.visible = false;

  const hEl = hGuide.value;
  const vEl = vGuide.value;
  if (!hEl || !vEl) return;

  if (y > 15 && y < 15 + baseHeightPx.value) {
    hEl.style.display = "block";
    hEl.style.width = baseWidthPx.value + "px";
    hEl.style.top = `${15 + cmToPxY(snapDisplay ? snappedYcm : rawYcm)}px`;
    hEl.style.left = "15px";
  } else {
    hEl.style.display = "none";
  }

  if (x > 15 && x < 15 + baseWidthPx.value) {
    vEl.style.display = "block";
    vEl.style.height = baseHeightPx.value + "px";
    vEl.style.left = `${15 + cmToPxX(snapDisplay ? snappedXcm : rawXcm)}px`;
    vEl.style.top = "15px";
  } else {
    vEl.style.display = "none";
  }

  cursorCm.value = {
    x: snapDisplay ? snappedXcm : rawXcm,
    y: snapDisplay ? snappedYcm : rawYcm,
  };
}

function hideGuides() {
  if (hGuide.value) hGuide.value.style.display = "none";
  if (vGuide.value) vGuide.value.style.display = "none";
  eraserCursor.value.visible = false;
}

function updateEraserCursor(pos) {
  if (mode.value !== "erase" || !insidePage(pos.x, pos.y)) {
    eraserCursor.value.visible = false;
    return;
  }

  const widthPx = cmToPxX(Math.max(0.1, eraserWidthCm.value));
  const heightPx = cmToPxY(Math.max(0.1, eraserHeightCm.value));
  const minLeft = 15;
  const maxLeft = 15 + baseWidthPx.value - widthPx;
  const minTop = 15;
  const maxTop = 15 + baseHeightPx.value - heightPx;

  eraserCursor.value = {
    visible: true,
    leftPx: clamp(pos.x - widthPx / 2, minLeft, Math.max(minLeft, maxLeft)),
    topPx: clamp(pos.y - heightPx / 2, minTop, Math.max(minTop, maxTop)),
  };
}

function pointInRect(x, y, rect) {
  return x >= rect.xMin && x <= rect.xMax && y >= rect.yMin && y <= rect.yMax;
}

function getCenteredEraseRect(xCm, yCm) {
  const halfW = Math.max(0.1, eraserWidthCm.value) / 2;
  const halfH = Math.max(0.1, eraserHeightCm.value) / 2;
  return {
    xMin: clamp(xCm - halfW, 0, widthCm.value),
    xMax: clamp(xCm + halfW, 0, widthCm.value),
    yMin: clamp(yCm - halfH, 0, heightCm.value),
    yMax: clamp(yCm + halfH, 0, heightCm.value),
  };
}

function getManualEraseRect() {
  const w = Math.max(0.1, eraseAreaWidth.value || 0.1);
  const h = Math.max(0.1, eraseAreaHeight.value || 0.1);
  return {
    xMin: clamp(eraseAreaX.value, 0, widthCm.value),
    xMax: clamp(eraseAreaX.value + w, 0, widthCm.value),
    yMin: clamp(eraseAreaY.value, 0, heightCm.value),
    yMax: clamp(eraseAreaY.value + h, 0, heightCm.value),
  };
}

function sampleRotatedEllipsePoints(circle, steps = 48) {
  const theta = getCircleAngleRad(circle);
  const points = [{ x: circle.cx, y: circle.cy }];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const localX = circle.rx * Math.cos(t);
    const localY = circle.ry * Math.sin(t);
    points.push({
      x: circle.cx + localX * Math.cos(theta) - localY * Math.sin(theta),
      y: circle.cy + localX * Math.sin(theta) + localY * Math.cos(theta),
    });
  }
  return points;
}

function circleIntersectsRect(circle, rect) {
  if (
    pointInRect(circle.cx, circle.cy, rect) ||
    pointInsideEllipse(rect.xMin, rect.yMin, circle) ||
    pointInsideEllipse(rect.xMax, rect.yMin, circle) ||
    pointInsideEllipse(rect.xMin, rect.yMax, circle) ||
    pointInsideEllipse(rect.xMax, rect.yMax, circle)
  ) {
    return true;
  }

  return sampleRotatedEllipsePoints(circle).some((point) => pointInRect(point.x, point.y, rect));
}

function interpolateLinePoint(line, t) {
  return {
    x: line.x1 + (line.x2 - line.x1) * t,
    y: line.y1 + (line.y2 - line.y1) * t,
  };
}

function createLineSegmentFromExisting(line, start, end) {
  const next = makeLine({
    x1: snapPoint(start.x),
    y1: snapPoint(start.y),
    x2: snapPoint(end.x),
    y2: snapPoint(end.y),
    role: line.role,
    hypothetical: line.hypothetical,
    note: line.note,
  });
  if (line.customColor) next.customColor = line.customColor;
  return next;
}

function getLineRectIntersectionInterval(line, rect) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  let t0 = 0;
  let t1 = 1;

  const clip = (p, q) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (
    clip(-dx, line.x1 - rect.xMin) &&
    clip(dx, rect.xMax - line.x1) &&
    clip(-dy, line.y1 - rect.yMin) &&
    clip(dy, rect.yMax - line.y1)
  ) {
    return { t0, t1 };
  }
  return null;
}

function eraseLineWithRect(line, rect) {
  const interval = getLineRectIntersectionInterval(line, rect);
  if (!interval) return [line];

  const epsilon = 1e-4;
  if (interval.t0 <= epsilon && interval.t1 >= 1 - epsilon) return [];

  const segments = [];
  if (interval.t0 > epsilon) {
    segments.push(
      createLineSegmentFromExisting(line, { x: line.x1, y: line.y1 }, interpolateLinePoint(line, interval.t0))
    );
  }
  if (interval.t1 < 1 - epsilon) {
    segments.push(
      createLineSegmentFromExisting(line, interpolateLinePoint(line, interval.t1), { x: line.x2, y: line.y2 })
    );
  }
  return segments.filter(
    (segment) => Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1) > epsilon
  );
}

function eraseUsingRect(rect) {
  const nextPrickings = prickings.value.filter((p) => !pointInRect(p.x, p.y, rect));
  const nextCircles = circles.value.filter((c) => !circleIntersectsRect(c, rect));
  const nextLines = lines.value.flatMap((line) => eraseLineWithRect(line, rect));

  const changed =
    nextPrickings.length !== prickings.value.length ||
    nextCircles.length !== circles.value.length ||
    nextLines.length !== lines.value.length ||
    nextLines.some((line, idx) => {
      const current = lines.value[idx];
      return (
        !current ||
        line.x1 !== current.x1 ||
        line.y1 !== current.y1 ||
        line.x2 !== current.x2 ||
        line.y2 !== current.y2
      );
    });

  if (!changed) return false;

  prickings.value = nextPrickings;
  circles.value = nextCircles;
  lines.value = nextLines;
  selectedFeature.value = { kind: null, id: null };
  redrawAll();
  return true;
}

function eraseAtPoint(xCm, yCm, { snapshot = true } = {}) {
  const rect = getCenteredEraseRect(xCm, yCm);
  const hadChanges =
    prickings.value.some((p) => pointInRect(p.x, p.y, rect)) ||
    circles.value.some((c) => circleIntersectsRect(c, rect)) ||
    lines.value.some((line) => eraseLineWithRect(line, rect).length !== 1 || eraseLineWithRect(line, rect)[0] !== line);

  if (!hadChanges) return false;
  if (snapshot) pushUndoSnapshot();
  return eraseUsingRect(rect);
}

function eraseByCoordinates() {
  const rect = getManualEraseRect();
  const wouldChange =
    prickings.value.some((p) => pointInRect(p.x, p.y, rect)) ||
    circles.value.some((c) => circleIntersectsRect(c, rect)) ||
    lines.value.some((line) => eraseLineWithRect(line, rect).length !== 1 || eraseLineWithRect(line, rect)[0] !== line);

  if (!wouldChange) return;
  pushUndoSnapshot();
  eraseUsingRect(rect);
}

function getCircleHandleAtPosition(xPx, yPx, circle) {
  const handles = getCircleHandlePositionsPx(circle);
  const threshold = CIRCLE_HANDLE_RADIUS_PX + 4;
  for (const [name, point] of Object.entries(handles)) {
    if (Math.hypot(xPx - point.x, yPx - point.y) <= threshold) {
      return name;
    }
  }
  return null;
}

function updateDraggedCircle(pos) {
  const drag = activeCircleDrag.value;
  const circle = selectedCircle.value;
  if (!drag || !circle || drag.circleId !== circle.id) return;

  const xPagePx = clamp(pos.x - 15, 0, baseWidthPx.value);
  const yPagePx = clamp(pos.y - 15, 0, baseHeightPx.value);
  const xCm = pxToCmX(xPagePx);
  const yCm = pxToCmY(yPagePx);

  if (!drag.hasMoved) {
    pushUndoSnapshot();
    drag.hasMoved = true;
  }

  if (drag.handle === "center") {
    circle.cx = snapPoint(xCm);
    circle.cy = snapPoint(yCm);
  } else if (drag.handle === "major") {
    const dx = xCm - circle.cx;
    const dy = yCm - circle.cy;
    circle.rx = Math.max(snapStepCm.value, snapPoint(Math.hypot(dx, dy)));
    circle.angle = normalizeAngleDeg((Math.atan2(dy, dx) * 180) / Math.PI);
  } else if (drag.handle === "minor") {
    const theta = getCircleAngleRad(circle);
    const dx = xCm - circle.cx;
    const dy = yCm - circle.cy;
    const projection = dx * -Math.sin(theta) + dy * Math.cos(theta);
    circle.ry = Math.max(snapStepCm.value, snapPoint(Math.abs(projection)));
  }

  suppressCanvasClick.value = true;
  redrawAll();
}

function handleCanvasMouseDown(e) {
  if (mode.value === "erase") {
    const pos = toLocalCoords(e);
    if (!pos || !insidePage(pos.x, pos.y)) return;
    const xCm = pxToCmX(clamp(pos.x - 15, 0, baseWidthPx.value));
    const yCm = pxToCmY(clamp(pos.y - 15, 0, baseHeightPx.value));
    const changed = eraseAtPoint(xCm, yCm, { snapshot: true });
    activeEraseDrag.value = { active: true, hasSnapshot: changed };
    suppressCanvasClick.value = true;
    e.preventDefault();
    return;
  }

  if (mode.value !== "select" || !selectedCircle.value) return;
  const pos = toLocalCoords(e);
  if (!pos) return;

  const handle = getCircleHandleAtPosition(pos.x, pos.y, selectedCircle.value);
  if (!handle) return;

  activeCircleDrag.value = {
    circleId: selectedCircle.value.id,
    handle,
    hasMoved: false,
  };
  e.preventDefault();
}

function handleCanvasMouseMove(e) {
  moveGuides(e);
  const pos = toLocalCoords(e);
  if (!pos) return;

  if (mode.value === "erase" && activeEraseDrag.value.active && insidePage(pos.x, pos.y)) {
    const xCm = pxToCmX(clamp(pos.x - 15, 0, baseWidthPx.value));
    const yCm = pxToCmY(clamp(pos.y - 15, 0, baseHeightPx.value));
    const changed = eraseAtPoint(xCm, yCm, { snapshot: !activeEraseDrag.value.hasSnapshot });
    if (changed && !activeEraseDrag.value.hasSnapshot) {
      activeEraseDrag.value = { active: true, hasSnapshot: true };
    }
    return;
  }

  if (!activeCircleDrag.value) return;
  updateDraggedCircle(pos);
}

function handleCanvasMouseUp() {
  activeEraseDrag.value = { active: false, hasSnapshot: false };
  activeCircleDrag.value = null;
}

function handleCanvasMouseLeave() {
  hideGuides();
  activeEraseDrag.value = { active: false, hasSnapshot: false };
  activeCircleDrag.value = null;
}

/* Snap & distance helpers */
function snapPoint(cm) {
  return snapVal(cm, snapStepCm.value);
}

function normalizeAngleDeg(angle) {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

function normalizeHexColor(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

function getCircleAngleRad(circle) {
  return ((circle.angle || 0) * Math.PI) / 180;
}

function getCircleLocalCoords(x, y, circle) {
  const dx = x - circle.cx;
  const dy = y - circle.cy;
  const theta = -getCircleAngleRad(circle);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

function pointInsideEllipse(x, y, circle) {
  if (circle.rx <= 0 || circle.ry <= 0) return false;
  const local = getCircleLocalCoords(x, y, circle);
  const norm =
    (local.x * local.x) / (circle.rx * circle.rx) +
    (local.y * local.y) / (circle.ry * circle.ry);
  return norm <= 1;
}

function getCircleHandlePositionsCm(circle) {
  const theta = getCircleAngleRad(circle);
  return {
    center: { x: circle.cx, y: circle.cy },
    major: {
      x: circle.cx + circle.rx * Math.cos(theta),
      y: circle.cy + circle.rx * Math.sin(theta),
    },
    minor: {
      x: circle.cx - circle.ry * Math.sin(theta),
      y: circle.cy + circle.ry * Math.cos(theta),
    },
  };
}

function getCircleHandlePositionsPx(circle) {
  const handles = getCircleHandlePositionsCm(circle);
  const toPx = (point) => ({
    x: 15 + cmToPxX(point.x),
    y: 15 + cmToPxY(point.y),
  });
  return {
    center: toPx(handles.center),
    major: toPx(handles.major),
    minor: toPx(handles.minor),
  };
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

function addUniqueIntersection(intersections, seen, point) {
  const key = `${point.x.toFixed(3)}|${point.y.toFixed(3)}`;
  if (seen.has(key)) return;
  seen.add(key);
  intersections.push(point);
}

// Get all intersection points from lines and prickings on lines
function getIntersections() {
  const intersections = [];
  const seen = new Set();
  const linesArray = lines.value;
  
  for (let i = 0; i < linesArray.length; i++) {
    for (let j = i + 1; j < linesArray.length; j++) {
      const intersection = getLineIntersection(linesArray[i], linesArray[j]);
      if (intersection) {
        addUniqueIntersection(intersections, seen, {
          x: snapPoint(intersection.x),
          y: snapPoint(intersection.y),
        });
      }
    }
  }

  const prickingThresholdCm = Math.max(MILLIMETRE_STEP_CM / 2, 0.03);
  for (const pricking of prickings.value) {
    for (const line of linesArray) {
      if (pointToSegmentDist(pricking.x, pricking.y, line) <= prickingThresholdCm) {
        addUniqueIntersection(intersections, seen, {
          x: snapPoint(pricking.x),
          y: snapPoint(pricking.y),
        });
        break;
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
  const local = getCircleLocalCoords(x, y, C);
  const distFromCenter = Math.hypot(local.x, local.y);
  const angle = Math.atan2(local.y, local.x);
  const ex = C.rx * Math.cos(angle);
  const ey = C.ry * Math.sin(angle);
  return Math.abs(distFromCenter - Math.hypot(ex, ey));
}

/* -------- Canvas click -------- */
function handleCanvasClick(e) {
  if (suppressCanvasClick.value) {
    suppressCanvasClick.value = false;
    return;
  }

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
      const d = pointInsideEllipse(xCm, yCm, C) ? 0 : pointToEllipseDist(xCm, yCm, C);
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
  showGhostSingleLine.value = false;
  ghostSingleLine.value = null;
  redrawAll();
}

function addMultipleLines() {
  const n = Math.max(1, Math.floor(number.value || 1));
  const y0 = start_y2.value;
  const hasExplicitSpacing = Number.isFinite(line_spacing2.value) && line_spacing2.value > 0;
  const y1 = end_y2.value;
  const step = hasExplicitSpacing
    ? line_spacing2.value
    : n === 1
      ? 0
      : (y1 - y0) / (n - 1);
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
  showGhostMultiLines.value = false;
  ghostMultiLines.value = [];
  redrawAll();
}

function addSinglePricking() {
  pushUndoSnapshot();
  prickings.value = [
    ...prickings.value,
    makePricking({ x: snapPoint(hor.value), y: snapPoint(ver.value), role: "margin", prickingType: prickingType.value }),
  ];
  showGhostSinglePricking.value = false;
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
  showGhostMultiPrickings.value = false;
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
      angle: normalizeAngleDeg(Number(circle_angle.value) || 0),
    }),
  ];
  showGhostSingleCircle.value = false;
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
    showGhostSingleLine.value = true;
  } else {
    ghostSingleLine.value = null;
    showGhostSingleLine.value = false;
  }
  redrawAll();
});

watch([start_x2, end_x2, start_y2, end_y2, line_spacing2, number], () => {
  const n = Math.max(1, Math.floor(number.value || 0));
  const y0 = start_y2.value;
  const y1 = end_y2.value;
  const hasExplicitSpacing = Number.isFinite(line_spacing2.value) && line_spacing2.value > 0;
  if (!Number.isFinite(y0) || (!hasExplicitSpacing && !Number.isFinite(y1)) || !n) {
    ghostMultiLines.value = [];
    showGhostMultiLines.value = false;
    redrawAll();
    return;
  }
  const step = hasExplicitSpacing
    ? line_spacing2.value
    : n === 1
      ? 0
      : (y1 - y0) / (n - 1);
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
  showGhostMultiLines.value = true;
  redrawAll();
});

watch([hor, ver], () => {
  const x = hor.value;
  const y = ver.value;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    ghostSinglePricking.value = { x: snapPoint(x), y: snapPoint(y) };
    showGhostSinglePricking.value = true;
  } else {
    ghostSinglePricking.value = null;
    showGhostSinglePricking.value = false;
  }
  redrawAll();
});

watch([hor2, start_y3, end_y3, number2], () => {
  const n = Math.max(1, Math.floor(number2.value || 0));
  const y0 = start_y3.value;
  const y1 = end_y3.value;
  if (!Number.isFinite(y0) || !Number.isFinite(y1) || !n) {
    ghostMultiPrickings.value = [];
    showGhostMultiPrickings.value = false;
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
  showGhostMultiPrickings.value = true;
  redrawAll();
});

watch([circle_x, circle_y, circle_rx, circle_ry, circle_angle], () => {
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
      angle: normalizeAngleDeg(Number(circle_angle.value) || 0),
    };
    showGhostSingleCircle.value = true;
  } else {
    ghostSingleCircle.value = null;
    showGhostSingleCircle.value = false;
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
    const normalized = normalizeHexColor(val);
    if (!normalized) return;
    l.customColor = normalized;
    redrawAll();
  }
}
function clearSelectedLineColor() {
  const l = selectedLine.value;
  if (l) {
    l.customColor = "";
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
    const normalized = normalizeHexColor(val);
    if (!normalized) return;
    p.customColor = normalized;
    redrawAll();
  }
}
function clearSelectedPrickingColor() {
  const p = selectedPricking.value;
  if (p) {
    p.customColor = "";
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

function updateSelectedCircleCoord(coord, val) {
  const c = selectedCircle.value;
  if (!c) return;
  const num = parseFloat(val);
  if (!Number.isFinite(num)) return;

  if (coord === "rx" || coord === "ry") {
    c[coord] = Math.max(snapStepCm.value, num);
  } else if (coord === "cx") {
    c.cx = clamp(num, 0, widthCm.value);
  } else if (coord === "cy") {
    c.cy = clamp(num, 0, heightCm.value);
  }
  redrawAll();
}

function updateSelectedCircleAngle(val) {
  const c = selectedCircle.value;
  if (!c) return;
  const num = parseFloat(val);
  if (!Number.isFinite(num)) return;
  c.angle = normalizeAngleDeg(num);
  redrawAll();
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
function openImagePicker() {
  imageFileInput.value?.click();
}

function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  selectedImageName.value = file.name;
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
  selectedImageName.value = "";
  if (imageFileInput.value) imageFileInput.value.value = "";
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
      snapStepCm.value = MILLIMETRE_STEP_CM;
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

function drawExportRulers(ctx, offsetX = 0, offsetY = 0) {
  ctx.save();
  ctx.fillStyle = "#0b1724";
  ctx.fillRect(offsetX, offsetY, baseWidthPx.value + 15, baseHeightPx.value + 15);

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px Arial";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.rect(offsetX + 15, offsetY + 15, baseWidthPx.value, baseHeightPx.value);
  ctx.stroke();

  for (let cm = 0; cm <= widthCm.value; cm += 1) {
    const xPos = offsetX + 15 + cmToPxX(cm);
    ctx.beginPath();
    ctx.moveTo(xPos, offsetY + 7);
    ctx.lineTo(xPos, offsetY + 14);
    ctx.stroke();
  }

  for (let cm = 0; cm <= widthCm.value; cm += 5) {
    const xPos = offsetX + 15 + cmToPxX(cm);
    ctx.beginPath();
    ctx.moveTo(xPos, offsetY);
    ctx.lineTo(xPos, offsetY + 14);
    ctx.stroke();
    ctx.fillText(String(cm), xPos + 2, offsetY + 10);
  }

  for (let cm = 0; cm <= heightCm.value; cm += 1) {
    const yPos = offsetY + 15 + cmToPxY(cm);
    ctx.beginPath();
    ctx.moveTo(offsetX + 7, yPos);
    ctx.lineTo(offsetX + 14, yPos);
    ctx.stroke();
  }

  for (let cm = 0; cm <= heightCm.value; cm += 5) {
    const yPos = offsetY + 15 + cmToPxY(cm);
    ctx.beginPath();
    ctx.moveTo(offsetX, yPos);
    ctx.lineTo(offsetX + 14, yPos);
    ctx.stroke();
    ctx.fillText(String(cm), offsetX + 2, yPos + 10);
  }
  ctx.restore();
}

// render schema into temp canvas for export (thicker, saturated)
function renderSchemaToCanvasForPdf(ctx, includeImage, includeMeasurements) {
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
      getCircleAngleRad(C),
      0,
      2 * Math.PI
    );
    ctx.stroke();
    ctx.restore();
  }

  // Intersection Measurements (if enabled)
  if (includeMeasurements) {
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
      
      // Draw measurement text
      const text = `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
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
  pdf.text(1, y, `Lines: ${lines.value.length}, prickings: ${prickings.value.length}, circles: ${circles.value.length}`); y += 0.7;
  
  if (includeIntersectionMeasurementsInExport.value) {
    const intersections = getIntersections();
    pdf.text(1, y, `Intersections: ${intersections.length}`); y += 0.7;
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
    { label: "Text lines (horizontal)", color: "#0088ff" },
    { label: "Bounding lines", color: "#ff8800" },
    { label: "Margin guidelines", color: "#e645ff" },
    { label: "Column boundaries", color: "#00d0b8" },
    { label: "Circles (compass impressions)", color: "#ff0088" },
    { label: "Hypothetical (reconstructed)", color: "#808080" },
  ];

  const prickingRoleLabels = {
    margin: "Margin pricking",
    column: "Column pricking",
    other: "Pricking",
  };
  const prickingShapeLabels = {
    pierced: "pierced circle",
    slit: "slit",
    other: "rectangular mark",
  };
  const seenPrickingLegendEntries = new Set();

  prickings.value.forEach((pricking) => {
    const shape = pricking.prickingType || "pierced";
    const color = getPrickingColor(pricking);
    const roleLabel = prickingRoleLabels[pricking.role] || "Pricking";
    const label = pricking.customColor
      ? `${roleLabel} (${prickingShapeLabels[shape]}, custom color)`
      : `${roleLabel} (${prickingShapeLabels[shape]})`;
    const key = `${label}|${shape}|${color}`;
    if (seenPrickingLegendEntries.has(key)) return;
    seenPrickingLegendEntries.add(key);
    legendEntries.push({ label, color, shape });
  });

  pdf.setLineWidth(0.06);
  for (const entry of legendEntries) {
    ensureSpace(0.8);
    if (entry.shape) {
      // Draw pricking type shape
      const { r, g, b } = hexToRgb(entry.color);
      pdf.setDrawColor(r, g, b);
      pdf.setFillColor(r, g, b);
      if (entry.shape === 'pierced') {
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
  temp.width = includeRulingGridInExport.value ? baseWidthPx.value + 15 : baseWidthPx.value;
  temp.height = includeRulingGridInExport.value ? baseHeightPx.value + 15 : baseHeightPx.value;
  const ctx = temp.getContext("2d");

  if (includeRulingGridInExport.value) {
    drawExportRulers(ctx);
    ctx.save();
    ctx.translate(15, 15);
    renderSchemaToCanvasForPdf(
      ctx,
      includeImageInPdf.value,
      includeIntersectionMeasurementsInExport.value
    );
    ctx.restore();
  } else {
    renderSchemaToCanvasForPdf(
      ctx,
      includeImageInPdf.value,
      includeIntersectionMeasurementsInExport.value
    );
  }

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
  temp.width = includeRulingGridInExport.value ? baseWidthPx.value + 15 : baseWidthPx.value;
  temp.height = includeRulingGridInExport.value ? baseHeightPx.value + 15 : baseHeightPx.value;
  const ctx = temp.getContext("2d");

  if (includeRulingGridInExport.value) {
    drawExportRulers(ctx);
    ctx.save();
    ctx.translate(15, 15);
    renderSchemaToCanvasForPdf(
      ctx,
      includeImageInImage.value,
      includeIntersectionMeasurementsInExport.value
    );
    ctx.restore();
  } else {
    renderSchemaToCanvasForPdf(
      ctx,
      includeImageInImage.value,
      includeIntersectionMeasurementsInExport.value
    );
  }

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
  temp.width = includeRulingGridInExport.value ? baseWidthPx.value + 15 : baseWidthPx.value;
  temp.height = includeRulingGridInExport.value ? baseHeightPx.value + 15 : baseHeightPx.value;
  const ctx = temp.getContext("2d");

  if (includeRulingGridInExport.value) {
    drawExportRulers(ctx);
    ctx.save();
    ctx.translate(15, 15);
    renderSchemaToCanvasForPdf(
      ctx,
      includeImageInImage.value,
      includeIntersectionMeasurementsInExport.value
    );
    ctx.restore();
  } else {
    renderSchemaToCanvasForPdf(
      ctx,
      includeImageInImage.value,
      includeIntersectionMeasurementsInExport.value
    );
  }

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
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
.ruling-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(to bottom, #3a4b60, #112233);
  color: #ffffff;
  font-size: 14px;
}

/* Meta summary */
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
  min-height: 0;
}

/* Sidebars */
.side {
  padding: 8px;
  background: #1b2738;
  border-radius: 12px;
  overflow-y: auto;
  max-height: 100%;
  min-height: 0;
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
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
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
}

.help-icon .tooltip::after {
  content: '';
  position: absolute;
  right: 8px;
  bottom: 100%;
  border: 6px solid transparent;
  border-bottom-color: #1e293b;
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
  min-height: 0;
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

.canvas-wrap.erase-mode {
  cursor: none;
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

.eraser-cursor {
  position: absolute;
  z-index: 5;
  border: 2px solid #f3f4f6;
  background: rgb(255 255 255 / 0.15);
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgb(15 23 42 / 0.5);
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
  display: none;
}

.file-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 6px;
}

.file-select-btn {
  flex: 0 0 auto;
}

.file-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: hsl(var(--card));
  padding: 2px;
}

.color-hex-input {
  flex: 1;
  min-width: 0;
  text-transform: lowercase;
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

/* QuillApp-inspired visual layer */
.ruling-page {
  background: linear-gradient(180deg, var(--app-bg-top), var(--app-bg-bottom));
  color: hsl(var(--foreground));
}

.ruling-page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle at 2px 2px, rgb(23 43 77 / 0.07) 1px, transparent 0);
  background-size: 24px 24px;
  opacity: 0.4;
}

.meta-summary,
.side,
.panel,
.stage-header,
.status-bar,
.modal-content {
  background: hsl(var(--card) / 0.92);
  border-color: hsl(var(--border));
  color: hsl(var(--card-foreground));
  box-shadow: var(--shadow-sm);
}

.meta-summary {
  border-radius: var(--radius-md);
  margin: 12px 14px 10px;
  padding: 10px 24px 12px;
  border: 1px solid hsl(var(--border) / 0.85);
  background:
    linear-gradient(180deg, hsl(var(--card) / 0.76), hsl(var(--card) / 0.64));
  backdrop-filter: blur(10px);
}

.mode-pill {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  border: 1px solid hsl(var(--border));
}

.side {
  border-radius: var(--radius-md);
  border: 1px solid hsl(var(--border) / 0.7);
  background:
    linear-gradient(180deg, hsl(var(--card) / 0.58), hsl(var(--card) / 0.42));
  box-shadow: 0 18px 34px rgb(12 17 29 / 0.08);
  backdrop-filter: blur(10px);
}

.panel {
  border-radius: var(--radius-md);
  border: 1px solid hsl(var(--border) / 0.78);
  background:
    linear-gradient(180deg, hsl(var(--card) / 0.82), hsl(var(--card) / 0.72));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08), var(--shadow-sm);
}

.stage-header,
.status-bar {
  border: 1px solid hsl(var(--border) / 0.8);
  border-radius: var(--radius-md);
  background:
    linear-gradient(180deg, hsl(var(--card) / 0.72), hsl(var(--card) / 0.58));
  backdrop-filter: blur(8px);
}

.stage-header {
  padding: 10px 14px;
  margin-bottom: 10px;
}

.status-bar {
  margin-top: 10px;
  padding: 10px 14px;
}

.meta-item strong,
.ruling-page .modal-content h2 {
  color: hsl(var(--card-foreground));
}

.hint,
.field-label,
.field-label-small,
.meta-row-secondary {
  color: hsl(var(--muted-foreground));
}

.field-input,
.number-input,
.field-textarea,
.inline select,
.inline input[type="number"] {
  background: hsl(var(--muted));
  color: hsl(var(--card-foreground));
  border-color: hsl(var(--border));
  border-radius: var(--radius-sm);
}

.canvas-wrap {
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  border: 1px solid hsl(var(--border) / 0.65);
}

button,
.small-btn,
.adjust-btn,
.export-option-btn,
.modal-close-btn,
.clear-color-btn,
.export-btn {
  border-radius: var(--radius-sm);
  font-weight: 700;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease,
    transform 0.08s ease, filter 0.14s ease;
}

button:hover:not(:disabled),
.small-btn:hover:not(:disabled),
.adjust-btn:hover:not(:disabled),
.export-option-btn:hover:not(:disabled),
.modal-close-btn:hover:not(:disabled),
.clear-color-btn:hover:not(:disabled) {
  background: hsl(var(--muted));
  border-color: hsl(var(--ring));
}

button.active,
.export-btn {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

button.btn-danger {
  background: #b42318;
  border-color: #b42318;
  color: #fff;
}

button.btn-danger:hover:not(:disabled) {
  background: #981b14;
  border-color: #981b14;
}

button:active:not(:disabled) {
  transform: translateY(1px);
}

.modal-overlay {
  background: rgb(7 12 20 / 0.7);
}

.selected-summary,
.image-controls {
  border-top-color: hsl(var(--border));
}

.ruling-page .help-icon {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}

.ruling-page .help-icon,
.ruling-page .help-icon::before,
.ruling-page .help-icon .tooltip,
.ruling-page .status-bar,
.ruling-page .empty-selected,
.ruling-page .selected-text,
.ruling-page .image-controls h4,
.ruling-page .range-value {
  color: hsl(var(--muted-foreground));
}

.ruling-page .help-icon .tooltip {
  background: hsl(var(--card));
  border-color: hsl(var(--border));
}

.ruling-page .help-icon .tooltip::after {
  border-right-color: hsl(var(--card));
}

.ruling-page .export-option-btn strong {
  background: transparent;
  border: 0;
  color: hsl(var(--card-foreground));
  font-weight: 700;
}

.ruling-page .export-option-btn span,
.ruling-page .modal-content h2 {
  color: hsl(var(--card-foreground));
}

.ruling-page .meta-summary,
.ruling-page .meta-item strong,
.ruling-page .panel h3,
.ruling-page .panel h4,
.ruling-page .field-inline,
.ruling-page .inline,
.ruling-page .selected-text,
.ruling-page .modal-content,
.ruling-page .export-option-btn,
.ruling-page .modal-close-btn,
.ruling-page .clear-color-btn {
  color: hsl(var(--card-foreground));
}

.ruling-page .help-icon .tooltip {
  color: hsl(var(--card-foreground));
}

.ruling-page .help-icon .tooltip::after {
  border-bottom-color: hsl(var(--card));
}
</style>
