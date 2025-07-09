<!-- src/components/BookBindingScreen.vue -->
<template>
  <div class="bookbinding-screen">
    <!-- HEADER BAR -->
    <div class="header-bar">
      <span class="product-label">eManuskript Produkt</span>
      <button class="return-btn" @click="$router.back()">↩ return</button>
    </div>

    <!-- TITLE BAR -->
    <div class="title-bar">FENIUS</div>

    <!-- METADATA BREADCRUMB -->
    <div class="breadcrumb">
      {{ title }}
      <span v-if="location">, {{ location }}</span>
      <span v-if="shelfmark">, {{ shelfmark }}</span>
      <span v-if="manuscriptDate">, {{ manuscriptDate }}</span>
    </div>

    <!-- PEN TOOLBAR -->
    <div class="pen-toolbar">
      <button
        v-for="pen in pens"
        :key="pen.id"
        :class="['pen-btn', { active: activePenId === pen.id }]"
        @click="selectPen(pen.id)"
      >
        Pen {{ pen.id }}
      </button>
    </div>

    <!-- RULER + TABLE -->
    <div class="table-container">
      <!-- RULER -->
      <div
        class="ruler"
        ref="ruler"
        @mousemove="onRulerMove"
        @mouseleave="tooltipVisible = false"
      >
        <div
          v-for="cm in majorTicks"
          :key="'M' + cm"
          class="tick major"
          :style="{ left: (cm / totalCm) * 100 + '%' }"
        />
        <div
          v-for="pct in minorTicks"
          :key="'m' + pct"
          class="tick minor"
          :style="{ left: pct + '%' }"
        />
        <div
          v-if="tooltipVisible"
          class="tooltip"
          :style="{ left: tooltipX + 'px' }"
        >
          {{ tooltipCm.toFixed(1) }} cm
        </div>
      </div>

      <!-- DATA TABLE -->
      <table class="binding-table">
        <thead>
          <tr>
            <th class="header-dark">Quire</th>
            <th class="header-dark">Leaves</th>
            <th class="header-light head-tail">Head</th>
            <th class="header-light">Sewing</th>
            <th class="header-light">Change</th>
            <th class="header-light">Holes</th>
            <th class="header-light head-tail">Tail</th>
            <th class="header-dark">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="i"
            :class="i % 2 === 0 ? 'even' : 'odd'"
          >
            <td class="cell-text">{{ row.roman }}</td>
            <td class="cell-text">{{ row.range }}</td>

            <!-- Headbands (left) -->
            <td class="canvas-cell">
              <div
                v-for="(pos, idx) in headbandPositions"
                :key="'hb-left-' + idx"
                class="headband-bar"
                v-draggable="(newPos) => (headbandPositions[idx] = newPos)"
                :style="{ left: pos + '%' }"
              />
            </td>

            <!-- Sewing supports -->
            <td class="canvas-cell">
              <div
                v-for="(sp, idx) in supportEntries"
                :key="sp.id"
                class="support-bar"
                v-draggable="
                  (newPos) => (supportEntries[idx].position = newPos)
                "
                :style="{ left: sp.position + '%', width: sp.width + 'px' }"
              />
            </td>

            <!-- Change‐over stations -->
            <td class="canvas-cell">
              <div
                v-for="(pos, idx) in changePositions"
                :key="'co-' + idx"
                class="change-bar"
                v-draggable="(newPos) => (changePositions[idx] = newPos)"
                :style="{ left: pos + '%' }"
              />
            </td>

            <!-- Sewing holes -->
            <td class="canvas-cell">
              <div
                v-for="(pos, idx) in holePositions"
                :key="'hole-' + idx"
                class="hole-dot"
                v-draggable="(newPos) => (holePositions[idx] = newPos)"
                :style="{ left: pos + '%' }"
              />
            </td>

            <!-- Headbands (right) -->
            <td class="canvas-cell">
              <div
                v-for="(pos, idx) in headbandPositions"
                :key="'hb-right-' + idx"
                class="headband-bar"
                v-draggable="
                  (newPos) => (headbandPositions[idx] = 100 - newPos)
                "
                :style="{ left: 100 - pos + '%' }"
              />
            </td>

            <td>
              <input
                type="text"
                class="notes-input"
                v-model="notes[i]"
                placeholder="Enter notes"
              />
            </td>
          </tr>
          <tr class="add-row">
            <td class="add-cell" colspan="8">+ Add Row</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER LEGEND + CONTROLS -->
    <div class="footer">
      <div class="legend">
        <div>
          <span class="swatch headband" /> Headbands
          <button @click="addHeadband()">+ Add</button>
        </div>
        <div>
          <span class="swatch support" /> Sewing support
          <button @click="addSupport()">+ Add</button>
        </div>
        <div>
          <span class="swatch change" /> Change-over
          <button @click="addChange()">+ Add</button>
        </div>
        <div>
          <span class="swatch hole" /> Sewing holes
          <button @click="addHole()">+ Add</button>
        </div>
      </div>
      <button class="continue-btn" @click="$router.push('/')">Continue</button>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { ref, computed, reactive, onMounted } from "vue";

