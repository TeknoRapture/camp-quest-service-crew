# AGENTS.md

This repository is an experiment for OpenAI Codex Cloud.

## Project goal

Build a small static browser game called “Camp Quest: Service Crew.”

The game should be a retro top-down 2D adventure set at Brigade Camp at Stony Glen. The player is part of Service Crew. When the morning bell rings, Service Crew begins the day by trying to find the cleaning supplies that other people borrowed and forgot to return. Before the crew can clean the shower houses, they must track down missing mops, brooms, gloves, trash bags, toilet paper, paper towels, soap refills, and other supplies scattered around camp.

The early game should emphasize comedy: Service Crew is ready to work, but first they have to solve the ancient camp mystery of “Who took the mop?” After gathering enough tools and supplies, the player cleans shower houses, restocks bathrooms, takes out trash, and delivers supplies around camp while avoiding various hazards.

## Platform and controls

Design this primarily as a mobile-friendly browser game.

The game should work well on phones first, while still supporting desktop controls for testing and laptop play.

## Mobile-first requirements

- The game should be playable on a phone in portrait orientation.
- Use a responsive layout that fits common mobile screens.
- The canvas should scale to the available screen size without requiring scrolling during gameplay.
- Important UI elements should be large enough to read and tap on a phone.
- Avoid tiny buttons, tiny text, or precise mouse-only interactions.
- Touch controls should be visible and easy to use.
- The player should not need a physical keyboard.

## Touch controls

Add simple on-screen mobile controls:

- A virtual D-pad or joystick for movement.
- A large action button for interacting, cleaning, picking up, taming, and talking.
- Optional smaller buttons for menu/checklist if needed.

The main action button should perform the nearest useful interaction, such as:

- Talk to an NPC
- Clean a mess spot
- Pick up a supply
- Drop off a supply
- Restock a station
- Tame wildlife if Nature Skills is unlocked
- Read the “Beware of Cliff!” sign

## Desktop controls

Also support keyboard controls for desktop play and testing:

- Movement: WASD and arrow keys
- Interact/action: Space or E
- Optional pause/menu: Escape

Desktop controls should not replace touch controls. Touch controls are required.

## Style

- Retro top-down 2D adventure game
- Inspired by 16-bit camp RPGs, not strict 8-bit pixel art
- Use simple readable sprites and warm outdoor colors
- Use a tile-based camp map
- Use a clipboard-style Service Checklist UI
- Keep the tone wholesome, funny, outdoorsy, faith-friendly, and lightly mysterious
- Avoid realistic horror; the Cliff story should feel like camp folklore, mystery, and cartoon chaos

## Visual reference images

A picture will be supplied as the map reference.

Use the supplied map picture as visual guidance for the camp layout. It does not need to be reproduced perfectly in Version 1, but the game map should be inspired by it and should preserve recognizable locations where practical.

A picture will also be supplied for the “Beware of Cliff!” sign.

Use the supplied sign picture as the reference for the sign design. The in-game sign can be simplified, but it should clearly resemble the supplied picture.

## Main locations

Main Camp:

- Welcome Center / Camp Office
- Shower House
- Bathroom area
- Supply Shed
- Dumpster
- Dining Hall
- Cabin Loop
- Patrick
- Mildon
- Beech
- Cherry
- Walnut
- Crusader
- Stoddard
- Maple
- Hickory
- Juniper
- Willow
- Hawthorne
- Philippians Building / Store
- Carl Smith Chapel / Rally Circle
- Gym
- Nurse’s Station
- Archery Range
- Rifle Range
- Paintball Field
- Ball Field
- Tree House
- Footprints Pavilion
- Milner Lake
- Milner Nature Pavilion
- Waterfalls
- Grand River
- Campfires

Back 40 / Outdoor Challenge:

- Bridge to the Back 40
- Pine
- A-Frame
- Don’s Place
- Outdoor Challenge Base
- Pioneer Point
- Elite Landing
- Cliff Trail / Cliff Area
- “Beware of Cliff!” sign, based on a supplied picture

## Day 1 map boundary

For Version 1 / Day 1, the bridge to the Back 40 should be blocked.

The player may see the bridge, Pine, A-Frame, Don’s Place, Outdoor Challenge territory, or hints of the Back 40, but should not fully access that region yet.

Use the blocked bridge as a natural game boundary and teaser for later expansion.

Possible bridge-blocking reasons:

- “Bridge closed for inspection.”
- “Outdoor Challenge hasn’t opened yet.”
- “Crazy Joe says the Back 40 is not ready for Service Crew… yet.”
- “A suspicious vulture is guarding the bridge.”
- “The bridge is blocked by misplaced supply crates.”

The blocked bridge should make the world feel larger without requiring the full Back 40 to be implemented in Version 1.

## NPCs

