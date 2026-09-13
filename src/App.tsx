import { useEffect, useMemo, useRef, useState } from "react";
import tiles from "./assets/tiles.png";
import { NAME_LIMIT, type Glyph } from "./data/charset";
import { PRESETS } from "./data/presets";
import { analyzeName, hexByte, isTypableChar, type NameState } from "./lib/glitch";

const COLS = 9;

const ROWS = {
  upper: [
    ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
    ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
    ["S", "T", "U", "V", "W", "X", "Y", "Z", " "],
    ["×", "(", ")", ":", ";", "[", "]", "<", ">"],
    ["-", "?", "!", "♂", "♀", "/", ".", ",", ""],
  ],
  lower: [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
    ["j", "k", "l", "m", "n", "o", "p", "q", "r"],
    ["s", "t", "u", "v", "w", "x", "y", "z", " "],
    ["×", "(", ")", ":", ";", "[", "]", "<", ">"],
    ["-", "?", "!", "♂", "♀", "/", ".", ",", ""],
  ],
} as const;

function sanitize(value: string): string {
  return [...value].filter(isTypableChar).slice(0, NAME_LIMIT).join("");
}

function shown(char: string): string {
  if (char === "<") return "PK";
  if (char === ">") return "MN";
  if (char === " ") return "SP";
  if (char === "\0") return "00";
  if (char === "~") return "END";
  return char;
}

