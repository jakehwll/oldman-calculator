export type EncounterKind = "pokemon" | "missingno" | "trainer" | "m00";

export type MissingNoVariant = "classic" | "kabutops" | "aerodactyl" | "ghost";

export interface Glyph {
  /** Character as stored in the name buffer / typed on the keyboard. */
  char: string;
  hex: number;
  /** Label drawn on the naming-screen key. */
  key: string;
  species: string;
  level: number;
  kind: EncounterKind;
  /** National Dex number for real Pokémon sprites. */
  dex?: number;
  variant?: MissingNoVariant;
}

const glyph = (char: string, hex: number, species: string, extras: Partial<Glyph> = {}): Glyph => ({
  char,
  hex,
  key: extras.key ?? char,
  species,
  level: extras.level ?? hex,
  kind: extras.kind ?? "pokemon",
  dex: extras.dex,
  variant: extras.variant,
});

const missing = (
  char: string,
  hex: number,
  label = "MissingNo.",
  variant: MissingNoVariant = "classic",
): Glyph => glyph(char, hex, label, { kind: "missingno", variant });

const trainer = (char: string, hex: number, species: string, key?: string): Glyph =>
  glyph(char, hex, species, { kind: "trainer", key });

/**
 * English Red/Blue name-screen characters, keyed by the byte they write
 * into the grass encounter table. Values follow Glitch City / The Big HEX List.
 */
export const GLYPHS: readonly Glyph[] = [
  glyph("\0", 0x00, "'M", { key: "00", kind: "m00", level: 0 }),
  missing("~", 0x50, "MissingNo.", "classic"),
  missing(" ", 0x7f, "MissingNo."),

  glyph("A", 0x80, "Golduck", { dex: 55 }),
  glyph("B", 0x81, "Hypno", { dex: 97 }),
  glyph("C", 0x82, "Golbat", { dex: 42 }),
  glyph("D", 0x83, "Mewtwo", { dex: 150 }),
  glyph("E", 0x84, "Snorlax", { dex: 143 }),
  glyph("F", 0x85, "Magikarp", { dex: 129 }),
  missing("G", 0x86),
  missing("H", 0x87),
  glyph("I", 0x88, "Muk", { dex: 89 }),
  missing("J", 0x89),
  glyph("K", 0x8a, "Kingler", { dex: 99 }),
  glyph("L", 0x8b, "Cloyster", { dex: 91 }),
  missing("M", 0x8c),
  glyph("N", 0x8d, "Electrode", { dex: 101 }),
  glyph("O", 0x8e, "Clefable", { dex: 36 }),
  glyph("P", 0x8f, "Weezing", { dex: 110 }),
  glyph("Q", 0x90, "Persian", { dex: 53 }),
  glyph("R", 0x91, "Marowak", { dex: 105 }),
  missing("S", 0x92),
  glyph("T", 0x93, "Haunter", { dex: 93 }),
  glyph("U", 0x94, "Abra", { dex: 63 }),
  glyph("V", 0x95, "Alakazam", { dex: 65 }),
  glyph("W", 0x96, "Pidgeotto", { dex: 17 }),
  glyph("X", 0x97, "Pidgeot", { dex: 18 }),
  glyph("Y", 0x98, "Starmie", { dex: 121 }),
  glyph("Z", 0x99, "Bulbasaur", { dex: 1 }),

  glyph("(", 0x9a, "Venusaur", { dex: 3 }),
  glyph(")", 0x9b, "Tentacruel", { dex: 73 }),
  missing(":", 0x9c),
  glyph(";", 0x9d, "Goldeen", { dex: 118 }),
  glyph("[", 0x9e, "Seaking", { dex: 119 }),
  missing("]", 0x9f),

  missing("a", 0xa0),
  missing("b", 0xa1),
  missing("c", 0xa2),
  glyph("d", 0xa3, "Ponyta", { dex: 77 }),
  glyph("e", 0xa4, "Rapidash", { dex: 78 }),
  glyph("f", 0xa5, "Rattata", { dex: 19 }),
  glyph("g", 0xa6, "Raticate", { dex: 20 }),
  glyph("h", 0xa7, "Nidorino", { dex: 33 }),
  glyph("i", 0xa8, "Nidorina", { dex: 30 }),
  glyph("j", 0xa9, "Geodude", { dex: 74 }),
  glyph("k", 0xaa, "Porygon", { dex: 137 }),
  glyph("l", 0xab, "Aerodactyl", { dex: 142 }),
  missing("m", 0xac),
  glyph("n", 0xad, "Magnemite", { dex: 81 }),
  missing("o", 0xae),
  missing("p", 0xaf),
  glyph("q", 0xb0, "Charmander", { dex: 4 }),
  glyph("r", 0xb1, "Squirtle", { dex: 7 }),
  glyph("s", 0xb2, "Charmeleon", { dex: 5 }),
  glyph("t", 0xb3, "Wartortle", { dex: 8 }),
  glyph("u", 0xb4, "Charizard", { dex: 6 }),
  missing("v", 0xb5),
  missing("w", 0xb6, "MissingNo. (Kabutops)", "kabutops"),
  missing("x", 0xb7, "MissingNo. (Aerodactyl)", "aerodactyl"),
  missing("y", 0xb8, "MissingNo. (Ghost)", "ghost"),
  glyph("z", 0xb9, "Oddish", { dex: 43 }),

  trainer("<", 0xe1, "Rival Blue", "PK"),
  trainer(">", 0xe2, "Pokémon Prof.", "MN"),
  trainer("-", 0xe3, "Chief"),
  trainer("?", 0xe6, "Rocket"),
  trainer("!", 0xe7, "Cool Trainer"),
  trainer("♂", 0xef, "Blaine"),
  trainer("×", 0xf1, "Gentleman"),
  trainer(".", 0xf2, "Rival Blue"),
  trainer("/", 0xf3, "Champion Blue"),
  trainer(",", 0xf4, "Lorelei"),
  trainer("♀", 0xf5, "Channeler"),
];

export const GLYPH_BY_CHAR = new Map(GLYPHS.map((g) => [g.char, g]));
export const GLYPH_BY_HEX = new Map(GLYPHS.map((g) => [g.hex, g]));

export const NAME_LIMIT = 7;
export const BUFFER_LENGTH = 11;
export const TERMINATOR = 0x50;
export const NULL_BYTE = 0x00;
