# Integrating Madness Engine into an existing game

This guide describes the current state of the game's integration and what the verification script actually tests. It is not a promise that swapping files is behavior-neutral in every browser or scene. Use the verifier and review the game after each migration.

## Current integration status

The migration configuration lives in `scripts/drop-in/games.mjs`; the set of projects that already depend on the engine lives in `scripts/extract/sources.mjs` as `ON_ENGINE`.

| Game | Current path |
|---|---|
| Madness | Uses the engine as a package; no local copies of the extracted engine files. |
| Dungeon Roller | Uses the engine as a package; no local copies of the extracted engine files. |
| Catroller | Uses the engine as a package; no local copies of the extracted engine files. |
| Rock 'n' Roller I, II, and III | Use the engine as a package; no local copies of the extracted engine files. |
| Metrlol | Uses the engine as a package; retains its game-specific cast and game code. |
| Petroll | Uses the engine as a package; retains its game-specific cast, controls, and game code. |
| Metroll | Uses the compatibility-overlay configuration. It is not in the `ON_ENGINE` set. |

The verifier also maintains per-game settings for renderer paths, physics behavior, input options, view defaults, and model kits. Do not infer a game's migration status from this table alone; check the configuration before changing it.

## What remains game-specific

The engine provides reusable systems and assets. A game still owns its level design, rules, UI, progression, rosters, and the way those systems are composed.

In particular, the engine's stage does not automatically take over a game's audio, weather, or music lifecycle. The game decides when to wake audio, start a band, apply weather through the effects system, and respond to game events. The stage can apply a mood's lighting, sky, reflection environment, and film settings, but it does not start the mood's music or weather for the game.

The shared library stores reusable characters, props, heroes, scenery, textures, and music extracted from the games. `scripts/extract/origins.json` records where a game's files were placed. The game's roster files remain game-specific: they decide which of the shared assets appear in that game.

## Run compatibility verification

The verifier expects a directory containing game folders named after the configured projects. From the engine repository:

```sh
npm run verify -- --games ../games
```

Use the actual directory that contains the game folders in place of `../games`.

The script has two paths:

### Games already on the engine

For a game marked `onEngine`, the script checks that:

- `package.json` declares a `madness-engine` dependency;
- files already represented in the shared library are not still present as local copies; and
- the old `src/vendor/gfx` renderer folder is absent.

It then copies the game to a temporary work directory, links the current engine repository into that copy as `node_modules/madness-engine`, and runs the game's test suite. With package verification enabled, it also packs the engine, installs that package into another copy, runs the tests, and builds with Vite.

### Games still using the compatibility overlay

For a game not marked `onEngine`, the default checks compare the engine with the game's local copies where applicable:

- physics behavior over the configured test worlds;
- scripted input behavior, including configured boost and game-specific controls;
- renderer shader files;
- extracted library content and import relationships;
- moods and film settings, where that game has them;
- music behavior for extracted bands; and
- the view implementation and configured starting view.

The script then makes an untouched copy and an overlay copy of the game. The overlay replaces the configured renderer, physics, input, view, and model-kit files with engine versions, applying the game's configured options. It runs the same game tests against both copies and compares the results.

This is a temporary verification process. It does not rewrite the checked-out game directory.

## Verification options

| Option | Effect |
|---|---|
| `--games <path>` | Directory containing the configured game folders. Defaults to the parent directory of the current working directory. |
| `--only <names>` | Comma-separated game names to check, such as `metroll,petroll`. |
| `--work <path>` | Use a specific directory for temporary copies and package artifacts. |
| `--skip-tests` | Skip game test suites. Compatibility comparisons still run for overlay-based games. |
| `--package` | Also pack and install the engine as a package, then run the package-mode tests and Vite build. |
| `--package-only` | Run package-mode verification without the normal compatibility comparisons or overlay test pass. |

Examples:

```sh
# Check one game with the compatibility comparisons and overlay tests.
npm run verify -- --games ../games --only metroll

# Check every configured game and also test the packed npm package.
npm run verify -- --games ../games --package

# Test the package-install path without the normal overlay comparisons.
npm run verify -- --games ../games --package-only

# Run comparisons without running the game test suites.
npm run verify -- --games ../games --skip-tests
```

The verifier exits with a nonzero status when a check fails. It skips game folders that are not present under the supplied games directory, so confirm the output lists every project you intended to check.

## Moving a game onto the engine

The overlay and package-mode implementations are the executable migration examples:

- `scripts/drop-in/overlay.mjs` replaces local engine files in a temporary game copy.
- `scripts/drop-in/package-mode.mjs` removes local copies or turns compatibility files into package re-exports.
- `scripts/drop-in/games.mjs` defines each game's options and migration path.
- `scripts/extract/sources.mjs` defines extracted assets and the games already using the engine.
- `scripts/extract/origins.json` maps source game files to their library locations.

For a package-based migration, replace local implementation files with imports from `madness-engine` rather than leaving duplicate copies beside the package. Keep game-specific control maps and other glue in the game. Preserve the game's own roster and content selection.

A typical package re-export is:

```js
export * from 'madness-engine/physics';
```

For systems with game-specific configuration, import the engine's API and pass those options at the call site. Avoid forking an engine module merely to change one default when the option already exists.

## Changes the engine may introduce

The engine is not necessarily a byte-for-byte copy of every historical game implementation. The shared systems have accumulated fixes and enhancements, including collision options, renderer corrections, model baking improvements, and rebuilt character assets. The compatibility checks cover the behaviors they explicitly exercise; they do not prove that every visual result, browser/GPU combination, or untested gameplay path is unchanged.

When a migration changes character or prop assets, use the corresponding generated library assets and their current model budgets. Do not keep an old local model while replacing only the model system unless that combination is intentional and tested.
