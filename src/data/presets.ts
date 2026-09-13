import { BUFFER_LENGTH, GLYPH_BY_CHAR, NULL_BYTE, TERMINATOR } from "./charset";

export interface PresetName {
  id: string;
  version: "red" | "blue";
  label: string;
  /** Visible name on the trainer card. */
  name: string;
  /**
   * The full 11-byte leftover string after the chosen name, as characters.
   * `~` is the 0x50 terminator, spaces in leftover data stay 0x7F.
   */
  leftover: string;
}

/**
 * New-game default names keep rival / unused name data after the terminator,
 * so they yield extra encounters a hand-typed name of the same letters would not.
 */
export const PRESETS: readonly PresetName[] = [
  { id: "red", version: "red", label: "RED", name: "RED", leftover: "RED~ASH~JAC" },
  { id: "ash", version: "red", label: "ASH", name: "ASH", leftover: "ASH~JACK~NE" },
  { id: "jack", version: "red", label: "JACK", name: "JACK", leftover: "JACK~NEW NA" },
  { id: "blue", version: "blue", label: "BLUE", name: "BLUE", leftover: "BLUE~GARY~J" },
  { id: "gary", version: "blue", label: "GARY", name: "GARY", leftover: "GARY~JOHN~N" },
  { id: "john", version: "blue", label: "JOHN", name: "JOHN", leftover: "JOHN~NEW NA" },
];

export function leftoverToBytes(leftover: string): number[] {
  if (leftover.length !== BUFFER_LENGTH) {
    throw new Error(`Preset leftover must be ${BUFFER_LENGTH} chars, got "${leftover}"`);
  }

  return [...leftover].map((char) => {
    const glyph = GLYPH_BY_CHAR.get(char);
    if (glyph) return glyph.hex;
    throw new Error(`Unknown leftover character ${JSON.stringify(char)}`);
  });
}

export function encodeCustomName(name: string): number[] {
  const bytes: number[] = [];

  for (const char of name) {
    const glyph = GLYPH_BY_CHAR.get(char);
    if (!glyph || glyph.hex === NULL_BYTE) continue;
    bytes.push(glyph.hex);
  }

  bytes.push(TERMINATOR);
  while (bytes.length < BUFFER_LENGTH) bytes.push(NULL_BYTE);
  return bytes.slice(0, BUFFER_LENGTH);
}
