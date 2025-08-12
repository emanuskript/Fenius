<template>
  <div class="bookbinding-screen">
    <!-- Header -->
    <div class="header-bar">
      <span class="book-title">
        {{ title }} , {{ location }}, {{ shelfmark }}, {{ manuscriptDate }}
      </span>
      <router-link to="/input-screen" class="return-link">↩ return</router-link>
    </div>

    <h1 class="screen-title">FENIUS</h1>

    <!-- Table -->
    <table class="binding-table">
      <thead>
        <tr>
          <th>Quire</th>
          <th>Leaves</th>
          <th>Head</th>
          <th colspan="3">
            <!-- Ruler -->
            <div class="ruler-container">
              <div
                v-for="n in 101"
                :key="'tick-' + n"
                class="ruler-tick"
                :class="{ major: n % 10 === 0 }"
              ></div>
            </div>
          </th>
          <th>Tail</th>
          <th>Notes</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, rowIndex) in tableRows" :key="'row-' + rowIndex">
          <td>{{ row.quire }}</td>
          <td>{{ row.leaves }}</td>
          <td class="head-cell"></td>

          <!-- Supports cell -->
          <td
            class="canvas-cell supports-cell"
            colspan="3"
            @click="maybeAddHole($event, rowIndex)"
          >
            <!-- Sewing supports -->
            <div
              class="support-wrap"
              v-for="(sp, si) in supportEntries"
              :key="'row-support-' + sp.id + '-' + rowIndex"
            >
              <div
                class="hole-dot sewing"
                :style="{ left: `calc(${sp.position}% - 10px)` }"
              ></div>
              <div
                class="support-bar"
                :style="{ left: sp.position + '%' }"
                v-draggable="{
                  onStart: (pct) => beginDragFeedback(pct),
                  onChange: (pct) => {
                    supportEntries[si].position = clampPct(pct);
                    updateDragFeedback(pct);
                  },
                  onEnd: endDragFeedback,
                }"
              ></div>
              <div
                class="hole-dot sewing"
                :style="{ left: `calc(${sp.position}% + 8px)` }"
              ></div>
            </div>

            <!-- Change-over holes -->
            <div
              class="changeover-hole"
              v-for="(hole, hi) in changeoverHoles.filter(
                (h) => h.row === rowIndex
              )"
              :key="'hole-' + hi + '-' + rowIndex"
              :style="{ left: hole.position + '%' }"
              :class="{ selected: selectedHoles.includes(hole) }"
              @contextmenu.prevent="onHoleRightClick(hole, $event)"
              v-draggable="{
                onStart: (pct) => beginDragFeedback(pct),
                onChange: (pct) => {
                  hole.position = clampPct(pct);
                  updateDragFeedback(pct);
                },
                onEnd: endDragFeedback,
              }"
            ></div>
          </td>

          <td class="tail-cell"></td>
          <td><input type="text" class="notes-input" /></td>
        </tr>
      </tbody>
    </table>

    <!-- Controls -->
    <div class="controls-bar">
      <button class="btn" @click="addHeadband">Headbands + Add</button>
      <button class="btn" @click="addSupport">Sewing support + Add</button>
      <button class="btn" @click="addChangeoverHole">
        Change-over hole + Add
      </button>
      <button class="btn" @click="addPen">+ Add Pen</button>
      <button class="btn" @click="toggleEraser">Eraser</button>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <ul>
        <li @click="selectHole(contextMenu.hole)">Select</li>
        <li @click="startRecolorSelected">Recolor</li>
        <li @click="removeSelectedHoles">Remove</li>
      </ul>
    </div>

    <!-- Selection Controls -->
    <div v-if="selectionMode" class="selection-controls">
      <button class="btn" @click="finishSelection">Done</button>
      <button class="btn" @click="cancelSelection">Cancel</button>
    </div>

    <!-- Export -->
    <div class="export-bar">
      <button class="btn export" @click="exportToPDF">Export</button>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { ref, computed, reactive, onMounted, watch, nextTick } from "vue";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default {
  name: "BookBindingScreen",
  directives: {
    draggable: {
      mounted(el, binding) {
        el.style.position = "absolute";
        el.style.cursor = "grab";

        const getHandler = () =>
          typeof binding.value === "function"
            ? { onChange: binding.value }
            : binding.value || {};

        const onMove = (e) => {
          const r = el.parentElement.getBoundingClientRect();
          const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
          const pct = (x / r.width) * 100;
          const { onChange } = getHandler();
          if (onChange) onChange(pct);
          el.style.left = pct + "%";
        };

        const onDown = (ev) => {
          ev.preventDefault();
          const r = el.parentElement.getBoundingClientRect();
          const x = Math.max(0, Math.min(r.width, ev.clientX - r.left));
          const pct = (x / r.width) * 100;
          const { onStart } = getHandler();
          if (onStart) onStart(pct);
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
    title: String,
    manuscriptDate: String,
    location: String,
    shelfmark: String,
    quires: [Number, String],
    foliosPerQuire: [Number, String],
    leavesPerQuire: [Number, String],
    collationStyle: { type: String, default: "foliate" },
    frontEndleaves: [Number, String],
    backEndleaves: [Number, String],
    sewingSupports: [Number, String],
    headbands: Boolean,
    changeOver: Boolean,
    spineLength: [Number, String],
    quiresStyle: String,
    sewingType: String,
  },
  setup(props) {
    const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

    /* ---------- Recolor popup state placed FIRST to avoid hoist issues ---------- */
    const showRecolorPopup = ref(false);
    const recolorForGroup = ref(false);
    const recolorColor = ref("#4ea5de");

    /* ---------------- Rows & numbering ---------------- */
    const rows = computed(() => {
      const q = Math.max(0, num(props.quires, 0));
      const l = Math.max(
        0,
        num(props.foliosPerQuire, num(props.leavesPerQuire, 0))
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

    const notes = reactive([]);
    const syncNotes = () => {
      const need = rows.value.length;
      if (notes.length < need)
        for (let i = notes.length; i < need; i++) notes.push("");
      else if (notes.length > need) notes.splice(need);
    };
    onMounted(syncNotes);
    watch(rows, syncNotes, { immediate: true });

    /* ---------------- Table sizing ---------------- */
    const tableContainer = ref(null);
    const containerHeight = 430;
    const headerHeight = 40;
    const rowHeight = ref(40);
    function calcRowHeight() {
      const rowCount = rows.value.length || 1;
      rowHeight.value = Math.max(
        18,
        Math.floor((containerHeight - headerHeight) / rowCount)
      );
    }
    onMounted(() => {
      nextTick(calcRowHeight);
      window.addEventListener("resize", calcRowHeight);
    });
    watch(rows, () => nextTick(calcRowHeight));

    /* ---------------- Ruler ---------------- */
    const totalCm = computed(() => Math.max(0, num(props.spineLength, 0)));
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
      const r = ruler.value.getBoundingClientRect();
      tooltipX.value = e.clientX - r.left;
      tooltipCm.value = (tooltipX.value / r.width) * totalCm.value;
      tooltipVisible.value = true;
    }

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

    /* ---------------- Headbands ---------------- */
    const headbandPositions = reactive(props.headbands ? [5, 95] : []);
    function addHeadband() {
      headbandPositions.push(50);
    }

    /* ---------------- Sewing supports ---------------- */
    const supportEntries = reactive([]);
    onMounted(() => {
      const n = Math.max(0, num(props.sewingSupports, 0));
      for (let i = 0; i < n; i++)
        supportEntries.push({ id: i + 1, position: ((i + 1) / (n + 1)) * 100 });
    });
    function addSupport() {
      supportEntries.push({ id: supportEntries.length + 1, position: 50 });
    }

    /* ---------------- Change‑over holes (per row) ---------------- */
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
      ensureHolesArrays();
    }

    function onChangeHoleDragged(rowIndex, uid, pct) {
      const row = changeHolesByRow.value[rowIndex];
      const hole = row.find((h) => h.uid === uid);
      if (hole) hole.position = clampPct(pct);
    }

    const holeKey = (rowIndex, uid) => `${rowIndex}:${uid}`;

    const selectedKeys = ref(new Set());
    const selectingMode = ref(false);
    const postSelectMode = ref(false);
    const selectedCount = computed(() => selectedKeys.value.size);
    const isSelected = (key) => selectedKeys.value.has(key);
    const toggleSelected = (key) => {
      const s = new Set(selectedKeys.value);
      s.has(key) ? s.delete(key) : s.add(key);
      selectedKeys.value = s;
    };
    const clearSelected = () => {
      selectedKeys.value = new Set();
    };
    function onHoleClick(rowIndex, uid) {
      if (!selectingMode.value) return;
      toggleSelected(holeKey(rowIndex, uid));
    }

    const menu = reactive({
      visible: false,
      x: 0,
      y: 0,
      rowIndex: null,
      uid: null,
      group: false,
    });
    function openHoleMenu(e, rowIndex, uid) {
      const key = holeKey(rowIndex, uid);
      menu.visible = true;
      menu.x = e.clientX;
      menu.y = e.clientY;
      menu.rowIndex = rowIndex;
      menu.uid = uid;
      menu.group = postSelectMode.value && selectedKeys.value.has(key);

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

    function beginSelectFromMenu() {
      selectingMode.value = true;
      postSelectMode.value = false;
      clearSelected();
      if (menu.rowIndex != null && menu.uid != null)
        toggleSelected(holeKey(menu.rowIndex, menu.uid));
      menu.visible = false;
    }

    function removeFromMenu() {
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
      ensureHolesArrays();
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
      ensureHolesArrays();
      clearSelection();
      menu.visible = false;
    }

    /* ---------------- Recolor (popup) ---------------- */
    function openRecolorPopup(isGroup) {
      recolorForGroup.value = !!isGroup;
      if (!isGroup && menu.rowIndex != null && menu.uid != null) {
        const row = changeHolesByRow.value[menu.rowIndex];
        const hole = row.find((h) => h.uid === menu.uid);
        if (hole) recolorColor.value = hole.color || "#4ea5de";
      }
      showRecolorPopup.value = true;
      menu.visible = false;
    }
    function cancelRecolor() {
      showRecolorPopup.value = false;
    }
    function confirmRecolor() {
      if (recolorForGroup.value) {
        selectedKeys.value.forEach((key) => {
          const [r, u] = key.split(":").map(Number);
          const hole = changeHolesByRow.value[r].find((h) => h.uid === u);
          if (hole) hole.color = recolorColor.value;
        });
      } else if (menu.rowIndex != null && menu.uid != null) {
        const hole = changeHolesByRow.value[menu.rowIndex].find(
          (h) => h.uid === menu.uid
        );
        if (hole) hole.color = recolorColor.value;
      }
      showRecolorPopup.value = false;
    }

    /* ---------------- Pens & eraser ---------------- */
    const pens = ref([]);
    const activePenId = ref(null);
    const eraserActive = ref(false);
    const showPenPopup = ref(false);
    const penForm = reactive({
      type: "straight",
      style: "solid",
      color: "#4ea5de",
    });

    function confirmPen() {
      const id = pens.value.length + 1;
      pens.value.push({ id, ...JSON.parse(JSON.stringify(penForm)) });
      activePenId.value = id;
      eraserActive.value = false;
      showPenPopup.value = false;
    }
    function togglePen(id) {
      activePenId.value = activePenId.value === id ? null : id;
      if (activePenId.value) eraserActive.value = false;
    }
    function toggleEraser() {
      eraserActive.value = !eraserActive.value;
      if (eraserActive.value) activePenId.value = null;
    }

    const drawCanvas = ref(null);
    const canvasWidth = ref(0);
    const canvasHeight = ref(0);
    function resizeCanvas() {
      if (tableContainer.value) {
        canvasWidth.value = tableContainer.value.offsetWidth;
        canvasHeight.value = tableContainer.value.offsetHeight;
      }
    }
    onMounted(() => {
      nextTick(resizeCanvas);
      window.addEventListener("resize", resizeCanvas);
    });
    watch(tableContainer, resizeCanvas);

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
      snapshot =
        pen.type === "straight"
          ? ctx.getImageData(
              0,
              0,
              drawCanvas.value.width,
              drawCanvas.value.height
            )
          : null;
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
        lastPoint.value = curr;
        return;
      }

      if (!activePenId.value) return;
      const pen = getPenStyle();
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = pen.color;
      if (pen.style === "dotted") ctx.setLineDash([2, 6]);
      else if (pen.style === "dashed") ctx.setLineDash([10, 8]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      if (pen.type === "straight") {
        if (snapshot) ctx.putImageData(snapshot, 0, 0);
        ctx.moveTo(startPoint.value.x, startPoint.value.y);
        ctx.lineTo(curr.x, curr.y);
      } else {
        ctx.moveTo(lastPoint.value.x, lastPoint.value.y);
        ctx.lineTo(curr.x, curr.y);
        lastPoint.value = curr;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function endDraw(e) {
      if (!drawing.value) return;
      const ctx = drawCanvas.value.getContext("2d");
      if (eraserActive.value) {
        drawing.value = false;
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
      }
      drawing.value = false;
      snapshot = null;
    }

    /* ---------------- Export to PDF (legend + pens) ---------------- */
    const showExportPopup = ref(false);

    function drawPenSample(pdf, x1, y, x2, style, colorRgb) {
      pdf.setDrawColor(colorRgb.r, colorRgb.g, colorRgb.b);
      pdf.setLineWidth(1.2);
      if (pdf.setLineDash) {
        if (style === "dotted") pdf.setLineDash([1, 4], 0);
        else if (style === "dashed") pdf.setLineDash([6, 4], 0);
        else pdf.setLineDash([]);
      }
      pdf.line(x1, y, x2, y);
      if (pdf.setLineDash) pdf.setLineDash([]);
    }

    async function exportToPDF() {
      try {
        const target =
          tableContainer.value || document.querySelector(".bookbinding-screen");
        const canvas = await html2canvas(target, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "a4",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const margin = 32;
        const gap = 20;

        const hasHeadbands = headbandPositions.length > 0;
        const hasSupports = supportEntries.length > 0;
        const hasChangeovers = changeHolesByRow.value.some(
          (r) => r && r.length > 0
        );
        const hasPens = pens.value.length > 0;

        const rowsLegend = [];
        if (hasHeadbands) rowsLegend.push({ kind: "headband" });
        if (hasSupports) rowsLegend.push({ kind: "support" });
        if (hasChangeovers) rowsLegend.push({ kind: "changeover" });

        const pensHeader = hasPens ? { kind: "section", label: "Pens" } : null;
        const penRows = hasPens
          ? pens.value.map((p) => ({ kind: "pen", pen: p }))
          : [];

        const headerH = 22;
        const sectionH = 18;
        const lineH = 18;
        const padX = 14;
        const padY = 12;

        const legendItemsH =
          rowsLegend.length * lineH +
          (hasPens ? sectionH + penRows.length * lineH + 6 : 0);
        const legendBoxH =
          rowsLegend.length || hasPens
            ? headerH + padY + legendItemsH + padY
            : 0;

        const availableWidth = pageWidth - margin * 2;
        const availableHeight =
          pageHeight - margin * 2 - (legendBoxH ? legendBoxH + gap : 0);

        const ratio = Math.min(
          availableWidth / canvas.width,
          availableHeight / canvas.height
        );
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        const x = (pageWidth - w) / 2;
        const y = margin;

        pdf.addImage(imgData, "PNG", x, y, w, h);

        if (legendBoxH > 0) {
          const legendW = Math.max(420, Math.min(520, w));
          const legendX = (pageWidth - legendW) / 2;
          const legendY = y + h + gap;

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
                  const r = parseInt(hex.slice(0, 2), 16);
                  const g = parseInt(hex.slice(2, 4), 16);
                  const b = parseInt(hex.slice(4, 6), 16);
                  if ([r, g, b].every((n) => Number.isFinite(n)))
                    color = { r, g, b };
                }
              }
              pdf.setFillColor(color.r, color.g, color.b);
              pdf.setDrawColor(34, 34, 34);
              pdf.circle(iconX + 8, rowY - 5, 4, "FD");
              drawLabel(labelX, "Change‑over hole (dot)");
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
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                if ([r, g, b].every((n) => Number.isFinite(n)))
                  color = { r, g, b };
              }
              const sampleX1 = iconX;
              const sampleX2 = iconX + 64;
              drawPenSample(pdf, sampleX1, rowY - 4, sampleX2, p.style, color);
              const label = `Pen${p.id} (${p.type}, ${p.style})`;
              drawLabel(sampleX2 + 12, label);
              rowY += lineH;
            }
          }
        }

        const fileName =
          (props.title && String(props.title).trim()) || "Untitled";
        pdf.save(`${fileName}.pdf`);
      } catch (e) {
        console.error("PDF export failed:", e);
      } finally {
        showExportPopup.value = false;
      }
    }

    return {
      rows,
      notes,
      tableContainer,
      rowHeight,
      ruler,
      totalCmNumber,
      majorTicks,
      minorTicks,
      tooltipVisible,
      tooltipX,
      tooltipCm,
      onRulerMove,
      dragFeedback,
      beginDragFeedback,
      updateDragFeedback,
      endDragFeedback,
      dragStartCm,
      dragCurrentCm,
      dragDeltaCm,
      clampPct,
      headbandPositions,
      addHeadband,
      supportEntries,
      addSupport,
      changeHolesByRow,
      addHoleMode,
      toggleAddHole,
      maybeAddHole,
      onChangeHoleDragged,
      holeKey,
      selectedKeys,
      selectingMode,
      postSelectMode,
      selectedCount,
      isSelected,
      onHoleClick,
      finishSelection,
      cancelSelection,
      clearSelection,
      exitPostSelect,
      menu,
      openHoleMenu,
      beginSelectFromMenu,
      removeFromMenu,
      deleteSelected,
      showRecolorPopup,
      recolorForGroup,
      recolorColor,
      openRecolorPopup,
      cancelRecolor,
      confirmRecolor,
      pens,
      activePenId,
      eraserActive,
      toggleEraser,
      showPenPopup,
      penForm,
      confirmPen,
      togglePen,
      drawCanvas,
      canvasWidth,
      canvasHeight,
      startDraw,
      drawMove,
      endDraw,
      showExportPopup,
      exportToPDF,
    };
  },
};
</script>

<style scoped>
/* (styles identical to previous message — unchanged) */
.bookbinding-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #112233;
  color: #fff;
  font-family: Arial, sans-serif;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #c0c2c3;
  color: #000;
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
  color: #fff;
}
.selection-bar {
  width: 80%;
  margin: 10px auto 0;
  background: #0f2340;
  border: 1px solid #2c3f58;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.selection-actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 6px 12px;
  border: 1px solid #9fb3cc;
  background: #1f2a3a;
  color: #e7f1ff;
  border-radius: 4px;
  cursor: pointer;
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
.table-container {
  position: relative;
  margin: 0 auto;
  width: 80%;
  height: 430px;
  min-height: 200px;
  max-height: 430px;
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin-top: 50px;
}
.draw-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}
.binding-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  table-layout: fixed;
}
.binding-table th,
.binding-table td {
  border: 1px solid #333;
  padding: 6px 8px;
  font-size: 14px;
  color: #000;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
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
  width: 25%;
}
.canvas-cell {
  position: relative;
  background: rgba(15, 35, 64, 0.1);
  overflow: visible;
}
.headband-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16px;
  background: #4ea5de;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: grab;
}
.supports-cell {
  position: relative;
  background: transparent;
  height: 100%;
  padding: 0;
  overflow: visible;
}
.support-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background: #e2b043;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: grab;
  z-index: 2;
}
.hole-dot {
  position: absolute;
  border-radius: 50%;
  z-index: 3;
  top: 50%;
  transform: translateY(-50%);
}
.hole-dot.sewing {
  width: 5px;
  height: 5px;
  background: #333;
  border: none;
}
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
  width: 100%;
  padding: 4px;
  font-size: 14px;
  border: 1px solid #999;
}
.ruler {
  position: relative;
  height: 40px;
  background: #f7f7f7;
  border-bottom: 1px solid #ccc;
}
.tick {
  position: absolute;
  bottom: 0;
  width: 1px;
  background: #666;
}
.tick.major {
  height: 24px;
}
.tick.minor {
  height: 12px;
}
.tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
.drag-marker {
  position: absolute;
  top: 0;
  bottom: 0;
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
  top: 0;
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
.footer {
  background: #1f2a3a;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
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
  border: 1px solid #fff;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
}
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
  border: 1px solid #fff;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}
.continue-btn:hover {
  background: #fff;
  color: #000;
}
.pen-btn {
  padding: 6px 12px;
  background: #1f2a3a;
  border: 2px solid #555;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  margin-left: 6px;
}
.pen-btn.active {
  background: #4ea5de;
  color: #fff !important;
}
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
</style>