export default {
  name: "BookBindingScreen",
  directives: {
    draggable: {
      mounted(el, binding) {
        el.style.position = "absolute";
        const onMouseMove = (e) => {
          const parent = el.parentElement;
          const rect = parent.getBoundingClientRect();
          let x = e.clientX - rect.left;
          x = Math.max(0, Math.min(x, rect.width));
          const pct = (x / rect.width) * 100;
          el.style.left = pct + "%";
          binding.value(pct);
        };
        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };
        const onMouseDown = (e) => {
          e.preventDefault();
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        };
        el.addEventListener("mousedown", onMouseDown);
        el._cleanup = () => {
          el.removeEventListener("mousedown", onMouseDown);
        };
      },
      unmounted(el) {
        el._cleanup && el._cleanup();
      },
    },
  },
  // eslint-disable-next-line vue/no-dupe-keys
  props: {
    title: { type: String, required: true },
    manuscriptDate: { type: String, default: "" },
    location: { type: String, required: true },
    shelfmark: { type: String, default: "" },
    quires: { type: [Number, String], required: true },
    leavesPerQuire: { type: [Number, String], required: true },
    collationStyle: { type: String, default: "foliate" },
    frontEndleaves: { type: [Number, String], default: 0 },
    backEndleaves: { type: [Number, String], default: 0 },
    sewingSupports: { type: [Number, String], required: true },
    headbands: { type: Boolean, default: false },
    changeOver: { type: Boolean, default: false },
    spineLength: { type: [Number, String], required: true },
  },
  setup(props) {
    const qNum = computed(() => parseInt(props.quires) || 0);
    const leavesN = computed(() => parseInt(props.leavesPerQuire) || 0);
    const feN = computed(() => parseInt(props.frontEndleaves) || 0);
    const beN = computed(() => parseInt(props.backEndleaves) || 0);
    const slN = computed(() => parseInt(props.spineLength) || 0);

    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const rows = computed(() => {
      const out = [];
      for (let i = 0; i < feN.value; i++) {
        const n = i + 1;
        out.push({
          roman: "",
          range:
            props.collationStyle === "foliate"
              ? `${n}r–${n}v`
              : `p ${2 * n - 1}–${2 * n}`,
        });
      }
      for (let i = 0; i < qNum.value; i++) {
        const start = i * leavesN.value + 1,
          end = start + leavesN.value - 1;
        out.push({
          roman: roman[i] || `${i + 1}`,
          range:
            props.collationStyle === "foliate"
              ? `${start}r–${end}v`
              : `p ${2 * start - 1}–${2 * end}`,
        });
      }
      const offset = qNum.value * leavesN.value;
      for (let i = 0; i < beN.value; i++) {
        const n = offset + (i + 1);
        out.push({
          roman: "",
          range:
            props.collationStyle === "foliate"
              ? `${n}r–${n}v`
              : `p ${2 * n - 1}–${2 * n}`,
        });
      }
      return out;
    });

    const notes = reactive(Array(rows.value.length).fill(""));

    const ruler = ref(null);
    const tooltipVisible = ref(false);
    const tooltipX = ref(0);
    const tooltipCm = ref(0);
    const totalCm = computed(() => slN.value);
    const majorTicks = computed(() =>
      Array.from({ length: totalCm.value + 1 }, (_, i) => i)
    );
    const minorTicks = computed(() =>
      Array.from({ length: totalCm.value * 10 + 1 }, (_, i) =>
        i % 10 === 0 ? null : (i / (totalCm.value * 10)) * 100
      ).filter((x) => x != null)
    );
    function onRulerMove(e) {
      const rect = ruler.value.getBoundingClientRect();
      const x = e.clientX - rect.left;
      tooltipX.value = x;
      tooltipCm.value = (x / rect.width) * totalCm.value;
      tooltipVisible.value = true;
    }

    const headbandPositions = reactive(props.headbands ? [5, 95] : []);
    function addHeadband() {
      headbandPositions.push(50);
    }

    const supportEntries = reactive([]);
    const changePositions = reactive(props.changeOver ? [25, 75] : []);
    const holePositions = reactive([]);

    onMounted(() => {
      for (let i = 0; i < props.sewingSupports; i++) {
        supportEntries.push({
          id: i + 1,
          position: ((i + 1) / (props.sewingSupports + 1)) * 100,
          width: 6,
        });
      }
      const count = Math.max(1, Math.floor(leavesN.value / 2));
      for (let i = 0; i < count; i++) {
        holePositions.push(((i + 1) / (count + 1)) * 100);
      }
    });

    function addSupport() {
      const type = window.prompt("single or double?", "single");
      const id = supportEntries.length + 1;
      supportEntries.push({
        id,
        position: 50,
        width: type === "double" ? 12 : 6,
      });
    }

    function addChange() {
      changePositions.push(50);
    }

    function addHole() {
      holePositions.push(50);
    }

    const pens = ref([{ id: 1 }, { id: 2 }]);
    const activePenId = ref(1);
    function selectPen(id) {
      activePenId.value = id;
    }

    return {
      title: props.title,
      manuscriptDate: props.manuscriptDate,
      location: props.location,
      shelfmark: props.shelfmark,

      rows,
      notes,
      ruler,
      tooltipVisible,
      tooltipX,
      tooltipCm,
      totalCm,
      majorTicks,
      minorTicks,
      onRulerMove,

      headbandPositions,
      addHeadband,
      supportEntries,
      addSupport,
      changePositions,
      addChange,
      holePositions,
      addHole,

      pens,
      activePenId,
      selectPen,
    };
  },
};
</script>



