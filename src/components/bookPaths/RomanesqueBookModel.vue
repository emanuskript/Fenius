<template>
  <svg
    class="roman-model"
    viewBox="0 0 1200 850"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="accessibleLabel"
  >
    <title>{{ accessibleLabel }}</title>
    <desc>
      A single connected isometric reconstruction. Its holes, endleaves, sewing supports,
      boards, channels, lining, endbands, cover stitching, and fastening are derived from
      the choices made in the Romanesque binding workflow.
    </desc>

    <defs>
      <linearGradient id="paperTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fffefb" />
        <stop offset="1" stop-color="#f3f0e8" />
      </linearGradient>
      <linearGradient id="paperEdge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fbfaf6" />
        <stop offset="1" stop-color="#ebe7dd" />
      </linearGradient>
      <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#eee5d5" />
        <stop offset="1" stop-color="#d8c8ad" />
      </linearGradient>
      <pattern id="wood" width="120" height="45" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect width="120" height="45" fill="#e8ddc8" />
        <path d="M0 9 C28 2 68 18 120 7 M0 28 C35 18 76 38 120 24" fill="none" stroke="#b8a486" stroke-width="1.2" opacity=".52" />
      </pattern>
      <filter id="bookShadow" x="-25%" y="-25%" width="150%" height="170%">
        <feDropShadow dx="0" dy="14" stdDeviation="13" flood-color="#334155" flood-opacity=".16" />
      </filter>
      <clipPath id="spineFaceClip">
        <polygon :points="spineFacePoints" />
      </clipPath>
    </defs>

    <rect data-model-background width="1200" height="850" fill="#fff" />

    <g :transform="sceneTransform" filter="url(#bookShadow)">
      <!-- During board preparation the book is explicitly set aside. The board
           and its channels are therefore drawn as one connected object. -->
      <g v-if="boardOnly">
        <path :d="boardTopPath" fill="url(#wood)" :stroke="ink" stroke-width="2.3" stroke-linejoin="round" />
        <path :d="boardFrontEdgePath" fill="#cfbea1" :stroke="ink" stroke-width="2" stroke-linejoin="round" />
        <path v-if="boardBevelled" :d="boardInsetPath" fill="none" stroke="#9c8768" stroke-width="2" />
        <g v-if="showChannels" aria-label="Lacing channels on the selected board">
          <g v-for="station in supportStations" :key="`board-channel-${station.t}`">
            <path :d="channelPath(station, channelLength)" fill="none" stroke="#6f5b42" stroke-width="10" stroke-linecap="round" opacity=".34" />
            <path :d="channelPath(station, channelLength)" fill="none" :stroke="ink" stroke-width="2.2" stroke-dasharray="5 4" />
            <circle :cx="station.x" :cy="station.y" r="5" fill="#f8f5ef" :stroke="ink" stroke-width="2" />
            <circle :cx="station.x + channelLength" :cy="station.y - channelLength * 0.56" r="4.5" fill="#8b7658" :stroke="ink" stroke-width="1.7" />
          </g>
        </g>
        <path v-if="derived.backCornered" :d="headBackCornerPath" fill="#fff" :stroke="ink" stroke-width="2" />
        <path v-if="derived.backCornered" :d="tailBackCornerPath" fill="#fff" :stroke="ink" stroke-width="2" />
      </g>

      <g v-else>
        <!-- Lower board, visible beneath the trimmed block. -->
        <g v-if="hasBoards">
          <polygon :points="lowerBoardSpinePoints" :fill="covered ? 'url(#leather)' : 'url(#wood)'" :stroke="ink" stroke-width="2.2" />
          <polygon :points="lowerBoardForePoints" :fill="covered ? '#cdbb9d' : '#cfbea1'" :stroke="ink" stroke-width="2.2" />
        </g>

        <!-- The book block is always one continuous solid. -->
        <g aria-label="Book block">
          <polygon :points="spineFacePoints" fill="#fffdf8" :stroke="ink" stroke-width="2.5" stroke-linejoin="round" />
          <polygon :points="foreFacePoints" fill="url(#paperEdge)" :stroke="ink" stroke-width="2.5" stroke-linejoin="round" />
          <polygon :points="topPlanePoints" fill="url(#paperTop)" :stroke="ink" stroke-width="2.5" stroke-linejoin="round" />

          <path
            v-for="offset in quireOffsets"
            :key="`quire-${offset}`"
            :d="quireLine(offset)"
            fill="none"
            stroke="#746f68"
            stroke-width="1.45"
          />
          <path
            v-for="offset in pageOffsets"
            :key="`page-${offset}`"
            :d="forePageLine(offset)"
            fill="none"
            stroke="#969086"
            stroke-width=".72"
            opacity=".72"
          />

          <g v-if="showHoles" clip-path="url(#spineFaceClip)" :aria-label="`${derived.holes} sewing holes`">
            <template v-for="station in holeStations" :key="`holes-${station.t}`">
              <template v-for="offset in holeRowOffsets" :key="`hole-${station.t}-${offset}`">
                <circle
                  v-if="derived.holes === 'pierced'"
                  :cx="station.x"
                  :cy="station.y + offset"
                  r="2.25"
                  fill="#3f3b36"
                />
                <path
                  v-else
                  :d="`M ${station.x - 5} ${station.y + offset - 2} l 10 5`"
                  stroke="#3f3b36"
                  stroke-width="2.1"
                  stroke-linecap="round"
                />
              </template>
            </template>
          </g>
        </g>

        <!-- Endleaves alter the block itself; they are never free-floating plates. -->
        <g v-if="derived.endleaves === 'added-quire' && !hasBoards" aria-label="Added thin endleaf quire">
          <polygon :points="offsetPlane(-10, -8)" fill="#fff" :stroke="ink" stroke-width="2" />
          <path :d="`M ${spineBack.x - 7} ${spineBack.y + blockHeight + 9} L ${spineFront.x - 7} ${spineFront.y + blockHeight + 9}`" fill="none" :stroke="ink" stroke-width="2" />
        </g>
        <g v-if="derived.endleaves === 'wrapped-bifolium' && !hasBoards" aria-label="Large wrapped bifolium endleaf">
          <path :d="wrappedEndleafPath" fill="#fffdf7" :stroke="ink" stroke-width="2.2" stroke-linejoin="round" />
          <path :d="wrappedFoldPath" fill="none" stroke="#8a8379" stroke-width="1.5" stroke-dasharray="6 5" />
        </g>

        <!-- Lining is pasted to the spine face, behind the sewing supports. -->
        <g v-if="derived.lining === 'patch'" aria-label="Patch spine lining">
          <polygon
            v-for="segment in patchSegments"
            :key="`patch-${segment}`"
            :points="patchPoints(segment)"
            fill="#e5dcc8"
            stroke="#806f56"
            stroke-width="1.5"
          />
        </g>
        <g v-if="derived.lining === 'slotted'" aria-label="Full-length slotted spine lining">
          <polygon :points="spineFacePoints" fill="#e5dcc8" stroke="#806f56" stroke-width="1.5" opacity=".95" />
          <path
            v-for="station in supportStations"
            :key="`lining-slot-${station.t}`"
            :d="`M ${station.x - 7} ${station.y + 5} L ${station.x - 7} ${station.y + blockHeight - 5} L ${station.x + 7} ${station.y + blockHeight - 5} L ${station.x + 7} ${station.y + 5}`"
            fill="#fffdf8"
            :stroke="ink"
            stroke-width="1.3"
          />
        </g>

        <!-- Sewn supports and stitches occupy the same spine geometry. -->
        <g
          v-if="showSewnSupports"
          :clip-path="hasBoards ? 'url(#spineFaceClip)' : null"
          :aria-label="`${derived.support}, ${derived.sewing} sewing`"
        >
          <g v-for="station in supportStations" :key="`support-${station.t}`">
            <path
              v-if="derived.support === 'twisted-leather'"
              :d="twistedSupportPath(station)"
              fill="none"
              stroke="#bba98a"
              stroke-width="14"
              stroke-linecap="round"
            />
            <path
              v-if="derived.support === 'twisted-leather'"
              :d="twistedSupportPath(station)"
              fill="none"
              :stroke="ink"
              stroke-width="2.1"
              stroke-dasharray="7 5"
            />
            <rect
              v-else
              :x="station.x - 10"
              :y="station.y - 8"
              width="20"
              :height="blockHeight + 48"
              rx="7"
              fill="#d6c6aa"
              :stroke="ink"
              stroke-width="1.8"
            />
            <path
              v-if="derived.support === 'slit-leather'"
              :d="`M ${station.x} ${station.y + 5} L ${station.x} ${station.y + blockHeight + 30}`"
              fill="none"
              stroke="#8b795e"
              stroke-width="1.3"
            />

            <path
              v-for="offset in stitchOffsets"
              :key="`stitch-${station.t}-${offset}`"
              :d="stitchPath(station, offset)"
              fill="none"
              stroke="#554a3d"
              :stroke-width="derived.sewing === 'packed-straight' ? 2.1 : 2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>

          <g v-for="station in changeoverStations" :key="`changeover-${station.t}`">
            <ellipse
              v-for="offset in changeoverOffsets"
              :key="`loop-${station.t}-${offset}`"
              :cx="station.x"
              :cy="station.y + offset"
              rx="8"
              ry="11"
              fill="none"
              stroke="#554a3d"
              stroke-width="2.4"
            />
          </g>
        </g>

        <!-- Boards return only after their preparation detour. -->
        <g v-if="hasBoards" aria-label="Prepared boards attached to the book block">
          <path :d="boardTopPath" :fill="covered ? 'url(#leather)' : 'url(#wood)'" :stroke="ink" stroke-width="2.5" stroke-linejoin="round" />
          <path :d="boardFrontEdgePath" :fill="covered ? '#cdbb9d' : '#cfbea1'" :stroke="ink" stroke-width="2" />
          <path v-if="boardBevelled" :d="boardInsetPath" fill="none" stroke="#9c8768" stroke-width="2" />

          <g v-if="showChannels && !covered" aria-label="Supports laced through channels">
            <g v-for="station in supportStations" :key="`laced-${station.t}`">
              <path :d="channelPath(station, channelLength)" fill="none" stroke="#78664c" stroke-width="13" stroke-linecap="round" opacity=".28" />
              <path :d="lacedSupportPath(station)" fill="none" stroke="#d3c2a4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
              <path :d="lacedSupportPath(station)" fill="none" :stroke="ink" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 3" />
              <circle :cx="station.x + channelLength" :cy="station.y - channelLength * 0.56" r="6" fill="#8b7658" :stroke="ink" stroke-width="2" />
            </g>
          </g>

          <path v-if="derived.backCornered" :d="headBackCornerPath" fill="#fff" :stroke="ink" stroke-width="2" />
          <path v-if="derived.backCornered" :d="tailBackCornerPath" fill="#fff" :stroke="ink" stroke-width="2" />
        </g>

        <!-- Covering is an exterior state: the leather wraps the spine and
             correctly conceals its internal sewing, lining, and channels. -->
        <polygon
          v-if="covered"
          :points="spineFacePoints"
          fill="url(#leather)"
          :stroke="ink"
          stroke-width="2.5"
          stroke-linejoin="round"
          aria-label="Leather spine covering"
        />

        <!-- Endbands reinforce the actual head and tail of the spine. -->
        <g v-if="derived.endband" :aria-label="`${derived.endband} endbands`">
          <path :d="headEndbandPath" fill="none" stroke="#c3a56f" stroke-width="12" stroke-linecap="round" />
          <path :d="headEndbandPath" fill="none" :stroke="ink" stroke-width="2.2" :stroke-dasharray="endbandDash" />
          <path :d="tailEndbandPath" fill="none" stroke="#c3a56f" stroke-width="12" stroke-linecap="round" />
          <path :d="tailEndbandPath" fill="none" :stroke="ink" stroke-width="2.2" :stroke-dasharray="endbandDash" />
        </g>

        <g v-if="derived.endbandTab" :aria-label="`${derived.endbandTab} endband tabs`">
          <path :d="headTabPath" fill="url(#leather)" :stroke="ink" stroke-width="2" />
          <path :d="tailTabPath" fill="url(#leather)" :stroke="ink" stroke-width="2" />
        </g>

        <!-- Cover stitching follows the connected perimeter of the same cover. -->
        <g v-if="covered" :aria-label="`${derived.coverStitch} perimeter stitching`">
          <path :d="coverPerimeterPath" fill="none" stroke="#5d5144" stroke-width="3" :stroke-dasharray="coverDash" stroke-linecap="round" />
        </g>

        <!-- The fastening is constructed on this book, so every previous choice remains visible. -->
        <g v-if="derived.fastening === 'short-strap'" aria-label="Short strap fastening">
          <path :d="shortStrapPath" fill="none" :stroke="ink" stroke-width="23" stroke-linecap="round" stroke-linejoin="round" />
          <path :d="shortStrapPath" fill="none" stroke="#cbb897" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
          <circle :cx="shortPeg.x" :cy="shortPeg.y" r="8" fill="#a58a5d" :stroke="ink" stroke-width="2.5" />
        </g>
        <g v-if="derived.fastening === 'long-strap'" aria-label="Two long strap fastenings">
          <g v-for="strap in longStraps" :key="`long-strap-${strap.t}`">
            <path :d="strap.path" fill="none" :stroke="ink" stroke-width="25" stroke-linecap="round" stroke-linejoin="round" />
            <path :d="strap.path" fill="none" stroke="#cbb897" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" />
            <circle :cx="strap.peg.x" :cy="strap.peg.y" r="8" fill="#a58a5d" :stroke="ink" stroke-width="2.5" />
          </g>
        </g>

        <!-- The sewing frame is a temporary, connected work state. -->
        <g v-if="showFrame" aria-label="Book block on sewing frame">
          <path d="M115 530 L635 830 L1100 560 L580 260 Z" fill="none" stroke="#8e7b60" stroke-width="10" opacity=".55" />
          <path d="M126 118 L706 452" fill="none" stroke="#9e896a" stroke-width="34" stroke-linecap="square" />
          <path d="M126 118 L706 452" fill="none" :stroke="ink" stroke-width="2.5" />
          <path d="M112 105 L692 439" fill="none" stroke="#d5c5aa" stroke-width="15" />
          <rect x="100" y="112" width="34" height="435" rx="12" fill="#d6c6aa" :stroke="ink" stroke-width="2.3" />
          <rect x="688" y="438" width="34" height="337" rx="12" fill="#d6c6aa" :stroke="ink" stroke-width="2.3" />
          <g v-for="station in supportStations" :key="`frame-support-${station.t}`">
            <path :d="frameSupportPath(station)" fill="none" stroke="#bba98a" :stroke-width="derived.support === 'twisted-leather' ? 10 : 16" stroke-linecap="round" />
            <path :d="frameSupportPath(station)" fill="none" :stroke="ink" stroke-width="2" :stroke-dasharray="derived.support === 'twisted-leather' ? '7 5' : 'none'" />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
