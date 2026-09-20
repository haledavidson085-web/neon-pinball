# Neon Circuit Contributor Guide

Use Bun for dependency and script execution. Keep physics and scoring behavior under `src/game`, UI composition under `src/components`, and avoid coupling deterministic rules to canvas or browser APIs. Run `bun run check` before proposing changes. Preserve keyboard and touch parity, semantic daisyUI colors, reduced-motion behavior, and the no-network runtime privacy boundary. Do not commit `dist`, coverage output, local environment files, or generated release archives.
