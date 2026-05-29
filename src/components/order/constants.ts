// Per-item ink colors — keep the playful color-coded names from the prior design.
export const ITEM_COLORS = [
  "#5a3a1a", // brown
  "#d97a3a", // orange
  "#ff8fb3", // pink
  "#e85a3a", // coral
  "#e09d28", // yellow
  "#a87827", // mustard
  "#7a4dc7", // purple
  "#3d7348", // green
];

export function colorForIndex(i: number): string {
  return ITEM_COLORS[i % ITEM_COLORS.length];
}
