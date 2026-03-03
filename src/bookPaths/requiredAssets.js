import { BOOK_PATHS_FLOW } from "./flow.js";

const MIN_REQUIRED_KEYS = [
  "1",
  "2",
  "3",
  "8",
  "9",
  "10",
  "11",
  "12A",
  "13A",
  "14A",
  "15",
  "16",
  "17",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "26",
  "27",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "47",
  "48",
  "52",
  "53",
  "55",
  "56",
  "57",
  "59",
  "63",
  "64",
  "65",
  "66",
  "67",
  "69",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "1+2",
  "21+22",
  "23+24",
  "3B",
  "3C",
  "3D",
  "3E",
  "2F",
];

const flowReferencedKeys = Object.values(BOOK_PATHS_FLOW).flatMap((node) => {
  const images = node.images || [];
  const compositeKey = node.compositeKey ? [node.compositeKey] : [];
  const compositeOf = node.compositeOf || [];
  return [...images, ...compositeKey, ...compositeOf];
});

export const REQUIRED_BOOK_PATHS_ASSET_KEYS = Array.from(
  new Set([...MIN_REQUIRED_KEYS, ...flowReferencedKeys])
).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