/* eslint-disable no-undef */
import { computed } from "vue";
import { resolveRomanesqueVisualState } from "@/bookPaths/romanModelState";

const props = defineProps({
  derived: { type: Object, default: () => ({}) },
  nodeId: { type: String, default: "" },
});

const ink = "#403c37";
const blockHeight = 176;
const spineBack = { x: 205, y: 255 };
const foreBack = { x: 610, y: 72 };
const foreFront = { x: 1015, y: 305 };
const spineFront = { x: 610, y: 493 };

const derived = computed(() => resolveRomanesqueVisualState(props.derived || {}));
const boardOnly = computed(() => ["romanesque_channels", "romanesque_backcorner"].includes(props.nodeId));
const showChannels = computed(() => !!derived.value.channels);
const hasBoards = computed(() => !!derived.value.backCornered || !!derived.value.lining || !!derived.value.endband || !!derived.value.endbandTab || !!derived.value.coverStitch || !!derived.value.fastening);
const covered = computed(() => !!derived.value.coverStitch);
const showFrame = computed(() => !!derived.value.support && !derived.value.sewing);
const showSewnSupports = computed(() => !!derived.value.sewing);
const showHoles = computed(() => !!derived.value.holes && !covered.value);
const boardBevelled = computed(() => derived.value.board === "bevelled");
const channelLength = computed(() => derived.value.channels === "type-2" ? 148 : 78);
const sceneTransform = computed(() => boardOnly.value ? "translate(72 78) scale(.88)" : "translate(0 0)");