<style scoped>
.bookbinding-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #112233;
  color: white;
  overflow: hidden;
  font-family: Arial, sans-serif;
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
  text-align: center;
  padding: 12px 0;
  font-size: 32px;
  color: #a0a0a0;
  font-weight: 400;
}
.breadcrumb {
  background: #1f2a3a;
  padding: 8px 24px;
  font-size: 14px;
  color: white;
}

/* Pen toolbar */
.pen-toolbar {
  display: flex;
  gap: 12px;
  padding: 8px 24px;
  background: #0f2340;
}
.pen-btn {
  padding: 6px 12px;
  background: #1f2a3a;
  border: 1px solid #555;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}
.pen-btn.active {
  background: #4ea5de;
  border-color: #4ea5de;
}

/* Ruler */
.ruler {
  position: relative;
  height: 40px;
  background: #f7f7f7;
  margin: 16px auto;
  width: 80%;
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
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

/* Table */
.binding-table {
  width: 80%;
  margin: 0 auto 16px;
  border-collapse: collapse;
  background: white;
}
.binding-table th,
.binding-table td {
  border: 1px solid #333;
  padding: 6px 8px;
  font-size: 14px;
}
.header-dark {
  background: #0f2340;
  color: white;
  font-weight: 600;
}
.header-light {
  background: #fff;
  color: black;
  font-weight: 600;
}
.head-tail {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
.cell-text {
  color: black;
}
.canvas-col {
  background: white !important;
}
.canvas-cell {
  position: relative;
  background: rgba(15, 35, 64, 0.1);
}
tbody tr.even {
  background: #e1e1e1;
}
tbody tr.odd {
  background: #c8c8c8;
}
.add-row .add-cell {
  text-align: left;
  color: #555;
  font-style: italic;
  font-size: 14px;
}

/* Bars & dots */
.headband-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16px;
  background: #4ea5de;
}
.support-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12px;
  background: #e2b043;
  transform: translateX(-50%);
}
.change-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background: #222;
  transform: translateX(-50%);
}
.hole-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #333;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* Notes & footer */
.notes-input {
  width: 100%;
  padding: 4px;
  font-size: 14px;
  border: 1px solid #999;
}
.footer {
  background: #1f2a3a;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.legend {
  display: flex;
  gap: 24px;
  font-size: 14px;
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
.swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: middle;
}
.swatch.headband {
  background: #4ea5de;
}
.swatch.support {
  background: #e2b043;
}
.swatch.change {
  background: #222;
}
.swatch.hole {
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
</style>
