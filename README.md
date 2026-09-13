# Old man glitch

Type a Pokémon Red/Blue trainer name and see exactly which five wild Pokémon the Cinnabar east-shore glitch would roll for it.

## The glitch

When the old man in Viridian City demonstrates catching a Weedle, the game temporarily renames you `OLD MAN` and stashes your real name in the grass encounter table at `D887`. Viridian City has no grass, so nothing ever overwrites it. Fly to Cinnabar Island and surf the east coast — those shore tiles read as grass, and the island has no encounter list of its own, so the game interprets your leftover name bytes as level/species pairs.

This app does that interpretation for you. It encodes a name into the same 11-byte buffer the game uses (name characters, the `0x50` terminator, then zeros), maps each byte through the Red/Blue character set to a species and level, and shows both the resulting encounter list and the raw hex tape behind it.

## Features

- A replica Game Boy naming screen with mouse, arrow-key, and direct typing input, including the single-character `PK` and `MN` glyphs.
- The five wild encounters for the current name, with levels, species, and the bytes each one came from.
- A byte-by-byte view of grass table `D887`, highlighting the encounter rate, the terminator, and the trailing nulls.
- Default-name presets (`RED`, `ASH`, `JACK`, `BLUE`, `GARY`, `JOHN`), which keep rival and unused name data alive past the terminator and so produce different encounters than typing the same letters by hand.
- Notes on why the shore works and which regional versions it works on.

## Development

```bash
npm install
npm run dev
```

```bash
npm run fmt
npm run lint
npm test
npm run build
```

GitHub Actions runs those checks on pull requests and deploys `main` to GitHub Pages. In the repo, set **Settings → Pages → Source** to **GitHub Actions**.

## License

[MIT](LICENSE). Pokémon is a trademark of Nintendo, Creatures Inc., and Game Freak; this is an unaffiliated fan project.
