# AGENTS.md

This repository is an experiment for OpenAI Codex Cloud.

## Project goal

Build a small static browser game called “Camp Quest: Service Crew.”

The game should be a retro top-down 2D adventure set at Brigade Camp at Stony Glen. The player is part of Service Crew. When the morning bell rings, Service Crew begins cleaning shower houses, restocking bathrooms, taking out trash, and delivering supplies around camp.

## Style

- Retro top-down 2D adventure game
- Inspired by 16-bit camp RPGs, not strict 8-bit pixel art
- Use simple readable sprites and warm outdoor colors
- Use a tile-based camp map
- Use a clipboard-style Service Checklist UI
- Keep the tone wholesome, funny, outdoorsy, faith-friendly, and lightly mysterious

## Main locations

Main Camp:
- Welcome Center / Camp Office
- Shower House
- Bathroom area
- Supply Shed
- Dumpster
- Dining Hall
- Cabin Loop
- Philippians Building / Store
- Carl Smith Chapel / Rally Circle
- Gym

Back 40 / Outdoor Challenge:
- Outdoor Challenge Base
- Pioneer Point
- Elite Landing
- Cliff Trail / Cliff Area
- “Beware of Cliff!” sign

## NPCs

- Cooper / “Coop”: Service Crew Director. Main checklist giver and service task supervisor.
- Crazy Joe: Nature Program Director and Outdoor Challenge leader. Teaches Nature Skills.
- Greggerwy: Camp Director. Tracks overall camp readiness and unlocks final rally objective.
- Ethan: Camp Program Director. Gives program setup and supply delivery quests.
- Cliff: BBEG tied to the camp ghost story and the Cliff area. Refine later.

## Gameplay constraints

- Client-side only
- Do not require AWS
- Do not require a backend server
- Do not require user accounts
- Do not require a database
- Use localStorage for saved best score or settings
- Keep dependencies minimal
- Keep the first version simple and playable

## Version 1 features

- Use Vite + TypeScript
- Use HTML Canvas
- Player can move with WASD or arrow keys
- Player can interact with Space or E
- Add a Service Checklist UI
- Clean 4 mess spots in the shower house
- Restock 3 bathroom supplies: soap, paper towels, and toilet paper
- Take 2 trash bags to the dumpster
- Deliver 2 supply crates from the supply shed to requested camp locations
- Reach the rally circle when the checklist is complete
- Use Service Points as the score
- Use Energy as the health/stamina meter
- Save best score to localStorage

## Hazards

- Wet floor spots
- Mud patches
- Mosquito clouds
- Spiders
- Snakes
- Vultures

Hazard behavior:
- Wet floor and mud slow movement
- Mosquito clouds reduce Energy
- Spiders briefly slow or startle the player
- Snakes block narrow paths and reduce Energy if touched
- Vultures may swoop around supply areas or distract the player

## Nature Skills perk

Add a “Nature Skills” perk. With this perk, spiders, snakes, and vultures can be tamed instead of simply avoided.

Taming should use Space or E.

Tamed wildlife benefits:
- Tamed spiders reveal hidden items nearby
- Tamed snakes clear or repel mosquito clouds
- Tamed vultures point toward the nearest unfinished objective or missing supply

## Cliff sign

Add a readable “Beware of Cliff!” sign near the entrance to the Cliff Trail / Back 40 area.

The sign should have:
- White sign background
- Red text
- Text stacked as:
  Beware
  of
  Cliff!
- Smaller red symbol below the text: a dot inside a triangle inside a circle inside a square, all sharing the same center point

## Expected commands

Once the project exists, prefer these commands:

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Build: `npm run build`
- Test, if tests exist: `npm test`

## Before finishing a task

- Run the build command if possible
- Run tests if they exist
- Update README.md with setup, run, and deploy instructions
- Summarize what changed
- Mention anything that still needs manual review
