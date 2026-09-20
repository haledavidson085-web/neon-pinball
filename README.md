# Neon Circuit Pinball

A responsive, browser-based pinball game with real-time Matter.js physics, neon canvas visuals, keyboard and touch controls, procedural sound, scoring multipliers, three-ball games, and a locally saved high score.

## Play

```bash
bun install
bun run dev
```

- `Space`: start or launch the ball
- `A` / `←`: left flipper
- `D` / `→`: right flipper
- `P` / `Esc`: pause or resume

On touch screens, use the two on-screen flipper buttons and the Launch ball button.

## Development

```bash
bun run lint
bun run test
bun run typecheck
bun run build
bun run check
```

The physics and canvas renderer live in `src/game/PinballTable.ts`; deterministic scoring rules are isolated in `src/game/scoring.ts`. React owns the responsive controls and status UI. High scores remain in browser `localStorage`; the game has no backend, accounts, analytics, advertisements, or network calls at runtime.

## Release

Push a tag such as `v1.0.0`. The release workflow validates the project, builds a static site archive, generates its SHA-256 checksum, and publishes both to GitHub Releases.

## License

MIT — see [LICENSE](LICENSE).
