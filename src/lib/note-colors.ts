/** Distinct fills so each sounding note stays recognizable on the staff and the instrument. */
export const NOTE_COLORS = [
  "#FACC00",
  "#67E8F9",
  "#F9A8D4",
  "#86EFAC",
  "#FDBA74",
  "#C4B5FD",
  "#FDA4AF",
  "#A5B4FC",
] as const;

export function noteColor(index: number): string {
  return NOTE_COLORS[index % NOTE_COLORS.length];
}
