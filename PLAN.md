# Neon Circuit Pinball Plan

## Product and scope

Neon Circuit is a responsive web pinball game for desktop and mobile browsers, built with React 19, TypeScript, Vite, Matter.js, Tailwind CSS 4, and daisyUI 5. It provides a complete three-ball arcade loop that loads quickly and works offline after the static assets are cached by the browser. Accounts, online leaderboards, monetization, telemetry, multiplayer, native installers, and automatic updates are out of scope.

Success means a new player can start without documentation, control both flippers by keyboard or touch, understand scoring feedback, finish a game, and replay; production build, tests, lint, accessibility smoke checks, and release packaging must pass.

## User flows and UI

1. The ready overlay explains the goal and exposes one primary Start game action.
2. During play, the table is dominant; score, multiplier, balls, pause, restart, sound, and launch remain visible without covering play.
3. A missed ball is replaced after a short delay. After three drains, the final score and replay action appear.
4. Help is an accessible dialog. Sound is opt-in per page load and can be muted instantly.

The layout becomes a two-column cabinet on wide screens and a single-column table with large touch flippers on narrow screens. Browser zoom and long localized labels must not hide game controls. All actions have visible focus states and accessible names. Motion honors `prefers-reduced-motion`; status uses text plus semantic color.

## Architecture and data boundaries

- `src/game/PinballTable.ts`: Matter.js world, input commands, canvas drawing, audio feedback, and lifecycle cleanup.
- `src/game/scoring.ts`: deterministic, rendering-independent score and multiplier rules.
- `src/components/GameBoard.tsx`: narrow React adapter for engine lifecycle and input.
- `src/App.tsx`: status UI, overlays, touch controls, and help.

Only the integer high score is retained in `localStorage`. There is no runtime network access or diagnostic logging. Recoverable audio failure leaves the visual game playable; lack of canvas support becomes a safe React error boundary milestone. Fatal errors must never expose stack traces in production.

## Visual system, identity, and accessibility

daisyUI semantic tokens drive surfaces, controls, and status; the canvas uses a deliberately fixed neon palette because it is game artwork. Lucide supplies interface icons with text or accessible labels. The lightning mark is the web identity until a dedicated multi-size app icon is commissioned. Both enabled themes, 200% text scale, keyboard-only operation, touch input, focus order, contrast, and screen-reader announcements are release checks.

## Notifications, errors, and updates

Scoring and ball changes use non-blocking in-game text. Pause and game-over use overlays because they suspend play. No OS notifications are warranted. The static web app has no client self-updater: deployments are atomic static artifact replacements, served over HTTPS, and rollback uses the prior GitHub Release artifact. Checksums prove artifact integrity.

## Testing and release gates

Unit tests cover scoring, multiplier bounds, and formatting. Engine lifecycle, collision regression, keyboard/touch interaction, canvas fallback, responsive layout, and accessibility checks are the next test layer. Every release must pass `bun run check`, archive only `dist`, publish a SHA-256 checksum, and contain no secrets or local paths. The tag-triggered GitHub workflow owns packaging with least-privilege `contents: write` permission.

## Delivery phases and issues

Implementation status belongs in GitHub Issues; create one issue per phase using the repository forms.

| Phase | Durable deliverable | Exit gate |
| --- | --- | --- |
| Foundation | Vite app, game/UI boundary, tokens, CI | Clean install and production build |
| Core game | Physics, controls, scoring, balls, high score | Complete playable loop and unit tests |
| Resilience | Canvas/audio fallback and lifecycle tests | Failure paths preserve user control |
| Polish | Icons, both themes, a11y and device coverage | Keyboard, touch, zoom, contrast checks |
| Release | Versioned static archive and checksum | Tagged release installs and smoke-tests |

## Harness coordination

Codex `gpt-5.6-sol` owns scope, integration, validation, and final reporting. Agy `gemini-3.8-flash-high` performs bounded read-only repository reviews; `claude-sonnet-4-6` is reserved for difficult implementation review, and Grok `grok-4.6` for adversarial release/privacy review after authentication. Live inventories must be checked before delegation and unavailable models must never be silently substituted. Delegates may not commit, push, release, access secrets, or broaden scope; the initiator reviews all output and runs final gates.

## Risks and decisions

- Browser physics can vary with frame pressure; the fixed Matter.js timestep and regression smoke tests mitigate this.
- Moving static flippers trade perfect simulation for stable browser performance; tune only against play tests.
- Web Audio requires a user gesture; sound begins only after play/launch input and is never required for gameplay.
- A static archive is the production artifact; native executable and self-update requirements do not apply to this web target.

GitHub Pages is the hosted web channel. Pushes to `main` validate the project before deploying the immutable `dist` artifact through GitHub's OIDC-backed Pages environment; version tags continue to produce downloadable release archives and checksums.

Definition of done: the full three-ball flow is playable across keyboard and touch; acceptance and release gates pass; UI remains clear at supported sizes and themes; only a high-score integer is stored; documentation, license, issue forms, hosted Pages deployment, and traceable release artifact are present.
