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
      {{ title }}<span v-if="location">, {{ location }}</span
      ><span v-if="shelfmark">, {{ shelfmark }}</span
      ><span v-if="manuscriptDate">, {{ manuscriptDate }}</span>
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
            <th class="black-text">Quire</th>
            <th class="black-text">Leaves</th>
            <th class="canvas-col head-tail">Head</th>
            <th class="canvas-col">Sewing</th>
            <th class="canvas-col">Change</th>
            <th class="canvas-col">Holes</th>
            <th class="canvas-col head-tail">Tail</th>
            <th class="notes-header">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="i"
            :class="i % 2 === 0 ? 'even' : 'odd'"
          >
            <td class="black-text">{{ row.roman }}</td>
            <td class="black-text">{{ row.range }}</td>
            <td class="canvas-cell">
              <div v-if="headbands" class="headband-bar" />
            </td>
            <td class="canvas-cell">
              <div
                v-for="(pos, j) in supportPositions"
                :key="j"
                class="support-bar"
                :style="{ left: pos + '%' }"
              />
            </td>
            <td class="canvas-cell">
              <div
                v-for="(pos, j) in changePositions"
                :key="j"
                class="change-bar"
                :style="{ left: pos + '%' }"
              />
            </td>
            <td class="canvas-cell">
              <div
                v-for="(pos, j) in holePositions"
                :key="j"
                class="hole-dot"
                :style="{ left: pos + '%' }"
              />
            </td>
            <td class="canvas-cell">
              <div v-if="headbands" class="headband-bar" />
            </td>
            <td>
              <input type="text" class="notes-input" v-model="notes[i]" />
            </td>
          </tr>
          <tr class="add-row">
            <td class="add-cell" colspan="8">+ Add</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER LEGEND + CONTINUE -->
    <div class="footer">
      <div class="legend">
        <div>
          <span class="swatch headband" /> Headbands <button>+ Add</button>
        </div>
        <div>
          <span class="swatch support" /> Sewing support <button>+ Add</button>
        </div>
        <div>
          <span class="swatch change" /> Change-over <button>+ Add</button>
        </div>
        <div>
          <span class="swatch hole" /> Sewing holes <button>+ Add</button>
        </div>
      </div>
      <button class="continue-btn" @click="$router.push('/')">Continue</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive } from "vue";

export default {
  name: "BookBindingScreen",
  props: {
    title: { type: String, required: true },
    manuscriptDate: { type: String, default: "" },
    location: { type: String, required: true },
    shelfmark: { type: String, default: "" },
    quires: { type: Number, required: true },
    leavesPerQuire: { type: Number, required: true },
    collationStyle: { type: String, default: "foliate" },
    frontEndleaves: { type: Number, default: 0 },
    backEndleaves: { type: Number, default: 0 },
    sewingSupports: { type: Number, required: true },
    headbands: { type: Boolean, default: false },
    changeOver: { type: Boolean, default: false },
    spineLength: { type: Number, required: true },
  },
  setup(props) {
    // 1) Build rows (front endleaves → quires → back endleaves)
    const romanArr = [
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
    const rows = computed(() => {
      const out = [];
      // front endleaves
      for (let i = 0; i < props.frontEndleaves; i++) {
        const n = i + 1;
        out.push({
          roman: "",
          range:
            props.collationStyle === "foliate"
              ? `${n}r–${n}v`
              : `p ${2 * n - 1}–${2 * n}`,
        });
      }
      // main quires
      for (let i = 0; i < props.quires; i++) {
        const start = i * props.leavesPerQuire + 1;
        const end = start + props.leavesPerQuire - 1;
        out.push({
          roman: romanArr[i] || `${i + 1}`,
          range:
            props.collationStyle === "foliate"
              ? `${start}r–${end}v`
              : `p ${2 * start - 1}–${2 * end}`,
        });
      }
      // back endleaves
      const offset = props.quires * props.leavesPerQuire;
      for (let i = 0; i < props.backEndleaves; i++) {
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

    // notes array
    const notes = reactive(Array(rows.value.length).fill(""));

    // 2) Ruler logic
    const ruler = ref(null),
      tooltipVisible = ref(false),
      tooltipX = ref(0),
      tooltipCm = ref(0);

    const totalCm = computed(() => props.spineLength);
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

    // 3) Support / change / hole positions
    const supportPositions = computed(() =>
      Array.from(
        { length: props.sewingSupports },
        (_, i) => ((i + 1) / (props.sewingSupports + 1)) * 100
      )
    );
    const changePositions = computed(() => (props.changeOver ? [25, 75] : []));
    const holePositions = computed(() =>
      Array.from(
        { length: Math.max(1, Math.floor(props.leavesPerQuire / 2)) },
        (_, i) => ((i + 1) / (Math.floor(props.leavesPerQuire / 2) + 1)) * 100
      )
    );

    return {
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
      supportPositions,
      changePositions,
      holePositions,
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

/* Header */
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

/* Title */
.title-bar {
  background: #0f2340;
  text-align: center;
  padding: 12px 0;
  font-size: 32px;
  color: #a0a0a0;
  font-weight: 400;
}

/* Breadcrumb */
.breadcrumb {
  background: #1f2a3a;
  padding: 8px 24px;
  font-size: 14px;
  color: white;
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

/* Data table */
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
.binding-table th {
  background: #0f2340;
  color: white;
  font-weight: 600;
  font-size: 16px;
}
.black-text {
  color: black !important;
}
.canvas-col {
  background: white !important;
}
.canvas-cell {
  position: relative;
  background: rgba(15, 35, 64, 0.1);
}
/* Head/Tail vertical */
.head-tail {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 14px;
  font-weight: 600;
}
/* Striping */
tbody tr.even {
  background: #e1e1e1;
}
tbody tr.odd {
  background: #c8c8c8;
}
/* + Add row */
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
  left: 0;
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

/* Notes input */
.notes-input {
  width: 100%;
  padding: 4px;
  font-size: 14px;
  border: 1px solid #999;
}

/* Footer */
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