const topPlanePoints = `${spineBack.x},${spineBack.y} ${foreBack.x},${foreBack.y} ${foreFront.x},${foreFront.y} ${spineFront.x},${spineFront.y}`;
const spineFacePoints = `${spineBack.x},${spineBack.y} ${spineFront.x},${spineFront.y} ${spineFront.x},${spineFront.y + blockHeight} ${spineBack.x},${spineBack.y + blockHeight}`;
const foreFacePoints = `${spineFront.x},${spineFront.y} ${foreFront.x},${foreFront.y} ${foreFront.x},${foreFront.y + blockHeight} ${spineFront.x},${spineFront.y + blockHeight}`;

const boardBack = { x: 191, y: 239 };
const boardFarBack = { x: 610, y: 49 };
const boardFarFront = { x: 1034, y: 293 };
const boardFront = { x: 610, y: 538 };

const point = (p) => `${p.x},${p.y}`;
const polygon = (points) => points.map(point).join(" ");
const interpolate = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const supportStations = [0.27, 0.5, 0.73].map((t) => ({ t, ...interpolate(spineBack, spineFront, t) }));
const changeoverStations = [0.075, 0.925].map((t) => ({ t, ...interpolate(spineBack, spineFront, t) }));
const holeStations = [0.075, 0.27, 0.5, 0.73, 0.925].map((t) => ({ t, ...interpolate(spineBack, spineFront, t) }));

