# Camp Quest: Service Crew

A small, mobile-first retro camp adventure built as a static browser game. The morning bell has rung, but Service Crew cannot start until somebody solves the ancient mystery: **who took the mop?**

This initial playable foundation includes a canvas-rendered Main Camp, touch and keyboard controls, NPC dialogue, collision, hazards, supply pickups, a delivery, a Service Checklist, Energy, Service Points, a saved best score, and a blocked bridge teasing the Back 40.

## Play

- **Phone:** use the on-screen D-pad and large **ACTION** button.
- **Desktop:** move with WASD or arrow keys; interact with Space or E.
- Talk to Coop by the Welcome Center, recover supplies, and deliver the crate to the Dining Hall.
- Mud and wet floors slow movement. Mosquito clouds reduce Energy.

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

- `src/main.ts` — game state, input, update loop, interactions, and canvas rendering.
- `src/style.css` — responsive mobile-first game shell, HUD, checklist, dialogue, and controls.
- `public/reference/` — supplied visual references for the Stony Glen layout and Cliff sign.
- `.github/workflows/deploy-pages.yml` — static GitHub Pages deployment.

## Expanding the game

The foundation intentionally uses straightforward data arrays for buildings, NPCs, supplies, hazards, and checklist tasks. Future days can add more objects and interactions without introducing a large generic game engine. The Back 40, Nature Skills, cleaning/restocking tasks, and the Cliff mystery are teased but left for later expansion.
