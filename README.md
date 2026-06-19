# Camp Quest: Service Crew

A small, mobile-first retro camp adventure built as a static browser game. The morning bell has rung, but Service Crew cannot start until somebody solves the ancient mystery: **who took the mop?**

This initial playable foundation includes a canvas-rendered Main Camp, touch and keyboard controls, NPC dialogue with reusable portraits, collision, hazards, supply pickups, a delivery, a Service Checklist, Energy, Service Points, a saved best score, skill-gated terrain, and an expanded 4800 × 3200 Main Camp with denser culled woods, a northern gorge trail and Tree House landmark, and an objective-gated bridge teasing the Back 40. It also includes an incremental SVG sprite pipeline with shape-drawing fallbacks and reusable image inspection overlays.

## Play

- **Phone:** use the on-screen D-pad and large **ACTION** button.
- **Desktop:** move with WASD or arrow keys; interact with Space or E.
- Talk to Coop by the Welcome Center, recover supplies, deliver the crate to the Dining Hall, and walk into the Shower House doorway to explore the proof-of-concept interior.
- Mud, wet floors, and camp creatures slow movement. Lake and stream terrain require Swimming, while gorge terrain requires Climbing. All skills currently start locked.
- Mosquito clouds reduce Energy. Their content metadata prepares Nature Skills to reduce nuisance-wildlife damage once that skill can be unlocked.

## Setup and development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and preview

```bash
npm run build
npm run validate:quests
npm run test:quest-engine
npm run preview
```

The production-ready static site is generated in `dist/`.

## Deploy to GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the game whenever changes are pushed to `main`, or when manually started from the Actions tab.

1. In the GitHub repository, open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the deployment workflow manually.

No backend, accounts, database, or AWS services are required. The best Service Points score is stored in browser `localStorage`.

## Project structure

- `src/main.ts` — game state, input, update loop, interactions, quest-event integration, and canvas rendering.
- `src/questEngine.ts` — generic typed quest validation, lifecycle/progression helpers, visibility selectors, event/objective resolution, tracked objective selection, and typed reward application.
- `src/assets.ts` — reusable loader and public asset catalog; failed or pending images leave the canvas fallbacks in place.
- `src/sprites.ts` — reusable canvas sprite drawing helper.
- `public/assets/` — game-ready, text-based SVG sprites for supplies, terrain, hazards, and creatures; supplied inspection images remain in `public/reference/`.
- `src/style.css` — responsive mobile-first game shell, HUD, checklist, dialogue, and controls.
- `public/reference/` — supplied visual references for the Stony Glen layout and Cliff sign.
- `.github/workflows/deploy-pages.yml` — static GitHub Pages deployment.

## Content files

Static game content lives in `src/content/` so future changes can add or edit content without hardcoding it into the gameplay loop when possible:

- `npcs.ts` controls NPC definitions, display names, positions, accents, and portrait assignments.
- `dialogue.ts` controls NPC conversations and story messages.
- `quests.ts` controls typed quest definitions for the Service Checklist; `tasks.ts` remains a compatibility re-export.
- `items.ts` controls collectible tools and supplies.
- `interactables.ts` controls signs, inspection objects, and interaction zones.
- `hazards.ts` controls terrain and wildlife hazards, including future Nature Skills interactions and damage mitigation.
- `skills.ts` defines the small static skill catalog and default missing-skill messages.
- `locations.ts` controls named outdoor buildings and other map objects.
- `maps/mainCamp.ts` composes the intentionally arranged outdoor map, terrain, zones, placements, collision, and Shower House entrance.
- `maps/showerHouse.ts` defines the first small interior, including its walls, wet-floor hazard, cleaning spot, and exit.
- `maps/index.ts` registers maps available to the lightweight map switcher.
- `types.ts` contains the shared TypeScript interfaces for content, maps, skills, terrain gates, hazard mitigation data, quest categories, objective unions, quest events, quest state, and typed rewards.

Future Codex tasks should add game content through these files when possible instead of hardcoding it into the gameplay loop. Run `npm run validate:quests` after quest content edits; validation reports duplicate IDs, broken prerequisites/rewards, target references, quest-giver metadata problems, and hidden/side/main progression safety warnings. Run `npm run test:quest-engine` for lightweight pure helper checks. To add another interior, define a readable `MapDefinition`, register it in `maps/index.ts`, and pair indoor/outdoor `map-exit` interactables with matching spawn IDs. Normal open Shower House doorways use automatic overlap transitions. Main Camp sets a modest `buildingFrontOverlap` that shortens outdoor building collision from the bottom while leaving each full building visual unchanged; a building can override it with `frontOverlap`. Doorway visuals are independent and can define their own `depth`, so future locked, special, or story-gated exits can omit automatic activation and continue to use the Action button. The canvas renderer uses a small named pass order—ground/background, terrain/decor, below actors, actors, then above actors—so outdoor building bodies and doors stay below the player while roofs and overhangs can cover actors for the top-down overlap illusion.

## Expanding the game

The foundation intentionally uses straightforward data arrays for maps, terrain, buildings, NPCs, supplies, hazards, and typed quest definitions. To convert another object to a sprite, add its path to `assetPaths` and assign its `assetId` in the relevant item or hazard content entry; the shared renderer keeps the existing shape fallback available. NPC dialogue metadata can define a display name, accent color, and an emotion-ready portrait set; NPCs without a custom portrait use the generic fallback. The reusable inspection overlay can similarly display maps, notes, schedules, labels, and other image clues. Future days can add more objects, questlines, side quests, hidden quests, and interactions without introducing a large generic game engine; gameplay hooks should emit generic quest events rather than hardcoding quest-specific branches. The Back 40, Nature Skills, cleaning/restocking tasks, and the Cliff mystery are teased but left for later expansion.