const quireOffsets = Array.from({ length: 8 }, (_, i) => (i + 1) * (blockHeight / 9));
const pageOffsets = Array.from({ length: 35 }, (_, i) => (i + 1) * (blockHeight / 36));
const holeRowOffsets = Array.from({ length: 9 }, (_, i) => i * (blockHeight / 9) + 9);
const stitchOffsets = Array.from({ length: 9 }, (_, i) => i * (blockHeight / 9) + 7);
const changeoverOffsets = Array.from({ length: 6 }, (_, i) => 20 + i * 27);
const patchSegments = [0.16, 0.4, 0.64, 0.88];

function quireLine(offset) {
  return `M ${spineBack.x} ${spineBack.y + offset} Q ${(spineBack.x + spineFront.x) / 2} ${(spineBack.y + spineFront.y) / 2 + offset + 5} ${spineFront.x} ${spineFront.y + offset}`;
}

function forePageLine(offset) {
  return `M ${spineFront.x} ${spineFront.y + offset} L ${foreFront.x} ${foreFront.y + offset}`;
}

function offsetPlane(dx, dy) {
  return polygon([
    { x: spineBack.x + dx, y: spineBack.y + dy },
    { x: foreBack.x + dx, y: foreBack.y + dy },
    { x: foreFront.x + dx, y: foreFront.y + dy },
    { x: spineFront.x + dx, y: spineFront.y + dy },
  ]);
}

