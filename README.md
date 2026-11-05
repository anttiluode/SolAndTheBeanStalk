# Sol and the Beanstalk 🌱
### The Weight of the Sky — a playable living fairy tale

A third-person, browser-based 3D story about growing paths across the clouds and discovering who carries their weight. Built in plain JavaScript and native WebGL2. No game engine, no external models, no backend, no webcam, no tracking.

## Play

**GitHub Pages:** https://anttiluode.github.io/SolAndTheBeanStalk/ — **requires one-time enablement** for this new repository: GitHub repo **Settings → Pages → Build and deployment → GitHub Actions**. The CI token cannot enable GitHub Pages itself. Verification succeeds even while deployment is blocked.

Or clone/download the repository, open a terminal in its directory, and run:

    python -m http.server 8000

Then open http://localhost:8000/ in Chrome or Edge. No npm or install step is required. WebGL2 is required; browser settings must allow hardware acceleration. The optional Google Fonts stylesheet improves typography but isn't needed for gameplay.

## The playable story

You start with **one green climbing bean** on an island beneath the clouds. Every new island holds more pods and a piece of a story. A vine bridge grows from each climber seed into a broad, walkable, braided stem with twining shoots and flowers. Walk and jump across, or press **F** to follow a grown bridge automatically if you'd rather explore than fight the controls.

Five connected chapters form a **deterministically varied vertical archipelago**:

1. **The Last Bean.** A question left by your grandmother, and a route that only exists after you grow it.
2. **The Chain Orchard.** Growth becomes support for more growth. Gather your seeds.
3. **The Hanging Garden.** The chain's distant pin is overloaded. Spend a **golden root** to share its burden before planting the next bridge.
4. **The Hollow Heart.** Enter a chamber of ribs and crystals. Sow a **blue pulse** to wake a sleeping organ and continue upward.
5. **Above the Giant.** Meet a weary keeper. Choose whether to **root the shared load** or **release the oldest chain**. Both decisions have written endings.

The **pink bloom** is optional: plant a giant, colorful flower to remember a place. It never uses a required traversal seed. Every chapter grants its necessary pod exactly once so spending flowers cannot soft-lock the story.

## Controls

| Action | Keyboard and mouse |
| --- | --- |
| Move | WASD or arrows |
| Run / jump | Hold Shift / Space |
| Look / zoom | Drag the world / mouse wheel |
| Select seed | 1 Climber, 2 Root, 3 Bloom, 4 Pulse |
| Grow or use seed | E or Sow Seed button |
| Safely follow grown vine | F |
| Help, sound, new seeded world | Buttons at top right |
| Touch controls | On-screen movement pad, jump/follow, seed bar |

**Tip:** green bridges grow over a few seconds. Let the vine flower before stepping onto it. Your HUD tells you what must happen next, and a luminous beacon marks the next garden. If you fall into the clouds, you return to the last reached island with your progress intact.

## The story

The world tells its story through what you grow and repair. There is no combat boss and no randomized dialogue. The giant is a keeper rather than a monster; the player learns that every useful new route places weight on something out of sight.

The drama was informed by the **“Find what carries the load”** motif in the screenplay [Same Seed](https://github.com/anttiluode/Story). Related earlier experiments informed the mechanics and aesthetic: [Köynnös](https://github.com/anttiluode/Koynnos) (vine climbing and distant pin loads), [CrystalMoon](https://github.com/anttiluode/CrystalMoon) (organic crystal interiors), and [PsychedelicGarden](https://github.com/anttiluode/PsychedelicGarden) (growth as progression in surreal spaces).

This is **a distinct new implementation**. It does not incorporate or claim to reproduce the biological, fluid, or Clockfield mathematics of those projects. The chain/root problem is a designed narrative economy, not a structural physics solver. Terrain variation is procedural while the chapter spine is constrained for a guaranteed route.

## Files

- **index.html** — story dialogs, seed bar, HUD, field guide, controls.
- **style.css** — atmospheric responsive user interface.
- **core.js** — deterministic world generation, story gates, inventory, bridge geometry, two endings, saved-state validation. Testable in Node.
- **scene.js** — no-dependency WebGL2 renderer, floating islands, giant stalk, suspended chains, blooming bridges, crystal ribs, distant keeper, destination beacon and clouds.
- **game.js** — third-person movement and jump/gravity, camera, vine-follow, seeding, autosave, synthetic chimes.
- **tests/progression.test.cjs** — seed reproducibility, connectivity, resource constraints and two complete story branches.
- **.github/workflows/bean.yml** — Node syntax checks and tests, downloadable build artifact and conditional GitHub Pages deployment.

Local tests:

    node --check core.js
    node --check scene.js
    node --check game.js
    node --test tests/*.test.cjs

The GitHub Actions **verify** job runs these tests on every push. The first recorded verification passed. A real browser GPU playtest is still necessary before claiming validated graphics performance.

## Saving, replay and limitations

Progress uses browser localStorage, indexed by the world seed. For a shareable geography use a URL fragment such as **#seed-cloud-1105**. The **New world** button picks a new seed without erasing previous saves. Completed bridges, a rooted pin, an awakened heart and planted blossoms all return after reloading.

This is a **complete small five-chapter story build**, not a finished commercial game. There's no NPC conversational AI, procedural plot generator, combat, realistic fluid simulation, structural fracture model, or 30-hour campaign. Device-by-device performance, controller support, detailed accessibility, and full-browser GPU validation are not yet established.

**A path should remember who grew it, and someone must carry its weight.**

Built November 5, 2026.