- Cooper / “Coop”: Service Crew Director. Main checklist giver and service task supervisor.
- Crazy Joe: Nature Program Director and Outdoor Challenge leader. Teaches Nature Skills and oversees the Back 40 / Outdoor Challenge territory.
- Gweggowy: Camp Director. Tracks overall camp readiness and unlocks the final rally objective.
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
- Prefer clear code and simple systems over clever architecture

## First Codex task direction

The first Codex task should focus on creating a simple playable foundation, not a full game.

Build a small, expandable game foundation for “Camp Quest: Service Crew” that can support future content.

The foundation should include:

- A basic game loop
- Mobile-first input handling
- Keyboard fallback input handling
- Canvas rendering
- Player movement
- Simple collision detection
- Interactable objects
- NPC placeholders
- Dialogue boxes
- A task/checklist system
- A simple item pickup and delivery system
- Basic hazards
- Simple save data using localStorage
- A clear structure for adding more maps, tasks, NPCs, hazards, days, and story events later

Keep the code understandable and easy to modify.

Do not build a large generic game engine. Avoid unnecessary abstraction. Build only what this game needs for Version 1, but organize it so future days, locations, quests, and characters can be added without rewriting everything.

## Core game loop

The game should be built around a simple repeating loop:

1. Receive or discover a task.
2. Find the needed tool, supply, NPC, or location.
3. Navigate camp while avoiding hazards.
4. Use the action button to interact, clean, pick up, deliver, restock, talk, or tame.  Each task takes some time so include a timer with a ui indicator.  Keep the time relatively short, just a few seconds. 
5. Complete the task and earn Service Points.
6. Update the Service Checklist.
7. Unlock or reveal the next task.

The player should always have a clear current objective.

The game should feel like a playful camp errand adventure, not a complex RPG. The fun comes from movement, exploration, funny dialogue, missing supplies, simple hazards, and satisfying checklist progress.

## Game design priorities

Prioritize these in Version 1:

1. Make it playable on mobile.
2. Make movement and interaction feel simple and reliable.
3. Make the Service Checklist clear.
4. Make the “Find the Supplies” phase funny and understandable.
5. Make the map readable and camp-like.
6. Make tasks short and satisfying.
7. Make hazards simple but noticeable.
8. Make the ending clear when the checklist is complete.

Do not overbuild systems in Version 1.

Avoid complex combat, inventory management, dialogue trees, crafting, multiplayer, procedural generation, or large RPG systems.

Use simple state tracking for tasks, items, NPC dialogue, hazards, and completion.

## Intended player experience

A first-time player should understand the basic goal within 30 seconds:

- The morning bell rang.
- Coop needs Service Crew to get moving.
- The supplies are missing.
- The player needs to find supplies, clean, restock, deliver items, avoid hazards, and report back.

The game should feel funny, active, and lightly chaotic, but never confusing.

## Comedy and tone for Service Crew tasks

The Service Crew tasks should be funny, humble, and camp-authentic.

The opening joke is that the crew wants to clean, but the supplies are missing because people around camp keep borrowing mops, brooms, toilet paper, trash bags, soap refills, and other tools without returning them.

Use light, wholesome comedy in dialogue and objectives.

Examples:

- “The mop was last seen near the Dining Hall. Program may have recruited it for an emergency skit.”
- “Someone borrowed the toilet paper. Again.”
- “Coop says the broom has been promoted to ‘missing equipment.’”
- “Before you can clean the Shower House, you must first survive the Supply Hunt.”
- “Service Crew Rule #1: The thing you need is never where it belongs.”
- “Service Crew Rule #2: Check the weirdest place first.”

Avoid mean-spirited humor. The comedy should come from camp chaos, missing supplies, and the heroic absurdity of doing humble jobs well.

## Version 1 features

- Use Vite + TypeScript
- Use HTML Canvas
- Mobile-first controls with on-screen movement and action buttons
- Desktop fallback controls with WASD, arrow keys, Space, and E
- Simple top-down camp map focused on Main Camp
- Include a blocked bridge that teases the Back 40 for later expansion
- Add a Service Checklist UI
- Start with a “Find the Supplies” phase before cleaning begins
- Find missing cleaning tools: mop, broom, gloves, and trash bags
- Find missing bathroom supplies: toilet paper, paper towels, and soap refill
- Clean 4 mess spots in the shower house after finding the required cleaning tools
- Restock 3 bathroom supplies: soap, paper towels, and toilet paper
- Take 2 trash bags to the dumpster
- Deliver 2 supply crates from the supply shed to requested camp locations
- Reach the rally circle when the checklist is complete
- Use Service Points as the score
- Use Energy as the health/stamina meter
- Save best score to localStorage
- Include placeholder NPCs for Coop, Crazy Joe, Gweggowy, Ethan, and Cliff
- Include a readable “Beware of Cliff!” sign near the Cliff Trail / Back 40 area, based on a supplied picture
- Support using a supplied map picture as the visual reference for the camp layout

