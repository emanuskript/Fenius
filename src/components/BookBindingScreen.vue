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
      <table class="binding-table">
        <thead>
          <tr>
            <th class="header-dark quire-col">Quire</th>
            <th class="header-dark leaves-col">Leaves</th>
            <th class="header-light head-col">
              <div class="vertical-text">Head</div>
            </th>

            <!-- RULER HEADER spans Sewing / Change / Holes -->
            <th class="header-light ruler-header" colspan="3">
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
            </th>

            <th class="header-light tail-col">
              <div class="vertical-text">Tail</div>
            </th>
            <th class="header-dark notes-col">Notes</th>
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
                :key="'hbL-' + idx"
                class="headband-bar"
                :style="{ left: pos + '%' }"
                v-draggable="(v) => (headbandPositions[idx] = v)"
              />
            </td>

            <!-- Combined supports+change+holes -->
            <td class="canvas-cell supports-cell" colspan="3">
              <!-- change‐over stations (initialized near edges) -->
              <div
                v-for="(cp, ci) in changePositions"
                :key="'co-' + ci"
                class="change-bar"
                :style="{ left: cp + '%' }"
                v-draggable="(v) => (changePositions[ci] = v)"
              />
              <!-- sewing supports + holes -->
              <div
                v-for="(sp, si) in supportEntries"
                :key="sp.id"
                class="support-group"
              >
                <div
                  v-if="showHoles"
                  class="hole-dot"
                  :style="holeStyle(sp.position, -1)"
                />
                <div
                  class="support-bar"
                  :style="{ left: sp.position + '%' }"
                  v-draggable="(v) => (supportEntries[si].position = v)"
                />
                <div
                  v-if="showHoles"
                  class="hole-dot"
                  :style="holeStyle(sp.position, 1)"
                />
              </div>
            </td>

            <!-- Headbands (right) -->
            <td class="canvas-cell">
              <div
                v-for="(pos, idx) in headbandPositions"
                :key="'hbR-' + idx"
                class="headband-bar"
                :style="{ left: 100 - pos + '%' }"
                v-draggable="(v) => (headbandPositions[idx] = 100 - v)"
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

    <!-- FOOTER -->
    <div class="footer">
      <div class="legend">
        <div>
          <span class="swatch headband"></span> Headbands
          <button @click="addHeadband">+ Add</button>
        </div>
        <div>
          <span class="swatch support"></span> Sewing support
          <button @click="addSupport">+ Add</button>
        </div>
        <div>
          <span class="swatch change"></span> Change‐over station
          <button @click="addChange">+ Add</button>
        </div>
        <div>
          <span class="swatch hole"></span> Sewing holes
          <button @click="toggleHoles">Toggle</button>
        </div>
      </div>
      <button class="continue-btn" @click="$router.push('/')">Continue</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from "vue";

