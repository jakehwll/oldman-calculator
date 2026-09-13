import { BUFFER_LENGTH, GLYPH_BY_CHAR, GLYPH_BY_HEX, type Glyph } from "../data/charset";
import { encodeCustomName, leftoverToBytes, PRESETS } from "../data/presets";

export type NameMode = "custom" | "preset";

export interface NameState {
  mode: NameMode;
  custom: string;
  presetId: string;
}

export interface Encounter {
  slot: number;
  levelGlyph: Glyph;
  speciesGlyph: Glyph;
  levelAddress: string;
  speciesAddress: string;
  fromName: boolean;
}

export interface Analysis {
  bytes: number[];
  glyphs: Glyph[];
  encounters: Encounter[];
  warning: string | null;
}

const GRASS_BASE = 0xd887;

export function getGlyph(byte: number): Glyph {
  const known = GLYPH_BY_HEX.get(byte);
  if (known) return known;

  return {
    char: "?",
    hex: byte,
    key: hexByte(byte),
    species: `Unknown (${hexByte(byte)})`,
    level: byte,
    kind: "missingno",
    variant: "classic",
  };
}

export function hexByte(value: number): string {
  return value.toString(16).toUpperCase().padStart(2, "0");
}

export function hexAddress(value: number): string {
  return value.toString(16).toUpperCase().padStart(4, "0");
}

export function detectPkMnWarning(name: string): string | null {
  if (/pk/i.test(name)) {
    return "That looks like the two letters P and K. On the Game Boy naming screen, PK is a single character — tap the PK key (or type <).";
  }
  if (/mn/i.test(name)) {
    return "That looks like the two letters M and N. On the Game Boy naming screen, MN is a single character — tap the MN key (or type >).";
  }
  return null;
}

export function encodeName(state: NameState): number[] {
  if (state.mode === "preset") {
    const preset = PRESETS.find((entry) => entry.id === state.presetId);
    if (preset) return leftoverToBytes(preset.leftover);
  }
  return encodeCustomName(state.custom);
}

export function analyzeName(state: NameState): Analysis {
  const bytes = encodeName(state);
  const glyphs = bytes.map(getGlyph);
  const nameLength =
    state.mode === "preset"
      ? (PRESETS.find((entry) => entry.id === state.presetId)?.name.length ?? 0)
      : state.custom.length;

  const encounters: Encounter[] = [];
  for (let slot = 0; slot < 5; slot += 1) {
    const levelIndex = slot * 2 + 1;
    const speciesIndex = slot * 2 + 2;
    encounters.push({
      slot: slot + 1,
      levelGlyph: glyphs[levelIndex],
      speciesGlyph: glyphs[speciesIndex],
      levelAddress: hexAddress(GRASS_BASE + levelIndex),
      speciesAddress: hexAddress(GRASS_BASE + speciesIndex),
      fromName: speciesIndex < nameLength,
    });
  }

  return {
    bytes,
    glyphs,
    encounters,
    warning: state.mode === "custom" ? detectPkMnWarning(state.custom) : null,
  };
}

export function displayName(name: string): string {
  return name.replaceAll("<", "PK").replaceAll(">", "MN");
}

export function isTypableChar(char: string): boolean {
  if (char === "\0" || char === "~") return false;
  return GLYPH_BY_CHAR.has(char);
}

export function randomName(length = 7): string {
  const pool = [...GLYPH_BY_CHAR.keys()].filter(isTypableChar);
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join("");
}

export function parseQuery(search: string): Partial<NameState> {
  const params = new URLSearchParams(search);
  const preset = params.get("preset");
  const name = params.get("name");

  if (preset && PRESETS.some((entry) => entry.id === preset)) {
    return { mode: "preset", presetId: preset };
  }
  if (name != null) {
    return {
      mode: "custom",
      custom: [...name].filter(isTypableChar).slice(0, 7).join(""),
    };
  }
  return {};
}

export function toQuery(state: NameState): string {
  if (state.mode === "preset") return `?preset=${state.presetId}`;
  if (!state.custom) return "";
  return `?name=${encodeURIComponent(state.custom)}`;
}

export { BUFFER_LENGTH, GRASS_BASE };