## Hazards

- Wet floor spots
- Mud patches
- Mosquito clouds
- Spiders
- Snakes
- Vultures
- Bees
- Wasps

Hazard behavior:

- Wet floor and mud slow movement
- Mosquito clouds reduce Energy
- Spiders briefly slow or startle the player
- Snakes block narrow paths and reduce Energy if touched
- Vultures may swoop around supply areas or distract the player
- Bees and wasps may swarm near outdoor areas, cabins, trash, or supply pickup spots and reduce Energy if the player gets too close

## Nature Skills perk

Add a “Nature Skills” perk.

With this perk, spiders, snakes, vultures, bees, and wasps can be tamed, calmed, redirected, or safely handled instead of simply avoided.

Taming or calming should use the main action button on mobile and Space or E on desktop.

Tamed wildlife benefits:

- Tamed spiders reveal hidden items nearby
- Tamed snakes clear or repel mosquito clouds
- Tamed vultures point toward the nearest unfinished objective or missing supply
- Calmed bees may reveal hidden outdoor supplies or lead the player toward flowers, nature areas, or supply pickups
- Calmed wasps may temporarily guard an area and keep other hazards away

For Version 1, it is acceptable for Nature Skills to be simple. It can be unlocked by talking to Crazy Joe or completing a basic Outdoor Challenge task at Pioneer Point.

## Cliff sign

Add a readable “Beware of Cliff!” sign near the entrance to the Cliff Trail / Back 40 area.

A picture will be supplied for this sign. Use the supplied picture as the visual reference.

The sign should have:

- White sign background
- Red text
- Text stacked as:
  - Beware
  - of
  - Cliff!
- Smaller red symbol below the text: a dot inside a triangle inside a circle inside a square, all sharing the same center point

The sign should be interactable. When the player interacts with it, show a short dialogue message that foreshadows the Cliff ghost story.

Example:

“BEWARE OF CLIFF! Someone scratched a strange symbol beneath the warning.”

## Outdoor Challenge / Back 40

Add a wilder camp region called the Back 40. This is Outdoor Challenge territory and includes Pioneer Point and Elite Landing.

Crazy Joe is both the Nature Program Director and the leader of Outdoor Challenge. He is stationed in or near the Back 40 and teaches the player Nature Skills.

For Version 1 / Day 1, the Back 40 should mostly be teased rather than fully playable because the bridge is blocked.

Back 40 gameplay for later expansion:

- The Back 40 has more wildlife hazards than Main Camp.
- Spiders, snakes, vultures, bees, and wasps appear more often here.
- With the Nature Skills perk, wildlife can be tamed, calmed, redirected, or used as helpers.
- Pioneer Point should introduce Nature Skills.
- Elite Landing should feel like a harder supply delivery area.
- Pine, A-Frame, and Don’s Place are located across the bridge in or near the Back 40.
- The Cliff Area should connect to the camp ghost story and the BBEG, Cliff.
- The “Beware of Cliff!” sign should appear in or near this region and should be based on the supplied picture.

## Suggested game flow

1. Morning bell rings.
2. Player starts near Coop.
3. Coop gives the Service Crew checklist.
4. Player begins the “Find the Supplies” phase.
5. Player tracks down missing cleaning tools and bathroom supplies around Main Camp.
6. Player returns to the Shower House with the required supplies.
7. Player cleans the Shower House.
8. Player restocks bathroom supplies.
9. Player takes trash to the dumpster.
10. Ethan requests supply deliveries for program setup.
11. Crazy Joe mentions the Back 40 and Nature Skills, but the bridge is blocked for Day 1.
12. Player sees or interacts with the blocked bridge and/or the “Beware of Cliff!” sign, based on the supplied picture.
13. Player completes the checklist and reaches the rally circle.
14. Gweggowy confirms camp readiness.
15. Cliff mystery is foreshadowed for later expansion.

## UI expectations

Use a mobile-friendly HUD with:

- Service Checklist
- Energy meter
- Service Points
- Current objective
- Inventory or carried item indicator, if needed

The Service Checklist should feel like a camp clipboard.

The UI should stay readable on phone screens.

## Expected commands

Once the project exists, prefer these commands:

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Build: `npm run build`
- Test, if tests exist: `npm test`

## Deployment

Add a GitHub Pages deployment workflow if practical.

The project should be buildable as a static site and deployable without AWS.

## Before finishing a task

- Run the build command if possible
- Run tests if they exist
- Update README.md with setup, run, build, and deploy instructions
- Summarize what changed
- Mention anything that still needs manual review
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
- Gweggowy: Camp Director. Tracks overall camp readiness and unlocks final rally objective.
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
