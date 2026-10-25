/** Distinct fills so each sounding note stays recognizable on the staff and the instrument. */
export const NOTE_COLORS = [
  "#F5C400",
  "#2EC5E0",
  "#F15BB5",
  "#3DDC78",
  "#FF8A3D",
  "#8B7CFF",
  "#FF5D73",
  "#3DB4FF",
  "#B6E04A",
  "#E05CFF",
  "#2AD4B8",
  "#FFB020",
] as const;

export function noteColor(index: number): string {
  if (index < NOTE_COLORS.length) return NOTE_COLORS[index];
  const hue = (index * 47) % 360;
  return `hsl(${hue} 78% 52%)`;
}

/** White, black, and near-neutral inks are not used to identify a pitch. */
export function isNeutralColor(color: string): boolean {
  const value = color.trim().toLowerCase();
  if (value === "white" || value === "black") return true;
  const hexBody = value.startsWith("#") ? value.slice(1) : "";
  const full =
    hexBody.length === 3
      ? hexBody
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : hexBody;
  if (!/^[0-9a-f]{6}$/.test(full)) return false;
  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max - min < 18 && (max > 235 || min < 40);
}

export function playedColor(color: string | undefined, index = 0): string {
  if (color && !isNeutralColor(color)) return color;
  return noteColor(index);
}

/** A darker rim of the same hue, still neither white nor black. */
export function noteOutline(fill: string): string {
  const value = fill.trim().toLowerCase();
  const hexBody = value.startsWith("#") ? value.slice(1) : "";
  const full =
    hexBody.length === 3
      ? hexBody
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : hexBody;
  if (!/^[0-9a-f]{6}$/.test(full)) return fill;
  const mix = (channel: number) => Math.max(48, Math.min(196, Math.round(channel * 0.55)));
  const red = mix(parseInt(full.slice(0, 2), 16));
  const green = mix(parseInt(full.slice(2, 4), 16));
  const blue = mix(parseInt(full.slice(4, 6), 16));
  return `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, "0")}`;
}