const wrappedEndleafPath = computed(() => `M ${spineBack.x - 24} ${spineBack.y - 14} L ${foreBack.x} ${foreBack.y - 14} L ${foreFront.x + 18} ${foreFront.y - 2} L ${spineFront.x + 8} ${spineFront.y + 10} L ${spineFront.x + 8} ${spineFront.y + blockHeight + 16} L ${spineBack.x - 24} ${spineBack.y + blockHeight + 16} Q ${spineBack.x - 45} ${spineBack.y + blockHeight / 2} ${spineBack.x - 24} ${spineBack.y - 14} Z`);
const wrappedFoldPath = computed(() => `M ${spineBack.x - 24} ${spineBack.y - 14} L ${spineFront.x + 8} ${spineFront.y + 10} M ${spineBack.x - 24} ${spineBack.y + blockHeight + 16} L ${spineFront.x + 8} ${spineFront.y + blockHeight + 16}`);

function patchPoints(t) {
  const a = interpolate(spineBack, spineFront, Math.max(0, t - 0.075));
  const b = interpolate(spineBack, spineFront, Math.min(1, t + 0.075));
  return polygon([a, b, { x: b.x, y: b.y + blockHeight }, { x: a.x, y: a.y + blockHeight }]);
}

function twistedSupportPath(station) {
  let d = `M ${station.x} ${station.y - 8}`;
  for (let i = 1; i <= 18; i += 1) {
    const y = station.y - 8 + i * ((blockHeight + 48) / 18);
    const x = station.x + (i % 2 ? 6 : -6);
    d += ` Q ${station.x + (i % 2 ? -8 : 8)} ${y - 6} ${x} ${y}`;
  }
  return d;
}

