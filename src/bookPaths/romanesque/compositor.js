// Pure logic for the Romanesque drawing-stack activity.
//
// Ported from the reference implementation that ships with the activity data
// (index.html: test, compose, flatten, place, fitView, soFar, sceneFor, choose,
// furthest, preload). No imports and no DOM access: the activity data is always
// passed in, so the audit script can load this file on its own.
//
// Coordinates: every scene is laid out in "scene units" on the activity canvas
// (1190.6 x 841.9). A drawing is placed with a 2D matrix [a, b, c, d, e, f] as in
// CSS matrix(): x' = a*x + c*y + e, y' = b*x + d*y + f, where (x, y) are units of
// the drawing's own viewBox (its `size`).

export const IDENTITY = Object.freeze([1, 0, 0, 1, 0, 0]);

/** Conditions: {"holes":"cut"} | {"holes":["cut","pierced"]} | {"holes":null} (not yet chosen) | {"holes":"*"} (any answer). */
export function test(when, choices) {
  if (!when) return true;
  return Object.keys(when).every((key) => {
    const want = when[key];
    const have = choices[key];
    if (want === null) return have == null;
    if (want === "*") return have != null;
    if (Array.isArray(want)) return want.indexOf(have) !== -1;
    return have === want;
  });
}

/** Matrix product: the result applies `b` first, then `a`. */
export function compose(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

/**
 * Flatten a scene into an ordered list of drawings (bottom to top) for a choice set.
 * Nested scenes inherit the outer transform; each drawing's `at` offset is applied last.
 */
export function flatten(activity, sceneName, choices, outer = IDENTITY, out = []) {
  const scene = activity.scenes[sceneName];
  if (!scene) throw new Error(`Unknown scene: ${sceneName}`);
  for (const layer of scene.layers) {
    if (!test(layer.when, choices)) continue;
    const t = compose(outer, layer.transform || IDENTITY);
    if (layer.scene) {
      flatten(activity, layer.scene, choices, t, out);
      continue;
    }
    const drawing = activity.drawings[layer.draw];
    if (!drawing) throw new Error(`Unknown drawing: ${layer.draw}`);
    const at = drawing.at || [0, 0];
    out.push({ id: layer.draw, drawing, matrix: compose(t, [1, 0, 0, 1, at[0], at[1]]) });
  }
  return out;
}

/** Widen or heighten a view [x, y, w, h] so it matches the box aspect without distortion. */
export function fitView(view, aspect) {
  let [x, y, w, h] = view;
  if (w / h > aspect) {
    const nh = w / aspect;
    y -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * aspect;
    x -= (nw - w) / 2;
    w = nw;
  }
  return [x, y, w, h];
}

/** The decisions made up to and including the step on screen. */
export function soFar(activity, choices, stepIndex) {
  const out = {};
  activity.steps.forEach((step, i) => {
    if (i <= stepIndex && step.key && choices[step.key] != null) out[step.key] = choices[step.key];
  });
  return out;
}

/** Scene name for a step: `before` while unanswered (may be null = empty sheet), `scene` once answered. */
export function sceneFor(step, choices) {
  const answered = !step.key || choices[step.key] != null;
  let name = answered ? step.scene : step.before !== undefined ? step.before : step.scene;
  if (name && typeof name === "object") {
    // a scene may depend on a choice: {"by": "support", "slit": "frameA", "default": ...}
    name = name[choices[name.by]] || name.default;
  }
  return name || null;
}

export function visibleOptions(step, choices) {
  return (step.options || []).filter((option) => test(option.when, choices));
}

export function canContinue(step, choices) {
  return !step.key || choices[step.key] != null;
}

/** First step that still needs an answer (or the last step). */
export function furthest(activity, choices) {
  for (let i = 0; i < activity.steps.length; i += 1) {
    if (!canContinue(activity.steps[i], choices)) return i;
  }
  return activity.steps.length - 1;
}

/**
 * Record a choice at `stepIndex`. Later answers that are no longer offered
 * (e.g. the stitch after the support changed) are forgotten; others survive.
 * Returns a new choices object.
 */
export function choose(activity, choices, stepIndex, value) {
  const step = activity.steps[stepIndex];
  const next = { ...choices, [step.key]: value };
  activity.steps.forEach((s, i) => {
    if (i <= stepIndex || !s.key || next[s.key] == null) return;
    const ok = (s.options || []).some((o) => o.value === next[s.key] && test(o.when, next));
    if (!ok) delete next[s.key];
  });
  return next;
}

/**
 * Everything needed to draw the sheet for a step, in scene units. Both the DOM
 * sheet and the canvas export use this, so they cannot drift apart.
 *   layers: [{ id, file, size, matrix, name, label }] bottom to top
 *   view:   [x, y, w, h] fitted to the canvas aspect
 */
export function composeSheet(activity, choices, stepIndex) {
  const step = activity.steps[stepIndex];
  const now = soFar(activity, choices, stepIndex);
  const sceneName = sceneFor(step, now);
  const canvas = activity.canvas;
  let view = [0, 0, canvas[0], canvas[1]];
  let layers = [];
  if (sceneName) {
    layers = flatten(activity, sceneName, now).map(({ id, drawing, matrix }) => ({
      id,
      file: drawing.file,
      size: drawing.size,
      matrix,
      name: drawing.name || id,
      label: drawing.label === undefined ? id : drawing.label,
    }));
    view = fitView(activity.scenes[sceneName].view || view, canvas[0] / canvas[1]);
  }
  const scene = sceneName ? activity.scenes[sceneName] : null;
  const labelled = layers.filter((layer) => layer.label !== null);
  const caption = (scene && scene.caption) || "";
  return {
    sceneName,
    caption,
    layers,
    view,
    emptyText: layers.length ? "" : step.emptyText || "",
    numbers: layers.length ? `Drawings ${labelled.map((layer) => layer.label || layer.id).join(" + ")}` : "",
    ariaLabel: `${caption ? `${caption}. ` : ""}Drawings shown: ${labelled.map((layer) => layer.name).join(", ")}`,
  };
}

/** Stable identity for a placed layer: unchanged layers keep their element, changed ones crossfade. */
export function layerKey(layer, view) {
  return `${layer.id}@${layer.matrix.map((n) => n.toFixed(2)).join(",")}|${view.map((n) => n.toFixed(1)).join(",")}`;
}

/**
 * CSS box for a layer inside a box that shows `view`. Sized so one drawing unit
 * equals one scene unit, then moved (and for boards/frame reshaped) by the matrix.
 * Percentages keep registration correct at any rendered size.
 */
export function layerStyle(size, matrix, view) {
  const [a, b, c, d, e, f] = matrix;
  return {
    left: "0",
    top: "0",
    width: `${(size[0] / view[2]) * 100}%`,
    height: `${(size[1] / view[3]) * 100}%`,
    transform:
      `translate(${((e - view[0]) / size[0]) * 100}%, ${((f - view[1]) / size[1]) * 100}%) ` +
      `matrix(${a}, ${b}, ${c}, ${d}, 0, 0)`,
  };
}

/** Files the next click at this step could need (for preloading). */
export function previewFiles(activity, choices, stepIndex) {
  const step = activity.steps[stepIndex];
  const files = new Set();
  if (!step.key) return [];
  for (const option of visibleOptions(step, choices)) {
    if (option.disabled) continue;
    const ch = { ...soFar(activity, choices, stepIndex), [step.key]: option.value };
    const name = sceneFor(step, ch);
    if (!name) continue;
    for (const item of flatten(activity, name, ch)) files.add(item.drawing.file);
  }
  return [...files];
}

/** Rows for the summary list: [{ key, short, title, label }], skipping hideInSummary steps. */
export function summaryRows(activity, choices) {
  const rows = [];
  for (const step of activity.steps) {
    if (!step.key || choices[step.key] == null || step.hideInSummary) continue;
    const option = (step.options || []).find((o) => o.value === choices[step.key]);
    rows.push({
      key: step.key,
      short: step.short || step.title,
      title: step.title,
      label: option ? option.label : String(choices[step.key]),
    });
  }
  return rows;
}