export default {
  name: "BookBindingScreen",
  directives: {
    draggable: {
      mounted(el, { value }) {
        el.style.position = "absolute";
        el.style.cursor = "grab";
        const onMove = (e) => {
          const r = el.parentElement.getBoundingClientRect();
          let x = Math.max(0, Math.min(r.width, e.clientX - r.left));
          const pct = (x / r.width) * 100;
          el.style.left = pct + "%";
          value(pct);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        el.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
      },
    },
  },
  props: {
    title: String,
    manuscriptDate: String,
    location: String,
    shelfmark: String,
    quires: [Number, String],
    leavesPerQuire: [Number, String],
    collationStyle: String,
    frontEndleaves: [Number, String],
    backEndleaves: [Number, String],
    sewingSupports: [Number, String],
    headbands: Boolean,
    changeOver: Boolean,
    spineLength: [Number, String],
  },
  setup(props) {
    // rows
    const rows = computed(() => {
      const a = [],
        q = +props.quires || 0,
        l = +props.leavesPerQuire || 0,
        fe = +props.frontEndleaves || 0,
        be = +props.backEndleaves || 0,
        romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
      for (let i = 0; i < fe; i++) {
        const n = i + 1;
        a.push({
          roman: "",
          range:
            props.collationStyle === "foliate"
              ? `${n}r–${n}v`
              : `p ${2 * n - 1}–${2 * n}`,
        });
      }
      for (let i = 0; i < q; i++) {
        const s = i * l + 1,
          e = s + l - 1;
        a.push({
          roman: romans[i] || `${i + 1}`,
          range:
            props.collationStyle === "foliate"
              ? `${s}r–${e}v`
              : `p ${2 * s - 1}–${2 * e}`,
        });
      }
      const off = q * l;
      for (let i = 0; i < be; i++) {
        const n = off + i + 1;
        a.push({
          roman: "",
          range:
            props.collationStyle === "foliate"
              ? `${n}r–${n}v`
              : `p ${2 * n - 1}–${2 * n}`,
        });
      }
      return a;
    });
    const notes = reactive(Array(rows.value.length).fill(""));

    // ruler
    const totalCm = computed(() => +props.spineLength || 0);
    const majorTicks = computed(() =>
      Array.from({ length: totalCm.value + 1 }, (_, i) => i)
    );
    const minorTicks = computed(() =>
      Array.from({ length: totalCm.value * 10 + 1 }, (_, i) =>
        i % 10 ? (i / (totalCm.value * 10)) * 100 : null
      ).filter((x) => x != null)
    );
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

    // headbands
    const headbandPositions = reactive(props.headbands ? [5, 95] : []);
    function addHeadband() {
      headbandPositions.push(50);
    }

    // supports
    const supportEntries = reactive([]);
    onMounted(() => {
      const cnt = +props.sewingSupports || 0;
      for (let i = 0; i < cnt; i++) {
        supportEntries.push({
          id: i + 1,
          position: ((i + 1) / (cnt + 1)) * 100,
        });
      }
    });
    function addSupport() {
      supportEntries.push({ id: supportEntries.length + 1, position: 50 });
    }

    // change-over
    const changePositions = reactive(props.changeOver ? [5, 95] : []);
    function addChange() {
      changePositions.push(50);
    }

    // holes
    const showHoles = ref(true);
    function toggleHoles() {
      showHoles.value = !showHoles.value;
    }
    function holeStyle(p, side) {
      return {
        left: `calc(${p + side * 3}% )`,
        top: "50%",
        transform: "translate(-50%,-50%)",
      };
    }

    // pens
    const pens = ref([{ id: 1 }, { id: 2 }]),
      activePenId = ref(1);
    function selectPen(id) {
      activePenId.value = id;
    }

    return {
      rows,
      notes,
      ruler,
      totalCm,
      majorTicks,
      minorTicks,
      tooltipVisible,
      tooltipX,
      tooltipCm,
      onRulerMove,
      headbandPositions,
      addHeadband,
      supportEntries,
      addSupport,
      changePositions,
      addChange,
      showHoles,
      toggleHoles,
      holeStyle,
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
  color: #a0a0a0;
  text-align: center;
  padding: 12px 0;
  font-size: 32px;
  font-weight: 400;
}
.breadcrumb {
  background: #1f2a3a;
  padding: 8px 24px;
  font-size: 14px;
  color: white;
}
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

.table-container {
  margin: 0 auto;
  width: 80%;
}
.binding-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  margin-bottom: 16px;
  table-layout: fixed;
}
.binding-table th,
.binding-table td {
  border: 1px solid #333;
  padding: 6px 8px;
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
.ruler-header {
  width: 50%;
  padding: 0;
}
.notes-col {
  width: 25%;
}

.vertical-text {
  transform: rotate(-90deg);
  transform-origin: center center;
  white-space: nowrap;
}

.ruler {
  position: relative;
  height: 40px;
  background: #f7f7f7;
  width: 100%;
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
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}

.canvas-cell {
  position: relative;
  background: rgba(15, 35, 64, 0.1);
}
.supports-cell {
  padding: 0;
}
.support-group {
  position: relative;
  height: 48px;
}
.change-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  border-left: 2px dashed #222;
  transform: translateX(-50%);
}
.support-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background: #e2b043;
  transform: translateX(-50%);
  cursor: grab;
}
.hole-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #333;
}
.headband-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16px;
  background: #4ea5de;
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
  border-left: 2px dashed #222;
  background: transparent;
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