function stitchPath(station, offset) {
  const y = station.y + offset;
  if (derived.value.sewing === "herringbone") {
    return `M ${station.x - 15} ${y - 7} L ${station.x + 15} ${y + 7} M ${station.x + 15} ${y - 7} L ${station.x - 15} ${y + 7}`;
  }
  if (derived.value.sewing === "packed-straight") {
    return `M ${station.x - 16} ${y - 5} L ${station.x + 16} ${y - 5} M ${station.x - 16} ${y} L ${station.x + 16} ${y} M ${station.x - 16} ${y + 5} L ${station.x + 16} ${y + 5}`;
  }
  return `M ${station.x - 16} ${y} L ${station.x + 16} ${y}`;
}

const lowerBoardSpinePoints = polygon([
  { x: boardBack.x, y: boardBack.y + blockHeight + 2 },
  { x: boardFront.x, y: boardFront.y + blockHeight + 2 },
  { x: boardFront.x, y: boardFront.y + blockHeight + 21 },
  { x: boardBack.x, y: boardBack.y + blockHeight + 21 },
]);
const lowerBoardForePoints = polygon([
  { x: boardFront.x, y: boardFront.y + blockHeight + 2 },
  { x: boardFarFront.x, y: boardFarFront.y + blockHeight + 2 },
  { x: boardFarFront.x, y: boardFarFront.y + blockHeight + 21 },
  { x: boardFront.x, y: boardFront.y + blockHeight + 21 },
]);

const boardTopPath = computed(() => {
  if (derived.value.board === "rounded") {
    return `M ${boardBack.x + 14} ${boardBack.y - 8} Q ${boardBack.x - 10} ${boardBack.y} ${boardBack.x} ${boardBack.y + 25} L ${boardFront.x - 13} ${boardFront.y + 9} Q ${boardFront.x} ${boardFront.y + 19} ${boardFront.x + 16} ${boardFront.y + 9} L ${boardFarFront.x} ${boardFarFront.y} L ${boardFarBack.x} ${boardFarBack.y} Z`;
  }
  return `M ${boardBack.x} ${boardBack.y} L ${boardFarBack.x} ${boardFarBack.y} L ${boardFarFront.x} ${boardFarFront.y} L ${boardFront.x} ${boardFront.y} Z`;
});
const boardFrontEdgePath = computed(() => `M ${boardFront.x} ${boardFront.y} L ${boardFarFront.x} ${boardFarFront.y} L ${boardFarFront.x} ${boardFarFront.y + 16} L ${boardFront.x} ${boardFront.y + 16} Z`);
const boardInsetPath = computed(() => `M ${boardBack.x + 13} ${boardBack.y + 5} L ${boardFarBack.x} ${boardFarBack.y + 8} L ${boardFarFront.x - 15} ${boardFarFront.y} L ${boardFront.x} ${boardFront.y - 9} Z`);

function channelPath(station, length) {
  return `M ${station.x} ${station.y - 8} L ${station.x + length} ${station.y - 8 - length * 0.56}`;
}
function lacedSupportPath(station) {
  const length = channelLength.value;
  return `M ${station.x} ${station.y + blockHeight + 26} L ${station.x} ${station.y - 8} L ${station.x + length} ${station.y - 8 - length * 0.56}`;
}

const headBackCornerPath = computed(() => `M ${boardBack.x - 1} ${boardBack.y - 1} L ${boardBack.x + 24} ${boardBack.y + 13} L ${boardBack.x + 1} ${boardBack.y + 27} Z`);
const tailBackCornerPath = computed(() => `M ${boardFront.x - 26} ${boardFront.y - 14} L ${boardFront.x + 1} ${boardFront.y} L ${boardFront.x - 1} ${boardFront.y - 28} Z`);