function cellClass(glyph: Glyph, index: number): string {
  return [
    "cell",
    index === 0 ? "rate" : "",
    glyph.char === "\0" ? "null" : "",
    glyph.char === "~" ? "end" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function tableNote(state: NameState): string {
  if (state.mode === "preset") {
    return "Picking a default name leaves the rest of the game's name list sitting in memory behind the END byte. Those spare letters fill the later slots, which is why 'M never turns up here.";
  }
  if (!state.custom) {
    return "With no name at all there is nothing but END and a run of zeros, and a zero reads as 'M at level 0. That is the entire shore.";
  }
  if (state.custom.length % 2 === 1) {
    return "Your letters, then END (hex 50), then zeros the rest of the way. An odd number of letters drops END onto a level byte, so 'M shows up at level 80 as well as level 0.";
  }
  return "Your letters, then END (hex 50), then zeros the rest of the way. Hex 50 is read as MissingNo, and every zero after it is 'M at level 0.";
}

export default function App() {
  const [state, setState] = useState<NameState>({
    mode: "custom",
    custom: "",
    presetId: "red",
  });
  const [page, setPage] = useState<keyof typeof ROWS>("upper");
  const [cursor, setCursor] = useState(0);
  const keysRef = useRef<(HTMLButtonElement | null)[]>([]);

  const analysis = useMemo(() => analyzeName(state), [state]);
  const name =
    state.mode === "preset"
      ? (PRESETS.find((entry) => entry.id === state.presetId)?.name ?? "")
      : state.custom;
  const grid = ROWS[page];

  const setName = (custom: string) => {
    setState({ ...state, mode: "custom", custom: sanitize(custom) });
  };

  const add = (char: string) => {
    if (!char) return;
    setName(name + char);
  };

  const backspace = () => {
    if (state.mode !== "custom") {
      setName("");
      return;
    }
    setName(state.custom.slice(0, -1));
  };

  const move = (dx: number, dy: number) => {
    let col = cursor % COLS;
    let row = Math.floor(cursor / COLS);
    for (let step = 0; step < COLS * grid.length; step += 1) {
      col = (col + dx + COLS) % COLS;
      row = (row + dy + grid.length) % grid.length;
      if (grid[row][col]) {
        setCursor(row * COLS + col);
        return;
      }
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1, 0);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1, 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(0, -1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        move(0, 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        add(grid[Math.floor(cursor / COLS)][cursor % COLS]);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (event.key.length === 1 && isTypableChar(event.key)) {
        event.preventDefault();
        add(event.key);
        if (/[a-z]/.test(event.key)) setPage("lower");
        if (/[A-Z]/.test(event.key)) setPage("upper");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    keysRef.current[cursor]?.focus();
    // `page` is required: the same index remounts when the case page changes.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [cursor, page]);

  return (
    <main className="container">
      <div className="hero">
        <div className="hero-text">
          <h1>OLD MAN GLITCH CALCULATOR</h1>
          <p>
            When the old man in Viridian City shows you how to catch a Weedle, the game renames you
            OLD MAN for a moment and has to put your real name somewhere. It picks the grass
            encounter table. Viridian City has no grass, so nothing ever writes over it.
          </p>
          <p>
            Then when you fly to Cinnabar Island and surf the east coast. Those shore tiles count as
            grass, and the island has no encounter list of its own, so the game reads whatever is
            still sitting in that table. Your name comes out of the water as five wild Pokémon.
          </p>
          <p>
            Bulbapedia has the full write-up on the{" "}
            <a
              href="https://bulbapedia.bulbagarden.net/wiki/Old_man_glitch"
              target="_blank"
              rel="noreferrer"
            >
              old man glitch
            </a>
            .
          </p>
          <ol className="how">
            <li>Watch the old man's Weedle tutorial in northern Viridian City.</li>
            <li>Fly straight to Cinnabar Island. Don't walk out of town.</li>
            <li>Surf the east coast tiles and nothing further.</li>
          </ol>
        </div>

        <figure className="map">
          <img
            src={tiles}
            alt="Map of Cinnabar Island with the water tiles along the east shore highlighted"
          />
          <figcaption>
            Surf the highlighted strip along the east shore, and nothing else.
          </figcaption>
        </figure>
      </div>

      <div className="preview">
        <section className="namer">
          <p className="prompt">YOUR NAME?</p>
          <p className="name">
            {Array.from({ length: NAME_LIMIT }, (_, index) => (
              <span
                key={index}
                className={
                  [name[index] ? "" : "blank", index === name.length ? "active" : ""]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              >
                {name[index] ?? ""}
              </span>
            ))}
          </p>

          <div className="frame kb">
            {grid.map((row, rowIndex) => (
              <div className="kb-row" key={rowIndex}>
                {row.map((char, colIndex) => {
                  const index = rowIndex * COLS + colIndex;
                  if (!char) return null;
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      aria-label={char === " " ? "space" : undefined}
                      ref={(node) => {
                        keysRef.current[index] = node;
                      }}
                      onMouseEnter={(event) => {
                        setCursor(index);
                        event.currentTarget.focus();
                      }}
                      onClick={() => {
                        setCursor(index);
                        add(char);
                      }}
                    >
                      {char === " " ? "" : char}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="controls">
            <button type="button" onClick={() => setPage(page === "upper" ? "lower" : "upper")}>
              {page === "upper" ? "lower case" : "UPPER CASE"}
            </button>
            <button type="button" onClick={backspace}>
              DEL
            </button>
          </div>
        </section>

        <section className="frame presets">
          <ul className="preset-list">
            {PRESETS.map((preset) => (
              <li
                key={preset.id}
                className={
                  state.mode === "preset" && state.presetId === preset.id ? "active" : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => setState({ ...state, mode: "preset", presetId: preset.id })}
                >
                  {preset.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {analysis.warning && <p className="warning">{analysis.warning}</p>}

      <section className="frame encounters">
        <h2>WILD ENCOUNTERS</h2>
        <p className="hint">
          Encounter rate {analysis.glyphs[0].hex}. The higher it goes, the more often you find an
          encounter.
        </p>
        <ol className="party">
          {analysis.encounters.map((encounter) => (
            <li key={encounter.slot}>
              <span className="lv">Lv. {encounter.levelGlyph.level}</span>
              <span className="mon">{encounter.speciesGlyph.species}</span>
              <span className="bytes">
                {shown(encounter.levelGlyph.char)} / {shown(encounter.speciesGlyph.char)}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="frame tape-card">
        <h2>GRASS TABLE D887</h2>
        <p className="hint">
          The first byte sets the encounter rate. Everything after it runs level, species, level,
          species, once for each of the five slots.
        </p>
        <div className="tape">
          <div className={cellClass(analysis.glyphs[0], 0)}>
            <span className="role">RATE</span>
            <span className="ch">{shown(analysis.glyphs[0].char)}</span>
            <span className="hx">{hexByte(analysis.glyphs[0].hex)}</span>
          </div>
          {analysis.encounters.map((encounter, slot) => (
            <div className="pair" key={encounter.slot}>
              <span className="role">{encounter.slot}</span>
              <div className="pair-bytes">
                <div className={cellClass(encounter.levelGlyph, slot * 2 + 1)}>
                  <span className="ch">{shown(encounter.levelGlyph.char)}</span>
                  <span className="hx">{hexByte(encounter.levelGlyph.hex)}</span>
                </div>
                <div className={cellClass(encounter.speciesGlyph, slot * 2 + 2)}>
                  <span className="ch">{shown(encounter.speciesGlyph.char)}</span>
                  <span className="hx">{hexByte(encounter.speciesGlyph.hex)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="hint">{tableNote(state)}</p>
      </section>

      <section className="notes">
        <div>
          <h2>WHY THE SHORE</h2>
          <p>
            To decide whether you're in grass, the international releases only check one tile out of
            every 2 by 2 block, the bottom right one. On Cinnabar's east shore that tile happens to
            be grass, so the game rolls an encounter while you're sitting on open water.
          </p>
        </div>
        <div>
          <h2>VERSIONS</h2>
          <p>
            English, German, and French Red and Blue all have that shore, though the French version
            freezes the moment MissingNo. shows up. Spanish and Italian recoded the tiles, so
            there's nothing to find. Yellow clears the table before you ever get to the water.
          </p>
        </div>
      </section>

      <footer className="footer">
        <a href="https://github.com/jakehwll/oldman-calculator" target="_blank" rel="noreferrer">
          jakehwll/oldman-calculator
        </a>
      </footer>
    </main>
  );
}
