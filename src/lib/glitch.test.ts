import { describe, expect, it } from "vitest";
import { BUFFER_LENGTH, NAME_LIMIT, NULL_BYTE, TERMINATOR } from "../data/charset";
import { encodeCustomName, leftoverToBytes, PRESETS } from "../data/presets";
import {
  analyzeName,
  detectPkMnWarning,
  displayName,
  encodeName,
  getGlyph,
  hexAddress,
  hexByte,
  isTypableChar,
  parseQuery,
  toQuery,
} from "./glitch";

function custom(name: string) {
  return analyzeName({ mode: "custom", custom: name, presetId: "red" });
}

function preset(id: string) {
  return analyzeName({ mode: "preset", custom: "", presetId: id });
}

function encounterTable(id: string) {
  const analysis = preset(id);
  return {
    levels: analysis.encounters.map((entry) => entry.levelGlyph.level),
    species: analysis.encounters.map((entry) => entry.speciesGlyph.species),
  };
}

describe("preset leftovers", () => {
  it("keeps an 11-byte name list for every default trainer name", () => {
    for (const entry of PRESETS) {
      expect(leftoverToBytes(entry.leftover)).toHaveLength(BUFFER_LENGTH);
    }
  });

  it("rejects leftovers that are the wrong length or use unknown glyphs", () => {
    expect(() => leftoverToBytes("RED")).toThrow(/must be 11 chars/);
    expect(() => leftoverToBytes("***********")).toThrow(/Unknown leftover character/);
  });
});

describe("Glitch City encounter tables", () => {
  it.each([
    {
      id: "red",
      levels: [132, 80, 146, 80, 128],
      species: ["Mewtwo", "Golduck", "MissingNo.", "MissingNo.", "Golbat"],
    },
    {
      id: "ash",
      levels: [146, 80, 128, 138, 141],
      species: ["MissingNo.", "MissingNo.", "Golbat", "MissingNo.", "Snorlax"],
    },
    {
      id: "jack",
      levels: [128, 138, 141, 150, 141],
      species: ["Golbat", "MissingNo.", "Snorlax", "MissingNo.", "Golduck"],
    },
  ] as const)("$id matches the documented Cinnabar table", ({ id, levels, species }) => {
    expect(encounterTable(id)).toEqual({ levels, species });
  });
});

describe("typed names", () => {
  it("writes END then zeros for an empty name, so the shore is all 'M at level 0", () => {
    const analysis = custom("");
    expect(analysis.bytes).toEqual([
      TERMINATOR,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
      NULL_BYTE,
    ]);
    expect(analysis.encounters.map((entry) => entry.speciesGlyph.species)).toEqual([
      "'M",
      "'M",
      "'M",
      "'M",
      "'M",
    ]);
    expect(analysis.encounters.map((entry) => entry.levelGlyph.level)).toEqual([0, 0, 0, 0, 0]);
  });

  it("puts END on a level slot when the typed name has odd length", () => {
    const analysis = custom("A");
    expect(analysis.bytes[0]).toBe(0x80);
    expect(analysis.bytes[1]).toBe(TERMINATOR);
    expect(analysis.encounters[0]?.levelGlyph.level).toBe(80);
    expect(analysis.encounters[0]?.speciesGlyph.species).toBe("'M");
  });

  it("puts END on a species slot when the typed name has even length", () => {
    const analysis = custom("AB");
    expect(analysis.bytes.slice(0, 3)).toEqual([0x80, 0x81, TERMINATOR]);
    expect(analysis.encounters[0]?.speciesGlyph.species).toBe("MissingNo.");
    expect(analysis.encounters[1]?.levelGlyph.level).toBe(0);
  });

  it("does not keep leftover rival names the way a new-game preset does", () => {
    expect(encodeName({ mode: "custom", custom: "RED", presetId: "red" })).not.toEqual(
      encodeName({ mode: "preset", custom: "", presetId: "red" }),
    );
  });

  it("falls back to a typed name when the preset id is unknown", () => {
    expect(encodeName({ mode: "preset", custom: "ASH", presetId: "missing" })).toEqual(
      encodeCustomName("ASH"),
    );
  });
});

describe("PK/MN typing", () => {
  it("warns when PK or MN were typed as two letters", () => {
    expect(detectPkMnWarning("PK")).toContain("PK is a single character");
    expect(detectPkMnWarning("MN")).toContain("MN is a single character");
    expect(custom("apk").warning).toContain("PK is a single character");
  });

  it("does not warn for the real PK/MN glyphs or presets", () => {
    expect(detectPkMnWarning("<")).toBeNull();
    expect(detectPkMnWarning(">")).toBeNull();
    expect(preset("red").warning).toBeNull();
  });

  it("encodes the PK glyph as a trainer byte", () => {
    expect(custom("<").bytes[0]).toBe(0xe1);
    expect(displayName("A<>B")).toBe("APKMNB");
  });
});

describe("name helpers", () => {
  it("treats terminator and null as untypable", () => {
    expect(isTypableChar("~")).toBe(false);
    expect(isTypableChar("\0")).toBe(false);
    expect(isTypableChar("A")).toBe(true);
    expect(isTypableChar("<")).toBe(true);
  });

  it("round-trips share links and strips illegal name characters", () => {
    expect(parseQuery("?preset=ash")).toEqual({ mode: "preset", presetId: "ash" });
    expect(parseQuery("?name=RED*")).toEqual({ mode: "custom", custom: "RED" });
    expect(parseQuery(`?name=${"A".repeat(NAME_LIMIT + 3)}`).custom).toHaveLength(NAME_LIMIT);
    expect(toQuery({ mode: "preset", custom: "", presetId: "blue" })).toBe("?preset=blue");
    expect(toQuery({ mode: "custom", custom: "AB", presetId: "red" })).toBe("?name=AB");
    expect(toQuery({ mode: "custom", custom: "", presetId: "red" })).toBe("");
  });

  it("formats grass-table bytes and addresses", () => {
    expect(hexByte(0xd)).toBe("0D");
    expect(hexAddress(0xd887)).toBe("D887");
    expect(getGlyph(0x80).species).toBe("Golduck");
    expect(getGlyph(0x01)).toMatchObject({
      char: "?",
      species: "Unknown (01)",
      kind: "missingno",
    });
  });
});
