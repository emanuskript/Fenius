<template>
  <div class="bookbinding-screen" ref="rootEl" :class="{ 'force-scroll': isScrollForced, 'export-mode': exportMode }">
    <!-- HEADER BAR -->
    <div class="header-bar">
      <span class="product-label">eManuskript Produkt</span>
      <button class="return-btn" @click="$router.back()">↩ return</button>
    </div>

    <!-- TITLE BAR -->
    <div class="title-bar">FENIUS</div>

    <!-- METADATA BREADCRUMB -->
    <div class="breadcrumb">
      <div class="breadcrumb-text">
        {{ title }}
        <span v-if="location">, {{ location }}</span>
        <span v-if="shelfmark">, {{ shelfmark }}</span>
        <span v-if="manuscriptDate">, {{ manuscriptDate }}</span>
        <span v-if="rows.length">, {{ rows.length }} Quires</span>
        <span v-if="rows[0] && rows[0].range">, {{ rows[0].range.split('-').length }} Folios/Quire</span>
        <span v-if="totalCmNumber">, {{ totalCmNumber.toFixed(1) }} cm spine</span>
      </div>
      
      <!-- Main Pen Controls (Center) -->
      <div class="breadcrumb-main-controls">
        <button class="pen-btn-header" @click="showPenPopup = true">
          + Add Pen
        </button>
        
        <!-- Individual Pen Buttons (next to Add Pen) -->
        <template v-for="pen in pens" :key="pen.id">
          <span class="pen-wrap-header">
            <button
              class="pen-btn-header"
              :class="{ active: activePenId === pen.id && !eraserActive }"
              @click="togglePen(pen.id)"
              :style="{ borderColor: pen.color, color: pen.color }"
              :title="penTooltip(pen)"
            >
              Pen{{ pen.id }}
            </button>
            <div
              v-if="penHintVisible && lastCreatedPenId === pen.id"
              class="pen-hint-header"
            >
              Click the pen button again to hide it
            </div>
          </span>
        </template>
        
        <button
          class="pen-btn-header"
          :class="{ active: eraserActive }"
          @click="toggleEraser"
        >
          🧹 Eraser
        </button>
      </div>

      <!-- Empty right section for balance -->
      <div class="breadcrumb-pen-controls">
        <!-- This div maintains the grid layout balance -->
      </div>
    </div>

    <!-- Selection bars -->
    <div v-if="selectingMode" class="selection-bar">
      <span>Select items (holes or supports). Selected: {{ selectedCount }}</span>
      <div class="selection-actions">
        <button @click="finishSelection" class="btn">Done</button>
        <button @click="cancelSelection" class="btn btn-ghost">Cancel</button>
      </div>
    </div>

    <div v-else-if="postSelectMode" class="selection-bar">
      <span>{{ selectedCount }} item(s) selected. Right‑click a selected item for group actions.</span>
      <div class="selection-actions">
        <button class="btn btn-ghost" @click="clearSelection">Exit</button>
      </div>
    </div>

    <!-- Status messages for active tools -->
    <div v-else-if="activePenId && !eraserActive" class="selection-bar">
      <span>Pen{{ activePenId }} is active. Draw on the table to create lines.</span>
      <div class="selection-actions">
        <button @click="deactivateCurrentPen" class="btn btn-ghost">Deactivate Pen</button>
      </div>
    </div>

    <div v-else-if="eraserActive" class="selection-bar">
      <span>Eraser is active. Click and drag to erase drawn lines.</span>
      <div class="selection-actions">
        <button @click="toggleEraser" class="btn btn-ghost">Deactivate Eraser</button>
      </div>
    </div>

    <div v-else-if="addKnotMode" class="selection-bar">
      <span>Adding knots is now active. Click on the table or on drawn lines to place bow knots.</span>
      <div class="selection-actions">
        <button @click="toggleAddKnot" class="btn btn-ghost">Exit Knot Mode</button>
      </div>
    </div>

    <div v-else-if="addRuptureMode" class="selection-bar">
      <span>Adding ruptures is now active. Click on the table or on drawn lines to create breaks.</span>
      <div class="selection-actions">
        <button @click="toggleAddRupture" class="btn btn-ghost">Exit Rupture Mode</button>
      </div>
    </div>

    <!-- TABLE CONTAINER -->
    <div class="table-container" ref="tableContainer">
      <!-- Drawing canvas (sits ABOVE the table; only captures events when pen/eraser is active) -->
      <canvas
        ref="drawCanvas"
        class="draw-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="{
          pointerEvents: activePenId || eraserActive ? 'auto' : 'none',
          // Position canvas at the start of the drawable area (after quire and leaves columns)
          left: (getDrawableOffsetPixels()) + 'px',
          width: canvasWidth + 'px',
          height: canvasHeight + 'px',
        }"
        @mousedown="startDraw"
        @mousemove="drawMove"
        @mouseup="endDraw"
        @mouseleave="endDraw"
      ></canvas>

      <!-- Element overlay (sits ABOVE the drawing canvas; captures events when knot or rupture mode is active) -->
      <div
        class="element-overlay"
        :style="{
          pointerEvents: (addKnotMode || addRuptureMode) ? 'auto' : 'none',
        }"
        @click="handleElementOverlayClick"
        @mousemove="handleElementOverlayMouseMove"
        @mouseleave="handleElementOverlayMouseLeave"
      >
        <!-- Rendered knots -->
        <div
          v-for="knot in knotEntries"
          :key="'knot-' + knot.id"
          class="knot-element"
          :style="{
            left: knot.x + '%',
            top: knot.y + '%',
            width: knot.size + 'px',
            height: knot.size + 'px',
          }"
          @contextmenu.prevent="openKnotMenu($event, knot.id)"
          @click.stop
          v-draggable="{
            onChange: (localPctX, globalPctX) => {
              updateKnotPosition(knot.id, localPctX, null);
            }
          }"
          title="Medieval Knot - right-click for options"
        >
          ⧗
        </div>

        <!-- Rendered ruptures -->
        <div
          v-for="rupture in ruptureEntries"
          :key="'rupture-' + rupture.id"
          class="rupture-container"
          :style="{
            left: rupture.x + '%',
            top: rupture.y + '%',
            width: (rupture.size + 8) + 'px',
            height: (rupture.size + 8) + 'px',
          }"
          @contextmenu.prevent="openRuptureMenu($event, rupture.id)"
          @click.stop
          v-draggable="{
            onChange: (localPctX, globalPctX) => {
              updateRupturePosition(rupture.id, localPctX, null);
            }
          }"
          title="Use this to indicate where a sewing support or thread has broken."
        >
          <!-- Eraser mask (creates gap in underlying elements) -->
          <div class="rupture-mask"></div>
          
          <!-- Lightning bolt symbol -->
          <div 
            class="rupture-element"
            :style="{
              width: rupture.size + 'px',
              height: rupture.size + 'px',
            }"
          >
            ⚡
          </div>
        </div>
      </div>

      <!-- Top ruler aligned to Head..Tail columns -->
      <div
        class="top-ruler"
        :style="{ marginLeft: topRulerLeft + 'px', width: topRulerWidth + 'px' }"
      >
        <div
          class="ruler"
          ref="ruler"
          @mousemove="onRulerMove"
          @mouseleave="onRulerLeave"
        >
          <!-- Major ticks with labels -->
          <div
            v-for="cm in majorTicks"
            :key="'M' + cm"
            :class="[
              'tick',
              'major',
              {
                'tick-first': cm === 0,
                'tick-last':
                  totalCmNumber > 0 && Number.isInteger(totalCmNumber) && cm === totalCmNumber,
              },
            ]"
            :style="{ left: (cm / Math.max(1, totalCmNumber)) * 100 + '%' }"
          >
            <span
              v-if="cm % 5 === 0 || (Number.isInteger(totalCmNumber) && cm === totalCmNumber)"
              class="tick-label"
            >
              {{ cm }}
            </span>
          </div>
          <div
            v-for="pct in minorTicks"
            :key="'m' + pct"
            class="tick minor"
            :style="{ left: pct + '%' }"
          />

          <!-- Drag feedback -->
          <div v-if="dragFeedback.visible">
            <div class="drag-marker start" :style="{ left: dragFeedback.startPct + '%' }"></div>
            <div class="drag-marker current" :style="{ left: dragFeedback.currentPct + '%' }"></div>
            <div class="drag-readout" :style="{ left: dragFeedback.currentPct + '%' }">
              Start: {{ dragStartCm.toFixed(2) }} cm | Current: {{ dragCurrentCm.toFixed(2) }} cm | Δ:
              {{ dragDeltaCm >= 0 ? "+" : "" }}{{ dragDeltaCm.toFixed(2) }} cm
            </div>
          </div>

          <!-- Normal tooltip -->
          <div v-if="tooltipVisible && !dragFeedback.visible" class="tooltip" :style="{ left: tooltipX + 'px' }">
            {{ tooltipCm.toFixed(1) }} cm
          </div>
        </div>
      </div>

      <table class="binding-table">
        <thead>
          <tr>
            <th class="header-dark quire-col">Quire</th>
            <th class="header-dark leaves-col">Leaves</th>
            <th class="header-light head-col" ref="headTh">Head</th>
            <th class="header-light ruler-col" colspan="3"></th>
            <th class="header-light tail-col" ref="tailTh">Tail</th>
            <th class="header-dark notes-col" v-if="!exportMode">Notes</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in rows"
            :key="rowIndex"
            :style="exportMode ? null : { height: rowHeight + 'px' }"
            :class="rowIndex % 2 === 0 ? 'even' : 'odd'"
          >
            <td class="cell-text">
              <template v-if="editRowsMode">
                <input class="cell-input small" v-model="rowsManual[rowIndex].roman" />
              </template>
              <template v-else>
                {{ (rowsManual[rowIndex] && rowsManual[rowIndex].roman) || row.roman }}
              </template>
            </td>
            <td class="cell-text">
              <template v-if="editRowsMode">
                <input class="cell-input" v-model="rowsManual[rowIndex].range" />
              </template>
              <template v-else>
                {{ (rowsManual[rowIndex] && rowsManual[rowIndex].range) || row.range }}
              </template>
            </td>

            <!-- Headbands (left) -->
            <td class="canvas-cell">
              <div
                v-for="(hb, hi) in headbandLeftPositions"
                :key="'hb-left-' + hi"
                class="headband-bar"
                :style="{ left: hb + '%' }"
                @contextmenu.prevent="openHeadbandMenu($event, 'left', hi)"
                v-draggable="{
                  getRect: getRulerRect,
                  onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                  onChange: (localPct, globalPct) => {
                    headbandLeftPositions[hi] = clampPct(localPct);
                    updateDragFeedback(globalPct);
                  },
                  onEnd: endDragFeedback,
                }"
              />
            </td>

            <!-- Spine area with supports + sewing holes + per-row changeover holes -->
            <td
              class="canvas-cell supports-cell"
              colspan="3"
              @click="maybeAddHole($event, rowIndex)"
            >
              <!-- Sewing supports (yellow + movable) -->
              <div
                class="support-wrap"
                v-for="(sp, si) in supportEntries"
                :key="'row-support-' + sp.id + '-' + rowIndex"
              >
                <!-- Single or double sewing support -->
                <template v-if="(sp.type || (isDoubleSupport ? 'double' : 'single')) === 'single'">
                  <div
                    class="support-bar"
                    :class="{ selected: isSupportSelected(sp.id) }"
                    :style="{ left: sp.position + '%', background: sp.color }"
                    @contextmenu.prevent="openSupportMenu($event, si)"
                    @click.stop="onSupportClick(si)"
                  v-draggable="{
                    getRect: getRulerRect,
                    onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                    onChange: (localPct, globalPct) => {
                      const prev = supportEntries[si].position;
                      const next = clampPct(localPct);
                      if (next !== prev) {
                        supportEntries[si].position = next;
                        moveSewingHolesForSupport(supportEntries[si].id ?? si, next - prev);
                      }
                      updateDragFeedback(globalPct);
                    },
                    onEnd: endDragFeedback,
                  }"
                    title="Sewing support"
                  ></div>
                </template>
                <template v-else>
                  <!-- Left bar and its dots -->
                  <div
                    class="support-bar"
                    :class="{ selected: isSupportSelected(sp.id) }"
                    :style="{ left: `calc(${sp.position}% - ${supportHalfGapPx}px)`, background: sp.color }"
                    @contextmenu.prevent="openSupportMenu($event, si)"
                    @click.stop="onSupportClick(si)"
                    v-draggable="{
                      getRect: getRulerRect,
                      onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                      onChange: (localPct, globalPct, pxToPct) => {
                        const prev = supportEntries[si].position;
                        const center = clampPct(localPct + pxToPct(supportHalfGapPx));
                        if (center !== prev) {
                          supportEntries[si].position = center;
                          moveSewingHolesForSupport(supportEntries[si].id ?? si, center - prev);
                        }
                        updateDragFeedback(globalPct);
                      },
                      onEnd: endDragFeedback,
                    }"
                    title="Sewing support (double)"
                  ></div>

                  <!-- Right bar and its dots -->
                  <div
                    class="support-bar"
                    :class="{ selected: isSupportSelected(sp.id) }"
                    :style="{ left: `calc(${sp.position}% + ${supportHalfGapPx}px)`, background: sp.color }"
                    @contextmenu.prevent="openSupportMenu($event, si)"
                    @click.stop="onSupportClick(si)"
                    v-draggable="{
                      getRect: getRulerRect,
                      onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                      onChange: (localPct, globalPct, pxToPct) => {
                        const prev = supportEntries[si].position;
                        const center = clampPct(localPct - pxToPct(supportHalfGapPx));
                        if (center !== prev) {
                          supportEntries[si].position = center;
                          moveSewingHolesForSupport(supportEntries[si].id ?? si, center - prev);
                        }
                        updateDragFeedback(globalPct);
                      },
                      onEnd: endDragFeedback,
                    }"
                    title="Sewing support (double)"
                  ></div>
                </template>
              </div>

              <!-- Sewing holes (individual per row, draggable) -->
              <div
                v-for="sh in sewingHolesByRow[rowIndex]"
                :key="'sh-' + sh.uid"
                class="hole-dot sewing"
                :class="{ selected: isSewingSelected(sewingKey(rowIndex, sh.uid)) }"
                :style="{
                  left: sewingHoleLeft(sh),
                  background: sh.color,
                }"
                v-draggable="{
                  getRect: getRulerRect,
                  onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                  onChange: (localPct, globalPct) => {
                    onSewingHoleDragged(rowIndex, sh.uid, localPct);
                    updateDragFeedback(globalPct);
                  },
                  onEnd: endDragFeedback,
                }"
                @contextmenu.prevent="openSewingMenu($event, rowIndex, sh.uid)"
                @click.stop="onSewingHoleClick(rowIndex, sh.uid)"
                :title="
                  isSewingSelected(sewingKey(rowIndex, sh.uid))
                    ? 'Selected'
                    : 'Sewing hole'
                "
              ></div>

              <!-- Change-over stations (individual per row, include 0% & 100%) -->
              <div
                v-for="hole in changeHolesByRow[rowIndex]"
                :key="'co-' + hole.uid"
                class="hole-dot change"
                :class="{ selected: isSelected(holeKey(rowIndex, hole.uid)) }"
                :style="{
                  left: hole.position + '%',
                  background: hole.color,
                  borderColor: isSelected(holeKey(rowIndex, hole.uid))
                    ? '#00b7ff'
                    : '#222',
                }"
                v-draggable="{
                  getRect: getRulerRect,
                  onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                  onChange: (localPct, globalPct) => {
                    onChangeHoleDragged(rowIndex, hole.uid, localPct);
                    updateDragFeedback(globalPct);
                  },
                  onEnd: endDragFeedback,
                }"
                @contextmenu.prevent="openHoleMenu($event, rowIndex, hole.uid)"
                @click.stop="onHoleClick(rowIndex, hole.uid)"
                :title="
                  isSelected(holeKey(rowIndex, hole.uid))
                    ? 'Selected'
                    : 'Change-over station'
                "
              ></div>
            </td>

            <!-- Headbands (right, independent) -->
            <td class="canvas-cell">
              <div
                v-for="(hb, hi) in headbandRightPositions"
                :key="'hb-right-' + hi"
                class="headband-bar"
                :style="{ left: hb + '%' }"
                @contextmenu.prevent="openHeadbandMenu($event, 'right', hi)"
                v-draggable="{
                  getRect: getRulerRect,
                  onStart: (localPct, globalPct) => beginDragFeedback(globalPct),
                  onChange: (localPct, globalPct) => {
                    headbandRightPositions[hi] = clampPct(localPct);
                    updateDragFeedback(globalPct);
                  },
                  onEnd: endDragFeedback,
                }"
              />
            </td>

            <td v-if="!exportMode">
              <input
                type="text"
                class="notes-input"
                v-model="notes[rowIndex]"
                :ref="el => noteRefs[rowIndex] = el"
                placeholder="Add note..."
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER -->
    <!-- Extra scroll range when rows are long -->
    <div v-if="isScrollForced" class="scroll-spacer"></div>

    <div class="footer" ref="footer">
      <div class="legend">
        <div>
          <span class="swatch headband"></span> Headbands
          <button @click="addHeadbandLeft">+ Add Headband</button>
          <button @click="addHeadbandRight" class="ml8">+ Add Tailband</button>
        </div>
        <div>
          <span class="swatch support"></span> Sewing support
          <button @click="openAddSupportPopup">+ Add</button>
        </div>
        <div>
          <span class="swatch change"></span> Change‑over station
          <button :class="{ 'btn-active': addHoleMode }" @click="toggleAddHole">
            {{ addHoleMode ? "Click in a row to place…" : "+ Add" }}
          </button>
        </div>

        <div>
          <span class="swatch knot"></span> Bow/Knot
          <button :class="{ 'btn-active': addKnotMode }" @click="toggleAddKnot">
            {{ addKnotMode ? "Click on table to place…" : "+ Add knot" }}
          </button>
        </div>

        <div>
          <span class="swatch rupture"></span> Sewing rupture
          <button :class="{ 'btn-active': addRuptureMode }" @click="toggleAddRupture">
            {{ addRuptureMode ? "Click on table to place…" : "+ Insert sewing rupture" }}
          </button>
        </div>

        <div>
          Rows
          <button class="ml8" :class="{ 'btn-active': editRowsMode }" @click="toggleEditRows">
            {{ editRowsMode ? 'Editing…' : 'Edit quires/leaves' }}
          </button>
          <button v-if="editRowsMode" class="ml8" @click="resetRowsManual">Reset from metadata</button>
        </div>


      </div>

      <button class="continue-btn" @click="showExportPopup = true">
        Export
      </button>
    </div>

    <!-- Context menu -->
    <div
      v-if="menu.visible"
      class="context-menu"
      :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
      @mousedown.stop
    >
      <!-- Hole menu -->
      <template v-if="menu.kind === 'hole'">
        <template v-if="menu.group">
          <button class="menu-item" @click="openRecolorPopup(true)">
            Recolor Selected…
          </button>
          <button class="menu-item danger" @click="deleteSelected">
            Delete Selected
          </button>
          <hr class="menu-sep" />
          <button class="menu-item" @click="exitPostSelect">
            Exit selection
          </button>
        </template>
        <template v-else>
          <button class="menu-item" @click="beginSelectFromMenu">Select</button>
          <button class="menu-item" @click="openRecolorPopup(false)">
            Recolor…
          </button>
          <button class="menu-item danger" @click="removeFromMenu">Remove</button>
        </template>
      </template>

      <!-- Support menu -->
      <template v-else-if="menu.kind === 'support'">
        <template v-if="menu.group">
          <button class="menu-item" @click="openRecolorPopup(true)">Recolor Selected…</button>
          <button class="menu-item danger" @click="deleteSelected">Delete Selected</button>
          <hr class="menu-sep" />
          <button class="menu-item" @click="exitPostSelect">Exit selection</button>
        </template>
        <template v-else>
          <button class="menu-item" @click="beginSupportSelectFromMenu">Select</button>
          <button class="menu-item" @click="openRecolorPopup(false)">Recolor…</button>
          <button class="menu-item danger" @click="removeFromMenu">Remove sewing support</button>
        </template>
      </template>

      <!-- Sewing hole menu -->
      <template v-else-if="menu.kind === 'sewing'">
        <template v-if="menu.group">
          <button class="menu-item" @click="openRecolorPopup(true)">Recolor Selected…</button>
          <button class="menu-item danger" @click="deleteSelected">Delete Selected</button>
          <hr class="menu-sep" />
          <button class="menu-item" @click="exitPostSelect">Exit selection</button>
        </template>
        <template v-else>
          <button class="menu-item" @click="beginSewingSelectFromMenu">Select</button>
          <button class="menu-item" @click="openRecolorPopup(false)">Recolor…</button>
          <button class="menu-item danger" @click="removeFromMenu">Remove</button>
        </template>
      </template>

      <!-- Stroke (pen line) menu -->
      <template v-else-if="menu.kind === 'stroke'">
        <button class="menu-item" @click="openRecolorPopup(false)">Recolor…</button>
      </template>

      <!-- Knot menu -->
      <template v-else-if="menu.kind === 'knot'">
        <button class="menu-item danger" @click="deleteKnotFromMenu">
          Remove Knot
        </button>
      </template>

      <!-- Headband/tailband menu -->
      <template v-else>
        <button class="menu-item danger" @click="removeFromMenu">
          Remove {{ menu.kind === 'headband-left' ? 'headband' : 'tailband' }}
        </button>
      </template>
    </div>

    <!-- Knot Context Menu (separate from main context menu) -->
    <div
      v-if="showKnotMenu"
      class="context-menu"
      :style="{ left: knotMenuPosition.x + 'px', top: knotMenuPosition.y + 'px' }"
      @mousedown.stop
    >
      <button class="menu-item danger" @click="deleteKnotFromMenu">
        Remove Knot
      </button>
    </div>

    <!-- Rupture Context Menu (separate from main context menu) -->
    <div
      v-if="showRuptureMenu"
      class="context-menu"
      :style="{ left: ruptureMenuPosition.x + 'px', top: ruptureMenuPosition.y + 'px' }"
      @mousedown.stop
    >
      <button class="menu-item danger" @click="deleteRuptureFromMenu">
        Remove Rupture
      </button>
    </div>

    <!-- Pen Creation Popup -->
    <div v-if="showPenPopup" class="overlay">
      <div class="popup">
        <h3>Create a Pen</h3>
        <div class="popup-section">
          <label>Type:</label>
          <select v-model="penForm.type">
            <option value="straight">Straight line</option>
            <option value="freehand">Free hand</option>
          </select>
        </div>
        <div class="popup-section">
          <label>Style:</label>
          <select v-model="penForm.style">
            <option value="solid">Solid</option>
            <option value="dotted">Dotted</option>
            <option value="dashed">Dash</option>
          </select>
        </div>
        <div class="popup-section">
          <label>Color:</label>
          <input type="color" v-model="penForm.color" />
        </div>
        <div class="popup-actions">
          <button @click="confirmPen" class="popup-btn confirm">Confirm</button>
          <button @click="showPenPopup = false" class="popup-btn cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Hole Recolor Popup -->
    <div v-if="showRecolorPopup" class="overlay">
      <div class="popup">
        <h3>{{ recolorHeading }}</h3>
        <div class="popup-section">
          <label>Color:</label>
          <input type="color" v-model="recolorColor" />
        </div>
        <div class="popup-actions">
          <button @click="confirmRecolor" class="popup-btn confirm">
            Confirm
          </button>
          <button @click="cancelRecolor" class="popup-btn cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Export Popup -->
    <div v-if="showExportPopup" class="overlay">
      <div class="popup">
        <h3>Save as PDF?</h3>
        <div class="popup-actions">
          <button class="popup-btn" @click="previewPDF">Preview</button>
          <button class="popup-btn confirm" @click="exportToPDF">
            Confirm
          </button>
          <button class="popup-btn cancel" @click="showExportPopup = false">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- PDF Preview Popup -->
    <div v-if="showPreviewPopup" class="overlay">
      <div class="popup">
        <h3>Preview</h3>
        <div style="max-width: 80vw; max-height: 60vh; overflow: auto; background:#fff; padding:8px; border-radius:6px;">
          <img :src="previewImg" style="max-width: 100%; height: auto;" />
        </div>
        <div class="popup-actions" style="margin-top:12px;">
          <button class="popup-btn confirm" @click="exportToPDF">Download PDF</button>
          <button class="popup-btn cancel" @click="showPreviewPopup = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Add Support Popup -->
    <div v-if="showAddSupportPopup" class="overlay">
      <div class="popup">
        <h3>Add Sewing Support</h3>
        <div class="popup-section">
          <label>Type:</label>
          <label class="radio-inline"><input type="radio" value="single" v-model="supportTypeChoice" /> Single</label>
          <label class="radio-inline"><input type="radio" value="double" v-model="supportTypeChoice" /> Double</label>
        </div>
        <div class="popup-actions">
          <button class="popup-btn confirm" @click="confirmAddSupport">Add</button>
          <button class="popup-btn cancel" @click="showAddSupportPopup = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default {
  name: "BookBindingScreen",
  directives: {
    // v-draggable: accepts { onStart?(localPct, globalPct, pxToPct), onChange(localPct, globalPct, pxToPct), onEnd?, getRect? }
    draggable: {
      mounted(el, binding) {
        el.style.position = "absolute";
        el.style.cursor = "grab";

        const getHandler = () =>
          typeof binding.value === "function"
            ? { onChange: binding.value }
            : binding.value || {};

        const onMove = (e) => {
          const parentRect = el.parentElement.getBoundingClientRect();
          let measureRect = parentRect;
          try {
            const getter = getHandler().getRect;
            const maybeRect = typeof getter === 'function' ? getter() : null;
            if (maybeRect && typeof maybeRect.left === 'number') measureRect = maybeRect;
          } catch (_) {
            measureRect = parentRect;
          }
          const xLocal = Math.max(0, Math.min(parentRect.width, e.clientX - parentRect.left));
          const xGlobal = Math.max(0, Math.min(measureRect.width, e.clientX - measureRect.left));
          const pctLocal = (xLocal / parentRect.width) * 100;
          const pctGlobal = (xGlobal / Math.max(1, measureRect.width)) * 100;
          const { onChange } = getHandler();
          const pxToPct = (px) => (px / Math.max(1, parentRect.width)) * 100;
          if (onChange) onChange(pctLocal, pctGlobal, pxToPct);
          el.style.left = pctLocal + "%";
        };

        const onDown = (ev) => {
          ev.preventDefault();
          const parentRect = el.parentElement.getBoundingClientRect();
          let measureRect = parentRect;
          try {
            const getter = getHandler().getRect;
            const maybeRect = typeof getter === 'function' ? getter() : null;
            if (maybeRect && typeof maybeRect.left === 'number') measureRect = maybeRect;
          } catch (_) {
            measureRect = parentRect;
          }
          const xLocal = Math.max(0, Math.min(parentRect.width, ev.clientX - parentRect.left));
          const xGlobal = Math.max(0, Math.min(measureRect.width, ev.clientX - measureRect.left));
          const pctLocal = (xLocal / parentRect.width) * 100;
          const pctGlobal = (xGlobal / Math.max(1, measureRect.width)) * 100;
          const { onStart } = getHandler();
          const pxToPct = (px) => (px / Math.max(1, parentRect.width)) * 100;
          if (onStart) onStart(pctLocal, pctGlobal, pxToPct);
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp, { once: true });
        };

        const onUp = () => {
          const { onEnd } = getHandler();
          if (onEnd) onEnd();
          document.removeEventListener("mousemove", onMove);
        };

        el.addEventListener("mousedown", onDown);
      },
    },
  },
  props: {
    // Metadata
    title: String,
    manuscriptDate: String,
    location: String,
    shelfmark: String,

    // Structure
    quires: [Number, String],
    foliosPerQuire: [Number, String],
    leavesPerQuire: [Number, String],
    collationStyle: { type: String, default: "foliate" },
    frontEndleaves: [Number, String],
    backEndleaves: [Number, String],

    // Layout
    sewingSupports: [Number, String],
    headbands: Boolean,
    changeOver: Boolean,
    spineLength: [Number, String],

    // Optional
    quiresStyle: String,
    sewingType: String,
  },
  setup(props) {
    const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

    /* ---------- Recolor popup state ---------- */
    const showRecolorPopup = ref(false);
    const recolorForGroup = ref(false);
    const recolorColor = ref("#4ea5de");

    /* ---------- Rows & numbering ---------- */
    const rows = computed(() => {
      const q = Math.min(10, Math.max(0, num(props.quires, 0)));
      const l = Math.min(
        20,
        Math.max(0, num(props.foliosPerQuire, num(props.leavesPerQuire, 0)))
      );
      const fe = Math.max(0, num(props.frontEndleaves, 0));
      const be = Math.max(0, num(props.backEndleaves, 0));

      const romans = [
        "I",
        "II",
        "III",
        "IV",
        "V",
        "VI",
        "VII",
        "VIII",
        "IX",
        "X",
      ];
      const isFoliate = (props.collationStyle || "foliate") === "foliate";
      const fmtF = (s, e) => `${s}r–${e}v`;
      const fmtP = (s, e) =>
        `p ${Math.max(1, 2 * s - 1)}–${Math.max(1, 2 * e)}`;

      const out = [];
      let cur = 1;

      if (fe > 0) {
        const s = cur,
          e = cur + fe - 1;
        out.push({ roman: "", range: isFoliate ? fmtF(s, e) : fmtP(s, e) });
        cur = e + 1;
      }
      for (let i = 0; i < q; i++) {
        const s = cur,
          span = l > 0 ? l : 1,
          e = s + span - 1;
        out.push({
          roman: romans[i] || String(i + 1),
          range: isFoliate ? fmtF(s, e) : fmtP(s, e),
        });
        cur = e + 1;
      }
      if (be > 0) {
        const s = cur,
          e = cur + be - 1;
        out.push({ roman: "", range: isFoliate ? fmtF(s, e) : fmtP(s, e) });
      }

      return out;
    });

    // Editable copies of quire label + leaves/range per row
    const rowsManual = reactive([]);
    const editRowsMode = ref(false);
    function ensureRowsManual() {
      const src = rows.value;
      // Grow/shrink to match base row count
      while (rowsManual.length < src.length) rowsManual.push({ roman: src[rowsManual.length]?.roman || "", range: src[rowsManual.length]?.range || "" });
      while (rowsManual.length > src.length) rowsManual.splice(rowsManual.length - 1, 1);
      // If not in edit mode, keep rowsManual in sync with metadata-driven rows
      if (!editRowsMode.value) {
        for (let i = 0; i < src.length; i++) {
          rowsManual[i].roman = src[i].roman;
          rowsManual[i].range = src[i].range;
        }
      }
    }
    onMounted(ensureRowsManual);
    watch(rows, ensureRowsManual, { immediate: true });
    function toggleEditRows() {
      editRowsMode.value = !editRowsMode.value;
    }
    function resetRowsManual() {
      editRowsMode.value = false;
      ensureRowsManual();
    }

    // Notes sync with rows
    const notes = reactive([]);
    const syncNotes = () => {
      const need = rows.value.length;
      if (notes.length < need)
        for (let i = notes.length; i < need; i++) notes.push("");
      else if (notes.length > need) notes.splice(need);
    };
    onMounted(syncNotes);
    watch(rows, syncNotes, { immediate: true });

    /* ---------- Table sizing (auto height; fixed row height) ---------- */
    const tableContainer = ref(null);
    const rowHeight = ref(40); // fixed row height; container grows to fit all rows

  /* ---------- Top ruler alignment to Head..Tail columns ---------- */
  const headTh = ref(null);
  const tailTh = ref(null);
  const topRulerLeft = ref(0);
  const topRulerWidth = ref(0);
  const rootEl = ref(null);
  const footer = ref(null);
  const prevHtmlOverflow = ref("");
  const prevBodyOverflow = ref("");
  function applyGlobalScroll(forceOn) {
    try {
      if (forceOn) {
        // Save previous inline values once
        if (!prevHtmlOverflow.value) prevHtmlOverflow.value = document.documentElement.style.overflow;
        if (!prevBodyOverflow.value) prevBodyOverflow.value = document.body.style.overflow;
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
      } else {
        document.documentElement.style.overflow = prevHtmlOverflow.value;
        document.body.style.overflow = prevBodyOverflow.value;
      }
    } catch (_) { /* no-op */ }
  }
  function updateScrollability() {
    try {
      if (!rootEl.value || !tableContainer.value || !footer.value) return;
      const tableRect = tableContainer.value.getBoundingClientRect();
      const footerRect = footer.value.getBoundingClientRect();
      // Force scroll when more than 10 rows; otherwise fall back to geometry threshold
      if (rows.value.length > 10) {
        rootEl.value.style.overflowY = 'auto';
      } else {
        const needsScroll = tableRect.bottom > (footerRect.top - 30);
        rootEl.value.style.overflowY = needsScroll ? 'auto' : 'hidden';
      }
      rootEl.value.style.height = '100dvh';
    } catch (_) { /* no-op */ }
  }
  function updateTopRulerAlignment() {
    if (!tableContainer.value || !headTh.value || !tailTh.value) return;
    const containerRect = tableContainer.value.getBoundingClientRect();
    const headRect = headTh.value.getBoundingClientRect();
    const tailRect = tailTh.value.getBoundingClientRect();
    const left = Math.max(0, headRect.left - containerRect.left);
    const right = Math.max(0, tailRect.right - containerRect.left);
    topRulerLeft.value = left;
    topRulerWidth.value = Math.max(0, right - left);
  }
  onMounted(() => {
    nextTick(() => { updateTopRulerAlignment(); updateScrollability(); applyGlobalScroll(isScrollForced.value); });
    window.addEventListener("resize", updateTopRulerAlignment);
    window.addEventListener("resize", updateScrollability);
  });
  watch([rows, () => rowHeight.value], () => nextTick(() => { updateTopRulerAlignment(); updateScrollability(); }));
  watch(rows, () => nextTick(() => { updateScrollability(); applyGlobalScroll(isScrollForced.value); }), { immediate: false });
  onUnmounted(() => {
    window.removeEventListener("resize", updateTopRulerAlignment);
    window.removeEventListener("resize", updateScrollability);
    applyGlobalScroll(false);
  });

    /* ---------- Ruler ---------- */
    const totalCm = computed(() => Math.max(0, num(props.spineLength, 0)));
    const isScrollForced = computed(() => rows.value.length > 10);
    const totalCmNumber = computed(() => totalCm.value);
    const majorTicks = computed(() => {
      const t = Math.floor(totalCm.value);
      return Array.from({ length: t + 1 }, (_, i) => i);
    });
    const minorTicks = computed(() => {
      const t = Math.floor(totalCm.value);
      const denom = Math.max(1, t) * 10;
      return Array.from({ length: t * 10 + 1 }, (_, i) =>
        i % 10 ? (i / denom) * 100 : null
      ).filter(Boolean);
    });
    const ruler = ref(null),
      tooltipVisible = ref(false),
      tooltipX = ref(0),
      tooltipCm = ref(0);
    function onRulerMove(e) {
      // Don't show ruler tooltip when in knot or rupture add mode (overlay handles it)
      if (addKnotMode.value || addRuptureMode.value) {
        return;
      }
      
      const r = ruler.value.getBoundingClientRect();
      tooltipX.value = e.clientX - r.left;
      tooltipCm.value = (tooltipX.value / r.width) * totalCm.value;
      tooltipVisible.value = true;
    }

    function onRulerLeave() {
      // Don't hide tooltip when in knot or rupture add mode (overlay controls it)
      if (addKnotMode.value || addRuptureMode.value) {
        return;
      }
      tooltipVisible.value = false;
    }

    // Provide rect getter for mapping local drags to top-ruler coordinates
    const getRulerRect = () => ruler.value?.getBoundingClientRect() || null;

    // Drag feedback overlay
    const dragFeedback = reactive({
      visible: false,
      startPct: 0,
      currentPct: 0,
    });
    const clampPct = (pct) => Math.max(0, Math.min(100, pct));
    const dragStartCm = computed(
      () => (dragFeedback.startPct / 100) * totalCm.value
    );
    const dragCurrentCm = computed(
      () => (dragFeedback.currentPct / 100) * totalCm.value
    );
    const dragDeltaCm = computed(() => dragCurrentCm.value - dragStartCm.value);
    function beginDragFeedback(p) {
      dragFeedback.visible = true;
      dragFeedback.startPct = clampPct(p);
      dragFeedback.currentPct = clampPct(p);
    }
    function updateDragFeedback(p) {
      dragFeedback.currentPct = clampPct(p);
    }
    function endDragFeedback() {
      dragFeedback.visible = false;
    }

    /* ---------- Headbands ---------- */
    const headbandLeftPositions = reactive(props.headbands ? [5] : []);
    const headbandRightPositions = reactive(props.headbands ? [95] : []);
    function addHeadbandLeft() {
      headbandLeftPositions.push(50);
    }
    function addHeadbandRight() {
      headbandRightPositions.push(50);
    }

    /* ---------- Sewing supports (yellow, movable) ---------- */
    const supportEntries = reactive([]);
    const isDoubleSupport = computed(
      () => String(props.sewingType || '').toLowerCase() === 'double'
    );
  const supportHalfGapPx = 8; // pixel offset for double supports
  function moveSewingHolesForSupport(supportId, delta) {
    if (!delta) return;
    try {
      sewingHolesByRow.value.forEach((row) => {
        row.forEach((h) => {
          if (h.supportId === supportId) h.position = clampPct(h.position + delta);
        });
      });
    } catch (_) { /* no-op */ }
  }
    function initSupportsFromCount(count) {
      const n = Math.max(0, num(count, 0));
      supportEntries.splice(0, supportEntries.length);
      if (n === 0) {
        // Fallback so a yellow bar is always visible
        supportEntries.push({ id: 1, position: 50, color: '#e2b043' });
      } else {
        for (let i = 0; i < n; i++) {
          supportEntries.push({ id: i + 1, position: ((i + 1) / (n + 1)) * 100, color: '#e2b043' });
        }
      }
    }
    onMounted(() => {
      initSupportsFromCount(props.sewingSupports);
    });
    watch(
      () => props.sewingSupports,
      (val) => {
        initSupportsFromCount(val);
      }
    );
    // Add support via popup (single/double)
    const showAddSupportPopup = ref(false);
    const supportTypeChoice = ref('single');
    function openAddSupportPopup() {
      supportTypeChoice.value = (props.sewingType || 'single').toLowerCase() === 'double' ? 'double' : 'single';
      showAddSupportPopup.value = true;
    }
    function confirmAddSupport() {
      const id = supportEntries.length + 1;
      supportEntries.push({ id, position: 50, color: '#e2b043', type: supportTypeChoice.value });
      showAddSupportPopup.value = false;
    }

    /* ---------- Knots/Bows ---------- */
    const knotEntries = reactive([]);
    const addKnotMode = ref(false);
    
    function toggleAddKnot() {
      addKnotMode.value = !addKnotMode.value;
    }
    
    function handleElementOverlayClick(evt) {
      const rect = evt.currentTarget.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * 100;
      const y = ((evt.clientY - rect.top) / rect.height) * 100;
      
      // Check if we clicked on a drawn line
      const strokeId = hitStrokeAtClient(evt.clientX, evt.clientY);
      
      if (strokeId && (addKnotMode.value || addRuptureMode.value)) {
        // Get the exact click position on the stroke
        const clickPoint = getClickPositionOnStroke(evt.clientX, evt.clientY, strokeId);
        
        if (addKnotMode.value) {
          createKnotOnLine(strokeId, clickPoint, x, y);
        } else if (addRuptureMode.value) {
          createRuptureOnLine(strokeId, clickPoint, x, y);
        }
      } else {
        // Regular placement when not clicking on a line
        if (addKnotMode.value) {
          addKnotAtPosition(x, y);
        } else if (addRuptureMode.value) {
          addRuptureAtPosition(x, y);
        }
      }
    }

    function handleKnotOverlayClick(evt) {
      // Keep for backward compatibility, but delegate to the new function
      handleElementOverlayClick(evt);
    }

    function handleElementOverlayMouseMove(evt) {
      // Only show position tracking when in knot or rupture add mode
      if (!addKnotMode.value && !addRuptureMode.value) {
        return;
      }

      const rulerRect = ruler.value?.getBoundingClientRect();
      
      if (rulerRect) {
        // Get mouse position relative to the ruler area
        const mouseX = evt.clientX;
        const rulerLeft = rulerRect.left;
        const rulerRight = rulerRect.right;
        
        // Check if mouse is within the ruler area horizontally
        if (mouseX >= rulerLeft && mouseX <= rulerRight) {
          // Calculate position within the ruler (0 to ruler width)
          const rulerX = mouseX - rulerLeft;
          
          // Calculate the cm position (0 to totalCm)
          const cmPosition = (rulerX / rulerRect.width) * totalCm.value;
          
          // Clamp to valid range
          const clampedCm = Math.max(0, Math.min(totalCm.value, cmPosition));
          
          // Update tooltip
          tooltipX.value = rulerX;
          tooltipCm.value = clampedCm;
          tooltipVisible.value = true;
        } else {
          // Mouse is outside ruler area - show boundary values
          if (mouseX < rulerLeft) {
            tooltipX.value = 0;
            tooltipCm.value = 0;
          } else {
            tooltipX.value = rulerRect.width;
            tooltipCm.value = totalCm.value;
          }
          tooltipVisible.value = true;
        }
      }
    }

    function handleElementOverlayMouseLeave(evt) {
      // Hide tooltip when mouse leaves the overlay area
      if (addKnotMode.value || addRuptureMode.value) {
        tooltipVisible.value = false;
      }
    }
    
    function addKnotAtPosition(x, y) {
      const id = knotEntries.length + 1;
      knotEntries.push({
        id,
        x: clampPct(x), // percentage from left
        y: clampPct(y), // percentage from top
        color: '#654321', // dark leather brown for medieval knot
        size: 18 // size in pixels
      });
      
      addKnotMode.value = false;
    }
    
    function updateKnotPosition(id, x, y) {
      const knot = knotEntries.find(k => k.id === id);
      if (!knot) return;
      
      if (x !== null) knot.x = clampPct(x);
      if (y !== null) knot.y = clampPct(y);
    }
    
    function removeKnot(id) {
      const index = knotEntries.findIndex(knot => knot.id === id);
      if (index !== -1) {
        knotEntries.splice(index, 1);
      }
    }

    // Knot context menu
    const showKnotMenu = ref(false);
    const knotMenuPosition = reactive({ x: 0, y: 0 });
    const knotMenuTargetId = ref(null);
    
    function openKnotMenu(evt, id) {
      evt.preventDefault();
      knotMenuPosition.x = evt.clientX;
      knotMenuPosition.y = evt.clientY;
      knotMenuTargetId.value = id;
      showKnotMenu.value = true;
    }
    
    function closeKnotMenu() {
      showKnotMenu.value = false;
      knotMenuTargetId.value = null;
    }
    
    function deleteKnotFromMenu() {
      if (knotMenuTargetId.value !== null) {
        removeKnot(knotMenuTargetId.value);
      }
      closeKnotMenu();
    }

    /* ---------- Sewing Ruptures ---------- */
    const ruptureEntries = reactive([]);
    const addRuptureMode = ref(false);
    
    function toggleAddRupture() {
      addRuptureMode.value = !addRuptureMode.value;
    }
    
    function handleRuptureOverlayClick(evt) {
      if (!addRuptureMode.value) return;
      
      const rect = evt.currentTarget.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * 100;
      const y = ((evt.clientY - rect.top) / rect.height) * 100;
      
      addRuptureAtPosition(x, y);
    }
    
    function addRuptureAtPosition(x, y) {
      const id = ruptureEntries.length + 1;
      ruptureEntries.push({
        id,
        x: clampPct(x), // percentage from left
        y: clampPct(y), // percentage from top
        color: '#FF6B47', // orange-red color for rupture/break
        size: 16 // size in pixels
      });
      
      // Convert click position to canvas coordinates
      const clickX = (x / 100) * canvasWidth.value;
      const clickY = (y / 100) * canvasHeight.value;
      const rupturRadius = 12; // detection radius around click point
      
      // Find strokes that pass through this rupture point and break them
      for (const stroke of strokes.value) {
        if (stroke.type === 'straight' && stroke.start && stroke.end) {
          // Check if this straight line passes near the rupture point
          if (linePassesThroughPoint(absPoint(stroke.start), absPoint(stroke.end), { x: clickX, y: clickY }, rupturRadius)) {
            // Calculate where on the line the rupture occurs (normalized 0-1)
            const t = getLineIntersectionParam(absPoint(stroke.start), absPoint(stroke.end), { x: clickX, y: clickY });
            stroke.broken = true;
            stroke.breakStart = t < 0.1; // break at start if rupture is near start
            stroke.breakEnd = t > 0.9;   // break at end if rupture is near end
          }
        } else if (stroke.type === 'freehand' && stroke.points && stroke.points.length > 0) {
          // Check if freehand path passes through the rupture point
          const pts = stroke.points.map(absPoint);
          for (let i = 0; i < pts.length - 1; i++) {
            if (linePassesThroughPoint(pts[i], pts[i + 1], { x: clickX, y: clickY }, rupturRadius)) {
              stroke.broken = true;
              stroke.breakPoints = stroke.breakPoints || [];
              stroke.breakPoints.push(i); // mark this segment as broken
              break;
            }
          }
        }
      }
      
      reRenderCanvas();
      addRuptureMode.value = false;
    }
    
    function linePassesThroughPoint(p1, p2, point, radius) {
      // Calculate distance from point to line segment p1-p2
      const dist = distanceToLineSegment(p1, p2, point);
      return dist <= radius;
    }
    
    function distanceToLineSegment(p1, p2, point) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      
      if (lenSq === 0) {
        // p1 and p2 are the same point
        const px = point.x - p1.x;
        const py = point.y - p1.y;
        return Math.sqrt(px * px + py * py);
      }
      
      let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      
      const closestX = p1.x + t * dx;
      const closestY = p1.y + t * dy;
      
      const px = point.x - closestX;
      const py = point.y - closestY;
      return Math.sqrt(px * px + py * py);
    }
    
    function getLineIntersectionParam(p1, p2, point) {
      // Returns t where 0 <= t <= 1, representing where on the line segment the closest point is
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      
      if (lenSq === 0) return 0;
      
      let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq;
      return Math.max(0, Math.min(1, t));
    }
    
    function updateRupturePosition(id, x, y) {
      const rupture = ruptureEntries.find(r => r.id === id);
      if (!rupture) return;
      
      if (x !== null) rupture.x = clampPct(x);
      if (y !== null) rupture.y = clampPct(y);
    }
    
    function removeRupture(id) {
      const index = ruptureEntries.findIndex(rupture => rupture.id === id);
      if (index !== -1) {
        ruptureEntries.splice(index, 1);
      }
    }

    // Rupture context menu
    const showRuptureMenu = ref(false);
    const ruptureMenuPosition = reactive({ x: 0, y: 0 });
    const ruptureMenuTargetId = ref(null);
    
    function openRuptureMenu(evt, id) {
      evt.preventDefault();
      ruptureMenuPosition.x = evt.clientX;
      ruptureMenuPosition.y = evt.clientY;
      ruptureMenuTargetId.value = id;
      showRuptureMenu.value = true;
    }
    
    function closeRuptureMenu() {
      showRuptureMenu.value = false;
      ruptureMenuTargetId.value = null;
    }
    
    function deleteRuptureFromMenu() {
      if (ruptureMenuTargetId.value !== null) {
        removeRupture(ruptureMenuTargetId.value);
      }
      closeRuptureMenu();
    }

    /* ---------- Change‑over holes (per row) ---------- */
    const changeHolesByRow = ref([]);
    const nextUid = ref(1);
    const hasHoleAt = (row, target, eps = 0.25) =>
      row.some((h) => Math.abs(h.position - target) <= eps);
    function addIfMissing(row, pct) {
      if (!hasHoleAt(row, pct))
        row.push({ uid: nextUid.value++, position: pct, color: "#333" });
    }
    function ensureHolesArrays() {
      const need = rows.value.length;
      while (changeHolesByRow.value.length < need) {
        changeHolesByRow.value.push([
          { uid: nextUid.value++, position: 0, color: "#333" },
          { uid: nextUid.value++, position: 100, color: "#333" },
        ]);
      }
      while (changeHolesByRow.value.length > need) changeHolesByRow.value.pop();
      for (const row of changeHolesByRow.value) {
        addIfMissing(row, 0);
        addIfMissing(row, 100);
      }
    }
    onMounted(ensureHolesArrays);
    watch(rows, ensureHolesArrays, { immediate: true });

    const addHoleMode = ref(false);
    function toggleAddHole() {
      addHoleMode.value = !addHoleMode.value;
    }
    function pctFromEvent(evt, el) {
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(r.width, evt.clientX - r.left));
      return (x / r.width) * 100;
    }
    function maybeAddHole(evt, rowIndex) {
      if (!addHoleMode.value) return;
      const pct = clampPct(pctFromEvent(evt, evt.currentTarget));
      changeHolesByRow.value[rowIndex].push({
        uid: nextUid.value++,
        position: pct,
        color: "#333",
      });
      addHoleMode.value = false;
    }
  function onChangeHoleDragged(rowIndex, uid, pct) {
    const row = changeHolesByRow.value[rowIndex];
    const hole = row.find((h) => h.uid === uid);
    if (!hole) return;

      const key = holeKey(rowIndex, uid);
      if (isSelected(key)) {
        // Calculate delta for this hole
        const delta = clampPct(pct) - hole.position;
        // Move ALL selected holes by the same delta, regardless of row
        selectedKeys.value.forEach((selectedKey) => {
          const [r, u] = selectedKey.split(":").map(Number);
          const h = changeHolesByRow.value[r].find((hh) => hh.uid === u);
          if (h) h.position = clampPct(h.position + delta);
        });
      } else {
        hole.position = clampPct(pct);
    }
    }

    const holeKey = (rowIndex, uid) => `${rowIndex}:${uid}`;
    const selectedKeys = ref(new Set()); // holes
    // Sewing holes (per row, independent)
    const sewingHolesByRow = ref([]);
    const sewingKey = (rowIndex, uid) => `${rowIndex}:${uid}`;
    const selectedSewingKeys = ref(new Set());
    const isSewingSelected = (key) => selectedSewingKeys.value.has(key);
    const toggleSewingSelected = (key) => {
      const s = new Set(selectedSewingKeys.value);
      s.has(key) ? s.delete(key) : s.add(key);
      selectedSewingKeys.value = s;
    };
    // (sewingHolesByRow declared above)
    const middleRowIndex = computed(() => Math.max(0, Math.floor((rows.value.length - 1) / 2)));
    function ensureSewingHolesArrays() {
      const need = rows.value.length;
      // Ensure rows exist
      while (sewingHolesByRow.value.length < need) sewingHolesByRow.value.push([]);
      while (sewingHolesByRow.value.length > need) sewingHolesByRow.value.pop();

      // Remove holes for supports that no longer exist
      const supportIds = new Set(supportEntries.map((s) => s.id));
      for (const row of sewingHolesByRow.value) {
        for (let i = row.length - 1; i >= 0; i--) {
          if (row[i].supportId != null && !supportIds.has(row[i].supportId)) row.splice(i, 1);
        }
      }

      // For each row, ensure default holes exist for each support
      // - Single support: ensure at least 2 side holes per row (user can adjust later)
      // - Double support: ensure exactly 1 center hole per row (between the two yellow bars)
      const sideOffset = 1.2; // percent offset from support center for side holes
      const centerThreshold = 0.6; // percent: classify holes near center as 'center'
      sewingHolesByRow.value.forEach((row, ri) => {
        for (const sp of supportEntries) {
          const type = (sp.type || (isDoubleSupport.value ? 'double' : 'single'));
          const holes = row.filter((h) => h.supportId === sp.id);
          // Classify center vs side for double; for single, treat all as side
          const centers = type === 'double'
            ? holes.filter((h) => (h.role === 'center') || Math.abs(h.position - sp.position) <= centerThreshold)
            : [];
          const sides = holes.filter((h) => !centers.includes(h));

          if (type === 'double') {
            // For double supports: ensure exactly one center hole in each row (between the two yellow bars)
            if (centers.length === 0) {
              row.push({ uid: nextUid.value++, position: clampPct(sp.position), color: '#333', supportId: sp.id, role: 'center' });
            } else if (centers.length > 1) {
              // keep the closest to center
              centers.sort((a, b) => Math.abs(a.position - sp.position) - Math.abs(b.position - sp.position));
              for (const h of centers.slice(1)) {
                const idx = row.indexOf(h);
                if (idx >= 0) row.splice(idx, 1);
              }
            }
            // Remove any side holes for double supports
            for (const h of sides) {
              const idx = row.indexOf(h);
              if (idx >= 0) row.splice(idx, 1);
            }
          } else {
            // For single supports: ensure side holes (at least two) exist on every row
            if (sides.length < 2) {
              const desired = [clampPct(sp.position - sideOffset), clampPct(sp.position + sideOffset)];
              for (let i = sides.length; i < 2; i++) {
                row.push({ uid: nextUid.value++, position: desired[i], color: '#333', supportId: sp.id, role: 'side' });
              }
            }
          }
        }
      });
    }
    onMounted(ensureSewingHolesArrays);
    watch(rows, ensureSewingHolesArrays, { immediate: true });
    watch(supportEntries, ensureSewingHolesArrays, { deep: true });
    watch(isDoubleSupport, () => ensureSewingHolesArrays());

    function onSewingHoleDragged(rowIndex, uid, pct) {
      const row = sewingHolesByRow.value[rowIndex];
      const hole = row.find((h) => h.uid === uid);
      if (!hole) return;
      const key = sewingKey(rowIndex, uid);
      if (isSewingSelected(key)) {
        const delta = clampPct(pct) - hole.position;
        selectedSewingKeys.value.forEach((selectedKey) => {
          const [r, u] = selectedKey.split(":").map(Number);
          const h = sewingHolesByRow.value[r].find((hh) => hh.uid === u);
          if (h) h.position = clampPct(h.position + delta);
        });
      } else {
        hole.position = clampPct(pct);
      }
    }

    // Visual offset to keep side holes from sitting on top of support bar
    const sewingSideMarginPx = 8;
    function sewingHoleLeft(hole) {
      const sp = supportEntries.find((s) => s.id === hole.supportId);
      // Center hole stays exactly centered on the support position
      if (hole.role === 'center' && sp) return `calc(${sp.position}% + 0px)`;
      const basePct = Number.isFinite(hole.position) ? hole.position : 0;
      if (!sp) return `${basePct}%`;
      const dir = basePct >= sp.position ? 1 : -1;
      return `calc(${basePct}% + ${dir * sewingSideMarginPx}px)`;
    }
  const selectedSupportIds = ref(new Set()); // supports (by id/index)
  const selectingMode = ref(false);
  const postSelectMode = ref(false);
  const selectedCount = computed(
      () => selectedKeys.value.size + selectedSewingKeys.value.size + selectedSupportIds.value.size
    );
  const isSelected = (key) => selectedKeys.value.has(key);
  const toggleSelected = (key) => {
    const s = new Set(selectedKeys.value);
    s.has(key) ? s.delete(key) : s.add(key);
    selectedKeys.value = s;
  };
  // sewingKey/isSewingSelected/toggleSewingSelected declared above
  const isSupportSelected = (indexOrId) => selectedSupportIds.value.has(indexOrId);
  const toggleSupportSelected = (indexOrId) => {
    const s = new Set(selectedSupportIds.value);
    s.has(indexOrId) ? s.delete(indexOrId) : s.add(indexOrId);
    selectedSupportIds.value = s;
  };
  const clearSelected = () => {
    selectedKeys.value = new Set();
    selectedSewingKeys.value = new Set();
    selectedSupportIds.value = new Set();
  };
  function onHoleClick(rowIndex, uid) {
    if (!selectingMode.value) return;
    toggleSelected(holeKey(rowIndex, uid));
  }
  function onSewingHoleClick(rowIndex, uid) {
    if (!selectingMode.value) return;
    toggleSewingSelected(sewingKey(rowIndex, uid));
  }
  function onSupportClick(index) {
    if (!selectingMode.value) return;
    toggleSupportSelected(supportEntries[index].id ?? index);
  }

    // Context menu
    const menu = reactive({
      visible: false,
      x: 0,
      y: 0,
      rowIndex: null,
      uid: null,
      group: false,
      kind: 'hole', // 'hole' | 'support' | 'sewing' | 'stroke' | 'headband-left' | 'headband-right'
      hbSide: null,
      hbIndex: null,
      supportIndex: null,
      strokeId: null,
    });
    function openHoleMenu(e, rowIndex, uid) {
      const key = holeKey(rowIndex, uid);
      menu.visible = true;
      menu.x = e.clientX;
      menu.y = e.clientY;
      menu.rowIndex = rowIndex;
      menu.uid = uid;
      // Group ops if clicked hole is selected and total holes selected across types >= 2
      menu.group = selectedKeys.value.has(key) && (selectedKeys.value.size + selectedSewingKeys.value.size) >= 2;
      menu.kind = 'hole';
      menu.hbSide = null;
      menu.hbIndex = null;
      menu.supportIndex = null;

      const close = (ev) => {
        const el = document.querySelector(".context-menu");
        if (el && el.contains(ev.target)) return;
        menu.visible = false;
        window.removeEventListener("mousedown", close, true);
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close, true);
      };
      window.addEventListener("mousedown", close, true);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close, true);
    }
    function openSupportMenu(e, index) {
      menu.visible = true;
      menu.x = e.clientX;
      menu.y = e.clientY;
      menu.kind = 'support';
      menu.supportIndex = index;
      menu.hbSide = null;
      menu.hbIndex = null;
      menu.rowIndex = null;
      menu.uid = null;
      const suppId = supportEntries[index]?.id ?? index;
      menu.group = postSelectMode.value && selectedSupportIds.value.has(suppId);

      const close = (ev) => {
        const el = document.querySelector(".context-menu");
        if (el && el.contains(ev.target)) return;
        menu.visible = false;
        window.removeEventListener("mousedown", close, true);
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close, true);
      };
      window.addEventListener("mousedown", close, true);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close, true);
    }
    function openSewingMenu(e, rowIndex, uid) {
      const key = sewingKey(rowIndex, uid);
      menu.visible = true;
      menu.x = e.clientX;
      menu.y = e.clientY;
      menu.rowIndex = rowIndex;
      menu.uid = uid;
      // Group ops if clicked sewing hole is selected and total holes selected across types >= 2
      menu.group = selectedSewingKeys.value.has(key) && (selectedKeys.value.size + selectedSewingKeys.value.size) >= 2;
      menu.kind = 'sewing';
      menu.hbSide = null;
      menu.hbIndex = null;
      menu.supportIndex = null;

      const close = (ev) => {
        const el = document.querySelector(".context-menu");
        if (el && el.contains(ev.target)) return;
        menu.visible = false;
        window.removeEventListener("mousedown", close, true);
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close, true);
      };
      window.addEventListener("mousedown", close, true);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close, true);
    }
    function openHeadbandMenu(e, side, index) {
      menu.visible = true;
      menu.x = e.clientX;
      menu.y = e.clientY;
      menu.kind = side === 'right' ? 'headband-right' : 'headband-left';
      menu.hbSide = side;
      menu.hbIndex = index;
      menu.supportIndex = null;
      menu.rowIndex = null;
      menu.uid = null;

      const close = (ev) => {
        const el = document.querySelector(".context-menu");
        if (el && el.contains(ev.target)) return;
        menu.visible = false;
        window.removeEventListener("mousedown", close, true);
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("resize", close, true);
      };
      window.addEventListener("mousedown", close, true);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close, true);
    }
    // Context menu for strokes drawn on canvas (recolor)
    function distToSeg(px, py, ax, ay, bx, by) {
      const vx = bx - ax, vy = by - ay;
      const wx = px - ax, wy = py - ay;
      const c1 = vx * wx + vy * wy;
      if (c1 <= 0) return Math.hypot(px - ax, py - ay);
      const c2 = vx * vx + vy * vy;
      if (c2 <= c1) return Math.hypot(px - bx, py - by);
      const t = c1 / c2;
      const projx = ax + t * vx, projy = ay + t * vy;
      return Math.hypot(px - projx, py - projy);
    }
    function hitStrokeAtClient(clientX, clientY) {
      const rect = drawCanvas.value?.getBoundingClientRect();
      if (!rect) return null;
      const x = clientX - rect.left,
        y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      const tol = 6; // pixels
      // search from top-most stroke
      for (let i = strokes.value.length - 1; i >= 0; i--) {
        const s = strokes.value[i];
        if (s.tool !== 'pen') continue; // recolor only pen strokes
        if (s.type === 'straight' && s.start && s.end) {
          const a = absPoint(s.start), b = absPoint(s.end);
          if (distToSeg(x, y, a.x, a.y, b.x, b.y) <= tol) return s.id;
        } else if (s.type === 'freehand' && s.points && s.points.length >= 2) {
          const pts = s.points.map(absPoint);
          for (let j = 1; j < pts.length; j++) {
            if (distToSeg(x, y, pts[j - 1].x, pts[j - 1].y, pts[j].x, pts[j].y) <= tol)
              return s.id;
          }
        }
      }
      return null;
    }

    // Get the exact position where user clicked on a stroke
    function getClickPositionOnStroke(clientX, clientY, strokeId) {
      const rect = drawCanvas.value?.getBoundingClientRect();
      if (!rect) return null;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const stroke = strokes.value.find(s => s.id === strokeId);
      
      if (!stroke) return null;
      
      if (stroke.type === 'straight' && stroke.start && stroke.end) {
        const startAbs = absPoint(stroke.start);
        const endAbs = absPoint(stroke.end);
        
        // Find the closest point on the line to the click
        const A = { x: startAbs.x, y: startAbs.y };
        const B = { x: endAbs.x, y: endAbs.y };
        const P = { x, y };
        
        // Calculate the projection of P onto line AB
        const AB = { x: B.x - A.x, y: B.y - A.y };
        const AP = { x: P.x - A.x, y: P.y - A.y };
        const AB_squared = AB.x * AB.x + AB.y * AB.y;
        
        if (AB_squared === 0) return { ...A, progress: 0 };
        
        const t = Math.max(0, Math.min(1, (AP.x * AB.x + AP.y * AB.y) / AB_squared));
        
        return {
          x: A.x + t * AB.x,
          y: A.y + t * AB.y,
          progress: t, // 0 to 1 along the line
          stroke
        };
      } else if (stroke.type === 'freehand' && stroke.points && stroke.points.length >= 2) {
        // For freehand, find the closest segment
        const pts = stroke.points.map(absPoint);
        let closestPoint = null;
        let closestDist = Infinity;
        let segmentIndex = 0;
        
        for (let i = 1; i < pts.length; i++) {
          const A = pts[i - 1];
          const B = pts[i];
          const P = { x, y };
          
          const AB = { x: B.x - A.x, y: B.y - A.y };
          const AP = { x: P.x - A.x, y: P.y - A.y };
          const AB_squared = AB.x * AB.x + AB.y * AB.y;
          
          if (AB_squared === 0) continue;
          
          const t = Math.max(0, Math.min(1, (AP.x * AB.x + AP.y * AB.y) / AB_squared));
          const projection = {
            x: A.x + t * AB.x,
            y: A.y + t * AB.y
          };
          
          const dist = Math.hypot(P.x - projection.x, P.y - projection.y);
          if (dist < closestDist) {
            closestDist = dist;
            segmentIndex = i - 1;
            closestPoint = {
              ...projection,
              progress: (segmentIndex + t) / (pts.length - 1),
              stroke
            };
          }
        }
        
        return closestPoint;
      }
      
      return null;
    }

    // Animation states
    const animations = reactive({
      knots: new Map(), // strokeId -> animation state
      ruptures: new Map() // strokeId -> animation state
    });

    // Create knot animation on a line
    function createKnotOnLine(strokeId, clickPoint, overlayX, overlayY) {
      if (!clickPoint) {
        // Fallback to regular placement
        addKnotAtPosition(overlayX, overlayY);
        return;
      }
      
      const animationId = `knot_${strokeId}_${Date.now()}`;
      
      // Start knot tying animation
      animateKnotTying(strokeId, clickPoint, animationId).then(() => {
        // After animation, modify the stroke to show permanent knot (no separate icon)
        modifyStrokeForKnot(strokeId, clickPoint);
      });
      
      // Exit knot mode
      addKnotMode.value = false;
    }

    // Create rupture animation on a line
    function createRuptureOnLine(strokeId, clickPoint, overlayX, overlayY) {
      if (!clickPoint) {
        // Fallback to regular placement
        addRuptureAtPosition(overlayX, overlayY);
        return;
      }
      
      const animationId = `rupture_${strokeId}_${Date.now()}`;
      
      // Start line snapping animation
      animateLineSnap(strokeId, clickPoint, animationId).then(() => {
        // After animation, split the stroke and add debris (no separate icon)
        splitStrokeWithDebris(strokeId, clickPoint);
      });
      
      // Exit rupture mode
      addRuptureMode.value = false;
    }

    // Animate knot tying effect
    async function animateKnotTying(strokeId, clickPoint, animationId) {
      const stroke = strokes.value.find(s => s.id === strokeId);
      if (!stroke) return;
      
      animations.knots.set(strokeId, {
        id: animationId,
        phase: 'gathering', // gathering -> looping -> tightening -> complete
        progress: 0,
        clickPoint,
        startTime: Date.now()
      });
      
      return new Promise((resolve) => {
        const animate = () => {
          const anim = animations.knots.get(strokeId);
          if (!anim || anim.id !== animationId) {
            resolve();
            return;
          }
          
          const elapsed = Date.now() - anim.startTime;
          const totalDuration = 2000; // 2 seconds
          
          if (elapsed >= totalDuration) {
            animations.knots.delete(strokeId);
            reRenderCanvas();
            resolve();
            return;
          }
          
          // Update animation progress
          anim.progress = elapsed / totalDuration;
          
          if (anim.progress < 0.3) {
            anim.phase = 'gathering';
          } else if (anim.progress < 0.7) {
            anim.phase = 'looping';
          } else {
            anim.phase = 'tightening';
          }
          
          reRenderCanvas();
          requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
      });
    }

    // Animate line snapping effect
    async function animateLineSnap(strokeId, clickPoint, animationId) {
      const stroke = strokes.value.find(s => s.id === strokeId);
      if (!stroke) return;
      
      animations.ruptures.set(strokeId, {
        id: animationId,
        phase: 'tension', // tension -> crack -> snap -> separate
        progress: 0,
        clickPoint,
        startTime: Date.now()
      });
      
      return new Promise((resolve) => {
        const animate = () => {
          const anim = animations.ruptures.get(strokeId);
          if (!anim || anim.id !== animationId) {
            resolve();
            return;
          }
          
          const elapsed = Date.now() - anim.startTime;
          const totalDuration = 1500; // 1.5 seconds
          
          if (elapsed >= totalDuration) {
            animations.ruptures.delete(strokeId);
            reRenderCanvas();
            resolve();
            return;
          }
          
          // Update animation progress
          anim.progress = elapsed / totalDuration;
          
          if (anim.progress < 0.2) {
            anim.phase = 'tension';
          } else if (anim.progress < 0.4) {
            anim.phase = 'crack';
          } else if (anim.progress < 0.7) {
            anim.phase = 'snap';
          } else {
            anim.phase = 'separate';
          }
          
          reRenderCanvas();
          requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
      });
    }

    // Modify stroke to show knot
    function modifyStrokeForKnot(strokeId, clickPoint) {
      const strokeIndex = strokes.value.findIndex(s => s.id === strokeId);
      if (strokeIndex === -1) return;
      
      const originalStroke = strokes.value[strokeIndex];
      
      if (originalStroke.type === 'straight') {
        // Replace straight line with knotted segments
        const knotStrokes = createKnottedStraightLine(originalStroke, clickPoint);
        strokes.value.splice(strokeIndex, 1, ...knotStrokes);
      } else if (originalStroke.type === 'freehand') {
        // Add knot to freehand stroke
        if (!originalStroke.knots) originalStroke.knots = [];
        originalStroke.knots.push({
          position: clickPoint.progress,
          point: { x: clickPoint.x / canvasWidth.value, y: clickPoint.y / canvasHeight.value },
          size: 12
        });
      }
      
      reRenderCanvas();
    }

    // Create multiple stroke segments that form a shoe-tie knot pattern
    function createKnottedStraightLine(originalStroke, clickPoint) {
      const knotStrokes = [];
      const knotSize = 8; // Smaller for more realistic appearance
      const knotX = clickPoint.x / canvasWidth.value;
      const knotY = clickPoint.y / canvasHeight.value;
      const loopWidth = knotSize * 1.5 / canvasWidth.value;
      const loopHeight = knotSize * 0.8 / canvasHeight.value;
      
      // Segment before knot (approaching from left)
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        end: { x: knotX - loopWidth/2, y: knotY }
      });
      
      // Left bow loop (like left side of shoelace bow)
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        type: 'bow-loop',
        center: { x: knotX - loopWidth/3, y: knotY },
        width: loopWidth/2,
        height: loopHeight,
        side: 'left',
        layer: 'over'
      });
      
      // Right bow loop (like right side of shoelace bow)
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        type: 'bow-loop',
        center: { x: knotX + loopWidth/3, y: knotY },
        width: loopWidth/2,
        height: loopHeight,
        side: 'right',
        layer: 'over'
      });
      
      // Center crossing (where the knot tightens)
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        type: 'bow-center',
        center: { x: knotX, y: knotY },
        width: loopWidth/4,
        height: loopHeight/3,
        layer: 'top'
      });
      
      // Connecting segments that go through the center
      // Left tail to center
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        type: 'bow-tail',
        start: { x: knotX - loopWidth/2, y: knotY },
        end: { x: knotX, y: knotY - loopHeight/4 },
        layer: 'under'
      });
      
      // Center to right tail  
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        type: 'bow-tail',
        start: { x: knotX, y: knotY + loopHeight/4 },
        end: { x: knotX + loopWidth/2, y: knotY },
        layer: 'under'
      });
      
      // Segment after knot (continuing to right)
      knotStrokes.push({
        ...originalStroke,
        id: strokeSeq++,
        start: { x: knotX + loopWidth/2, y: knotY }
      });
      
      return knotStrokes;
    }

    // Split stroke with debris effects
    function splitStrokeWithDebris(strokeId, clickPoint) {
      const strokeIndex = strokes.value.findIndex(s => s.id === strokeId);
      if (strokeIndex === -1) return;
      
      const originalStroke = strokes.value[strokeIndex];
      const debrisStrokes = [];
      
      if (originalStroke.type === 'straight') {
        // Split straight line into two parts with jagged breaks
        const breakX = clickPoint.x / canvasWidth.value;
        const breakY = clickPoint.y / canvasHeight.value;
        
        const newStroke1 = {
          ...originalStroke,
          id: strokeSeq++,
          end: { x: breakX - 0.005, y: breakY }, // Small gap
          broken: true,
          breakEnd: true
        };
        
        const newStroke2 = {
          ...originalStroke,
          id: strokeSeq++,
          start: { x: breakX + 0.005, y: breakY }, // Small gap
          broken: true,
          breakStart: true
        };
        
        debrisStrokes.push(newStroke1, newStroke2);
        
      } else if (originalStroke.type === 'freehand') {
        // Split freehand stroke at the closest point
        const points = originalStroke.points;
        const splitIndex = Math.floor(clickPoint.progress * (points.length - 1));
        
        if (splitIndex > 0 && splitIndex < points.length - 1) {
          const newStroke1 = {
            ...originalStroke,
            id: strokeSeq++,
            points: points.slice(0, splitIndex + 1),
            broken: true,
            breakEnd: true
          };
          
          const newStroke2 = {
            ...originalStroke,
            id: strokeSeq++,
            points: points.slice(splitIndex),
            broken: true,
            breakStart: true
          };
          
          debrisStrokes.push(newStroke1, newStroke2);
        }
      }
      
      // Create debris particles around break point
      const debrisCount = 8;
      const debrisX = clickPoint.x / canvasWidth.value;
      const debrisY = clickPoint.y / canvasHeight.value;
      
      for (let i = 0; i < debrisCount; i++) {
        const angle = (i / debrisCount) * Math.PI * 2;
        const distance = (Math.random() * 0.01) + 0.005; // Random small distance
        const size = (Math.random() * 0.003) + 0.001; // Random small size
        
        const debrisParticle = {
          id: strokeSeq++,
          tool: 'pen',
          type: 'debris',
          color: originalStroke.color,
          center: {
            x: debrisX + Math.cos(angle) * distance,
            y: debrisY + Math.sin(angle) * distance
          },
          size: size,
          rotation: Math.random() * Math.PI * 2
        };
        
        debrisStrokes.push(debrisParticle);
      }
      
      // Replace original with broken pieces and debris
      strokes.value.splice(strokeIndex, 1, ...debrisStrokes);
      reRenderCanvas();
    }

    function onGlobalContextMenu(ev) {
      const id = hitStrokeAtClient(ev.clientX, ev.clientY);
      if (!id) return; // let other menus work
      ev.preventDefault();
      ev.stopPropagation();
      menu.visible = true;
      menu.x = ev.clientX;
      menu.y = ev.clientY;
      menu.kind = 'stroke';
      menu.strokeId = id;
      menu.rowIndex = null;
      menu.uid = null;
      menu.supportIndex = null;
      menu.hbSide = null;
      menu.hbIndex = null;

      const close = (e2) => {
        const el = document.querySelector('.context-menu');
        if (el && el.contains(e2.target)) return;
        menu.visible = false;
        window.removeEventListener('mousedown', close, true);
        window.removeEventListener('scroll', close, true);
        window.removeEventListener('resize', close, true);
      };
      window.addEventListener('mousedown', close, true);
      window.addEventListener('scroll', close, true);
      window.addEventListener('resize', close, true);
    }
    onMounted(() => {
      window.addEventListener('contextmenu', onGlobalContextMenu, true);
    });
    onUnmounted(() => {
      window.removeEventListener('contextmenu', onGlobalContextMenu, true);
    });

    // Watch for knot menu changes to add/remove event listeners
    watch(showKnotMenu, (isVisible) => {
      if (isVisible) {
        const close = () => {
          closeKnotMenu();
          window.removeEventListener('mousedown', close, true);
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close, true);
        };
        window.addEventListener('mousedown', close, true);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close, true);
      }
    });

    // Watch for rupture menu changes to add/remove event listeners
    watch(showRuptureMenu, (isVisible) => {
      if (isVisible) {
        const close = () => {
          closeRuptureMenu();
          window.removeEventListener('mousedown', close, true);
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close, true);
        };
        window.addEventListener('mousedown', close, true);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close, true);
      }
    });
    function beginSelectFromMenu() {
      selectingMode.value = true;
      postSelectMode.value = false;
      clearSelected();
      if (menu.rowIndex != null && menu.uid != null)
        toggleSelected(holeKey(menu.rowIndex, menu.uid));
      menu.visible = false;
    }
    function beginSewingSelectFromMenu() {
      selectingMode.value = true;
      postSelectMode.value = false;
      clearSelected();
      if (menu.rowIndex != null && menu.uid != null)
        toggleSewingSelected(sewingKey(menu.rowIndex, menu.uid));
      menu.visible = false;
    }
    function beginSupportSelectFromMenu() {
      selectingMode.value = true;
      postSelectMode.value = false;
      clearSelected();
      if (menu.supportIndex != null) {
        const suppId = supportEntries[menu.supportIndex]?.id ?? menu.supportIndex;
        toggleSupportSelected(suppId);
      }
      menu.visible = false;
    }
    function removeFromMenu() {
      // If this is a group context, route to group delete
      if (menu.group) {
        deleteSelected();
        return;
      }
      if (menu.kind === 'hole') {
        if (menu.rowIndex == null || menu.uid == null) return;
        const row = changeHolesByRow.value[menu.rowIndex];
        const idx = row.findIndex((h) => h.uid === menu.uid);
        if (idx >= 0) row.splice(idx, 1);
        const key = holeKey(menu.rowIndex, menu.uid);
        if (selectedKeys.value.has(key)) {
          const s = new Set(selectedKeys.value);
          s.delete(key);
          selectedKeys.value = s;
        }
      } else if (menu.kind === 'sewing') {
        if (menu.rowIndex == null || menu.uid == null) return;
        const row = sewingHolesByRow.value[menu.rowIndex];
        const idx = row.findIndex((h) => h.uid === menu.uid);
        if (idx >= 0) row.splice(idx, 1);
        const key = sewingKey(menu.rowIndex, menu.uid);
        if (selectedSewingKeys.value.has(key)) {
          const s = new Set(selectedSewingKeys.value);
          s.delete(key);
          selectedSewingKeys.value = s;
        }
      } else if (menu.kind === 'support') {
        if (menu.supportIndex == null) return;
        const removed = supportEntries.splice(menu.supportIndex, 1)[0];
        if (removed && removed.id != null) {
          // Remove all sewing holes linked to this support
          sewingHolesByRow.value.forEach((arr) => {
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i].supportId === removed.id) arr.splice(i, 1);
            }
          });
        }
      } else if (menu.kind === 'headband-left') {
        if (menu.hbIndex == null) return;
        headbandLeftPositions.splice(menu.hbIndex, 1);
      } else if (menu.kind === 'headband-right') {
        if (menu.hbIndex == null) return;
        headbandRightPositions.splice(menu.hbIndex, 1);
      }
      menu.visible = false;
    }
    function finishSelection() {
      selectingMode.value = false;
      postSelectMode.value = true;
    }
    function cancelSelection() {
      selectingMode.value = false;
      postSelectMode.value = false;
      clearSelected();
    }
    function clearSelection() {
      postSelectMode.value = false;
      clearSelected();
    }
    function exitPostSelect() {
      menu.visible = false;
      clearSelection();
    }
    function deleteSelected() {
      selectedKeys.value.forEach((key) => {
        const [r, u] = key.split(":").map(Number);
        const row = changeHolesByRow.value[r];
        const idx = row.findIndex((h) => h.uid === u);
        if (idx >= 0) row.splice(idx, 1);
      });
      // Remove selected sewing holes
      selectedSewingKeys.value.forEach((key) => {
        const [r, u] = key.split(":").map(Number);
        const row = sewingHolesByRow.value[r];
        const idx = row.findIndex((h) => h.uid === u);
        if (idx >= 0) row.splice(idx, 1);
      });
      // Remove selected supports
      if (selectedSupportIds.value.size) {
        const removedIds = new Set();
        supportEntries.forEach((sp) => {
          if (selectedSupportIds.value.has(sp.id)) removedIds.add(sp.id);
        });
        const keep = supportEntries.filter((sp) => !removedIds.has(sp.id));
        supportEntries.splice(0, supportEntries.length, ...keep);
        // Remove sewing holes belonging to removed supports
        if (removedIds.size) {
          sewingHolesByRow.value.forEach((arr) => {
            for (let i = arr.length - 1; i >= 0; i--) {
              if (removedIds.has(arr[i].supportId)) arr.splice(i, 1);
            }
          });
        }
      }
      clearSelection();
      menu.visible = false;
    }

    /* ---------- Recolor (popup) ---------- */
    function openRecolorPopup(isGroup) {
      recolorForGroup.value = !!isGroup;
      if (!isGroup) {
        if (menu.kind === 'hole' && menu.rowIndex != null && menu.uid != null) {
          const row = changeHolesByRow.value[menu.rowIndex];
          const hole = row.find((h) => h.uid === menu.uid);
          if (hole) recolorColor.value = hole.color || "#4ea5de";
        } else if (menu.kind === 'sewing' && menu.rowIndex != null && menu.uid != null) {
          const row = sewingHolesByRow.value[menu.rowIndex];
          const hole = row.find((h) => h.uid === menu.uid);
          if (hole) recolorColor.value = hole.color || "#333";
        } else if (menu.kind === 'support' && menu.supportIndex != null) {
          const sp = supportEntries[menu.supportIndex];
          if (sp) recolorColor.value = sp.color || "#e2b043";
        }
      }
      showRecolorPopup.value = true;
      menu.visible = false;
    }
    const recolorHeading = computed(() => {
      if (recolorForGroup.value) return 'Recolor Selected…';
      if (menu.kind === 'support') return 'Recolor Support';
      if (menu.kind === 'hole') return 'Recolor Station';
      if (menu.kind === 'sewing') return 'Recolor Sewing Hole';
      if (menu.kind === 'stroke') return 'Recolor Pen Stroke';
      return 'Recolor';
    });
    function cancelRecolor() {
      showRecolorPopup.value = false;
    }
    function confirmRecolor() {
      if (recolorForGroup.value) {
        // Holes in selection
        selectedKeys.value.forEach((key) => {
          const [r, u] = key.split(":").map(Number);
          const hole = changeHolesByRow.value[r].find((h) => h.uid === u);
          if (hole) hole.color = recolorColor.value;
        });
        // Sewing holes in selection
        selectedSewingKeys.value.forEach((key) => {
          const [r, u] = key.split(":").map(Number);
          const hole = sewingHolesByRow.value[r].find((h) => h.uid === u);
          if (hole) hole.color = recolorColor.value;
        });
        // Supports in selection
        supportEntries.forEach((sp) => {
          if (selectedSupportIds.value.has(sp.id)) sp.color = recolorColor.value;
        });
      } else {
        if (menu.kind === 'hole' && menu.rowIndex != null && menu.uid != null) {
          const hole = changeHolesByRow.value[menu.rowIndex].find(
            (h) => h.uid === menu.uid
          );
          if (hole) hole.color = recolorColor.value;
        } else if (menu.kind === 'sewing' && menu.rowIndex != null && menu.uid != null) {
          const hole = sewingHolesByRow.value[menu.rowIndex].find(
            (h) => h.uid === menu.uid
          );
          if (hole) hole.color = recolorColor.value;
        } else if (menu.kind === 'support' && menu.supportIndex != null) {
          const sp = supportEntries[menu.supportIndex];
          if (sp) sp.color = recolorColor.value;
        } else if (menu.kind === 'stroke' && menu.strokeId != null) {
          const s = strokes.value.find((st) => st.id === menu.strokeId);
          if (s) {
            s.color = recolorColor.value;
            // redraw all strokes to apply new color
            nextTick(reRenderCanvas);
          }
        }
      }
      showRecolorPopup.value = false;
    }

    /* ---------- Pens & eraser ---------- */
    const pens = ref([]);
    const activePenId = ref(null);
    const eraserActive = ref(false);
    const showPenPopup = ref(false);
    const penForm = reactive({
      type: "straight",
      style: "solid",
      color: "#4ea5de",
    });
    const penHintVisible = ref(false);
    const lastCreatedPenId = ref(null);
    const penTooltip = (p) => `Color: ${p.color} • Type: ${p.type} • Style: ${p.style}`;

    // Vector strokes so we can recolor later
    const strokes = ref([]); // [{ id, tool:'pen'|'eraser', type:'straight'|'freehand'|'eraser'|'bow-*'|'debris', style, color, ... }]
    let strokeSeq = 1;
    let currentStroke = null; // working object while drawing

    function normPoint(pt) {
      const w = Math.max(1, canvasWidth.value);
      const h = Math.max(1, canvasHeight.value);
      return { x: pt.x / w, y: pt.y / h };
    }
    function absPoint(pt) {
      return { x: pt.x * canvasWidth.value, y: pt.y * canvasHeight.value };
    }
    function drawOneStroke(ctx, s) {
      const w = 2;
      
      // Check for active animations
      const knotAnim = animations.knots.get(s.id);
      const ruptureAnim = animations.ruptures.get(s.id);
      
      if (s.tool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s.width || 24;
        ctx.lineCap = 'round';
        const pts = (s.points || []).map(absPoint);
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, (s.width || 24) / 2, 0, 2 * Math.PI);
          ctx.fill();
        } else if (pts.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      
      // pen stroke with animation support
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.strokeStyle = s.color || '#4ea5de';
      
      // Handle line dash styles
      if (ctx.setLineDash) {
        if (s.style === 'dotted') ctx.setLineDash([2, 6]);
        else if (s.style === 'dashed') ctx.setLineDash([10, 8]);
        else ctx.setLineDash([]);
      }
      
      // Draw the stroke with animation effects
      if (s.type === 'straight' && s.start && s.end) {
        drawStraightStroke(ctx, s, knotAnim, ruptureAnim);
      } else if (s.type === 'freehand' && s.points && s.points.length > 0) {
        drawFreehandStroke(ctx, s, knotAnim, ruptureAnim);
      } else if (s.type === 'knot-loop') {
        drawKnotLoop(ctx, s);
      } else if (s.type === 'bow-loop') {
        drawBowLoop(ctx, s);
      } else if (s.type === 'bow-center') {
        drawBowCenter(ctx, s);
      } else if (s.type === 'bow-tail') {
        drawBowTail(ctx, s);
      } else if (s.type === 'debris') {
        drawDebrisParticle(ctx, s);
      }
      
      // Draw knots on freehand strokes
      if (s.knots && s.type === 'freehand') {
        drawFreehandKnots(ctx, s);
      }
      
      if (ctx.setLineDash) ctx.setLineDash([]);
      ctx.restore();
    }
    
    function drawStraightStroke(ctx, s, knotAnim, ruptureAnim) {
      const a = absPoint(s.start);
      const b = absPoint(s.end);
      
      if (ruptureAnim) {
        drawRuptureAnimation(ctx, s, ruptureAnim, a, b);
      } else if (knotAnim) {
        drawKnotAnimation(ctx, s, knotAnim, a, b);
      } else if (s.broken) {
        drawBrokenLine(ctx, a, b, s.breakStart, s.breakEnd);
      } else {
        // Normal straight line
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    
    function drawFreehandStroke(ctx, s, knotAnim, ruptureAnim) {
      const pts = s.points.map(absPoint);
      
      if (ruptureAnim) {
        drawFreehandRuptureAnimation(ctx, s, ruptureAnim, pts);
      } else if (knotAnim) {
        drawFreehandKnotAnimation(ctx, s, knotAnim, pts);
      } else if (s.broken) {
        drawBrokenFreehand(ctx, pts, s.breakStart, s.breakEnd, s.breakPoints);
      } else {
        // Normal freehand line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }
    }
    
    function drawRuptureAnimation(ctx, stroke, anim, startPt, endPt) {
      const clickPt = anim.clickPoint;
      const progress = anim.progress;
      
      if (anim.phase === 'tension') {
        // Show line with increasing tension (slight wobble)
        const wobbleIntensity = progress * 3;
        ctx.beginPath();
        
        // Create slightly wavy line to show tension
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = startPt.x + t * (endPt.x - startPt.x);
          const y = startPt.y + t * (endPt.y - startPt.y);
          
          // Add wobble near the click point
          const distanceFromClick = Math.abs(t - (clickPt.progress || 0.5));
          const wobbleAmount = Math.max(0, wobbleIntensity * (1 - distanceFromClick * 4));
          const wobbleY = y + Math.sin(t * Math.PI * 8) * wobbleAmount;
          
          if (i === 0) ctx.moveTo(x, wobbleY);
          else ctx.lineTo(x, wobbleY);
        }
        ctx.stroke();
        
      } else if (anim.phase === 'crack') {
        // Show crack forming
        const crackProgress = (progress - 0.2) / 0.2;
        drawCrackingLine(ctx, startPt, endPt, clickPt, crackProgress);
        
      } else if (anim.phase === 'snap') {
        // Show dramatic snap
        const snapProgress = (progress - 0.4) / 0.3;
        drawSnappingLine(ctx, startPt, endPt, clickPt, snapProgress);
        
      } else if (anim.phase === 'separate') {
        // Show pieces flying apart
        const separateProgress = (progress - 0.7) / 0.3;
        drawSeparatingPieces(ctx, startPt, endPt, clickPt, separateProgress);
      }
    }
    
    function drawKnotAnimation(ctx, stroke, anim, startPt, endPt) {
      const clickPt = anim.clickPoint;
      const progress = anim.progress;
      
      if (anim.phase === 'gathering') {
        // Show line gathering toward knot point
        const gatherProgress = progress / 0.3;
        drawGatheringLine(ctx, startPt, endPt, clickPt, gatherProgress);
        
      } else if (anim.phase === 'looping') {
        // Show loop formation
        const loopProgress = (progress - 0.3) / 0.4;
        drawLoopingLine(ctx, startPt, endPt, clickPt, loopProgress);
        
      } else if (anim.phase === 'tightening') {
        // Show knot tightening
        const tightenProgress = (progress - 0.7) / 0.3;
        drawTighteningKnot(ctx, startPt, endPt, clickPt, tightenProgress);
      }
    }
    
    function drawCrackingLine(ctx, startPt, endPt, clickPt, progress) {
      // Draw main line with small gap forming
      const gapSize = progress * 8;
      
      // Draw first segment
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(clickPt.x - gapSize/2, clickPt.y);
      ctx.stroke();
      
      // Draw second segment
      ctx.beginPath();
      ctx.moveTo(clickPt.x + gapSize/2, clickPt.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      
      // Draw crack lines
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 100, 100, ' + progress + ')';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * Math.PI / 6;
        const crackLength = progress * 10;
        ctx.beginPath();
        ctx.moveTo(clickPt.x, clickPt.y);
        ctx.lineTo(
          clickPt.x + Math.cos(angle) * crackLength,
          clickPt.y + Math.sin(angle) * crackLength
        );
        ctx.stroke();
      }
      ctx.restore();
    }
    
    function drawSnappingLine(ctx, startPt, endPt, clickPt, progress) {
      const snapIntensity = Math.sin(progress * Math.PI * 10) * 5 * (1 - progress);
      
      // Draw pieces with snap displacement
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(clickPt.x - 10 - snapIntensity, clickPt.y - snapIntensity);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(clickPt.x + 10 + snapIntensity, clickPt.y + snapIntensity);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      
      // Add spark effects
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 100, ' + (1 - progress) + ')';
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 15;
        const x = clickPt.x + Math.cos(angle) * dist;
        const y = clickPt.y + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    
    function drawSeparatingPieces(ctx, startPt, endPt, clickPt, progress) {
      const separation = progress * 20;
      
      // Calculate perpendicular direction for separation
      const dx = endPt.x - startPt.x;
      const dy = endPt.y - startPt.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / length;
      const perpY = dx / length;
      
      // Draw separated pieces
      ctx.save();
      ctx.globalAlpha = 1 - progress * 0.5;
      
      // First piece
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(
        clickPt.x - 10 + perpX * separation,
        clickPt.y - 10 + perpY * separation
      );
      ctx.stroke();
      
      // Second piece
      ctx.beginPath();
      ctx.moveTo(
        clickPt.x + 10 - perpX * separation,
        clickPt.y + 10 - perpY * separation
      );
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      
      ctx.restore();
    }
    
    function drawGatheringLine(ctx, startPt, endPt, clickPt, progress) {
      // Draw line with curve toward knot point
      const curves = progress * 0.3;
      
      ctx.beginPath();
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = startPt.x + t * (endPt.x - startPt.x);
        const y = startPt.y + t * (endPt.y - startPt.y);
        
        // Pull toward knot point
        const pullStrength = curves * Math.sin(t * Math.PI) * 20;
        const pullX = x + (clickPt.x - x) * pullStrength / 100;
        const pullY = y + (clickPt.y - y) * pullStrength / 100;
        
        if (i === 0) ctx.moveTo(pullX, pullY);
        else ctx.lineTo(pullX, pullY);
      }
      ctx.stroke();
    }
    
    function drawLoopingLine(ctx, startPt, endPt, clickPt, progress) {
      // Create loop at knot position
      const loopRadius = progress * 15;
      
      // Draw line up to loop
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(clickPt.x - loopRadius, clickPt.y);
      ctx.stroke();
      
      // Draw loop
      ctx.beginPath();
      ctx.arc(clickPt.x, clickPt.y, loopRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw line from loop
      ctx.beginPath();
      ctx.moveTo(clickPt.x + loopRadius, clickPt.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
    }
    
    function drawTighteningKnot(ctx, startPt, endPt, clickPt, progress) {
      const tightness = 1 - progress;
      const knotSize = 15 * tightness + 8;
      
      // Draw line segments
      ctx.beginPath();
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(clickPt.x - knotSize/2, clickPt.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(clickPt.x + knotSize/2, clickPt.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      
      // Draw tightening knot
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = ctx.strokeStyle;
      
      // Complex knot pattern
      const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
      angles.forEach((angle, i) => {
        ctx.beginPath();
        ctx.arc(
          clickPt.x + Math.cos(angle) * (knotSize/4),
          clickPt.y + Math.sin(angle) * (knotSize/4),
          knotSize/6,
          angle,
          angle + Math.PI + progress * Math.PI
        );
        ctx.stroke();
      });
      
      ctx.restore();
    }
    
    function drawBrokenLine(ctx, startPt, endPt, breakStart, breakEnd) {
      const gapSize = 12; // size of the gap where rupture occurs
      
      if (breakEnd) {
        // Line broken at end - draw most of line, skip end portion
        const endBreakDist = gapSize;
        const dx = endPt.x - startPt.x;
        const dy = endPt.y - startPt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > endBreakDist) {
          const t = (len - endBreakDist) / len;
          const breakX = startPt.x + t * dx;
          const breakY = startPt.y + t * dy;
          
          ctx.beginPath();
          ctx.moveTo(startPt.x, startPt.y);
          ctx.lineTo(breakX, breakY);
          ctx.stroke();
        }
      } else if (breakStart) {
        // Line broken at start - skip start portion, draw rest
        const startBreakDist = gapSize;
        const dx = endPt.x - startPt.x;
        const dy = endPt.y - startPt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > startBreakDist) {
          const t = startBreakDist / len;
          const breakX = startPt.x + t * dx;
          const breakY = startPt.y + t * dy;
          
          ctx.beginPath();
          ctx.moveTo(breakX, breakY);
          ctx.lineTo(endPt.x, endPt.y);
          ctx.stroke();
        }
      } else {
        // No break flags, draw normal line
        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
      }
    }
    
    function drawFreehandRuptureAnimation(ctx, stroke, anim, pts) {
      // Similar to straight line but for freehand curves
      drawFreehandStroke(ctx, { ...stroke, broken: false });
    }
    
    function drawFreehandKnotAnimation(ctx, stroke, anim, pts) {
      // Similar to straight line but for freehand curves
      drawFreehandStroke(ctx, { ...stroke, broken: false });
    }
    
    function drawBrokenFreehand(ctx, pts, breakStart, breakEnd, breakPoints) {
      if (pts.length < 2) return;
      
      const gapSize = 4; // pixels of gap around rupture
      
      if (breakPoints && breakPoints.length > 0) {
        // Draw freehand with gaps at specific indices
        let currentStart = 0;
        
        for (const breakIdx of breakPoints.sort((a, b) => a - b)) {
          // Draw segment before break
          if (currentStart < breakIdx) {
            ctx.beginPath();
            ctx.moveTo(pts[currentStart].x, pts[currentStart].y);
            
            // Calculate where to stop (gapSize before break point)
            const dx = pts[breakIdx].x - pts[breakIdx - 1].x;
            const dy = pts[breakIdx].y - pts[breakIdx - 1].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);
            
            if (segLen > 0) {
              const t = Math.max(0, 1 - (gapSize / segLen));
              for (let i = currentStart; i < breakIdx; i++) {
                if (i === breakIdx - 1) {
                  // Draw up to gap
                  const stopX = pts[i].x + t * (pts[i + 1].x - pts[i].x);
                  const stopY = pts[i].y + t * (pts[i + 1].y - pts[i].y);
                  ctx.lineTo(stopX, stopY);
                } else {
                  ctx.lineTo(pts[i].x, pts[i].y);
                }
              }
            }
            ctx.stroke();
          }
          
          // Skip the gap
          const skipFrom = Math.max(breakIdx, currentStart + 1);
          currentStart = skipFrom + 1;
        }
        
        // Draw remaining segments after last break
        if (currentStart < pts.length) {
          ctx.beginPath();
          ctx.moveTo(pts[currentStart].x, pts[currentStart].y);
          for (let i = currentStart + 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
        }
      } else if (breakEnd) {
        // Line broken at end - skip last gapSize distance
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        
        for (let i = 1; i < pts.length - 1; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        
        // Draw up to gapSize before the end
        if (pts.length >= 2) {
          const lastIdx = pts.length - 1;
          const dx = pts[lastIdx].x - pts[lastIdx - 1].x;
          const dy = pts[lastIdx].y - pts[lastIdx - 1].y;
          const segLen = Math.sqrt(dx * dx + dy * dy);
          
          if (segLen > gapSize) {
            const t = (segLen - gapSize) / segLen;
            const stopX = pts[lastIdx - 1].x + t * dx;
            const stopY = pts[lastIdx - 1].y + t * dy;
            ctx.lineTo(stopX, stopY);
          }
        }
        ctx.stroke();
      } else if (breakStart) {
        // Line broken at start - skip first gapSize distance
        ctx.beginPath();
        
        // Start from gapSize into the line
        if (pts.length >= 2) {
          const dx = pts[1].x - pts[0].x;
          const dy = pts[1].y - pts[0].y;
          const segLen = Math.sqrt(dx * dx + dy * dy);
          
          if (segLen > gapSize) {
            const t = gapSize / segLen;
            const startX = pts[0].x + t * dx;
            const startY = pts[0].y + t * dy;
            ctx.moveTo(startX, startY);
          }
        }
        
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      } else {
        // Normal freehand line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }
    }
    
    function drawKnotLoop(ctx, stroke) {
      const center = absPoint(stroke.center);
      const radius = stroke.radius * canvasWidth.value;
      
      ctx.save();
      ctx.strokeStyle = stroke.color || '#4ea5de';
      ctx.lineWidth = stroke.layer === 'over' ? 3 : 2;
      
      // Draw the loop with proper layering
      if (stroke.layer === 'under') {
        ctx.globalAlpha = 0.7; // Make under layers slightly transparent
      }
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, stroke.startAngle, stroke.endAngle);
      ctx.stroke();
      
      // Add small gaps to show over/under effect
      if (stroke.layer === 'under') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 1;
        
        // Create small breaks in the under loop
        const breakAngle1 = stroke.startAngle + (stroke.endAngle - stroke.startAngle) * 0.3;
        const breakAngle2 = stroke.startAngle + (stroke.endAngle - stroke.startAngle) * 0.7;
        
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, breakAngle1 - 0.1, breakAngle1 + 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, breakAngle2 - 0.1, breakAngle2 + 0.1);
        ctx.stroke();
        
        ctx.restore();
      }
      
      ctx.restore();
    }
    
    function drawBowLoop(ctx, stroke) {
      const center = absPoint(stroke.center);
      const width = stroke.width * canvasWidth.value;
      const height = stroke.height * canvasHeight.value;
      
      ctx.save();
      ctx.strokeStyle = stroke.color || '#4ea5de';
      ctx.fillStyle = stroke.color || '#4ea5de';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      
      // Draw filled bow loop with curved shape
      ctx.beginPath();
      
      if (stroke.side === 'left') {
        // Left bow loop - curved like fabric
        ctx.moveTo(center.x + width/3, center.y - height);
        ctx.quadraticCurveTo(center.x - width, center.y - height/2, center.x - width, center.y);
        ctx.quadraticCurveTo(center.x - width, center.y + height/2, center.x + width/3, center.y + height);
        ctx.quadraticCurveTo(center.x + width/2, center.y, center.x + width/3, center.y - height);
      } else {
        // Right bow loop - mirror of left
        ctx.moveTo(center.x - width/3, center.y - height);
        ctx.quadraticCurveTo(center.x + width, center.y - height/2, center.x + width, center.y);
        ctx.quadraticCurveTo(center.x + width, center.y + height/2, center.x - width/3, center.y + height);
        ctx.quadraticCurveTo(center.x - width/2, center.y, center.x - width/3, center.y - height);
      }
      
      // Fill with slight transparency for fabric effect
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.restore();
      
      // Stroke outline
      ctx.stroke();
      
      // Add fold lines to show fabric dimension
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      
      if (stroke.side === 'left') {
        ctx.beginPath();
        ctx.moveTo(center.x + width/3, center.y - height/2);
        ctx.quadraticCurveTo(center.x - width/2, center.y, center.x + width/3, center.y + height/2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(center.x - width/3, center.y - height/2);
        ctx.quadraticCurveTo(center.x + width/2, center.y, center.x - width/3, center.y + height/2);
        ctx.stroke();
      }
      ctx.restore();
      
      ctx.restore();
    }
    
    function drawBowCenter(ctx, stroke) {
      const center = absPoint(stroke.center);
      const width = stroke.width * canvasWidth.value;
      const height = stroke.height * canvasHeight.value;
      
      ctx.save();
      ctx.strokeStyle = stroke.color || '#4ea5de';
      ctx.fillStyle = stroke.color || '#4ea5de';
      ctx.lineWidth = 1.5;
      
      // Draw ribbon center knot with wrapped appearance
      ctx.beginPath();
      // Create a rounded rectangle for the center wrap
      const rectWidth = width * 2;
      const rectHeight = height * 2;
      const radius = height;
      
      ctx.moveTo(center.x - rectWidth/2 + radius, center.y - rectHeight/2);
      ctx.arcTo(center.x + rectWidth/2, center.y - rectHeight/2, center.x + rectWidth/2, center.y + rectHeight/2, radius);
      ctx.arcTo(center.x + rectWidth/2, center.y + rectHeight/2, center.x - rectWidth/2, center.y + rectHeight/2, radius);
      ctx.arcTo(center.x - rectWidth/2, center.y + rectHeight/2, center.x - rectWidth/2, center.y - rectHeight/2, radius);
      ctx.arcTo(center.x - rectWidth/2, center.y - rectHeight/2, center.x + rectWidth/2, center.y - rectHeight/2, radius);
      
      // Fill with gradient effect
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.restore();
      
      // Stroke outline
      ctx.stroke();
      
      // Add vertical wrapping lines to show how ribbon is tied
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1;
      
      // Left wrap line
      ctx.beginPath();
      ctx.moveTo(center.x - rectWidth/3, center.y - rectHeight/2);
      ctx.lineTo(center.x - rectWidth/3, center.y + rectHeight/2);
      ctx.stroke();
      
      // Right wrap line
      ctx.beginPath();
      ctx.moveTo(center.x + rectWidth/3, center.y - rectHeight/2);
      ctx.lineTo(center.x + rectWidth/3, center.y + rectHeight/2);
      ctx.stroke();
      
      // Center crease
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y - rectHeight/2);
      ctx.lineTo(center.x, center.y + rectHeight/2);
      ctx.stroke();
      ctx.restore();
      
      ctx.restore();
      ctx.restore();
    }
    
    function drawBowTail(ctx, stroke) {
      const start = absPoint(stroke.start);
      const end = absPoint(stroke.end);
      
      ctx.save();
      ctx.strokeStyle = stroke.color || '#4ea5de';
      ctx.fillStyle = stroke.color || '#4ea5de';
      ctx.lineWidth = stroke.layer === 'under' ? 1.5 : 2;
      ctx.lineCap = 'round';
      
      if (stroke.layer === 'under') {
        ctx.globalAlpha = 0.7;
      }
      
      // Create flowing ribbon tail with width
      const tailWidth = 4;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const curveOffset = stroke.layer === 'under' ? 3 : -3;
      
      // Calculate perpendicular direction for ribbon width
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / length * tailWidth;
      const perpY = dx / length * tailWidth;
      
      // Draw filled ribbon tail
      ctx.beginPath();
      ctx.moveTo(start.x + perpX/2, start.y + perpY/2);
      ctx.quadraticCurveTo(
        midX + perpX/2, 
        midY + curveOffset + perpY/2, 
        end.x + perpX/2, 
        end.y + perpY/2
      );
      ctx.lineTo(end.x - perpX/2, end.y - perpY/2);
      ctx.quadraticCurveTo(
        midX - perpX/2, 
        midY + curveOffset - perpY/2, 
        start.x - perpX/2, 
        start.y - perpY/2
      );
      ctx.closePath();
      
      // Fill with transparency for ribbon effect
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.restore();
      
      // Stroke both edges
      ctx.beginPath();
      ctx.moveTo(start.x + perpX/2, start.y + perpY/2);
      ctx.quadraticCurveTo(
        midX + perpX/2, 
        midY + curveOffset + perpY/2, 
        end.x + perpX/2, 
        end.y + perpY/2
      );
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(start.x - perpX/2, start.y - perpY/2);
      ctx.quadraticCurveTo(
        midX - perpX/2, 
        midY + curveOffset - perpY/2, 
        end.x - perpX/2, 
        end.y - perpY/2
      );
      ctx.stroke();
      
      // Add center line for ribbon fold
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(midX, midY + curveOffset, end.x, end.y);
      ctx.stroke();
      ctx.restore();
      
      ctx.restore();
    }
    
    function drawDebrisParticle(ctx, debris) {
      const center = absPoint(debris.center);
      const size = debris.size * canvasWidth.value;
      
      ctx.save();
      ctx.fillStyle = debris.color || '#4ea5de';
      ctx.strokeStyle = debris.color || '#4ea5de';
      ctx.translate(center.x, center.y);
      ctx.rotate(debris.rotation);
      
      // Draw small irregular debris shapes
      const shapeType = Math.floor(debris.rotation * 3) % 3;
      
      if (shapeType === 0) {
        // Small rectangle
        ctx.fillRect(-size/2, -size/4, size, size/2);
      } else if (shapeType === 1) {
        // Small circle
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Small triangle
        ctx.beginPath();
        ctx.moveTo(-size/2, size/2);
        ctx.lineTo(size/2, size/2);
        ctx.lineTo(0, -size/2);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    function drawFreehandKnots(ctx, stroke) {
      if (!stroke.knots) return;
      
      stroke.knots.forEach(knot => {
        const knotPt = absPoint(knot.point);
        const knotSize = knot.size || 12;
        
        // Draw elegant ribbon bow for freehand strokes
        ctx.save();
        ctx.strokeStyle = stroke.color || '#4ea5de';
        ctx.fillStyle = stroke.color || '#4ea5de';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        // Left bow wing - curved fabric shape
        ctx.beginPath();
        ctx.moveTo(knotPt.x - knotSize * 0.1, knotPt.y - knotSize * 0.3);
        ctx.quadraticCurveTo(knotPt.x - knotSize * 0.5, knotPt.y - knotSize * 0.2, knotPt.x - knotSize * 0.5, knotPt.y);
        ctx.quadraticCurveTo(knotPt.x - knotSize * 0.5, knotPt.y + knotSize * 0.2, knotPt.x - knotSize * 0.1, knotPt.y + knotSize * 0.3);
        ctx.quadraticCurveTo(knotPt.x - knotSize * 0.05, knotPt.y, knotPt.x - knotSize * 0.1, knotPt.y - knotSize * 0.3);
        
        // Fill with transparency
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.restore();
        ctx.stroke();
        
        // Right bow wing - mirror of left
        ctx.beginPath();
        ctx.moveTo(knotPt.x + knotSize * 0.1, knotPt.y - knotSize * 0.3);
        ctx.quadraticCurveTo(knotPt.x + knotSize * 0.5, knotPt.y - knotSize * 0.2, knotPt.x + knotSize * 0.5, knotPt.y);
        ctx.quadraticCurveTo(knotPt.x + knotSize * 0.5, knotPt.y + knotSize * 0.2, knotPt.x + knotSize * 0.1, knotPt.y + knotSize * 0.3);
        ctx.quadraticCurveTo(knotPt.x + knotSize * 0.05, knotPt.y, knotPt.x + knotSize * 0.1, knotPt.y - knotSize * 0.3);
        
        // Fill with transparency
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.restore();
        ctx.stroke();
        
        // Center ribbon wrap
        const centerWidth = knotSize * 0.2;
        const centerHeight = knotSize * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(knotPt.x - centerWidth, knotPt.y - centerHeight/2);
        ctx.arcTo(knotPt.x + centerWidth, knotPt.y - centerHeight/2, knotPt.x + centerWidth, knotPt.y + centerHeight/2, centerHeight/4);
        ctx.arcTo(knotPt.x + centerWidth, knotPt.y + centerHeight/2, knotPt.x - centerWidth, knotPt.y + centerHeight/2, centerHeight/4);
        ctx.arcTo(knotPt.x - centerWidth, knotPt.y + centerHeight/2, knotPt.x - centerWidth, knotPt.y - centerHeight/2, centerHeight/4);
        ctx.arcTo(knotPt.x - centerWidth, knotPt.y - centerHeight/2, knotPt.x + centerWidth, knotPt.y - centerHeight/2, centerHeight/4);
        
        // Fill center wrap
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.restore();
        ctx.stroke();
        
        // Add fold lines for realism
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1;
        
        // Left wing fold
        ctx.beginPath();
        ctx.moveTo(knotPt.x - knotSize * 0.1, knotPt.y - knotSize * 0.15);
        ctx.quadraticCurveTo(knotPt.x - knotSize * 0.25, knotPt.y, knotPt.x - knotSize * 0.1, knotPt.y + knotSize * 0.15);
        ctx.stroke();
        
        // Right wing fold
        ctx.beginPath();
        ctx.moveTo(knotPt.x + knotSize * 0.1, knotPt.y - knotSize * 0.15);
        ctx.quadraticCurveTo(knotPt.x + knotSize * 0.25, knotPt.y, knotPt.x + knotSize * 0.1, knotPt.y + knotSize * 0.15);
        ctx.stroke();
        
        // Center wrap lines
        ctx.beginPath();
        ctx.moveTo(knotPt.x - centerWidth * 0.5, knotPt.y - centerHeight/2);
        ctx.lineTo(knotPt.x - centerWidth * 0.5, knotPt.y + centerHeight/2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(knotPt.x + centerWidth * 0.5, knotPt.y - centerHeight/2);
        ctx.lineTo(knotPt.x + centerWidth * 0.5, knotPt.y + centerHeight/2);
        ctx.stroke();
        
        ctx.restore();
        ctx.restore();
      });
    }
    function reRenderCanvas() {
      const ctx = drawCanvas.value?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height);
      for (const s of strokes.value) drawOneStroke(ctx, s);
    }

    function confirmPen() {
      const id = pens.value.length + 1;
      const data = JSON.parse(JSON.stringify(penForm));
      pens.value.push({ id, ...data });
      activePenId.value = id;
      eraserActive.value = false;
      showPenPopup.value = false;

      // Show 3s hint over the newly created pen button
      lastCreatedPenId.value = id;
      penHintVisible.value = true;
      setTimeout(() => {
        penHintVisible.value = false;
      }, 3000);
    }
    function togglePen(id) {
      activePenId.value = activePenId.value === id ? null : id;
      if (activePenId.value) eraserActive.value = false;
    }
    function toggleEraser() {
      eraserActive.value = !eraserActive.value;
      if (eraserActive.value) activePenId.value = null;
    }
    function deactivateCurrentPen() {
      activePenId.value = null;
      eraserActive.value = false;
    }

    // Canvas drawing
    const drawCanvas = ref(null);
    const canvasWidth = ref(0);
    const canvasHeight = ref(0);

    // The drawable region (for pens) should match the distance
    // between the Head and Tail columns, same as the top ruler.
    function getDrawableWidth() {
      if (tableContainer.value) {
        // Prefer the precise Head..Tail span measured for the top ruler.
        if (topRulerWidth.value > 0) {
          return Math.max(1, topRulerWidth.value);
        }
        // Fallback: compute alignment once if not yet measured.
        updateTopRulerAlignment();
        if (topRulerWidth.value > 0) {
          return Math.max(1, topRulerWidth.value);
        }
        // Last resort: use full container width.
        return Math.max(1, tableContainer.value.offsetWidth);
      }
      return canvasWidth.value || 1;
    }

    function getDrawableOffsetPixels() {
      // Align canvas left edge with the Head column, matching the top ruler.
      if (tableContainer.value) {
        if (topRulerLeft.value > 0) return topRulerLeft.value;
        updateTopRulerAlignment();
        return topRulerLeft.value || 0;
      }
      return 0;
    }

    function resizeCanvas() {
      if (tableContainer.value) {
        // Keep canvas exactly in sync with the current Head–Tail span.
        updateTopRulerAlignment();
        canvasWidth.value = getDrawableWidth();
        canvasHeight.value = tableContainer.value.offsetHeight;
      }
      // Repaint stored strokes after resize to keep positions consistent
      reRenderCanvas();
      updateScrollability();
    }
    onMounted(() => {
      nextTick(() => resizeCanvas());
      window.addEventListener("resize", resizeCanvas);
    });
    watch(tableContainer, () => resizeCanvas());
    watch([rows, () => rowHeight.value], () => nextTick(() => resizeCanvas())); // keep canvas in sync as rows change

    const drawing = ref(false);
    const lastPoint = ref({ x: 0, y: 0 });
    const startPoint = ref({ x: 0, y: 0 });
    let snapshot = null;

    function getPenStyle() {
      return (
        pens.value.find((p) => p.id === activePenId.value) || {
          color: "#000",
          style: "solid",
          type: "straight",
        }
      );
    }

    function startDraw(e) {
      if (!activePenId.value && !eraserActive.value) return;
      const rect = drawCanvas.value.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      drawing.value = true;
      lastPoint.value = point;
      startPoint.value = point;
      const pen = getPenStyle();
      const ctx = drawCanvas.value.getContext("2d");
      if (eraserActive.value) {
        currentStroke = { id: strokeSeq++, tool: 'eraser', type: 'eraser', width: 24, points: [normPoint(point)] };
        return; // eraser doesn't need pen setup
      }

      if (pen.type === "straight") {
        snapshot = ctx.getImageData(
          0,
          0,
          drawCanvas.value.width,
          drawCanvas.value.height
        );
        currentStroke = { id: strokeSeq++, tool: 'pen', type: 'straight', style: pen.style, color: pen.color, start: normPoint(point), end: null };
      } else {
        // Freehand: start a continuous path so dashed/dotted are consistent
        snapshot = null;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = pen.color;
        if (pen.style === "dotted") ctx.setLineDash([2, 6]);
        else if (pen.style === "dashed") ctx.setLineDash([10, 8]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        currentStroke = { id: strokeSeq++, tool: 'pen', type: 'freehand', style: pen.style, color: pen.color, points: [normPoint(point)] };
      }
    }

    function drawMove(e) {
      if (!drawing.value) return;
      const ctx = drawCanvas.value.getContext("2d");
      const rect = drawCanvas.value.getBoundingClientRect();
      const curr = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (eraserActive.value) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(curr.x, curr.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        if (currentStroke) currentStroke.points.push(normPoint(curr));
        lastPoint.value = curr;
        return;
      }

      if (!activePenId.value) return;
      const pen = getPenStyle();
      if (pen.type === "straight") {
        // Prepare styles for straight preview
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = pen.color;
        if (pen.style === "dotted") ctx.setLineDash([2, 6]);
        else if (pen.style === "dashed") ctx.setLineDash([10, 8]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        if (snapshot) ctx.putImageData(snapshot, 0, 0);
        ctx.moveTo(startPoint.value.x, startPoint.value.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Freehand: continue existing path without restarting dashes
        ctx.lineTo(curr.x, curr.y);
        lastPoint.value = curr;
        ctx.stroke();
        if (currentStroke && currentStroke.points) currentStroke.points.push(normPoint(curr));
      }
    }

    function endDraw(e) {
      if (!drawing.value) return;
      const ctx = drawCanvas.value.getContext("2d");
      if (eraserActive.value) {
        drawing.value = false;
        if (currentStroke) strokes.value.push(currentStroke);
        currentStroke = null;
        snapshot = null;
        return;
      }
      if (!activePenId.value) return;

      const pen = getPenStyle();
      if (pen.type === "straight") {
        const rect = drawCanvas.value.getBoundingClientRect();
        const end = e
          ? { x: e.clientX - rect.left, y: e.clientY - rect.top }
          : lastPoint.value;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = pen.color;
        if (pen.style === "dotted") ctx.setLineDash([2, 6]);
        else if (pen.style === "dashed") ctx.setLineDash([10, 8]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(startPoint.value.x, startPoint.value.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (currentStroke) {
          currentStroke.end = normPoint(end);
          strokes.value.push(currentStroke);
          currentStroke = null;
        }
      } else {
        // Freehand: close out dash styles to default
        ctx.setLineDash([]);
        if (currentStroke) {
          strokes.value.push(currentStroke);
          currentStroke = null;
        }
      }
      drawing.value = false;
      snapshot = null;
    }

    /* ---------- Export to PDF (legend + pens) ---------- */
    const showExportPopup = ref(false);
    const showPreviewPopup = ref(false);
    const previewImg = ref("");
    const exportMode = ref(false); // no longer used for export layout; kept for potential UI hooks
    const noteRefs = ref([]);

    // For PDF/preview we capture what the user sees on screen,
    // but temporarily change the Notes column so that only the
    // first row shows "View Notes Below" and all other rows are blank.
    async function withExportLayout(fn) {
      const root = tableContainer.value || document.querySelector(".table-container");
      const inputs = root
        ? Array.from(root.querySelectorAll("input.notes-input"))
        : [];

      const originalPlaceholders = [];
      const originalValues = [];

      // Temporarily override placeholders/values for export snapshot
      inputs.forEach((input, index) => {
        originalPlaceholders[index] = input.placeholder;
        originalValues[index] = input.value;

        if (index === 0) {
          input.value = "";
          input.placeholder = "View Notes Below";
        } else {
          input.value = "";
          input.placeholder = "";
        }
      });

      try {
        return await fn();
      } finally {
        // Restore original placeholders/values
        inputs.forEach((input, index) => {
          input.placeholder = originalPlaceholders[index] ?? "";
          input.value = originalValues[index] ?? "";
        });
      }
    }
    async function previewPDF() {
      try {
        const target = tableContainer.value || document.querySelector(".bookbinding-screen");
        const dataUrl = await withExportLayout(async () => {
          const canvas = await html2canvas(target, { scale: 1.2, useCORS: true });
          // Show full view (including Notes) in preview
          return canvas.toDataURL("image/jpeg", 0.72);
        });
        previewImg.value = dataUrl;
        showPreviewPopup.value = true;
      } catch (e) {
        console.error("Preview failed:", e);
      }
    }
    async function exportToPDF() {
      try {
        const target = tableContainer.value || document.querySelector(".bookbinding-screen");
        const canvas = await withExportLayout(async () => {
          return await html2canvas(target, { scale: 1.2, useCORS: true });
        });

        // Use the full canvas so geometry (including Notes column width)
        // exactly matches what the user saw on screen.
        const exportCanvas = canvas;
        const imgData = exportCanvas.toDataURL("image/jpeg", 0.72);
        const snapWidth = exportCanvas.width;
        const snapHeight = exportCanvas.height;

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "a4",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const margin = 24; // smaller margins to allow larger table
        const gap = 10; // tighter spacing between sections

        const hasHeadbands =
          headbandLeftPositions.length > 0 || headbandRightPositions.length > 0;
        const hasSupports = supportEntries.length > 0;
        const hasChangeovers = changeHolesByRow.value.some(
          (r) => r && r.length > 0
        );
        const hasPens = pens.value.length > 0;

        // Count knots/ruptures from both free‑floating icons and direct line edits
        const getLegendKnotCount = () => {
          let count = knotEntries.length;
          // Each 'bow-center' stroke corresponds to one knot on a straight line
          for (const s of strokes.value) {
            if (s.type === "bow-center") count++;
            if (Array.isArray(s.knots)) count += s.knots.length;
          }
          return count;
        };
        const getLegendRuptureCount = () => {
          let count = ruptureEntries.length;
          // Each broken segment that starts after a gap represents one rupture
          for (const s of strokes.value) {
            if (s.broken && s.breakStart) count++;
          }
          return count;
        };
        const knotLegendCount = getLegendKnotCount();
        const ruptureLegendCount = getLegendRuptureCount();

        const rowsLegend = [];
        if (hasHeadbands) rowsLegend.push({ kind: "headband" });
        if (hasSupports) rowsLegend.push({ kind: "support" });
        if (hasChangeovers) rowsLegend.push({ kind: "changeover" });
        if (knotLegendCount > 0) rowsLegend.push({ kind: "knot", count: knotLegendCount });
        if (ruptureLegendCount > 0) rowsLegend.push({ kind: "rupture", count: ruptureLegendCount });

        const headerH = 16;
        const sectionH = 14;
        const lineH = 14;
        const padX = 10;
        const padY = 8;

        const legendItemsH =
          rowsLegend.length * lineH +
          (hasPens ? sectionH + pens.value.length * lineH + 6 : 0);
        const legendBoxH =
          rowsLegend.length || hasPens
            ? headerH + padY + legendItemsH + padY
            : 0;

        // Metadata box — before legend
        const metaItems = [];
        if (props.title) metaItems.push(["Title", String(props.title)]);
        if (props.location) metaItems.push(["City/Repository", String(props.location)]);
        if (props.shelfmark) metaItems.push(["Shelfmark", String(props.shelfmark)]);
        if (props.manuscriptDate) metaItems.push(["Date", String(props.manuscriptDate)]);

        // Structural metadata from the same inputs that drive the table
        const qCount = Math.max(0, num(props.quires, 0));
        if (qCount > 0) metaItems.push(["Number of Quires", String(qCount)]);

        const foliosPerQ = Math.max(
          0,
          num(props.foliosPerQuire, num(props.leavesPerQuire, 0))
        );
        if (foliosPerQ > 0)
          metaItems.push(["Folios per Quire", String(foliosPerQ)]);

        if (totalCmNumber.value)
          metaItems.push([
            "Spine Length (cm)",
            totalCmNumber.value.toFixed(1),
          ]);
        const metaBoxH = metaItems.length
          ? headerH + padY + metaItems.length * lineH + padY
          : 0;

        const availableWidth = pageWidth - margin * 2;
        const availableHeight =
          pageHeight -
          margin * 2 -
          (metaBoxH ? metaBoxH + gap : 0) -
          (legendBoxH ? legendBoxH + gap : 0);

        const ratio = Math.min(
          availableWidth / Math.max(1, snapWidth),
          availableHeight / Math.max(1, snapHeight)
        );
        const w = Math.max(1, snapWidth) * ratio;
        const h = Math.max(1, snapHeight) * ratio;
        const x = (pageWidth - w) / 2;
        const y = margin;

        pdf.addImage(imgData, "JPEG", x, y, w, h, undefined, "FAST");

        // Place metadata and legend beneath the image on the same page
        let nextY = y + h + gap;
        if (metaBoxH > 0) {
          const metaW = Math.max(420, Math.min(520, w));
          const metaX = (pageWidth - metaW) / 2;
          const metaY = nextY;

          pdf.setDrawColor(200, 208, 219);
          pdf.setFillColor(249, 251, 253);
          pdf.roundedRect(metaX, metaY, metaW, metaBoxH, 8, 8, "FD");

          pdf.setTextColor(20, 30, 45);
          pdf.setFontSize(13);
          pdf.setFont("helvetica", "bold");
          pdf.text("Metadata", metaX + padX, metaY + padY + 10);

          pdf.setDrawColor(220, 224, 230);
          pdf.line(metaX + padX, metaY + padY + headerH, metaX + metaW - padX, metaY + padY + headerH);

          let rowY = metaY + padY + headerH + 10;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setTextColor(26, 33, 45);
          for (const [k, v] of metaItems) {
            pdf.text(`${k}: ${v}`, metaX + padX, rowY);
            rowY += lineH;
          }

          nextY = metaY + metaBoxH + gap;
        }

        if (legendBoxH > 0) {
          const legendW = Math.max(420, Math.min(520, w));
          const legendX = (pageWidth - legendW) / 2;
          const legendY = nextY;

          pdf.setDrawColor(200, 208, 219);
          pdf.setFillColor(249, 251, 253);
          pdf.roundedRect(legendX, legendY, legendW, legendBoxH, 8, 8, "FD");

          pdf.setTextColor(20, 30, 45);
          pdf.setFontSize(13);
          pdf.setFont("helvetica", "bold");
          pdf.text("Legend", legendX + padX, legendY + padY + 10);

          pdf.setDrawColor(220, 224, 230);
          pdf.line(
            legendX + padX,
            legendY + padY + headerH,
            legendX + legendW - padX,
            legendY + padY + headerH
          );

          let rowY = legendY + padY + headerH + 10;
          const iconX = legendX + padX;
          const labelX = iconX + 34;

          function drawLabel(textX, label) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
            pdf.setTextColor(26, 33, 45);
            pdf.text(label, textX, rowY);
          }

          for (const item of rowsLegend) {
            if (item.kind === "headband") {
              pdf.setFillColor(78, 165, 222);
              pdf.rect(iconX, rowY - 8, 18, 10, "F");
              drawLabel(labelX, "Headband (bar)");
            } else if (item.kind === "support") {
              pdf.setFillColor(226, 176, 67);
              pdf.rect(iconX + 4, rowY - 9, 10, 12, "F");
              pdf.setFillColor(51, 51, 51);
              pdf.circle(iconX - 2, rowY - 4, 2, "F");
              pdf.circle(iconX + 18, rowY - 4, 2, "F");
              drawLabel(labelX, "Sewing support + holes");
            } else if (item.kind === "changeover") {
              let color = { r: 51, g: 51, b: 51 };
              const row = changeHolesByRow.value.find((r) => r && r.length);
              if (row) {
                const hex = (row[0].color || "#333").replace("#", "");
                if (hex.length === 6) {
                  const rr = parseInt(hex.slice(0, 2), 16);
                  const gg = parseInt(hex.slice(2, 4), 16);
                  const bb = parseInt(hex.slice(4, 6), 16);
                  if ([rr, gg, bb].every((n) => Number.isFinite(n)))
                    color = { r: rr, g: gg, b: bb };
                }
              }
              pdf.setFillColor(color.r, color.g, color.b);
              pdf.setDrawColor(34, 34, 34);
              pdf.circle(iconX + 8, rowY - 5, 4, "FD");
              drawLabel(labelX, "Change‑over station (dot)");
            } else if (item.kind === "knot") {
              // Stylised knotted sewing line: short line with a bulge in the centre
              const lineY = rowY - 4;
              const startX = iconX;
              const endX = iconX + 34;
              const knotX = (startX + endX) / 2;

              pdf.setDrawColor(34, 34, 34);
              pdf.setLineWidth(1.2);
              // Left half of line
              pdf.line(startX, lineY, knotX - 3, lineY);
              // Right half of line
              pdf.line(knotX + 3, lineY, endX, lineY);
              // Small loop/bulge to suggest a knot
              pdf.circle(knotX, lineY, 3, "S");

              drawLabel(
                labelX,
                `Knot on sewing line${item.count ? ` (${item.count})` : ""}`
              );
            } else if (item.kind === "rupture") {
              // Stylised rupture: line with a clean break and offset ends
              const lineY = rowY - 4;
              const startX = iconX;
              const endX = iconX + 34;
              const gapLeft = startX + 12;
              const gapRight = endX - 12;

              pdf.setDrawColor(34, 34, 34);
              pdf.setLineWidth(1.2);
              // Left segment
              pdf.line(startX, lineY, gapLeft, lineY);
              // Right segment slightly shifted to suggest misalignment
              pdf.line(gapRight, lineY + 1.5, endX, lineY + 1.5);

              drawLabel(
                labelX,
                `Rupture in sewing line${item.count ? ` (${item.count})` : ""}`
              );
            }
            rowY += lineH;
          }

          if (hasPens) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(20, 30, 45);
            pdf.text("Pens", iconX, rowY + 2);
            rowY += 6;
            pdf.setDrawColor(230, 232, 238);
            pdf.line(iconX, rowY + 4, legendX + legendW - padX, rowY + 4);
            rowY += sectionH - 8;

            for (const p of pens.value) {
              let color = { r: 78, g: 165, b: 222 };
              const hex = (p.color || "#4ea5de").replace("#", "");
              if (hex.length === 6) {
                const rr = parseInt(hex.slice(0, 2), 16);
                const gg = parseInt(hex.slice(2, 4), 16);
                const bb = parseInt(hex.slice(4, 6), 16);
                if ([rr, gg, bb].every((n) => Number.isFinite(n)))
                  color = { r: rr, g: gg, b: bb };
              }
              const sampleX1 = iconX;
              const sampleX2 = iconX + 64;
              pdf.setDrawColor(color.r, color.g, color.b);
              pdf.setLineWidth(1.2);
              if (pdf.setLineDash) {
                if (p.style === "dotted") pdf.setLineDash([1, 4], 0);
                else if (p.style === "dashed") pdf.setLineDash([6, 4], 0);
                else pdf.setLineDash([]);
              }
              pdf.line(sampleX1, rowY - 4, sampleX2, rowY - 4);
              if (pdf.setLineDash) pdf.setLineDash([]);
              const label = `Pen${p.id} (${p.type}, ${p.style})`;
              drawLabel(sampleX2 + 12, label);
              rowY += lineH;
            }
          }
        }

        // Add Notes as Footnotes
        let notesWithContent = [];
        try {
          notesWithContent = notes.map((note, index) => ({ note, rowIndex: index }))
            .filter(({ note }) => note && note.trim().length > 0)
            .map(({ note, rowIndex }) => ({ note: note.trim(), rowIndex }));
        } catch (notesError) {
          console.error("Error processing notes:", notesError);
        }

        if (notesWithContent.length > 0) {
          // Calculate notes position based on what content was added
          let notesY;
          if (legendBoxH > 0) {
            notesY = nextY + legendBoxH + gap; // After legend
          } else if (metaBoxH > 0) {
            notesY = nextY; // After metadata, no legend
          } else {
            notesY = y + h + gap; // After main image
          }
          
          // Notes header
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(14);
          pdf.setTextColor(20, 30, 45);
          pdf.text("Notes", margin, notesY);
          notesY += 20;
          
          // Draw separator line
          pdf.setDrawColor(200, 208, 219);
          pdf.line(margin, notesY - 5, pageWidth - margin, notesY - 5);
          
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          
          notesWithContent.forEach(({ note, rowIndex }, index) => {
            const row = rows.value[rowIndex];
            let rowLabel = "";
            
            if (row) {
              if (row.roman === "" && rowIndex === 0) {
                rowLabel = "Front endleaves";
              } else if (row.roman === "" && rowIndex === rows.value.length - 1) {
                rowLabel = "Back endleaves";
              } else if (row.roman) {
                rowLabel = `Quire ${row.roman}`;
              } else {
                rowLabel = `Row ${rowIndex + 1}`;
              }
            } else {
              rowLabel = `Row ${rowIndex + 1}`;
            }
            
            const noteText = `${rowLabel}: ${note}`;
            
            // Check if we need a new page
            if (notesY + lineH > pageHeight - margin) {
              pdf.addPage();
              notesY = margin + 20;
            }
            
            // Split long notes across multiple lines if needed
            const maxWidth = pageWidth - margin * 2;
            const lines = pdf.splitTextToSize(noteText, maxWidth);
            
            lines.forEach((line, lineIndex) => {
              if (notesY + lineH > pageHeight - margin) {
                pdf.addPage();
                notesY = margin + 20;
              }
              pdf.text(line, margin, notesY);
              notesY += lineH;
            });
            
            notesY += 4; // Extra spacing between notes
          });
        }

        const fileName =
          (props.title && String(props.title).trim()) || "Untitled";
        
        console.log("Generating PDF with filename:", fileName);
        
        try {
          // Prefer manual link to avoid any browser quirks
          const blob = pdf.output('blob');
          console.log("PDF blob created:", blob.size, "bytes");
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}.pdf`;
          document.body.appendChild(a);
          console.log("Triggering download...");
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          console.log("PDF download triggered successfully");
        } catch (downloadError) {
          console.error("Download method failed:", downloadError);
          try { 
            console.log("Trying fallback method...");
            pdf.save(`${fileName}.pdf`); 
          } catch (fallbackError) { 
            console.error("Fallback method also failed:", fallbackError);
          }
        }
      } catch (e) {
        console.error("PDF export failed:", e);
        alert("PDF export failed. Please check the console for details.");
      } finally {
        showExportPopup.value = false;
      }
    }

    return {
      // rows / notes
      rows,
      notes,

      // container sizing
      tableContainer,
      rowHeight,

      // ruler
      ruler,
      totalCmNumber,
      majorTicks,
      minorTicks,
      isDoubleSupport,
      supportHalfGapPx,
      headTh,
      tailTh,
      topRulerLeft,
      topRulerWidth,
      rootEl,
      footer,
      tooltipVisible,
      tooltipX,
      tooltipCm,
      onRulerMove,
      onRulerLeave,
      getRulerRect,
      isScrollForced,

      // drag feedback
      dragFeedback,
      beginDragFeedback,
      updateDragFeedback,
      endDragFeedback,
      dragStartCm,
      dragCurrentCm,
      dragDeltaCm,
      clampPct,

      // headbands / supports
      headbandLeftPositions,
      headbandRightPositions,
      addHeadbandLeft,
      addHeadbandRight,
      supportEntries,
      openAddSupportPopup,
      showAddSupportPopup,
      supportTypeChoice,
      confirmAddSupport,
      moveSewingHolesForSupport,

      // knots/bows
      knotEntries,
      addKnotMode,
      toggleAddKnot,
      handleElementOverlayClick,
      handleElementOverlayMouseMove,
      handleElementOverlayMouseLeave,
      getClickPositionOnStroke,
      createKnotOnLine,
      createRuptureOnLine,
      splitStrokeWithDebris,
      createKnottedStraightLine,
      drawBowLoop,
      drawBowCenter,
      drawBowTail,
      animations,
      handleKnotOverlayClick,
      addKnotAtPosition,
      updateKnotPosition,
      removeKnot,
      showKnotMenu,
      knotMenuPosition,
      knotMenuTargetId,
      openKnotMenu,
      closeKnotMenu,
      deleteKnotFromMenu,

      // sewing ruptures
      ruptureEntries,
      addRuptureMode,
      toggleAddRupture,
      handleRuptureOverlayClick,
      addRuptureAtPosition,
      updateRupturePosition,
      removeRupture,
      showRuptureMenu,
      ruptureMenuPosition,
      ruptureMenuTargetId,
      openRuptureMenu,
      closeRuptureMenu,
      deleteRuptureFromMenu,

      // change‑over holes (per row)
      changeHolesByRow,
      // sewing holes (per row)
      sewingHolesByRow,
      // rows edit
      rowsManual,
      editRowsMode,
      toggleEditRows,
      resetRowsManual,
      addHoleMode,
      toggleAddHole,
      maybeAddHole,
      onChangeHoleDragged,
      onSewingHoleDragged,
      holeKey,
      sewingKey,
      selectedKeys,
      selectedSewingKeys,
      selectedSupportIds,
      selectingMode,
      postSelectMode,
      selectedCount,
      isSelected,
      isSewingSelected,
      isSupportSelected,
      onHoleClick,
      onSewingHoleClick,
      sewingHoleLeft,
      onSupportClick,
      finishSelection,
      cancelSelection,
      clearSelection,
      exitPostSelect,

      // context menu + actions
      menu,
      openHoleMenu,
      openSupportMenu,
      openSewingMenu,
      openHeadbandMenu,
      beginSelectFromMenu,
      beginSewingSelectFromMenu,
      beginSupportSelectFromMenu,
      removeFromMenu,
      deleteSelected,

      // recolor popup
      showRecolorPopup,
      recolorForGroup,
      recolorColor,
      openRecolorPopup,
      cancelRecolor,
      confirmRecolor,
      recolorHeading,

      // pens
      pens,
      activePenId,
      eraserActive,
      toggleEraser,
      deactivateCurrentPen,
      showPenPopup,
      penForm,
      confirmPen,
      togglePen,
      penTooltip,
      penHintVisible,
      lastCreatedPenId,

      // canvas
      drawCanvas,
      canvasWidth,
      canvasHeight,
      startDraw,
      drawMove,
      endDraw,
      getDrawableOffsetPixels,

      // export
      showExportPopup,
      showPreviewPopup,
      previewImg,
      exportMode,
      noteRefs,

      previewPDF,
      exportToPDF,
    };
  },
};
</script>

<style scoped>
.bookbinding-screen {
  display: flex;
  flex-direction: column;
  /* Make this view its own scroll container (works despite global body overflow hidden) */
  min-height: 100vh;
  height: 100vh;     /* fallback */
  height: 100dvh;    /* mobile-safe dynamic viewport */
  overflow-y: auto;  /* scroll only when needed */
  -webkit-overflow-scrolling: touch;
  background: #112233;
  color: white;
  font-family: Arial, sans-serif;
}
.bookbinding-screen.force-scroll {
  position: fixed;
  inset: 0;
  overflow-y: auto;
}

.scroll-spacer {
  height: 50px;
  flex: 0 0 auto;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #c0c2c3;
  color: black;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 18px;
}
.return-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.title-bar {
  background: #0f2340;
  color: #a0a0a0;
  text-align: center;
  padding: 12px 0;
  font-size: 32px;
}
.breadcrumb {
  background: #1f2a3a;
  padding: 8px 24px;
  font-size: 14px;
  color: white;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.breadcrumb-text {
  justify-self: start;
}

.breadcrumb-main-controls {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-pen-controls {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Pen buttons in header */
.pen-btn-header {
  padding: 8px 16px;
  font-size: 13px;
  border: 1px solid #4ea5de;
  background: transparent;
  color: #4ea5de;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pen-btn-header:hover {
  background: #4ea5de;
  color: white;
}

.pen-btn-header.active {
  border-width: 3px;
  border-style: solid;
  background: rgba(78, 165, 222, 0.1);
  box-shadow: 0 0 12px rgba(78, 165, 222, 0.6), inset 0 0 8px rgba(78, 165, 222, 0.2);
  font-weight: bold;
}

.pen-wrap-header {
  position: relative;
  display: inline-block;
}

.pen-hint-header {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #2a3b54;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  margin-top: 4px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Selection bars */
.selection-bar {
  position: absolute;
  top: 157.5px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  background: #0f2340;
  border: 2px solid #4ea5de;
  border-radius: 4px;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  min-height: 24px;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.selection-actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 4px 8px;
  border: 1px solid #9fb3cc;
  background: #1f2a3a;
  color: #e7f1ff;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}
.btn:hover {
  background: #2a3a52;
}
.btn-ghost {
  background: transparent;
  color: #cbd6e3;
  border-color: #54657d;
}
.btn-active {
  border-color: #6ec3ff;
  color: #cfeaff;
}

/* Layout */
.table-container {
  position: relative;
  margin: 0 auto;
  width: 80%;
  height: auto;
  min-height: 200px;
  max-height: none;
  overflow: visible;
  /* Do not shrink; allow content to define height so parent can scroll */
  flex: 0 0 auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin-top: 50px;
  z-index: 1; /* table layer */
  /* Reserve space so the sticky footer doesn't cover last rows */
  padding-bottom: 96px;
}

/* Canvas must sit ABOVE the table; still only intercepts events if pen/eraser active */
.draw-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000; /* above table & draggables; below context menu (2000) & overlays (1500) */
}

/* Table */
.binding-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  table-layout: fixed;
}

/* Center table in export mode without changing its width,
   so drawn lines keep the same geometry as on screen. */
.export-mode .binding-table {
  margin: 0 auto;
}
.binding-table th,
.binding-table td {
  border: 1px solid #333;
  padding: 6px 8px;
  font-size: 14px;
  color: black;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cell-input {
  width: 100%;
  padding: 4px 6px;
  font-size: 14px;
  border: 1px solid #999;
  border-radius: 4px;
  box-sizing: border-box;
}
.cell-input.small {
  max-width: 80px;
}

/* Column widths */
.quire-col {
  width: 6.25%;
}
.leaves-col {
  width: 6.25%;
}
.head-col {
  width: 6.25%;
}
.tail-col {
  width: 6.25%;
}
.ruler-col {
  width: 50%;
  padding: 0;
}
.notes-col {
  width: 220px; /* Fixed width to accommodate fixed-width input */
  min-width: 220px;
}

/* Separate top ruler that aligns from Head to Tail columns */
.top-ruler {
  position: relative;
  margin-bottom: 8px;
}

/* Canvas cells */
.canvas-cell {
  position: relative;
  background: rgba(15, 35, 64, 0.1);
  overflow: visible;
}
.headband-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px; /* narrower endband */
  background: #4ea5de;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: grab;
  z-index: 3;
}
.supports-cell {
  position: relative;
  background: transparent;
  height: 100%;
  padding: 0;
  overflow: visible;
}
.support-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none; /* don't block canvas when drawing */
}
.support-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background: #e2b043; /* default yellow; overridden inline when recolored */
  transform: translateX(-50%);
  cursor: grab;
  z-index: 3; /* above dots in the cell */
  pointer-events: auto; /* draggable even though wrapper ignores events */
}

.support-bar.selected {
  outline: 2px solid #00b7ff;
}

/* Dots */
.hole-dot {
  position: absolute;
  border-radius: 50%;
  z-index: 4; /* above support bars for easier interaction */
  top: 50%;
  transform: translateY(-50%);
}
.hole-dot.sewing {
  width: 6px;
  height: 6px;
  background: #333;
  border: none;
  transform: translate(-50%, -50%); /* center at percentage position */
}
/* Center change-over holes so 0% and 100% show fully */
.hole-dot.change {
  width: 8px;
  height: 8px;
  border: 2px solid #222;
  transform: translate(-50%, -50%);
}
.hole-dot.selected {
  box-shadow: 0 0 0 3px rgba(0, 183, 255, 0.35);
}
.hole-dot.fixed-end {
  width: 8px;
  height: 8px;
  background: #333;
  border: 2px solid #222;
}

.even {
  background: #e1e1e1;
}
.odd {
  background: #c8c8c8;
}

.notes-input {
  width: 200px; /* Fixed width */
  max-width: 200px;
  padding: 4px;
  font-size: 14px;
  border: 1px solid #999;
  box-sizing: border-box;
  height: 28px; /* Fixed height - no expansion */
  line-height: 20px;
  resize: none;
  overflow-x: scroll; /* Always show horizontal scrollbar */
  overflow-y: hidden; /* No vertical scrolling */
  white-space: nowrap; /* Keep text on one line */
  word-break: normal;
  overflow-wrap: normal;
  scrollbar-width: thin; /* For Firefox */
}

/* Webkit scrollbar styling for better visibility */
.notes-input::-webkit-scrollbar {
  height: 6px;
}

.notes-input::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.notes-input::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.notes-input::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.notes-export {
  width: 100%;
  padding: 4px;
  font-size: 14px;
  border: 1px solid #999;
  box-sizing: border-box;
  background: #fff;
  color: #000;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* Ruler */
.ruler {
  position: relative;
  height: 56px;
  padding: 6px 0 16px;
  background: #f7f7f7;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.tick {
  position: absolute;
  width: 1px;
  background: #666;
}
.tick.major {
  top: 6px;
  height: 30px;
}
.tick.minor {
  top: 14px;
  height: 18px;
  opacity: 0.7;
}
.tick-label {
  position: absolute;
  top: 38px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #1f2a3a;
  white-space: nowrap;
  pointer-events: none;
}
.tick-label small {
  font-size: 9px;
  margin-left: 2px;
  text-transform: lowercase;
}
.tick-first .tick-label {
  left: 0;
  transform: translateX(0);
  text-align: left;
}
.tick-last .tick-label {
  left: 0;
  transform: translateX(-100%);
  text-align: right;
}
.tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}

/* Drag feedback UI on ruler */
.drag-marker {
  position: absolute;
  top: 6px;
  bottom: 16px;
  width: 2px;
}
.drag-marker.start {
  background: #2e86ff;
}
.drag-marker.current {
  background: #ff6a00;
}
.drag-readout {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  background: rgba(17, 34, 51, 0.9);
  color: #e9f2ff;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  border: 1px solid #2b3d56;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

/* Footer */
.footer {
  position: sticky;
  bottom: 0;
  background: #1f2a3a;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  z-index: 3000;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.25);
}
.legend {
  display: flex;
  gap: 16px;
  font-size: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.legend button {
  margin-left: 8px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid white;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}
.legend .ml8 { margin-left: 8px; }
.swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: middle;
  border: 1px solid #aaa;
  border-radius: 3px;
}
.swatch.headband {
  background: #4ea5de;
}
.swatch.support {
  background: #e2b043;
}
.swatch.change {
  background: #333;
}

.continue-btn {
  padding: 12px 48px;
  border: 1px solid white;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}
.continue-btn:hover {
  background: white;
  color: black;
}

/* Pen UI */
.pen-btn {
  padding: 6px 12px;
  background: #1f2a3a;
  border: 2px solid #555;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  margin-left: 6px;
}
.pen-btn.active {
  background: #4ea5de;
  color: #fff !important;
}

.pen-wrap { position: relative; display: inline-block; }
.pen-hint {
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(17, 34, 51, 0.95);
  color: #e9f2ff;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  border: 1px solid #2b3d56;
  box-shadow: 0 4px 14px rgba(0,0,0,0.35);
  pointer-events: none;
}

/* Context menu & overlays sit ABOVE canvas */
.context-menu {
  position: fixed;
  z-index: 2000;
  background: #1f2a3a;
  color: #e9f2ff;
  border: 1px solid #2b3d56;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  padding: 6px;
  min-width: 180px;
}
.menu-item {
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
}
.menu-item:hover {
  background: #2a3b54;
}
.menu-item.danger:hover {
  background: #4a1f25;
  color: #ffdcdc;
}
.menu-sep {
  border: none;
  border-top: 1px solid #2b3d56;
  margin: 6px 0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 34, 51, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}
.popup {
  background: #1f2a3a;
  color: #fff;
  padding: 28px 22px;
  border-radius: 10px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 4px 24px #0008;
}
.popup h3 {
  margin: 0 0 16px;
  font-size: 18px;
  text-align: center;
  color: #4ea5de;
}
.popup-section {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.popup-section label {
  min-width: 64px;
}
.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.popup-btn {
  padding: 6px 18px;
  border-radius: 4px;
  border: none;
  font-size: 15px;
  cursor: pointer;
}
.popup-btn.confirm {
  background: #4ea5de;
  color: #fff;
}
.popup-btn.cancel {
  background: #555;
  color: #fff;
}

/* Element overlay (knots and ruptures) */
.element-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5000; /* Much higher than drawing canvas to ensure DOM stacking order works */
  pointer-events: none; /* Let clicks pass through when not in add mode */
}

.element-overlay * {
  pointer-events: auto; /* Re-enable pointer events for child elements */
}

.knot-element {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 3;
  background: radial-gradient(circle at 30% 30%, #8B4513, #654321, #3D2914);
  border: 2px solid #2F1B14;
  border-radius: 3px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(139, 69, 19, 0.3),
    inset 0 -1px 0 rgba(47, 27, 20, 0.8);
  transition: transform 0.1s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.knot-element::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  bottom: 1px;
  background: linear-gradient(135deg, 
    rgba(139, 69, 19, 0.2) 0%, 
    transparent 25%, 
    rgba(47, 27, 20, 0.3) 75%
  );
  border-radius: 1px;
  pointer-events: none;
}

.knot-element:hover {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(139, 69, 19, 0.4),
    inset 0 -1px 0 rgba(47, 27, 20, 0.9);
}

.knot-element:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(0.95);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(47, 27, 20, 0.8);
}

/* Knot swatch in legend */
.swatch.knot {
  background: radial-gradient(circle at 30% 30%, #8B4513, #654321);
  border: 2px solid #2F1B14;
  box-shadow: inset 0 1px 0 rgba(139, 69, 19, 0.3);
}

/* Rupture container and masking */
.rupture-container {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 5100; /* Extremely high to ensure it's above canvas drawings */
}

.rupture-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 6px;
  background: #f8f4e6; /* Match table background */
  border-radius: 1px;
  z-index: 999; /* Just below drawing canvas to create gap in table elements */
  box-shadow: 
    0 0 0 1px #f8f4e6,
    0 0 0 2px rgba(0, 0, 0, 0.1);
}

/* Alternative mask for different colored supports */
.rupture-mask::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -2px;
  right: -2px;
  bottom: -1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    #f8f4e6 20%, 
    #f8f4e6 80%, 
    transparent 100%
  );
  border-radius: 2px;
}

.rupture-mask::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -4px;
  right: -4px;
  bottom: -2px;
  background: radial-gradient(ellipse at center, 
    rgba(248, 244, 230, 0.9) 0%, 
    rgba(248, 244, 230, 0.7) 50%, 
    transparent 100%
  );
  border-radius: 50%;
}

/* Rupture lightning bolt element */
.rupture-element {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 5100; /* Extremely high to ensure it's above canvas drawings */
  background: radial-gradient(circle at 30% 30%, #FF6B47, #CC3A1F, #991F0A);
  border: 2px solid #661100;
  border-radius: 2px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 107, 71, 0.4),
    inset 0 -1px 0 rgba(102, 17, 0, 0.8),
    0 0 8px rgba(255, 107, 71, 0.3);
  transition: transform 0.1s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  animation: flicker 2s infinite alternate;
}

@keyframes flicker {
  0%, 50% { opacity: 1; }
  75%, 100% { opacity: 0.7; }
}

.rupture-element::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  bottom: 1px;
  background: linear-gradient(135deg, 
    rgba(255, 107, 71, 0.3) 0%, 
    transparent 25%, 
    rgba(102, 17, 0, 0.4) 75%
  );
  border-radius: 0px;
  pointer-events: none;
}

.rupture-container:hover .rupture-element {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 107, 71, 0.5),
    inset 0 -1px 0 rgba(102, 17, 0, 0.9),
    0 0 12px rgba(255, 107, 71, 0.5);
  animation-duration: 1s;
}

.rupture-container:hover .rupture-mask {
  width: 28px;
  box-shadow: 
    0 0 0 1px #f8f4e6,
    0 0 0 2px rgba(0, 0, 0, 0.2),
    0 0 4px rgba(255, 107, 71, 0.2);
}

.rupture-container:active {
  cursor: grabbing;
}

.rupture-container:active .rupture-element {
  transform: translate(-50%, -50%) scale(0.95);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(102, 17, 0, 0.8),
    0 0 6px rgba(255, 107, 71, 0.4);
}

/* Rupture swatch in legend */
.swatch.rupture {
  background: radial-gradient(circle at 30% 30%, #FF6B47, #CC3A1F);
  border: 2px solid #661100;
  box-shadow: 
    inset 0 1px 0 rgba(255, 107, 71, 0.4),
    0 0 4px rgba(255, 107, 71, 0.3);
  animation: flicker 2s infinite alternate;
}
</style>