const headEndbandPath = computed(() => `M ${spineBack.x - 3} ${spineBack.y + 1} L ${spineBack.x + 36} ${spineBack.y + 24}`);
const tailEndbandPath = computed(() => `M ${spineFront.x - 36} ${spineFront.y - 22} L ${spineFront.x + 3} ${spineFront.y + 1}`);
const endbandDash = computed(() => {
  if (derived.value.endband === "double-herringbone") return "3 3";
  if (derived.value.endband === "double-straight-packed") return "1 2";
  return "2 5";
});

const headTabPath = computed(() => derived.value.endbandTab === "round"
  ? `M ${spineBack.x - 18} ${spineBack.y - 3} Q ${spineBack.x + 2} ${spineBack.y - 32} ${spineBack.x + 34} ${spineBack.y + 15} L ${spineBack.x + 16} ${spineBack.y + 28} Z`
  : `M ${spineBack.x - 16} ${spineBack.y - 4} L ${spineBack.x + 17} ${spineBack.y - 22} L ${spineBack.x + 39} ${spineBack.y + 15} L ${spineBack.x + 14} ${spineBack.y + 29} Z`);
const tailTabPath = computed(() => derived.value.endbandTab === "round"
  ? `M ${spineFront.x - 36} ${spineFront.y - 22} Q ${spineFront.x - 2} ${spineFront.y - 5} ${spineFront.x + 17} ${spineFront.y + 25} L ${spineFront.x - 17} ${spineFront.y + 35} Z`
  : `M ${spineFront.x - 40} ${spineFront.y - 21} L ${spineFront.x - 9} ${spineFront.y - 38} L ${spineFront.x + 17} ${spineFront.y + 24} L ${spineFront.x - 15} ${spineFront.y + 38} Z`);

const coverPerimeterPath = computed(() => `M ${boardBack.x + 6} ${boardBack.y + 4} L ${boardFarBack.x} ${boardFarBack.y + 5} L ${boardFarFront.x - 6} ${boardFarFront.y} L ${boardFront.x} ${boardFront.y - 6} L ${boardBack.x + 6} ${boardBack.y + 4}`);
const coverDash = computed(() => derived.value.coverStitch === "link" ? "2 8" : "11 7");

function edgePoint(t) {
  return interpolate(boardFront, boardFarFront, t);
}

const shortEdge = edgePoint(0.47);
const shortPeg = { x: shortEdge.x - 84, y: shortEdge.y - 55 };
const shortStrapPath = computed(() => `M ${shortEdge.x} ${shortEdge.y + 112} L ${shortEdge.x} ${shortEdge.y + 8} L ${shortPeg.x} ${shortPeg.y}`);

const longStraps = [0.28, 0.68].map((t) => {
  const edge = edgePoint(t);
  const peg = { x: edge.x - 250, y: edge.y - 148 };
  return {
    t,
    peg,
    path: `M ${edge.x} ${edge.y + blockHeight + 24} L ${edge.x} ${edge.y + 7} L ${peg.x} ${peg.y}`,
  };
});

function frameSupportPath(station) {
  const top = interpolate({ x: 126, y: 118 }, { x: 706, y: 452 }, station.t);
  return `M ${top.x} ${top.y} L ${station.x} ${station.y + 16}`;
}

const accessibleLabel = computed(() => {
  const d = derived.value;
  if (boardOnly.value) {
    return `Prepared ${d.board || "wooden"} Romanesque board${d.channels ? ` with ${d.channels} lacing channels` : ""}`;
  }
  const parts = ["Romanesque binding model"];
  if (d.holes) parts.push(`${d.holes} holes`);
  if (d.endleaves) parts.push(`${d.endleaves} endleaves`);
  if (d.support) parts.push(`${d.support} supports`);
  if (d.sewing) parts.push(`${d.sewing} sewing`);
  if (d.board) parts.push(`${d.board} boards`);
  if (d.lining) parts.push(`${d.lining} lining`);
  if (d.endband) parts.push(`${d.endband} endbands`);
  if (d.endbandTab) parts.push(`${d.endbandTab} tabs`);
  if (d.coverStitch) parts.push(`${d.coverStitch} cover stitching`);
  if (d.fastening) parts.push(`${d.fastening} fastening`);
  return parts.join(", ");
});
</script>

<style scoped>
.roman-model {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
</style>
