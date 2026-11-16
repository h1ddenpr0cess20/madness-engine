# British spellings in the code

A snapshot of the spellings still in British English across the tracked files, taken at commit `bf1983e`, with the file and line of each. It is a planning list, not generated output: it does not update itself, and the line numbers will drift as the files change.

Before converting a hit, check its kind. Identifiers, string values, and anything in the public API (for example the granite `grey` key) are part of the interface and need a deliberate rename, not a search and replace.

Total occurrences: 2470. By kind (heuristic): code 1249, comment 912, string 309.

Kind is a heuristic: `comment` = line starts as a comment; `string` = the word sits inside quotes; `code` = everything else (identifiers and prose in code). Identifiers such as `setColour` are included because they still use British spelling.

By top-level folder: src 1947, examples 183, scripts 172, test 154, docs 12, .claude 2.


## `.claude/skills/blender-pipeline/SKILL.md` (2)

- L186 `storey` (string): 2. Story count: `rows = max(1, round(height / storey))`, with the same
- L187 `storey` (string): `FACADE[kind].storey` values the file already uses.

## `docs/granite-kitchen.md` (2)

- L11 `grey` (string): The granite option uses the exact API key `'grey'` (not `'gray'`).
- L18 `grey` (string): | `granite` | `'grey'` | Key in the granite library. |

## `docs/library.md` (10)

- L42 `armoured` (code): | `characters/croc` | `croc` (rocknroller-iii) | The Saltwater Croc: long, low and armoured, olive-tan with dark blotches and cream underneath, rows o
- L112 `neighbour` (string): | `characters/neighbour` | `neighbour` (metrlol, rocknroller) | The Angry Neighbor: a pink-faced man in a terry-cloth bathrobe and slippers, a gray co
- L112 `neighbour` (string): | `characters/neighbour` | `neighbour` (metrlol, rocknroller) | The Angry Neighbor: a pink-faced man in a terry-cloth bathrobe and slippers, a gray co
- L113 `knickerbockers` (string): | `characters/newsie` | `newsie` (metrlol, rocknroller-ii) | The Newsie: a kid in a baggy cap, a waistcoat over a collarless shirt, braces, knickerboc
- L289 `setColour` (string): | `heroes/rock-jewel` | `createJewelRock`, `createJewelBoulder`, `JEWELS` (engine) | The granite stone's shape, cut from a translucent gem instead: cl
- L320 `grey` (string): | `textures/ground` | (engine) | Ground, painted to the same standard as `textures/road`: `turfTexture(GFX, { health, length, clover, dry, seed })` is
- L321 `grey` (string): | `textures/roofing` | (engine) | Roofs, painted the same way: `shinglesTexture(GFX, { color: 'charcoal' \| 'brown' \| 'grey' \| 'green', age, seed })
- L321 `grey` (string): | `textures/roofing` | (engine) | Roofs, painted the same way: `shinglesTexture(GFX, { color: 'charcoal' \| 'brown' \| 'grey' \| 'green', age, seed })
- L347 `kerbs` (code): | `textures/town/paint` | `paint` (metrlol, petroll) | From Rock 'n' Roller III, with Petroleum Springs's own added at the end (lawn, paving slabs, sh
- L390 `theatre` (string): | `moods/opera` | `opera` (rocknroller) | The Opera House: no film; `theatre` at 88 on `music/band.rocknroller` |

## `examples/asset-viewer/index.html` (16)

- L45 `colourrows` (comment): #colourrows .swatchrow { display: grid; grid-template-columns: 1fr 34px 22px; gap: 6px; align-items: center; }
- L46 `colourrows` (comment): #colourrows .swatchrow label { color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
- L47 `colourrows` (comment): #colourrows input[type=color] { padding: 0; width: 34px; height: 22px; }
- L48 `colourrows` (comment): #colourrows .swatchrow button { padding: 0; width: 22px; height: 22px; visibility: hidden; }
- L49 `colourrows` (comment): #colourrows .swatchrow.changed button { visibility: visible; }
- L85 `grey` (string): <div class="line"><label>Background</label><select id="bg"><option value="#0b0e1d">Dark</option><option value="#6b7280">Mid grey</option><option value
- L99 `colourgroup` (string): <div class="group" id="colourgroup" style="display:none"><h3>Colours &amp; design</h3>
- L99 `Colours` (string): <div class="group" id="colourgroup" style="display:none"><h3>Colours &amp; design</h3>
- L102 `colourrows` (string): <div id="colourrows" style="display:grid;gap:5px"></div>
- L103 `colourapply` (string): <button id="colourapply" disabled style="width:100%;font-weight:600">Applied</button>
- L104 `colourdiverse` (string): <div class="line"><button id="colourdiverse" title="A skin tone, hair and eyes from the palettes (diverse() in characters/person.js)">Randomise</butto
- L104 `colourreset` (string): <div class="line"><button id="colourdiverse" title="A skin tone, hair and eyes from the palettes (diverse() in characters/person.js)">Randomise</butto
- L104 `colourcopy` (string): <div class="line"><button id="colourdiverse" title="A skin tone, hair and eyes from the palettes (diverse() in characters/person.js)">Randomise</butto
- L105 `colourhint` (string): <div style="color:var(--dim)" id="colourhint">The same model in other colours: <code>variant()</code>. Choices are applied (re-baked) when you press A
- L105 `colours` (string): <div style="color:var(--dim)" id="colourhint">The same model in other colours: <code>variant()</code>. Choices are applied (re-baked) when you press A
- L107 `colours` (string): <div class="group" id="itemui" style="display:none"><h3>Item</h3><div class="line" style="margin-bottom:6px"><button id="itemreset" title="Everything 

## `examples/asset-viewer/src/bake.worker.js` (8)

- L5 `catalogue` (comment): * definition as the catalogue found it (its file, its export, and the entry
- L6 `colours` (comment): * in that export if it is a table of them, and `colours`, if a person is wanted in others); the mesh's arrays go back, handed
- L13 `catalogue` (comment): // As the catalogue has it: a still prop with no skeleton gets one bone, the root.
- L16 `colours` (code): self.onmessage = async ({ data: { id, path, key, sub, detail, colours } }) => {
- L20 `colours` (comment): // A person in other colours, as the page has them (characters/person.js `variant`).
- L21 `colours` (code): const def = colours && Object.keys(colours).length && typeof base.variant === 'function' ? base.variant(colours) : base;
- L21 `colours` (code): const def = colours && Object.keys(colours).length && typeof base.variant === 'function' ? base.variant(colours) : base;
- L21 `colours` (code): const def = colours && Object.keys(colours).length && typeof base.variant === 'function' ? base.variant(colours) : base;

## `examples/asset-viewer/src/catalog.js` (40)

- L129 `colours` (comment): // A person can be shown in other colours (characters/person.js `variant`): `palette` says which, and `colours` is the
- L129 `colours` (comment): // A person can be shown in other colours (characters/person.js `variant`): `palette` says which, and `colours` is the
- L135 `colours` (code): async build({ detail = 1, colours = null }) {
- L136 `colours` (code): const shown = people && colours && Object.keys(colours).length ? def.variant(colours) : def;
- L136 `colours` (code): const shown = people && colours && Object.keys(colours).length ? def.variant(colours) : def;
- L136 `colours` (code): const shown = people && colours && Object.keys(colours).length ? def.variant(colours) : def;
- L138 `colours` (code): try { adopt(shown, detail, await bakeElsewhere({ ...job, detail, colours })); } catch (err) { console.warn(`${source}: baked here instead (${err.messa
- L233 `colour` (string): ['rock (granite)', ({ colour = 'grey' } = {}) => import('../../../src/heroes/rock-granite.js').then((m) => m.createGraniteRock(GFX, { colour })), null
- L233 `grey` (string): ['rock (granite)', ({ colour = 'grey' } = {}) => import('../../../src/heroes/rock-granite.js').then((m) => m.createGraniteRock(GFX, { colour })), null
- L233 `colour` (string): ['rock (granite)', ({ colour = 'grey' } = {}) => import('../../../src/heroes/rock-granite.js').then((m) => m.createGraniteRock(GFX, { colour })), null
- L233 `colour` (string): ['rock (granite)', ({ colour = 'grey' } = {}) => import('../../../src/heroes/rock-granite.js').then((m) => m.createGraniteRock(GFX, { colour })), null
- L234 `colour` (string): ['rock (jewel)', ({ colour = 'sapphire', mist = 'on' } = {}) => import('../../../src/heroes/rock-jewel.js').then((m) => m.createJewelRock(GFX, { colou
- L234 `colour` (string): ['rock (jewel)', ({ colour = 'sapphire', mist = 'on' } = {}) => import('../../../src/heroes/rock-jewel.js').then((m) => m.createJewelRock(GFX, { colou
- L234 `colour` (string): ['rock (jewel)', ({ colour = 'sapphire', mist = 'on' } = {}) => import('../../../src/heroes/rock-jewel.js').then((m) => m.createJewelRock(GFX, { colou
- L392 `colours` (code): async build({ colours = {}, ...buildOptions } = {}) {
- L393 `colours` (code): const made = await make({ ...colours, ...buildOptions });
- L530 `colours` (code): build({ colours = {} } = {}) {
- L531 `colours` (code): const made = createDieProp(GFX, id, colours);
- L557 `colours` (code): build({ colours = {} } = {}) {
- L558 `colours` (code): const made = createBowlingBall(GFX, { colors: colours, design: colours.design ?? 'marble' });
- L558 `colours` (code): const made = createBowlingBall(GFX, { colors: colours, design: colours.design ?? 'marble' });
- L637 `colours` (code): build({ colours = {} } = {}) {
- L638 `colours` (code): const made = createBouncyBall(GFX, { colors: colours, design: colours.design ?? 'swirl' });
- L638 `colours` (code): const made = createBouncyBall(GFX, { colors: colours, design: colours.design ?? 'swirl' });
- L668 `colours` (code): build({ colours = {} } = {}) {
- L669 `colours` (code): const made = createBowlingPin(GFX, { colors: colours, design: colours.design ?? 'classic' });
- L669 `colours` (code): const made = createBowlingPin(GFX, { colors: colours, design: colours.design ?? 'classic' });
- L705 `colours` (code): colours = {},
- L712 `colours` (string): ? weapons[factory](GFX, { gripColor: colours.gripColor ?? grip ?? '#101010', graniteColour: colours.graniteColour ?? graniteDefault ?? 'grey' })
- L712 `graniteColour` (string): ? weapons[factory](GFX, { gripColor: colours.gripColor ?? grip ?? '#101010', graniteColour: colours.graniteColour ?? graniteDefault ?? 'grey' })
- L712 `colours` (string): ? weapons[factory](GFX, { gripColor: colours.gripColor ?? grip ?? '#101010', graniteColour: colours.graniteColour ?? graniteDefault ?? 'grey' })
- L712 `graniteColour` (string): ? weapons[factory](GFX, { gripColor: colours.gripColor ?? grip ?? '#101010', graniteColour: colours.graniteColour ?? graniteDefault ?? 'grey' })
- L712 `grey` (string): ? weapons[factory](GFX, { gripColor: colours.gripColor ?? grip ?? '#101010', graniteColour: colours.graniteColour ?? graniteDefault ?? 'grey' })
- L714 `colours` (code): ? weapons[factory](GFX, { metal, gripColor: colours.gripColor ?? grip ?? '#633b2c' })
- L718 `colours` (code): gripColor: colours.gripColor ?? grip ?? '#633b2c',
- L719 `colours` (code): ...(thread ? { threadColor: colours.threadColor ?? thread } : {}),
- L959 `greyed` (comment): // The character creator, slot by slot: those not built yet are shown, kept, and greyed out.
- L1107 `colours` (code): async function buildStaff(wood, { topper = 'orb', vine = 'roots', wrap = 'on', colours = {} } = {}) {
- L1117 `colours` (string): gripColor: colours.gripColor ?? '#3a2418', threadColor: colours.threadColor ?? '#e2b857' });
- L1117 `colours` (string): gripColor: colours.gripColor ?? '#3a2418', threadColor: colours.threadColor ?? '#e2b857' });

## `examples/asset-viewer/src/extras.js` (4)

- L36 `coloured` (comment): /** A Mesher's finished parts, one mesh each, coloured by material name. */
- L37 `colours` (code): export function meshesOf(parts, colours = {}) {
- L44 `colours` (code): const m = new GFX.Mesh(g, new GFX.MeshStandardMaterial({ name, vertexColors: true, color: new GFX.Color(colours[name] ?? '#ffffff'), roughness: 0.85, 
- L155 `colour` (string): effectItem('ring', 'Shock ring', (fx) => (dt, now) => { if (now) fx.ring(0, 0.05, 0, { colour: '#ffffff', reach: 3, life: 0.8 }); }),

## `examples/asset-viewer/src/gif.js` (6)

- L4 `colour` (comment): * Frames are added as RGBA pixels; `finish()` picks one 255-colour palette for the whole animation
- L8 `colour` (comment): * colour), so a still background costs nothing. The animation loops forever by default.
- L13 `colours` (comment): /** A palette of up to `size` colours for `frames` (RGBA), by median cut over a 5-bit-a-channel histogram: { palette: [[r, g, b]], lut: Uint8Array(327
- L53 `colours` (comment): // Each of the 32768 colours, to its nearest in the palette.
- L141 `colours` (comment): // A global table of 256 colours; the last is the transparent one.
- L161 `colour` (comment): // Graphic control: leave what is there, a transparent colour, the frame's delay (in hundredths).

## `examples/asset-viewer/src/main.js` (85)

- L32 `Colour` (string): const REASONS = ['Geometry', 'Colour / material', 'Animation', 'Scale / pose', 'Clipping', 'Too heavy', 'Missing', 'Other'];
- L113 `colours` (code): const view = { item: null, colours: {}, draft: {}, coloursFor: null, weaponMetals: {}, seed: 0, built: null, radius: 1, center: new GFX.Vector3(), cli
- L113 `coloursFor` (code): const view = { item: null, colours: {}, draft: {}, coloursFor: null, weaponMetals: {}, seed: 0, built: null, radius: 1, center: new GFX.Vector3(), cli
- L161 `colours` (comment): // Another person starts in their own colours.
- L162 `coloursFor` (code): if (view.coloursFor !== item.id) { view.colours = {}; view.draft = {}; view.coloursFor = item.id; view.seed = 0; }
- L162 `colours` (code): if (view.coloursFor !== item.id) { view.colours = {}; view.draft = {}; view.coloursFor = item.id; view.seed = 0; }
- L162 `coloursFor` (code): if (view.coloursFor !== item.id) { view.colours = {}; view.draft = {}; view.coloursFor = item.id; view.seed = 0; }
- L177 `colours` (code): const built = await item.build({ ...options, colours: view.colours, lights: stage.fixtureLights, stage });
- L177 `colours` (code): const built = await item.build({ ...options, colours: view.colours, lights: stage.fixtureLights, stage });
- L205 `centre` (comment): // Models stand on y = 0; centre the thing over the origin and look at its middle.
- L220 `colourGroup` (code): colourGroup(item);
- L244 `greys` (comment): * and { type: 'heading', label }. Those with a `get` follow the item while it moves on its own; `disabled` greys a
- L300 `colours` (comment): * The shown model as it first came: its option menus back to their defaults, its colours and saved metals
- L313 `colours` (code): view.colours = {}; view.draft = {}; view.seed = 0;
- L393 `colours` (comment): // ———————————————————————————————————————————————— colours
- L395 `colours` (comment): /** What a person's colours are to be: what has been chosen (not yet applied: `view.draft`), or what they come in. */
- L396 `colourRows` (code): function colourRows(item) {
- L432 `colour` (string): ['Second colour', pal.swirl, c.swirl, (v) => { c.swirl = v; }, () => { delete c.swirl; }],
- L433 `colour` (string): ['Third colour', pal.accent, c.accent, (v) => { c.accent = v; }, () => { delete c.accent; }],
- L461 `colour` (comment): // Clothes that are one colour change together, so a suit stays a suit.
- L493 `colourDirty` (code): const colourDirty = () => JSON.stringify(view.draft) !== JSON.stringify(view.colours);
- L493 `colours` (code): const colourDirty = () => JSON.stringify(view.draft) !== JSON.stringify(view.colours);
- L495 `colour` (comment): /** The colour pickers for the person on show; nothing for what is not a person. Choosing changes nothing on show until Apply. */
- L496 `colourGroup` (code): function colourGroup(item) {
- L497 `colourgroup` (string): const group = $('colourgroup');
- L511 `colourdiverse` (string): $('colourdiverse').style.display = isStaff || isDice || isWeapon || isGraniteWeapon || isMorningstar ? 'none' : '';
- L531 `colourdiverse` (string): $('colourdiverse').textContent = isBowlingPin ? 'Random pin color' : isBowlingBall || isBouncyBall ? 'Randomise colours' : 'Randomise';
- L531 `colours` (string): $('colourdiverse').textContent = isBowlingPin ? 'Random pin color' : isBowlingBall || isBouncyBall ? 'Randomise colours' : 'Randomise';
- L532 `colourdiverse` (string): $('colourdiverse').title = isBowlingPin
- L545 `colours` (string): $('bowlingdesign').value = view.draft.design ?? view.colours.design ?? item.palette.design ?? (isBowlingPin ? 'classic' : isBouncyBall ? 'swirl' : 'ma
- L550 `graniteColour` (code): select.value = view.draft.graniteColour ?? view.colours.graniteColour ?? item.palette.granite;
- L550 `colours` (code): select.value = view.draft.graniteColour ?? view.colours.graniteColour ?? item.palette.granite;
- L550 `graniteColour` (code): select.value = view.draft.graniteColour ?? view.colours.graniteColour ?? item.palette.granite;
- L551 `graniteColour` (code): select.onchange = () => { view.draft.graniteColour = select.value; colourGroup(item); };
- L551 `colourGroup` (code): select.onchange = () => { view.draft.graniteColour = select.value; colourGroup(item); };
- L556 `colourhint` (string): $('colourhint').textContent = isStaff
- L561 `colourway` (string): ? 'The blade, guard and fused handle are granite; choose its granite colourway and the leather wrap colour.'
- L561 `colour` (string): ? 'The blade, guard and fused handle are granite; choose its granite colourway and the leather wrap colour.'
- L565 `colour` (string): : 'Choose blade and hilt metals, then set the leather grip colour here. Metal finishes update immediately; Apply commits the grip colour.')
- L565 `colour` (string): : 'Choose blade and hilt metals, then set the leather grip colour here. Metal finishes update immediately; Apply commits the grip colour.')
- L567 `colour` (string): ? 'Choose the morningstar head and haft metal, then set the leather grip colour. Metal finishes update immediately; Apply commits the grip colour.'
- L567 `colour` (string): ? 'Choose the morningstar head and haft metal, then set the leather grip colour. Metal finishes update immediately; Apply commits the grip colour.'
- L571 `colours` (string): ? 'A rubber bouncy ball: choose a pattern and its three colours. Apply updates the ball. In a game, pair it with the physics\' RUBBER bounce.'
- L573 `colour` (string): ? 'Choose a surface design and change the base resin, swirl, accent veins, and recessed finger-hole colour. Apply updates the ball.'
- L576 `colours` (string): : 'The same model in other colours: variant(). Choices are applied (re-baked) when you press Apply. Hair also dyes beards and crests.';
- L577 `colourrows` (string): $('colourrows').replaceChildren(...colourRows(item).map(([label, was, now, set, clear]) => {
- L577 `colourRows` (string): $('colourrows').replaceChildren(...colourRows(item).map(([label, was, now, set, clear]) => {
- L581 `colourGroup` (code): input.onchange = () => { set(input.value); colourGroup(item); };
- L582 `colourGroup` (code): undo.onclick = () => { clear(); colourGroup(item); };
- L585 `colourDirty` (code): const dirty = colourDirty();
- L586 `colourapply` (string): $('colourapply').disabled = !dirty;
- L587 `colourapply` (string): $('colourapply').classList.toggle('on', dirty);
- L588 `colourapply` (string): $('colourapply').textContent = dirty ? 'Apply changes' : 'Applied';
- L591 `colourapply` (string): $('colourapply').onclick = () => { view.colours = structuredClone(view.draft); show(view.item); };
- L591 `colours` (string): $('colourapply').onclick = () => { view.colours = structuredClone(view.draft); show(view.item); };
- L592 `colourdiverse` (string): $('colourdiverse').onclick = () => {
- L594 `colours` (code): const design = view.draft.design ?? view.colours.design ?? view.item.palette.design ?? 'classic';
- L597 `colours` (code): const design = view.draft.design ?? view.colours.design ?? view.item.palette.design ?? 'swirl';
- L601 `colours` (code): const current = { ...view.item.palette, ...view.colours, ...view.draft };
- L609 `colourGroup` (code): colourGroup(view.item);
- L611 `colourreset` (string): $('colourreset').onclick = () => { view.draft = {}; colourGroup(view.item); };
- L611 `colourGroup` (string): $('colourreset').onclick = () => { view.draft = {}; colourGroup(view.item); };
- L615 `colourGroup` (code): colourGroup(view.item);
- L617 `colourcopy` (string): $('colourcopy').onclick = async () => {
- L623 `colours` (code): + JSON.stringify(view.colours, null, 2) + ");";
- L629 `colours` (string): + JSON.stringify(view.colours, null, 2) + ", design: '" + (view.colours.design ?? 'swirl') + "' });\n"
- L629 `colours` (string): + JSON.stringify(view.colours, null, 2) + ", design: '" + (view.colours.design ?? 'swirl') + "' });\n"
- L635 `colours` (string): + JSON.stringify(view.colours, null, 2) + ", design: '" + (view.colours.design ?? 'marble') + "' });";
- L635 `colours` (string): + JSON.stringify(view.colours, null, 2) + ", design: '" + (view.colours.design ?? 'marble') + "' });";
- L643 `colours` (code): + (view.colours.gripColor ?? '#633b2c') + "' });";
- L655 `colours` (string): + ", gripColor: '" + (view.colours.gripColor ?? view.item.palette.grip) + "', threadColor: '"
- L656 `colours` (code): + (view.colours.threadColor ?? view.item.palette.thread) + "' });";
- L662 `graniteColour` (string): + "const " + variable + " = " + factory + "(GFX, { graniteColour: '"
- L663 `colours` (string): + (view.colours.graniteColour ?? view.item.palette.granite ?? 'grey')
- L663 `graniteColour` (string): + (view.colours.graniteColour ?? view.item.palette.granite ?? 'grey')
- L663 `grey` (string): + (view.colours.graniteColour ?? view.item.palette.granite ?? 'grey')
- L664 `colours` (string): + "', gripColor: '" + (view.colours.gripColor ?? view.item.palette.grip ?? '#101010') + "' });";
- L672 `colours` (string): + (view.item.palette.metalGrip ? "'" : "', gripColor: '" + (view.colours.gripColor ?? view.item.palette.grip ?? '#633b2c') + "'")
- L674 `colours` (string): ? ", threadColor: '" + (view.colours.threadColor ?? view.item.palette.thread) + "'"
- L680 `colours` (string): + JSON.stringify(view.colours, null, 2) + ", design: '" + (view.colours.design ?? 'classic') + "' });";
- L680 `colours` (string): + JSON.stringify(view.colours, null, 2) + ", design: '" + (view.colours.design ?? 'classic') + "' });";
- L683 `colours` (string): code = `import ${name} from 'madness-engine/${view.item.source.replace(/\.js$/, '')}';\n\nconst ${name}Again = ${name}.variant(${JSON.stringify(view.c
- L685 `colourcopy` (string): try { await navigator.clipboard.writeText(code); flash($('colourcopy'), 'Copied'); } catch { flash($('colourcopy'), 'Copy failed'); }
- L685 `colourcopy` (string): try { await navigator.clipboard.writeText(code); flash($('colourcopy'), 'Copied'); } catch { flash($('colourcopy'), 'Copy failed'); }
- L717 `centre` (string): const depth = z > 0.62 ? 'front' : z < 0.38 ? 'back' : 'centre';

## `examples/asset-viewer/src/weapon-assets.js` (2)

- L26 `grey` (string): { id: 'weapons/granite-sword', factory: 'createGraniteSword', name: 'Granite Sword', set: 'Granite Set', hands: ONE, paletteKind: 'granite-weapon', gr
- L27 `grey` (string): { id: 'weapons/granite-dagger', factory: 'createGraniteDagger', name: 'Granite Dagger', set: 'Granite Set', hands: ONE, paletteKind: 'granite-weapon',

## `examples/human-world/src/main.js` (6)

- L4 `colour` (comment): * broadsword, and a crowd of the same man in every colour of skin, eyes,
- L5 `armoury` (comment): * shirt, jeans and shoes, each with a weapon from the engine's armoury and
- L56 `ARMOURY` (code): const ARMOURY = Object.keys(WEAPONS)
- L83 `colours` (comment): // A little more light than the mood's own, so the colours can be told apart at night.
- L200 `ARMOURY` (code): const arm = ARMOURY[i % ARMOURY.length];
- L200 `ARMOURY` (code): const arm = ARMOURY[i % ARMOURY.length];

## `examples/human-world/src/world/buildings.js` (2)

- L13 `colours` (comment): * colours, the height of a door) and keep where it is and which way it faces.
- L91 `colours` (comment): *   tint            multiplies the model's colours: the town is drained and darkened with it

## `examples/human-world/src/world/ground.js` (2)

- L22 `colour` (comment): /** The colour each surface is tinted, before the noise: the horror's drained green-grey. */
- L22 `grey` (comment): /** The colour each surface is tinted, before the noise: the horror's drained green-grey. */

## `examples/human-world/src/world/materials.js` (7)

- L1 `grey` (code): import { FLOORS, fractal, grey, pair, pixels, smoothstep, stone, ashlar, rubble, stucco, clapboard, timber, hedge, cliff, tiled } from 'madness-engine
- L8 `colour` (comment): * are painted below, and the colour comes from the models' vertex colours,
- L8 `colours` (comment): * are painted below, and the colour comes from the models' vertex colours,
- L22 `grey` (code): return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
- L36 `grey` (code): return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
- L47 `grey` (code): return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
- L58 `grey` (code): return grey(Math.round(255 * Math.max(0, Math.min(1, k))));

## `examples/human-world/src/world/scenery.js` (1)

- L287 `grey` (comment): /** The belfry bell, hung in its frame: gold-grey, a clapper that swings. Drawn so the town can show it. */

## `examples/human-world/src/world/town.js` (4)

- L29 `grey` (code): grey: [0.55, 0.57, 0.6],
- L40 `grey` (code): { id: 'chapel', enter: 'chapel', name: "St. Wick's Chapel", type: 'chapel', variant: 0, door: [40, 20.4], yaw: 0, tint: TINTS.grey },
- L52 `grey` (code): { id: 'h3', enter: null, name: 'A barred house', type: 'merchant', variant: 0, door: [46.0, 48.5], yaw: -Math.PI / 2, tint: TINTS.grey, lit: true },
- L57 `grey` (code): { id: 'well', enter: null, name: 'The well', type: 'well', variant: 0, door: [40, 46], yaw: 0, tint: TINTS.grey, lit: false },

## `scripts/bake-human.mjs` (8)

- L21 `modelling` (comment): *     modelling targets: each one's offsets at his size and in his pose,
- L299 `centre` (code): return { centre: r4([0, y, front]), corner: r4(corner) };
- L309 `centre` (code): eye: eyeFit('helper-l-eye'), mouth: mouth.centre,
- L345 `modelling` (comment): // Each is a sum of MakeHuman's modelling targets (features.js says which, and how much). A target
- L415 `millimetre` (comment): // A byte an axis where that is a quarter of a millimetre or finer, two bytes where it is not.
- L442 `modelling` (code): const text = `// Generated by scripts/bake-human.mjs${FEMALE ? ' --female' : ''} from the MakeHuman project's modelling targets,
- L446 `metres` (comment): // base64 Int8 or Int16, as \`bits\` says, × \`q\` metres, in his pose), how far it moves each of his joints
- L447 `metres` (comment): // (\`pivots\`, metres) and how much it grows each eye's radius (\`eyes\`).

## `scripts/drop-in/library-diff.mjs` (2)

- L165 `colour` (comment): /** The town's prop kit, and the colour function it needs: the game's own, to the letter, bar where the colour function is found. */
- L165 `colour` (comment): /** The town's prop kit, and the colour function it needs: the game's own, to the letter, bar where the colour function is found. */

## `scripts/extract/edits.mjs` (20)

- L64 `colour` (code): const QUADRUPED_INNER = `  // Inside the ears: their own colour, gone pink.
- L113 `colour` (comment): // The hollow inside, toward the front, and the colour in it.
- L156 `colour` (comment): * The eyes, set half out of the head where it is: the eyeball the colour of
- L313 `coloured` (comment): * A head: skull and cheeks, a nose, ears, big eyes (white, a coloured iris,
- L315 `colour` (comment): * the brows' colour; \`ears\` false hides them (under a hood or a helmet);
- L408 `colour` (comment): * Hair's colour (a function or hex) in strands: lighter and darker streaks
- L495 `colour` (string): const HUMANOID_FEET = `/** A colour (or a colour function) darkened, for a sole that wasn't given one. */
- L495 `colour` (string): const HUMANOID_FEET = `/** A colour (or a colour function) darkened, for a sole that wasn't given one. */
- L1172 `colour` (code): [`/** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
- L1176 `colour` (code): `/** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
- L1365 `neighbour` (string): 'neighbour.js': [
- L1366 `moustache` (code): [`      // A comb-over, and a moustache like a pair of wings.
- L1370 `moustache` (code): `      // A comb-over, and a moustache like a pair of wings.
- L1380 `grey` (comment): // What is left round the back and over the ears: a fringe of grey, lying close to the head.
- L1389 `neighbour` (string): 'neighbour.rocknroller.js': [
- L1390 `moustache` (code): [`      // A comb-over, and a moustache like a pair of wings.
- L1394 `moustache` (code): `      // A comb-over, and a moustache like a pair of wings.
- L1404 `grey` (comment): // What is left round the back and over the ears: a fringe of grey, lying close to the head.
- L1757 `coloured` (string): why: 'The animals\' faces: their eyes sank into heads swollen by smooth unions and were plain beads; the nose was too small for the grid and came out 
- L1917 `neighbour` (code): at: /^characters\/(dame|dancer|hippie|metalwear|neighbour|ninja|raver|salaryman|stuntman|superfan|usher|wardrobe|wizard)\.js$/,

## `scripts/extract/library.mjs` (118)

- L244 `colourable` (string): props: 'What lies about to be picked up: sculpted, still, for `createStatic`, and the colourable roleplaying dice (`DICE`) in `props/dice`.',
- L258 `bcolourable` (code): [/\bcolourable\b/gi, 'colorable'],
- L259 `bcolours` (code): [/\bcolours\b/gi, 'colors'],
- L260 `bcolouring` (code): [/\bcolouring\b/gi, 'coloring'],
- L261 `bcoloured` (code): [/\bcoloured\b/gi, 'colored'],
- L262 `bcolourful` (code): [/\bcolourful\b/gi, 'colorful'],
- L263 `bcolour` (code): [/\bcolour\b/gi, 'color'],
- L264 `bmodelling` (code): [/\bmodelling\b/gi, 'modeling'],
- L265 `bmodelled` (code): [/\bmodelled\b/gi, 'modeled'],
- L266 `bmillimetres` (code): [/\bmillimetres\b/gi, 'millimeters'],
- L267 `bmillimetre` (code): [/\bmillimetre\b/gi, 'millimeter'],
- L268 `bcentimetres` (code): [/\bcentimetres\b/gi, 'centimeters'],
- L269 `bcentimetre` (code): [/\bcentimetre\b/gi, 'centimeter'],
- L270 `bkilometres` (code): [/\bkilometres\b/gi, 'kilometers'],
- L271 `bkilometre` (code): [/\bkilometre\b/gi, 'kilometer'],
- L272 `bmetres` (code): [/\bmetres\b/gi, 'meters'],
- L273 `bmetre` (code): [/\bmetre\b/gi, 'meter'],
- L274 `blitres` (code): [/\blitres\b/gi, 'liters'],
- L275 `blitre` (code): [/\blitre\b/gi, 'liter'],
- L276 `bstylised` (code): [/\bstylised\b/gi, 'stylized'],
- L277 `bbehaviour` (code): [/\bbehaviour\b/gi, 'behavior'],
- L278 `bcatalogue` (code): [/\bcatalogue\b/gi, 'catalog'],
- L279 `bcentres` (code): [/\bcentres\b/gi, 'centers'],
- L280 `bcentre` (code): [/\bcentre\b/gi, 'center'],
- L281 `bgreys` (code): [/\bgreys\b/gi, 'grays'],
- L282 `bgreyed` (code): [/\bgreyed\b/gi, 'grayed'],
- L283 `bgreyer` (code): [/\bgreyer\b/gi, 'grayer'],
- L284 `bgreyest` (code): [/\bgreyest\b/gi, 'grayest'],
- L285 `bgreyish` (code): [/\bgreyish\b/gi, 'grayish'],
- L286 `bgrey` (code): [/\bgrey\b/gi, 'gray'],
- L287 `bfibres` (code): [/\bfibres\b/gi, 'fibers'],
- L288 `bfibre` (code): [/\bfibre\b/gi, 'fiber'],
- L289 `blicences` (code): [/\blicences\b/gi, 'licenses'],
- L290 `blicence` (code): [/\blicence\b/gi, 'license'],
- L291 `borganised` (code): [/\borganised\b/gi, 'organized'],
- L292 `borganise` (code): [/\borganise\b/gi, 'organize'],
- L293 `boptimised` (code): [/\boptimised\b/gi, 'optimized'],
- L294 `boptimise` (code): [/\boptimise\b/gi, 'optimize'],
- L295 `brealised` (code): [/\brealised\b/gi, 'realized'],
- L296 `brealise` (code): [/\brealise\b/gi, 'realize'],
- L297 `brecognised` (code): [/\brecognised\b/gi, 'recognized'],
- L298 `brecognise` (code): [/\brecognise\b/gi, 'recognize'],
- L299 `bcustomised` (code): [/\bcustomised\b/gi, 'customized'],
- L300 `bcustomise` (code): [/\bcustomise\b/gi, 'customize'],
- L301 `bvisualised` (code): [/\bvisualised\b/gi, 'visualized'],
- L302 `bvisualise` (code): [/\bvisualise\b/gi, 'visualize'],
- L303 `bspecialised` (code): [/\bspecialised\b/gi, 'specialized'],
- L304 `bspecialise` (code): [/\bspecialise\b/gi, 'specialize'],
- L305 `bauthorised` (code): [/\bauthorised\b/gi, 'authorized'],
- L306 `bauthorise` (code): [/\bauthorise\b/gi, 'authorize'],
- L307 `binitialised` (code): [/\binitialised\b/gi, 'initialized'],
- L308 `binitialise` (code): [/\binitialise\b/gi, 'initialize'],
- L309 `bnormalised` (code): [/\bnormalised\b/gi, 'normalized'],
- L310 `bnormalise` (code): [/\bnormalise\b/gi, 'normalize'],
- L311 `bserialised` (code): [/\bserialised\b/gi, 'serialized'],
- L312 `bserialise` (code): [/\bserialise\b/gi, 'serialize'],
- L313 `bsummarised` (code): [/\bsummarised\b/gi, 'summarized'],
- L314 `bsummarise` (code): [/\bsummarise\b/gi, 'summarize'],
- L315 `butilised` (code): [/\butilised\b/gi, 'utilized'],
- L316 `butilise` (code): [/\butilise\b/gi, 'utilize'],
- L317 `btravellers` (code): [/\btravellers\b/gi, 'travelers'],
- L318 `btraveller` (code): [/\btraveller\b/gi, 'traveler'],
- L319 `btravelling` (code): [/\btravelling\b/gi, 'traveling'],
- L320 `bcancelled` (code): [/\bcancelled\b/gi, 'canceled'],
- L321 `blabelled` (code): [/\blabelled\b/gi, 'labeled'],
- L322 `bfavourites` (code): [/\bfavourites\b/gi, 'favorites'],
- L323 `bfavourite` (code): [/\bfavourite\b/gi, 'favorite'],
- L324 `bfavourable` (code): [/\bfavourable\b/gi, 'favorable'],
- L325 `bfavour` (code): [/\bfavour\b/gi, 'favor'],
- L326 `btheatre` (code): [/\btheatre\b/gi, 'theater'],
- L327 `bmoustaches` (code): [/\bmoustaches\b/gi, 'mustaches'],
- L328 `bmoustache` (code): [/\bmoustache\b/gi, 'mustache'],
- L329 `btowards` (code): [/\btowards\b/gi, 'toward'],
- L330 `bstoreys` (code): [/\bstoreys\b/gi, 'stories'],
- L331 `bstorey` (code): [/\bstorey\b/gi, 'story'],
- L332 `baluminium` (code): [/\baluminium\b/gi, 'aluminum'],
- L333 `bmoulds` (code): [/\bmoulds\b/gi, 'molds'],
- L334 `bmoulded` (code): [/\bmoulded\b/gi, 'molded'],
- L335 `bmoulding` (code): [/\bmoulding\b/gi, 'molding'],
- L336 `bmould` (code): [/\bmould\b/gi, 'mold'],
- L337 `bchequered` (code): [/\bchequered\b/gi, 'checkered'],
- L338 `bwhilst` (code): [/\bwhilst\b/gi, 'while'],
- L339 `bamongst` (code): [/\bamongst\b/gi, 'among'],
- L340 `blearnt` (code): [/\blearnt\b/gi, 'learned'],
- L345 `bstencilled` (code): [/\bstencilled\b/gi, 'stenciled'],
- L346 `bstencilling` (code): [/\bstencilling\b/gi, 'stenciling'],
- L347 `bneighbours` (code): [/\bneighbours\b/gi, 'neighbors'],
- L348 `bneighbour` (code): [/\bneighbour\b/gi, 'neighbor'],
- L349 `bjewellery` (code): [/\bjewellery\b/gi, 'jewelry'],
- L350 `btyres` (code): [/\btyres\b/gi, 'tires'],
- L351 `btyre` (code): [/\btyre\b/gi, 'tire'],
- L352 `bkerb` (code): [/\bkerb\b/gi, 'curb'],
- L353 `bcheques` (code): [/\bcheques\b/gi, 'checks'],
- L354 `bcheque` (code): [/\bcheque\b/gi, 'check'],
- L355 `bprogramme` (code): [/\bprogramme\b/gi, 'program'],
- L357 `boffence` (code): [/\boffence\b/gi, 'offense'],
- L358 `bdefence` (code): [/\bdefence\b/gi, 'defense'],
- L359 `bploughed` (code): [/\bploughed\b/gi, 'plowed'],
- L360 `bplough` (code): [/\bplough\b/gi, 'plow'],
- L361 `bmanoeuvres` (code): [/\bmanoeuvres\b/gi, 'maneuvers'],
- L362 `bmanoeuvre` (code): [/\bmanoeuvre\b/gi, 'maneuver'],
- L364 `bpractising` (code): [/\bpractising\b/gi, 'practicing'],
- L365 `bpractised` (code): [/\bpractised\b/gi, 'practiced'],
- L366 `bpractise` (code): [/\bpractise\b/gi, 'practice'],
- L367 `bageing` (code): [/\bageing\b/gi, 'aging'],
- L368 `bhonoured` (code): [/\bhonoured\b/gi, 'honored'],
- L369 `bhonouring` (code): [/\bhonouring\b/gi, 'honoring'],
- L370 `bhonours` (code): [/\bhonours\b/gi, 'honors'],
- L371 `bhonour` (code): [/\bhonour\b/gi, 'honor'],
- L372 `bhumour` (code): [/\bhumour\b/gi, 'humor'],
- L373 `brumour` (code): [/\brumour\b/gi, 'rumor'],
- L374 `blabour` (code): [/\blabour\b/gi, 'labor'],
- L375 `barmour` (code): [/\barmour\b/gi, 'armor'],
- L376 `bflavour` (code): [/\bflavour\b/gi, 'flavor'],
- L377 `bodour` (code): [/\bodour\b/gi, 'odor'],
- L378 `bvigour` (code): [/\bvigour\b/gi, 'vigor'],
- L380 `bharbour` (code): [/\bharbour\b/gi, 'harbor'],
- L448 `coloured` (string): if (kind === 'props') lines.push('| `props/dice` | `DICE` (engine) | Eight standalone dice props: D4 (a numeral at each corner, read at the top vertex

## `scripts/extract/moods.mjs` (1)

- L162 `colours` (comment): /** The lantern the game's stage hangs over the ball, which the look colours: how bright, how far it reaches, how it falls off, how high. */

## `scripts/extract/origins.json` (4)

- L62 `neighbour` (string): "src/models/cast/neighbour.js": "characters/neighbour.js",
- L62 `neighbour` (string): "src/models/cast/neighbour.js": "characters/neighbour.js",
- L373 `neighbour` (string): "src/cast/neighbour.js": "characters/neighbour.js",
- L373 `neighbour` (string): "src/cast/neighbour.js": "characters/neighbour.js",

## `scripts/jupiter-map.py` (13)

- L10 `centred` (code): R pixels centred on (CX, CY). LON0 is the longitude, in degrees east, that faces
- L12 `colour` (code): stretched over the disc, and that brightness is run through Jupiter's colour
- L21 `colour` (code): The output is one colour JPEG, base64 in the module, which the glass globe holds
- L32 `colour` (comment): # Jupiter's colour scale, in globes' form (stops of value and color, as its temperature scale is): the value
- L91 `grey` (code): grey = c.mean()
- L92 `grey` (code): c = np.clip(grey + (c - grey) * saturation, 0, 255)
- L92 `grey` (code): c = np.clip(grey + (c - grey) * saturation, 0, 255)
- L151 `colours` (code): colours = lut[np.round(value * (len(lut) - 1)).astype(int)]
- L152 `colour` (comment): # the red the photograph has: pull the colour toward rust where it is red, most where it is dark
- L155 `colours` (code): colours = np.clip(colours * (1 - k) + rust * k * (0.8 + 0.4 * value[..., None]), 0, 255).astype(np.uint8)
- L155 `colours` (code): colours = np.clip(colours * (1 - k) + rust * k * (0.8 + 0.4 * value[..., None]), 0, 255).astype(np.uint8)
- L156 `colours` (code): im = Image.fromarray(colours, "RGB")
- L162 `colour` (comment): * Jupiter's clouds as a 2:1 colour layout, rows from 90N down, columns from

## `scripts/moon-relief.py` (6)

- L10 `metres` (code): 5760 x 2880, 16-bit integers in metres), read with its PDS label `ldem_16.lbl`
- L22 `centre` (string): to put the near side's centre (longitude 0) in the middle, as Mars's are.
- L43 `metres` (string): """The gridded topography in metres, with the label's nulls set to NaN."""
- L56 `metres` (code): metres = {"KILOMETER": 1000.0, "METER": 1.0}[label.get("UNIT", "METER")]
- L57 `metres` (code): elevation = raw * scale * metres
- L65 `Metres` (comment): # Metres a pixel spans: north-south is constant, east-west shrinks with cos(latitude).

## `src/buildings/california.js` (8)

- L159 `storey` (comment): /** A dingbat: a two-storey stucco box on stilts over a carport, a name in script on the front, a starburst. */
- L248 `storey` (comment): /** A strip mall: one storey of shopfronts under a sign band, a taco stand's awning, parking in front. */
- L266 `storey` (comment): /** A two-storey shopfront building: arcade of awnings below, offices with windows above. */
- L301 `storeys` (comment): // The lobby: two storeys of glass set back under the tower, a canopy over the doors.
- L430 `storey` (comment): /** A school: a long two-storey wing, a bell tower, a playground and a field with a track. */
- L800 `storey` (comment): /** A painted lady: a pastel Victorian with a two-storey bay on the front, a porch over the door and a hip roof. */
- L849 `storeys` (comment): /** A motel: two storeys of stucco rooms, a walkway with a rail on the upper floor, a pool in front and a pole sign by the road. */
- L1021 `coloured` (comment): /** An adobe: a thick earth-coloured house with a flat roof, a parapet to the front, wooden vigas through the wall and a beehive oven. */

## `src/buildings/civic.js` (1)

- L173 `coloured` (comment): /** A pointed window with a coloured pane, glowing at night. */

## `src/buildings/common.js` (5)

- L70 `millimetres` (comment): * a few millimetres past the one under it, so no two faces share a plane: faces
- L139 `storey` (comment): * heights, and braces in the end panels of each storey, rising toward the
- L156 `storey` (comment): // A rail on the ground would sink into the stone base it stands on, and one at the top of a storey into the storey above, whose own rail would then l
- L156 `storey` (comment): // A rail on the ground would sink into the stone base it stands on, and one at the top of a storey into the storey above, whose own rail would then l
- L306 `colour` (comment): // The board, its long side out from the wall; on each face a panel of another colour.

## `src/buildings/homes.js` (6)

- L71 `storeys` (comment): /** A house: timber-framed, two storeys, the upper one leaning out over the street; clay tiles. */
- L88 `centimetre` (comment): // The bressummer stands a centimetre past the storey above it, which would otherwise share its front and its ends.
- L88 `storey` (comment): // The bressummer stands a centimetre past the storey above it, which would otherwise share its front and its ends.
- L114 `storeys` (comment): /** A townhouse: three storeys narrow to the street, each leaning over the one below, under a steep tiled gable. */
- L129 `storeys` (comment): // Two timbered storeys, each a little further out in front.
- L196 `storey` (comment): /** A shop: one low storey and an attic, a shuttered counter window, an awning and a sign. */

## `src/buildings/industry.js` (3)

- L168 `storeys` (comment): // The house, two storeys, stone below.
- L270 `storeys` (comment): /** A craft hall: a master's hall of two jettied storeys with a counter on the street, a forge in the back and iron in the yard. */
- L282 `storey` (comment): // The upper storey leans out over the street.

## `src/buildings/newyork.js` (5)

- L87 `storeys` (comment): /** A brownstone: three storeys of brown stone on a raised stoop, a door with a transom, and a cornice. */
- L106 `storeys` (comment): /** A walk-up tenement: five storeys of brick with two fire escapes down the front and a stoop door. */
- L142 `storeys` (comment): /** A cast-iron loft: four storeys behind an iron front of pilasters and bands, tall windows between the pilasters. */
- L177 `storeys` (comment): /** An Italianate row house: five narrow storeys with arched-top windows, a bracketed cornice and a stoop. */
- L196 `storeys` (comment): /** A two-family brick house: three storeys, two front doors each with its own stoop, and a wooden porch on the upper floor. */

## `src/buildings/packs/index.js` (1)

- L14 `catalogue` (comment): * type belongs to, and `PACK_LABELS` the name of each pack for a catalogue.

## `src/buildings/packs/moscow.js` (1)

- L64 `storeys` (comment): /** A khrushchevka: a pale concrete panel block of nine storeys, with a balcony on every floor and rows of plain windows. */

## `src/buildings/packs/rio.js` (2)

- L36 `colours` (comment): // The awning: a cone of cloth, striped in two colours.
- L41 `storeys` (comment): /** A pousada: a bright colonial inn of two storeys, walls of yellow or pink with green shutters, a tiled roof and a palm court before it. */

## `src/buildings/packs/tokyo.js` (6)

- L6 `storey` (comment): * a konbini convenience store with its bright sign, a two-storey izakaya with
- L25 `storeys` (comment): /** A tiered pagoda: a stone plinth, three wooden storeys each under a deep tiled roof, and a gilt spire. Windows only on the ground storey, the store
- L25 `storey` (comment): /** A tiered pagoda: a stone plinth, three wooden storeys each under a deep tiled roof, and a gilt spire. Windows only on the ground storey, the store
- L25 `storeys` (comment): /** A tiered pagoda: a stone plinth, three wooden storeys each under a deep tiled roof, and a gilt spire. Windows only on the ground storey, the store
- L58 `storeys` (comment): /** An izakaya: two storeys of dark wood under a tiled roof, paper lanterns on the eaves, and a noren curtain over the door. */
- L74 `storeys` (comment): /** A danchi: a long concrete housing block of many storeys, with balconies of pale rail and a stair tower at one end. */

## `src/buildings/works.js` (3)

- L8 `GREYS` (code): const GREYS = ['#8f8a80', '#a29c90', '#7c776e', '#b0aa9c', '#96907f'];
- L21 `GREYS` (code): function heap(m, rnd, cx, cz, r, n = 8, cols = GREYS, { seed = 0, size = 1 } = {}) {
- L154 `GREYS` (code): heap(m, rnd, 1.15, -0.4, 0.3, 9, GREYS, { seed: 17 });

## `src/characters/artist.js` (4)

- L3 `moustache` (code): import { beard, beret, moustache } from './wardrobe.js';
- L7 `colour` (comment): * opinions, in a beret, a loose blue smock smeared with every colour, a red
- L8 `moustache` (comment): * neckerchief, a waxed moustache and a little beard; the palette on his
- L50 `moustache` (code): moustache(s, { color: '#2a1a10', wide: 1.5 });

## `src/characters/baldguy.js` (2)

- L2 `moustache` (code): import { beard, moustache } from './wardrobe.js';
- L28 `moustache` (code): moustache(s, { color: HAIR, wide: 1.1 });

## `src/characters/bird.js` (7)

- L25 `colour` (comment): *   eye      { r, iris, pupil (0–1 of the iris), ring: colour of the bare ring round it, ringW, look: [x, y, z] }
- L28 `colour` (comment): *              dihedral, pattern (colour, p, n, [out, back], t) over every feather of it, colors: { leading, lesser, median, greater, tertials, second
- L32 `colour` (comment): *   plumage  (p, n) the colour of the body, neck and head
- L35 `colour` (comment): * A colour anywhere may be '#rrggbb', (p, n), or for a feather (p, n, t)
- L48 `colour` (comment): /** A colour, whatever it was given as, at p (n its normal, t along a feather). */
- L110 `colour` (comment): /** An eye's colour: the pupil in the middle of the iris, the iris brighter toward it and dark at its rim. */
- L239 `grey` (comment): // The cere: bare skin over the base of the beak (a pigeon's white blob, a parrot's grey band).

## `src/characters/bobby.js` (3)

- L2 `moustache` (code): import { moustache } from './wardrobe.js';
- L7 `chequered` (comment): * silver, the chequered band, a whistle on its chain, and the hands behind
- L37 `moustache` (code): moustache(s, { color: '#5a3a24', wide: 1.1 });

## `src/characters/bobby.rocknroller-iii.js` (4)

- L2 `moustache` (code): import { moustache } from './wardrobe.js';
- L7 `chequered` (comment): * silver, the chequered band, a whistle on its chain, and the hands behind
- L39 `moustache` (code): moustache(s, { color: '#5a3a24' });
- L51 `chequered` (comment): // Silver buttons down the tunic, the chequered cuff band, the whistle chain.

## `src/characters/boulder.js` (2)

- L6 `coloured` (comment): * faceted, coloured grain by grain — with a face cut into it: two deep
- L57 `coloured` (comment): /** The stone, faceted and coloured; made once per detail and shared. */

## `src/characters/bull.js` (2)

- L18 `grey` (comment): * hump of the neck, grey on the muzzle and round the eyes, duller under
- L75 `colours` (comment): // The breeder's colours, pinned on the hump: green and white ribbons.

## `src/characters/candlekid.js` (1)

- L5 `colour` (comment): * The Candle Kid: a tie-dye T-shirt in a colour that does not exist, a

## `src/characters/capoeira.js` (1)

- L5 `coloured` (comment): * waist, in the white abadá trousers and the coloured cord of his grade

## `src/characters/cat.js` (9)

- L29 `grey` (string): grey: { name: 'Ghost', coat: 'grey', speed: 4.4, sight: 6.5, fov: 2.4, wary: 0.8, ears: 0.8, play: 5, size: 1, reach: 0.62 },
- L29 `grey` (string): grey: { name: 'Ghost', coat: 'grey', speed: 4.4, sight: 6.5, fov: 2.4, wary: 0.8, ears: 0.8, play: 5, size: 1, reach: 0.62 },
- L114 `colour` (comment): /** Soft variation over the coat, so no colour is flat. */
- L147 `grey` (code): grey: (p, n) => lerp3(C('#7b818c'), C('#a3a8b0'), pale(p, n) * 0.8).map((v) => v * hairs(p) * shade(p, 0.08)),
- L172 `colour` (comment): /** The eye colour for each coat. */
- L173 `grey` (string): const EYES = { ginger: '#c8e05a', black: '#f2c43a', grey: '#e8a63a', calico: '#7ac86a', siamese: '#5aa8f0', tom: '#e8b030' };
- L177 `centre` (comment): /** An eye's centre, the way it looks (`d`), and the turn that stands a shape along it. */
- L187 `centre` (comment): /** p in an eye's own frame (`R` its turn, `c` its centre): x across, y up, z out the front. */
- L197 `colour` (comment): /** An eye's colour: the iris bright in the middle and dark at its rim, and a slit of a pupil down the front. */

## `src/characters/clubber.js` (1)

- L7 `colour` (comment): * shaved head, a shaved everything else, a face the colour of a basement

## `src/characters/cop.js` (2)

- L2 `moustache` (code): import { cap, moustache } from './wardrobe.js';
- L39 `moustache` (code): moustache(s, { color: '#6a3a1a', wide: 1.15, droop: 0.4 });

## `src/characters/cosplayer.js` (4)

- L15 `ARMOUR` (code): const ARMOUR = { color: WHITE, mat: 'plastic' };
- L47 `ARMOUR` (code): s.box([0, 0.71, 0.0], [0.11, 0.1, 0.11], 0.04, { ...ARMOUR, bone: 'head', k: 0.006 });
- L53 `ARMOUR` (code): for (const m of [1, -1]) s.box([m * 0.14, 0.51, 0], [0.045, 0.045, 0.05], 0.01, { ...ARMOUR, bone: `arm${m > 0 ? 'L' : 'R'}`, k: 0.004 });
- L59 `armour` (comment): // The skirt armour over the hips, plates of white with a red one in front.

## `src/characters/cowboy.js` (2)

- L3 `moustache` (code): import { moustache, stetson } from './wardrobe.js';
- L46 `moustache` (code): moustache(s, { color: '#6a4422', wide: 1.15, droop: 0.6 });

## `src/characters/croc.js` (6)

- L6 `harbour` (comment): * The Saltwater Croc: up out of the harbour and onto the rocks, long and
- L7 `armoured` (comment): * low and armoured, olive-tan above with dark blotches and cream
- L18 `colour` (comment): /** Scaly hide: the colour of `base`, every scale's edge dark. */
- L30 `armour` (comment): * A crocodilian's head and armour, for the croc and the gator: `snout`
- L33 `colour` (comment): * outside the bottom jaw), the hide `H` and the colour of the eye.
- L73 `armour` (comment): /** The armour: rows of scutes down the back, and the double crest down the tail. */

## `src/characters/crossingguard.js` (1)

- L63 `Colours` (comment): // Colours are asked for as built; the stripes are drawn where they were sculpted, as the bands are.

## `src/characters/cultist.js` (1)

- L5 `colour` (comment): * The Cultist: a long robe the colour of a bad bruise, a hood, a candle in

## `src/characters/cyclist.js` (1)

- L62 `tyre` (comment): // it as it turns): a black tyre round a silver rim, a hub, and spokes from the hub to the rim.

## `src/characters/drunk.js` (2)

- L3 `moustache` (code): import { moustache } from './wardrobe.js';
- L44 `moustache` (code): moustache(s, { color: '#6a4a2e', wide: 1.15, droop: 0.5 });

## `src/characters/egg.js` (5)

- L58 `colour` (comment): * Marc's speckled shell skin (skin.js), as a colour map and a bump map, with
- L68 `colour` (code): const colour = canvas(), bump = canvas();
- L69 `colour` (code): if (!colour.ctx || !bump.ctx) return { map: null, bumpMap: null };
- L70 `colour` (code): const g = colour.ctx, b = bump.ctx;
- L108 `colour` (code): const map = new GFX.CanvasTexture(colour.el);

## `src/characters/eurocrat.js` (1)

- L5 `grey` (comment): * The Eurocrat: a grey suit, a blue tie with a ring of yellow stars on it,

## `src/characters/extra.js` (1)

- L36 `grey` (comment): // The headshot, held up by the face by its edge: an eight-by-ten, a face in grey on it.

## `src/characters/fan.js` (1)

- L37 `grey` (comment): // A rock printed on the shirt: a grey lump with a crack in it.

## `src/characters/floridaman.js` (1)

- L5 `rumour` (comment): * Florida Man: a sunburn that is mostly a rumour on the front and a fact on the

## `src/characters/footballer.js` (2)

- L58 `centres` (code): const centres = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [
- L61 `centres` (code): const near = Math.max(...centres.map((q) => q[0] * u[0] + q[1] * u[1] + q[2] * u[2]));

## `src/characters/foreman.js` (3)

- L2 `moustache` (code): import { cap, moustache } from './wardrobe.js';
- L6 `moustache` (comment): * moustache, a pencil behind the ear and a clipboard, on which is written,
- L36 `moustache` (code): moustache(s, { color: '#5a5a5a', wide: 1.2, droop: 0.4 });

## `src/characters/gangster.js` (3)

- L3 `moustache` (code): import { fedora, moustache, suitFront } from './wardrobe.js';
- L7 `moustache` (comment): * a white tie, a fedora pulled down, spats, a pencil moustache, and a
- L46 `moustache` (code): moustache(s, { color: '#14100c', pencil: true });

## `src/characters/gatekeeper.js` (1)

- L7 `rumour` (comment): * The Gatekeeper: a battle vest so covered in patches the denim is a rumour,

## `src/characters/gator.js` (1)

- L8 `armoured` (comment): * armoured, near black above with faint yellow bands and pale underneath,

## `src/characters/gent.js` (3)

- L3 `moustache` (code): import { bowler, moustache, suitFront } from './wardrobe.js';
- L7 `moustache` (comment): * pinstripe, a bowler, a white shirt and the old school tie; a moustache;
- L46 `moustache` (code): moustache(s, { color: '#6a6a6a', wide: 1.15, droop: 0.4 });

## `src/characters/gondolier.js` (4)

- L3 `moustache` (code): import { moustache } from './wardrobe.js';
- L7 `moustache` (comment): * a straw boater with a red ribbon down the back, a moustache, and the long
- L17 `millimetres` (comment): // Plaited round and round: a faint ring every few millimetres.
- L57 `moustache` (code): moustache(s, { color: '#1a120c', wide: 1.35 });

## `src/characters/hand.js` (1)

- L7 `grey` (comment): * A hand up out of a grave: a grey-green forearm in a ragged cuff, the

## `src/characters/hawker.js` (3)

- L4 `moustache` (code): import { moustache } from './wardrobe.js';
- L8 `moustache` (comment): * a white turban, pointed yellow slippers, a moustache and a smile, and a
- L60 `moustache` (code): moustache(s, { color: '#141010', wide: 1.05 });

## `src/characters/hipster.js` (4)

- L2 `moustache` (code): import { glasses, moustache, satchel } from './wardrobe.js';
- L6 `moustache` (comment): * The Hipster: an orange beanie, round glasses, a waxed moustache, a maroon
- L35 `moustache` (comment): // Round glasses, thick black frames; the moustache waxed into curls.
- L37 `moustache` (code): moustache(s, { color: '#5a3a1e', wide: 1.4 });

## `src/characters/hotdog.js` (2)

- L2 `moustache` (code): import { moustache } from './wardrobe.js';
- L46 `moustache` (code): moustache(s, { color: '#2a1a10', wide: 1.2 });

## `src/characters/humanoid.dungeon-roller.js` (5)

- L5 `stylised` (comment): * What the four heroes have in common: a stylised body about 0.8 tiles
- L64 `colours` (comment): * The body, painted in its clothes: `look` gives the colours (functions or
- L136 `coloured` (comment): * A head: skull and cheeks, a nose, ears, big eyes (white, a coloured iris,
- L138 `colour` (comment): * the brows' colour; `ears` false hides them (under a hood or a helmet);
- L230 `colour` (comment): * Hair's colour (a function or hex) in strands: lighter and darker streaks

## `src/characters/humanoid.js` (1)

- L5 `stylised` (comment): * What the four heroes have in common: a stylised body about 0.8 tiles

## `src/characters/ibex.js` (2)

- L6 `Grey` (comment): * think twice about. Grey-brown, a pale belly, dark down the front of the
- L18 `grey` (comment): * The ibex's coat as it is in summer: grey-brown over the back, a dark

## `src/characters/index.js` (3)

- L92 `neighbour` (string): import neighbour from './neighbour.js';
- L92 `neighbour` (string): import neighbour from './neighbour.js';
- L206 `neighbour` (code): mrbig, mummy, neighbour, newsie, ninja, nonna, nuguy, orc, pa, pallbearer, paparazzo, parrot,

## `src/characters/makeup.js` (1)

- L61 `colour` (comment): // The palette in the left: a black case open flat, held by its edge, its pans of colour in rows.

## `src/characters/medic.js` (1)

- L41 `grey` (comment): // The reflective bands: round the chest and round each upper arm, silver-grey on yellow.

## `src/characters/metalwear.js` (8)

- L88 `colour` (comment): // The turned-up brim, in its own colour if it has one.
- L163 `colours` (comment): * in colours that were each somebody's favourite, a big one in the middle.
- L163 `favourite` (comment): * in colours that were each somebody's favourite, a big one in the middle.
- L167 `colours` (code): const colours = ['#d81c2a', '#f0c040', '#e8e4d8', '#2a2a30', '#3ae88a', '#8a4be8', '#ff7a1a', '#2ad0ff'];
- L181 `colours` (code): list.push([x, y, 0.014 + rnd() * 0.016, 0.012 + rnd() * 0.016, colours[Math.floor(rnd() * colours.length)]]);
- L181 `colours` (code): list.push([x, y, 0.014 + rnd() * 0.016, 0.012 + rnd() * 0.016, colours[Math.floor(rnd() * colours.length)]]);
- L184 `centred` (comment): // The big one, centred: a banner across the back with a dark stripe through it.
- L340 `colour` (comment): * colour, `neck` the wood's.

## `src/characters/mogul.js` (7)

- L6 `grey` (comment): * giant, bald as an egg but for a grey fringe, round tortoiseshell glasses,
- L13 `grey` (code): const grey = cloth('#4a4a54', '#26262e');
- L25 `grey` (code): look: { torso: grey, sleeve: grey, cuff: grey, legs: grey, boot: '#0c0806', sole: '#020202' },
- L25 `grey` (code): look: { torso: grey, sleeve: grey, cuff: grey, legs: grey, boot: '#0c0806', sole: '#020202' },
- L25 `grey` (code): look: { torso: grey, sleeve: grey, cuff: grey, legs: grey, boot: '#0c0806', sole: '#020202' },
- L25 `grey` (code): look: { torso: grey, sleeve: grey, cuff: grey, legs: grey, boot: '#0c0806', sole: '#020202' },
- L47 `grey` (comment): // The grey fringe round the back of a bald head, and the jowls.

## `src/characters/mosher.js` (1)

- L5 `grey` (comment): * The Mosher: a mane, a band shirt gone grey with washing, a denim vest with

## `src/characters/mouse.js` (2)

- L5 `grey` (comment): * A house mouse: Dungeon Roller's rat, made small and soft — sandy grey-brown,
- L21 `greyer` (comment): /** The coat, lighter and greyer toward each lock's tip, darker in the creases. */

## `src/characters/mummy.js` (1)

- L5 `colour` (comment): * The Mummy: wrapped head to foot in linen gone the colour of tea, the

## `src/characters/neighbour.js` (8)

- L3 `moustache` (code): import { moustache, suitFront } from './wardrobe.js';
- L6 `Neighbour` (comment): * The Angry Neighbour: a pink-faced man in a terry-cloth bathrobe and
- L7 `grey` (comment): * slippers, a grey comb-over and a mighty moustache, who has come round at
- L7 `moustache` (comment): * slippers, a grey comb-over and a mighty moustache, who has come round at
- L27 `neighbour` (string): name: 'neighbour',
- L49 `grey` (comment): // The dressing gown's shawl collar open over a bare chest and a tuft of grey hair; its belt tied in a bow.
- L53 `grey` (comment): // The comb-over: three long strands of grey laid across the bald top from a parting low over the left ear.
- L62 `moustache` (code): moustache(s, { color: '#8a8a8a', wide: 1.4 });

## `src/characters/newsie.js` (2)

- L6 `knickerbockers` (comment): * braces, knickerbockers and long socks, a canvas bag of the late edition
- L40 `knickerbockers` (comment): // Braces over the shirt, buttoned to the knickerbockers.

## `src/characters/nonna.js` (2)

- L7 `grey` (comment): * chain, a grey bun, and the wooden spoon held up and shaking at you. You
- L41 `grey` (comment): // The grey bun at the back of the head, under the headscarf.

## `src/characters/oldtimer.js` (4)

- L2 `moustache` (code): import { cap, glasses, moustache } from './wardrobe.js';
- L7 `moustache` (comment): * white moustache, a brown cardigan buttoned over a checked shirt, grey
- L7 `grey` (comment): * white moustache, a brown cardigan buttoned over a checked shirt, grey
- L48 `moustache` (code): moustache(s, { color: '#e8e8e4', wide: 1.1, droop: 0.3 });

## `src/characters/orc.js` (2)

- L6 `grey` (comment): * The orc brute: a slab of grey-green muscle, broad in the shoulder and
- L19 `Grey` (comment): /** Grey-green hide, darker on the back and shoulders, with pale old scars across the chest and one arm. */

## `src/characters/paparazzo.js` (1)

- L6 `grey` (comment): * The Paparazzo: a photographer's vest of pockets over a grey hoodie, a

## `src/characters/parrot.js` (2)

- L7 `fibreglass` (comment): * feathers glued over a fibreglass shell. Green all over with every
- L9 `grey` (comment): * ring round each orange glass eye, a grey hooked beak that opens and

## `src/characters/person.js` (44)

- L35 `colour` (comment): /** Cloth: a colour that is lighter on top and darker beneath, with a little mottling. */
- L53 `colours` (comment): // ——————————————————————————————————————————————— colours
- L70 `colour` (comment): /** A colour (hex, linear rgb, or a colour function) as linear rgb: a function is read on a surface facing up, near the crown. */
- L70 `colour` (comment): /** A colour (hex, linear rgb, or a colour function) as linear rgb: a function is read on a surface facing up, near the crown. */
- L78 `colour` (comment): /** What colour to show for `c` in a picker: '#rrggbb'. */
- L82 `Colour` (comment): * Colour for a `look` slot that was `was` and is to be `now`. A hex colour for a slot that was cloth (a function,
- L82 `colour` (comment): * Colour for a `look` slot that was `was` and is to be `now`. A hex colour for a slot that was cloth (a function,
- L83 `colour` (comment): * mottled and lighter on top) is made into cloth of that colour, so a recoloured jacket is not flatter than the
- L83 `recoloured` (comment): * mottled and lighter on top) is made into cloth of that colour, so a recoloured jacket is not flatter than the
- L94 `colours` (comment): * Skin tones, hair and eye colours to draw from for variety (`variant`, `diverse`): common ones, a little beyond.
- L95 `colours` (comment): * Hex colours; hair is the colour in the light.
- L95 `colour` (comment): * Hex colours; hair is the colour in the light.
- L121 `colour` (comment): /** The parts of a `look` that are a colour (the rest of it says how: `boots` how high, `shorts`, `flare`, `skirt`). */
- L127 `colours` (comment): * dressed in other colours. `recolor` is what is to be changed in what the person's `extras` and hair make, which is
- L128 `colour` (comment): * made by code of its own: { hair, swaps }, `swaps` a Map from a colour (a normalised hex, or the very function or
- L128 `normalised` (comment): * made by code of its own: { hair, swaps }, `swaps` a Map from a colour (a normalised hex, or the very function or
- L148 `colour` (comment): // Only what they wear: skin is `skin`, and a part that is bare skin has no colour of its own.
- L153 `colour` (comment): // Bare arms and legs drawn in a colour of their own (the skin's, as a hex) go with the skin.
- L161 `colour` (comment): // What `extras` makes in the very colour of a garment is dyed with it, if everything of that colour is: a coat's
- L161 `colour` (comment): // What `extras` makes in the very colour of a garment is dyed with it, if everything of that colour is: a coat's
- L172 `colour` (comment): // What was drawn in the colour this one replaced (itself a swap's) follows to the new one.
- L186 `colour` (comment): /** The colour a `recolor` gives a shape of colour `color` and material `mat`: its swap, or hair's new colour if it is hair. */
- L186 `colour` (comment): /** The colour a `recolor` gives a shape of colour `color` and material `mat`: its swap, or hair's new colour if it is hair. */
- L186 `colour` (comment): /** The colour a `recolor` gives a shape of colour `color` and material `mat`: its swap, or hair's new colour if it is hair. */
- L200 `colour` (comment): * colour or a colour function), and `boots` or `shin` for the calf (see
- L200 `colour` (comment): * colour or a colour function), and `boots` or `shin` for the calf (see
- L217 `colour` (comment): // A variant's new skin on the bare parts that had a colour of their own.
- L261 `recolouring` (comment): // A variant's recolouring: what the hair and `extras` make in a colour that is to change comes out in its new one.
- L261 `colour` (comment): // A variant's recolouring: what the hair and `extras` make in a colour that is to change comes out in its new one.
- L283 `colours` (comment): * The same person in other colours, as a definition of its own to hand to `createModel` (and baked on its own);
- L284 `colour` (comment): * nothing about them but colour changes, and nothing is changed that is not given. Asked twice for the same
- L285 `colours` (comment): * colours it is the same definition.
- L286 `colour` (comment): * - `skin`: their skin, a hex colour.
- L287 `moustache` (comment): * - `hair`: their hair, and whatever else of theirs is hair (beard, moustache, a mohican); their brows follow,
- L289 `colour` (comment): * - `eyes`, `brow`: the colour of their irises, and of their brows.
- L292 `colour` (comment): *   colour is given a new one, whatever else of theirs is that colour (a coat's skirts) goes with them.
- L292 `colour` (comment): *   colour is given a new one, whatever else of theirs is that colour (a coat's skirts) goes with them.
- L293 `colour` (comment): * - `colors`: any other colour, such as a hat's, `{ '#1e2a4e': '#7a1020' }`: every shape the person is made of
- L294 `colour` (comment): *   in the colour on the left is drawn in the one on the right (a Map also takes a colour function or array
- L294 `colour` (comment): *   in the colour on the left is drawn in the one on the right (a Map also takes a colour function or array
- L300 `colours` (comment): // Asked twice for the same colours, the same definition (so it is baked once); not if a colour is a function.
- L300 `colour` (comment): // Asked twice for the same colours, the same definition (so it is baked once); not if a colour is a function.
- L309 `colours` (comment): * What can be changed in them, and what it is now (hex colours): `skin`, `eyes`, `brow`, `hair` (null if they
- L311 `colour` (comment): * colour, which are best changed together.

## `src/characters/phone.js` (1)

- L5 `grey` (comment): * Phone Guy: a grey hoodie, jeans, a cap on backwards, and one arm straight

## `src/characters/pigeon.js` (3)

- L7 `grey` (comment): * and blue-grey, a small round head, the neck shot through with green and
- L20 `colour` (comment): // The head darker, the neck and the top of the breast shot with colour, the rest blue-grey.
- L20 `grey` (comment): // The head darker, the neck and the top of the breast shot with colour, the rest blue-grey.

## `src/characters/pizzaiolo.js` (3)

- L2 `moustache` (code): import { moustache } from './wardrobe.js';
- L7 `moustache` (comment): * neckerchief, flour to the elbows, a moustache, the sleeves rolled
- L45 `moustache` (code): moustache(s, { color: '#1a120a', wide: 1.4 });

## `src/characters/purist.js` (1)

- L8 `favourites` (comment): * you which of your favourites are not metal, which is all of them, and

## `src/characters/quadruped.js` (5)

- L104 `colour` (comment): // Inside the ears: their own colour, gone pink.
- L112 `colour` (comment): // it, so no colour is flat.
- L250 `colour` (comment): // The hollow inside, toward the front, and the colour in it.
- L358 `colour` (comment): /** An eye's colour: dark at the rim, the iris lighter toward a pupil that is round or a sideways bar. */
- L380 `colour` (comment): * has them. Its own mesh, its own colour.

## `src/characters/rat.js` (1)

- L20 `greyer` (comment): /** The coat, lighter and greyer toward each lock's tip, darker in the creases. */

## `src/characters/raver.js` (1)

- L5 `colour` (comment): * nothing under it, baggy trousers the colour of a highlighter, trainers

## `src/characters/reveler.js` (1)

- L66 `colour` (comment): // White all over the mask: none of the face's colour under it shows through.

## `src/characters/roadie.js` (1)

- L38 `aluminium` (comment): // The flight case on the right shoulder, clear of the head, the long way back to front: black, its aluminium

## `src/characters/santa.js` (3)

- L2 `moustache` (code): import { beard, moustache } from './wardrobe.js';
- L99 `moustache` (comment): // The beard to the belt, its edge low on the cheeks so they show rosy, and a bushy moustache over the mouth.
- L101 `moustache` (code): moustache(s, { color: '#f6f6f8', wide: 1.2, droop: 0.5 });

## `src/characters/scalper.js` (1)

- L42 `coloured` (comment): // The tickets: a fan of coloured slips out of the top of the fist, held out to you.

## `src/characters/shopper.js` (1)

- L13 `centimetres` (comment): // Quilted: a seam every few centimetres up the body and the sleeves, each band puffed between.

## `src/characters/slime.js` (3)

- L7 `colour` (comment): * each slime one colour from the orb's palette instead of drifting through
- L83 `coloured` (comment): * A slime `size` tiles across (its radius about half that), coloured from
- L209 `colour` (comment): // Its colour: near its own, drifting a little.

## `src/characters/stoner.js` (1)

- L6 `colour` (comment): * The Stoner: a hooded top the colour of a swamp, a beanie, jeans with the

## `src/characters/troll.js` (1)

- L6 `grey` (comment): * vegetable, a lumpy brow, hair in grey rags, a rag of sheepskin round

## `src/characters/turkey.js` (2)

- L72 `centre` (comment): * `edge` is how far the point is from the centre of the feather covering it,
- L179 `neighbour` (comment): * each side where it overlaps its neighbour, so every feather reads on its own.

## `src/characters/waiter.js` (3)

- L2 `moustache` (code): import { moustache, suitFront } from './wardrobe.js';
- L7 `moustache` (comment): * shins, a thin moustache and his hair slicked back, the tray held high on
- L44 `moustache` (code): moustache(s, { color: '#14100c', pencil: true });

## `src/characters/wardrobe.js` (3)

- L15 `moustache` (comment): /** Hair's color in strands running along x (a moustache) or down (a beard): lighter and darker hairs. */
- L267 `moustache` (comment): * A moustache over the upper lip, following it: full in the middle under
- L272 `moustache` (code): export function moustache(s, { color = '#2a1a10', wide = 1, pencil = false, droop = 0 } = {}) {

## `src/characters/wizard.js` (1)

- L7 `colour` (comment): * a robe the colour of a bruise with stars on it, a staff with a glowing

## `src/characters/wolf.js` (10)

- L6 `grey` (comment): * The Wolf: out of the spruce at the edge of the car park, grey and
- L13 `GREY` (code): const GREY = rgb('#686a70'), SILVER = rgb('#a4a4a2'), CREAM = rgb('#ece6da'), BLACK = rgb('#26262a'), TAWNY = rgb('#a08060');
- L16 `grey` (comment): * The wolf's coat, as a wolf's is: agouti grey, each hair banded, so it
- L24 `grey` (comment): // Agouti: a soft variation of grey and silver over the coat, and a fine fleck too small to be more than a grain.
- L26 `GREY` (code): let c = mix(GREY, SILVER, smooth(0.3, 0.75, tone)).map((v) => v * (0.94 + 0.12 * fleck));
- L30 `GREY` (code): c = mix(c, mix(BLACK, GREY, 0.3), Math.min(1, saddle * 1.25));
- L39 `GREY` (code): c = mix(c, mix(GREY, BLACK, 0.55), bridge * 0.8);
- L45 `grey` (comment): /** The brush: grey, dark along the top, the tip black. */
- L47 `GREY` (code): let c = mix(GREY, SILVER, smooth(0.3, 0.75, fbm(p[0] * 24, p[1] * 24, p[2] * 24, 3)));
- L51 `GREY` (code): const EARS = (p, n) => mix(mix(GREY, TAWNY, 0.45), BLACK, smooth(0.0, -0.8, n[2]) * 0.35);

## `src/characters/yeti.js` (1)

- L7 `grey` (comment): * flat feet bare and blue-grey, two fangs over the lip, a woolly scarf it

## `src/characters/yodeler.js` (4)

- L2 `moustache` (code): import { moustache, sunHat } from './wardrobe.js';
- L7 `grey` (comment): * sleeves rolled up, grey socks to the knee, a green felt hat with a
- L8 `moustache` (comment): * feather in it and a pin, a big moustache, and a voice the next valley
- L43 `moustache` (code): moustache(s, { color: '#a8804a', wide: 1.5 });

## `src/characters/zinekid.js` (1)

- L39 `grey` (comment): // The stack of zines held out: photocopied sheets, stapled, the top copy's cover a black block on grey.

## `src/characters/zombie.js` (2)

- L5 `Grey` (comment): * The Zombie: up out of the swamp for the death-metal vocals. Grey-green skin, dark round the
- L46 `grey` (comment): // The shirt torn open at the side and the trousers through at the knees, his grey skin showing, frayed.

## `src/color.js` (1)

- L1 `colours` (comment): /** sRGB hex to linear RGB — vertex colours are linear. */

## `src/effects.js` (4)

- L17 `colours` (comment): /** Confetti and streamers: a party's colours. */
- L28 `colour` (comment): * petals): colour, how see-through, which way and how fast it goes
- L219 `colour` (code): ring(x, y, z, { colour = '#ffffff', reach = 2, life = 0.5 } = {}) {
- L222 `colour` (code): new GFX.MeshBasicMaterial({ name: 'ring', color: new GFX.Color(colour), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, blendin

## `src/film.js` (1)

- L17 `grey` (comment): /** The grain: fractal noise, grey, on a tile 180 pixels square. */

## `src/flora.js` (1)

- L214 `coloured` (comment): * coloured `col` (darker inside the crown and under it).

## `src/gfx/controls.js` (4)

- L264 `touchCentre` (code): _touchCentre(event) {
- L317 `touchCentre` (code): if (this.enablePan) this._panStart.set(...this._touchCentre(event));
- L329 `touchCentre` (code): this._handleMoveRotate(...this._touchCentre(event));
- L334 `touchCentre` (code): if (this.enablePan) this._handleMovePan(...this._touchCentre(event));

## `src/gfx/core.js` (8)

- L323 `metres` (comment): * Exponential fog: what is `d` metres from the camera is `1 - exp(-density * d)` of the way to `color`. A density of 0.02 is a
- L324 `metres` (comment): * haze that hides the far hills, 0.1 a fog that closes in at about thirty metres. Lit (standard and physical) materials take it;
- L664 `colour` (comment): * the size, its colour multiplied by `tint` — but the vertices stay on the
- L736 `centre` (comment): // The geometry's own sphere, set off from its origin, turns with each copy: as far as its centre is out, plus its radius.
- L1146 `colour` (comment): // Where it glows: the emissive colour times this texture, laid as the colour map is (it needs the map): lit windows, a sign's letters.
- L1146 `colour` (comment): // Where it glows: the emissive colour times this texture, laid as the colour map is (it needs the map): lit windows, a sign's letters.
- L1179 `colour` (comment): // Light scattered under the surface (skin, wax): how much, and how far each colour is carried round the form.
- L1251 `colour` (comment): * Whatever comes out is written as it is: no colour-space conversion, as

## `src/gfx/math.js` (4)

- L2 `colour` (comment): * Vectors, matrices, rotations, colour and bounds.
- L944 `Colour` (comment): * Colour, held linear. Hex and CSS inputs are sRGB and are decoded on the way
- L946 `colours` (comment): * is what the scenes that paint vertex colours in HSL were tuned against.
- L1021 `colour` (string): throw new Error(`gfx: unsupported colour ${style}`);

## `src/gfx/pmrem.js` (1)

- L32 `neighbouring` (comment): * the bilinear lookup reads is baked from the neighbouring faces.

## `src/gfx/renderer.js` (5)

- L185 `grey` (comment): // is behind a transmissive surface, that grey is what it refracts.
- L269 `colours` (comment): /** Intensities folded into colours; view-space directions are done per pass. */
- L497 `colour` (comment): // the repeat does not show as a grid, and the colour drifts a little across the whole.
- L499 `colour` (comment): // Skin and the like: a detail map over the colour map's layout (it needs both the map and the bump), and light scattered under the surface.
- L501 `colour` (comment): // Where it glows, over the colour map's layout (lit windows on a facade, the letters of a sign).

## `src/gfx/shaders/glsl/basic.frag.glsl.js` (2)

- L1 `colour` (code): export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.
- L1 `colours` (code): export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.

## `src/gfx/shaders/glsl/basic.vert.glsl.js` (2)

- L1 `colour` (code): export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.
- L1 `colours` (code): export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.

## `src/gfx/shaders/glsl/sprite.frag.glsl.js` (1)

- L1 `colour` (code): export default `// A billboard: the colour, times the map.

## `src/gfx/shaders/glsl/standard.frag.glsl.js` (6)

- L92 `colour` (comment): // Light carried under the surface past where it falls: each colour wrapped round the form as far as
- L113 `colour` (comment): // The detail map, on the colour map's layout: how much of the fine bump shows here (b), and a
- L193 `coloured` (comment): // coloured by it and broader, toward the tip. Both run across the strands, not along them, as hair's do.
- L214 `colour` (comment): // Each repeat of the map (a window) by its own chance; the vertex colour (a building's tint) shuffles them.
- L280 `neighbours` (comment): // Each strand's highlight a little off its neighbours', by its own shade in the texture.
- L282 `colour` (comment): // The second highlight has been through the strand: it is the hair's own colour, as bright as the hair is.

## `src/gfx/shaders/wgsl/basic.wgsl.js` (2)

- L1 `colour` (code): export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.
- L1 `colours` (code): export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.

## `src/gfx/shaders/wgsl/chunks/bump.wgsl.js` (1)

- L18 `colour` (comment): // The detail map, on the colour map's layout: how much of the fine bump shows here (b), and a

## `src/gfx/shaders/wgsl/mipmap.wgsl.js` (1)

- L1 `centre` (code): export default `// One mip level from the one above: a bilinear tap at the centre of each 2×2 block.

## `src/gfx/shaders/wgsl/standard.wgsl.js` (5)

- L119 `colour` (comment): // Light carried under the surface past where it falls: each colour wrapped round the form as far as
- L156 `coloured` (comment): // coloured by it and broader, toward the tip. Both run across the strands, not along them, as hair's do.
- L180 `colour` (comment): // Each repeat of the map (a window) by its own chance; the vertex colour (a building's tint) shuffles them.
- L256 `neighbours` (comment): // Each strand's highlight a little off its neighbours', by its own shade in the texture.
- L258 `colour` (comment): // The second highlight has been through the strand: it is the hair's own colour, as bright as the hair is.

## `src/gfx/webgpu.js` (1)

- L678 `grey` (comment): // with a plain grey texel in its place, rather than the whole loop stopping on one texture.

## `src/heroes/alan/gaze.js` (2)

- L4 `behaviour` (comment): * viewer — so every behaviour can be written without knowing where the camera
- L34 `centre` (comment): * centre), and the eye looks at that point — near enough that the pointer at

## `src/heroes/alan/iris.js` (11)

- L4 `fibres` (comment): * a dark limbal band. Radial fibres and a few crypts keep it from reading as
- L5 `colour` (comment): * a flat disc of colour. The pupil is its own mesh, so the centre is left a
- L5 `centre` (comment): * a flat disc of colour. The pupil is its own mesh, so the centre is left a
- L15 `centre` (code): centre: '#0b1f3d',
- L28 `centre` (code): base.addColorStop(0, IRIS.centre);
- L29 `centre` (code): base.addColorStop(RINGS.pupil, IRIS.centre);
- L38 `Fibres` (comment): // Fibres: thin spokes from the collarette out, some pale, some dark.
- L39 `fibres` (code): const fibres = 420;
- L41 `fibres` (code): for (let i = 0; i < fibres; i++) {
- L42 `fibres` (code): const a = (i / fibres) * Math.PI * 2 + random() * 0.02;
- L60 `fibres` (comment): // The collarette: a ragged pale ring where the fibres gather.

## `src/heroes/alan/model.js` (4)

- L2 `skyColour` (code): import { createSkyTexture, skyColour } from '../../textures/skies/cloudsea.js';
- L4 `metres` (comment): /** The eye, in metres of nothing in particular: the stage frames whatever size it is. */
- L12 `millimetres` (comment): * iris is a few millimetres behind the cornea; this one is set back far enough
- L106 `skyColour` (code): const [r, g, b] = skyColour(Math.asin(up)).map(Math.round);

## `src/heroes/alan/moods.js` (1)

- L17 `fibres` (comment): /** The brightest the iris gets: past this the painted fibres wash out to a flat blue. */

## `src/heroes/debater-egg/mist.js` (2)

- L7 `centre` (comment): * while a restrained warm-yellow third tone sits through its centre.
- L17 `centre` (comment): // centre of the egg rather than forming a yellow equatorial band.

## `src/heroes/debater-egg/skin.js` (4)

- L17 `colour` (code): const colour = canvas2d(width, height);
- L19 `colour` (code): if (!colour || !bump) return INERT;
- L21 `colour` (code): const g = colour.ctx;
- L47 `colour` (code): const map = new GFX.CanvasTexture(colour.el);

## `src/heroes/krystal/environment.js` (1)

- L17 `colour` (comment): * itself is `index.js`'s — it changes colour with the mist.

## `src/heroes/krystal/index.js` (6)

- L5 `paletteColour` (code): import { paletteColour } from './vision.js';
- L64 `colours` (comment): * which colours it runs to.
- L131 `colour` (comment): // The palette breathes a little on its own, so even an idle ball is never one colour for long.
- L145 `colour` (comment): // What the visions throw on the brass and the cloth: the colour at the heart of them.
- L146 `paletteColour` (code): const [r, g, b] = paletteColour(hue + 0.5);
- L248 `colours` (comment): /** The cards have come up: the glass flares, and the colours wheel round. */

## `src/heroes/krystal/model.js` (6)

- L1 `cosmosColour` (code): import { cosmosColour, createCosmosTexture } from '../../textures/skies/cosmos.js';
- L4 `metres` (comment): /** The ball, in metres of nothing in particular: the stage frames whatever size it is. */
- L14 `centre` (comment): * The stand's outline, turned about the upright, in radii from the centre of
- L28 `centre` (comment): /** Where the stand meets the table, in radii below the centre of the ball. */
- L42 `centred` (comment): * The crystal ball on its stand, centred on the ball.
- L184 `cosmosColour` (code): const [r, g, b] = cosmosColour(Math.asin(up)).map(Math.round);

## `src/heroes/krystal/moods.js` (1)

- L5 `colours` (comment): * of the ball, and `hue` where on the palette the colours sit — 0 rose, 0.15

## `src/heroes/krystal/vision.js` (3)

- L2 `coloured` (comment): * The visions: coloured mist swirling inside the glass, drawn by marching a
- L7 `Colour` (comment): * what makes the wisps curl and split rather than just rotate. Colour comes
- L263 `paletteColour` (code): export function paletteColour(t) {

## `src/heroes/marble.js` (4)

- L74 `colours` (code): const positions = [], normals = [], colours = [];
- L82 `colours` (code): colours.push(c.r, c.g, c.b);
- L100 `colours` (code): out.setAttribute('color', new GFX.BufferAttribute(new Float32Array(colours), 3));
- L105 `centred` (comment): * The marble as a group, centred on its middle: `spin` is the part that

## `src/heroes/morningstar.js` (3)

- L9 `colour` (comment): * picks up every colour of the rig), gunmetal where it doesn't, the spikes
- L136 `tipColour` (code): const tipColour = new GFX.Color('#ffffff');
- L159 `tipColour` (code): c.copy(root).lerp(tipColour, height);

## `src/heroes/rock-granite.js` (21)

- L5 `colour` (comment): * vertex colour: a painted colour map of feldspar, quartz and mica in crisp
- L5 `colour` (comment): * vertex colour: a painted colour map of feldspar, quartz and mica in crisp
- L8 `colour` (comment): * `createGraniteRock(GFX, { colour })` gives the same handle as `createRock`;
- L10 `colours` (comment): * colours are the GRANITES below, by name (GRANITE_CHOICES).
- L19 `colourways` (comment): * The colourways: a ground, a pale feldspar and a glassy quartz (sRGB, 0 to 1),
- L23 `grey` (code): grey: { ground: [0.54, 0.51, 0.47], feldspar: [0.84, 0.8, 0.74], quartz: [0.92, 0.92, 0.9], mica: 0.8 },
- L42 `colourway` (comment): * The granite's maps for one colourway: its colour map, painted once per
- L42 `colour` (comment): * The granite's maps for one colourway: its colour map, painted once per
- L43 `colourway` (comment): * renderer and colourway, and the bump map they share, on which the grains
- L44 `colours` (comment): * stand proud. Under node there is no canvas, and the vertex colours carry the
- L148 `colour` (comment): /** The granite stone alone: `heroes/rock`'s shape, finely sampled, with its own surface in the colour asked for. */
- L149 `colour` (string): export function createGraniteBoulder(GFX, { detail = GRANITE_DETAIL, colour = 'grey' } = {}) {
- L149 `grey` (string): export function createGraniteBoulder(GFX, { detail = GRANITE_DETAIL, colour = 'grey' } = {}) {
- L150 `colour` (string): if (!(colour in GRANITES)) throw new Error(`rock-granite: no granite called ${colour}; there is ${GRANITE_CHOICES.join(', ')}`);
- L150 `colour` (string): if (!(colour in GRANITES)) throw new Error(`rock-granite: no granite called ${colour}; there is ${GRANITE_CHOICES.join(', ')}`);
- L153 `colour` (code): const { map, bump } = granite(GFX, colour);
- L171 `colour` (comment): /** Rock in granite: `createRock`, with the granite stone in the colour asked for (`grey` by default). */
- L171 `grey` (comment): /** Rock in granite: `createRock`, with the granite stone in the colour asked for (`grey` by default). */
- L172 `colour` (string): export function createGraniteRock(GFX, { colour = 'grey', ...opts } = {}) {
- L172 `grey` (string): export function createGraniteRock(GFX, { colour = 'grey', ...opts } = {}) {
- L173 `colour` (code): return createRock(GFX, { ...opts, boulder: (G) => createGraniteBoulder(G, { colour }) });

## `src/heroes/rock-jewel.js` (24)

- L11 `colour` (comment): * `createJewelRock(GFX, { colour })` gives the same handle as `createRock`, so
- L50 `colour` (comment): /** The color `colour` names, or `color` as given; a bad hex is refused. */
- L51 `colour` (code): export function jewelHex(colour = 'sapphire', color = null) {
- L56 `colour` (string): if (!Object.hasOwn(JEWELS, colour)) throw new Error(`rock-jewel: no jewel called ${colour}; there is ${JEWEL_CHOICES.join(', ')}`);
- L56 `colour` (string): if (!Object.hasOwn(JEWELS, colour)) throw new Error(`rock-jewel: no jewel called ${colour}; there is ${JEWEL_CHOICES.join(', ')}`);
- L57 `colour` (code): return JEWELS[colour];
- L93 `inclusionColours` (code): function inclusionColours(fields, hex) {
- L97 `colours` (code): const colours = new Float32Array(n * 3);
- L107 `colours` (code): colours[3 * i + c] = clamp01(x * k);
- L110 `colours` (code): return colours;
- L147 `setColour` (comment): * The jewel stone alone: `{ mesh, geometry, material, glass, mist, setColour, setMist }`. `mesh` is a group of the glass
- L150 `colour` (code): export function createJewelBoulder(GFX, { colour = 'sapphire', color = null, mist = true, detail = GRANITE_DETAIL, size = 1 } = {}) {
- L151 `colour` (code): let hex = jewelHex(colour, color);
- L156 `inclusionColours` (code): geometry.setAttribute('color', new GFX.BufferAttribute(inclusionColours(fields, hex), 3));
- L230 `colour` (code): get colour() { return hex; },
- L232 `setColour` (code): setColour(name, color = null) {
- L236 `inclusionColours` (code): geometry.setAttribute('color', new GFX.BufferAttribute(inclusionColours(fields, hex), 3));
- L247 `colour` (comment): /** A jewel rock: `createRock`, with the jewel stone in the color asked for and its mist. `colour` is a `JEWELS` name. */
- L248 `colour` (code): export function createJewelRock(GFX, { colour = 'sapphire', color = null, mist = true, radius = 0.45, ...opts } = {}) {
- L253 `colour` (code): boulder: (G) => (asset = createJewelBoulder(G, { colour, color, mist, size: radius / SOURCE_RADIUS })),
- L256 `colour` (string): Object.defineProperty(rock, 'colour', { get: () => asset.colour, enumerable: true });
- L256 `colour` (string): Object.defineProperty(rock, 'colour', { get: () => asset.colour, enumerable: true });
- L257 `setColour` (code): rock.setColour = (name, hex = null) => { asset.setColour(name, hex); return rock; };
- L257 `setColour` (code): rock.setColour = (name, hex = null) => { asset.setColour(name, hex); return rock; };

## `src/heroes/rock.js` (1)

- L4 `colours` (comment): * granite, the same shape, the same colours and material, only sampled more

## `src/heroes/tater/tuber.js` (1)

- L45 `colour` (comment): // colour rides on the vertices instead.

## `src/heroes/vibey/geometry.js` (1)

- L27 `normalised` (comment): /** The blurred profile, sampled once and normalised so the tips reach 1. */

## `src/heroes/vibey/index.js` (2)

- L336 `centre` (comment): * Fit and centre in one pass each: place the camera, project the corners,
- L372 `centre` (comment): // Walk the focus by however far off centre the silhouette came out, in

## `src/heroes/vibey/moods.js` (1)

- L56 `colour` (comment): /** Where the colour goes when the call is broken. */

## `src/heroes/yarn/ball.js` (46)

- L3 `metre` (comment): /** As the tube in `model.js`: sides round it, and ply phase per metre over the texture's tile. */
- L5 `METRE` (code): const UV_PER_METRE = (3 / 0.03) / 4;
- L21 `metres` (comment): * The ball is in metres, as Carol is; `root` is scaled to the house.
- L24 `Metres` (comment): /** Metres to a tile of the house. */
- L25 `METRES` (code): export const TILE_METRES = 0.3;
- L27 `metres` (comment): /** The longest the strand pays out before it snaps, whatever holds it, in metres. */
- L30 `metres` (comment): /** Further than this in one step (metres) and the ball didn't roll there: it fell, or was put there. */
- L65 `METRES` (code): root.scale.setScalar(1 / TILE_METRES);
- L113 `METRE` (code): uv[2 * v] = A[i] * UV_PER_METRE;
- L144 `metres` (comment): // floor path it has paid out along since it was caught, in metres.
- L179 `metres` (comment): /** The radius the ball rides on with the bit at `a` at the contact, in metres (to its middle). */
- L256 `METRES` (code): group.scale.setScalar(1 / TILE_METRES);
- L260 `METRES` (code): for (let i = 0; i < path.length; i += 40) along.push([path[i][0] / TILE_METRES, path[i][2] / TILE_METRES]);
- L260 `METRES` (code): for (let i = 0; i < path.length; i += 40) along.push([path[i][0] / TILE_METRES, path[i][2] / TILE_METRES]);
- L261 `metres` (code): return { group, metres: s, at: [tip[0] / TILE_METRES, tip[1] / TILE_METRES, tip[2] / TILE_METRES], along };
- L261 `METRES` (code): return { group, metres: s, at: [tip[0] / TILE_METRES, tip[1] / TILE_METRES, tip[2] / TILE_METRES], along };
- L261 `METRES` (code): return { group, metres: s, at: [tip[0] / TILE_METRES, tip[1] / TILE_METRES, tip[2] / TILE_METRES], along };
- L261 `METRES` (code): return { group, metres: s, at: [tip[0] / TILE_METRES, tip[1] / TILE_METRES, tip[2] / TILE_METRES], along };
- L271 `METRES` (code): const out = { radius: riding(end) / TILE_METRES, snapped: null, rewound: false, piece: null };
- L275 `metres` (comment): /** Yarn on the ball, in metres; what has paid out still counts until it snaps. */
- L276 `metres` (code): get metres() { return end; },
- L287 `metres` (comment): * metres pay out before it snaps, letGo: whether it lets the strand wind
- L295 `METRES` (code): path.push([b.x * TILE_METRES, (f ?? b.y - b.r) * TILE_METRES, b.z * TILE_METRES]);
- L295 `METRES` (code): path.push([b.x * TILE_METRES, (f ?? b.y - b.r) * TILE_METRES, b.z * TILE_METRES]);
- L295 `METRES` (code): path.push([b.x * TILE_METRES, (f ?? b.y - b.r) * TILE_METRES, b.z * TILE_METRES]);
- L311 `metres` (comment): * snapped (metres lost, or null), piece (what was left on the floor),
- L319 `METRES` (code): const x = b.x * TILE_METRES, z = b.z * TILE_METRES;
- L319 `METRES` (code): const x = b.x * TILE_METRES, z = b.z * TILE_METRES;
- L321 `METRES` (code): const y = (f ?? b.y - b.r) * TILE_METRES;
- L332 `METRES` (code): out.radius = riding(end) / TILE_METRES;
- L367 `METRES` (code): out.radius = riding(holder ? end - paidOut() : end) / TILE_METRES;
- L392 `METRES` (code): ball.position.set(b.x * TILE_METRES, b.y * TILE_METRES, b.z * TILE_METRES);
- L392 `METRES` (code): ball.position.set(b.x * TILE_METRES, b.y * TILE_METRES, b.z * TILE_METRES);
- L392 `METRES` (code): ball.position.set(b.x * TILE_METRES, b.y * TILE_METRES, b.z * TILE_METRES);
- L399 `METRES` (code): contact.position.set(b.x * TILE_METRES, ground * TILE_METRES + 0.0006, b.z * TILE_METRES);
- L399 `METRES` (code): contact.position.set(b.x * TILE_METRES, ground * TILE_METRES + 0.0006, b.z * TILE_METRES);
- L399 `METRES` (code): contact.position.set(b.x * TILE_METRES, ground * TILE_METRES + 0.0006, b.z * TILE_METRES);
- L401 `METRES` (code): contact.scale.setScalar(b.r * TILE_METRES * 1.9);
- L413 `METRES` (code): out.radius = riding(end) / TILE_METRES;
- L417 `metres` (comment): /** Winds `metres` more on (a skein found), up to a whole ball; how much went on. */
- L418 `metres` (code): windOn(metres) {
- L421 `metres` (code): end = Math.min(TOTAL, end + metres);
- L422 `METRES` (code): out.radius = riding(end) / TILE_METRES;
- L427 `metres` (code): set(metres) {
- L429 `metres` (code): end = clamp(metres, STEP * 8, TOTAL);
- L430 `METRES` (code): out.radius = riding(end) / TILE_METRES;

## `src/heroes/yarn/model.js` (11)

- L12 `centimetres` (comment): /** Three plies, one full twist every three centimetres. */
- L15 `metre` (comment): /** Ply phase per metre along the strand. */
- L28 `fibres` (comment): /** A small, stable hash: the fibres in the plies. */
- L39 `fibres` (comment): * the fibres in each ply are each a shade off — and green is its height, for
- L52 `fibres` (comment): // Eleven fibres to a ply, and six runs of them to a tile along the strand.
- L53 `fibre` (code): const fibre = hash(Math.floor(phase * 11), Math.floor(u * 6));
- L54 `fibre` (code): const shade = (0.66 + 0.34 * bulge) * (0.82 + 0.3 * fibre);
- L63 `fibre` (comment): /** The ply heights: the round of each ply, with a little fibre roughness on top. */
- L73 `fibre` (code): const fibre = hash(Math.floor(phase * 11), Math.floor(u * 6));
- L74 `fibre` (code): const h = 0.85 * bulge + 0.15 * fibre;
- L150 `metres` (comment): * which rolls; `pose(s)` puts her `s` metres along the route and returns the

## `src/heroes/yarn/path.js` (3)

- L5 `metres` (comment): * it nears its end. Positions are in the floor plane (x, z), in metres.
- L22 `metres` (comment): /** Floor samples every this many metres along the route; positions between are interpolated. */
- L72 `metres` (comment): * `floorAt(x)` is the floor position `x` metres along it — negative `x` is

## `src/heroes/yarn/winding.js` (5)

- L8 `metres` (comment): /** Yarn radius, in metres: six millimetre wool. */
- L8 `millimetre` (comment): /** Yarn radius, in metres: six millimetre wool. */
- L65 `centre` (comment): * (unit directions from the centre), `P` (positions), `cum` (arc length to
- L73 `centred` (comment): /** rc < 0: the radius a strand centred on u must sit at to rest on the surface.
- L74 `centred` (comment): *  rc ≥ 0: lay a strand centred at radius rc (raises the surface under it). */

## `src/kit.js` (21)

- L5 `colour` (comment): * each with a colour. A kit gathers them, already placed, into one
- L6 `coloured` (comment): * vertex-coloured geometry per finish (matte, shiny, glowing), so a whole
- L27 `centred` (comment): /** Add `geometry` (unit-sized, centred) scaled to `size`, turned by `rot` ([x, y, z] radians), at `at`. */
- L28 `colour` (code): function add(geometry, at, size, rot, colour, finish) {
- L35 `colour` (code): const c = linearRGB(colour);
- L46 `centred` (comment): /** A box centred on `at`, `size` across. */
- L47 `colour` (code): box(at, size, colour, { rot = [0, 0, 0], finish = 'matte' } = {}) {
- L48 `colour` (code): add(cached('box', () => new GFX.BoxGeometry(1, 1, 1)), at, size, rot, colour, finish);
- L52 `colour` (code): slab(x0, y0, z0, x1, y1, z1, colour, opts) {
- L53 `colour` (code): return kit.box([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], colour, opts);
- L55 `centred` (comment): /** An upright cylinder centred on `at`, radius `r` (or [top, bottom]) and `h` tall; `rot` lays it down. */
- L56 `colour` (code): cyl(at, r, h, colour, { rot = [0, 0, 0], finish = 'matte', segments = 16, open = false } = {}) {
- L59 `colour` (code): add(cached(`cyl${segments}${rt / k}${open}`, () => new GFX.CylinderGeometry(rt / k, 1, 1, segments, 1, open)), at, [k, h, k], rot, colour, finish);
- L62 `colour` (code): cone(at, r, h, colour, { rot = [0, 0, 0], finish = 'matte', segments = 16 } = {}) {
- L63 `colour` (code): add(cached(`cone${segments}`, () => new GFX.ConeGeometry(1, 1, segments)), at, [r, h, r], rot, colour, finish);
- L66 `colour` (code): sphere(at, r, colour, { finish = 'matte', scale = [1, 1, 1], rot = [0, 0, 0], segments = 16 } = {}) {
- L67 `colour` (code): add(cached(`sphere${segments}`, () => new GFX.SphereGeometry(1, segments, Math.max(10, Math.round(segments * 0.6)))), at, [r * scale[0], r * scale[1],
- L70 `colour` (code): torus(at, r, tube, colour, { rot = [0, 0, 0], finish = 'matte', segments = 20 } = {}) {
- L71 `colour` (code): add(cached(`torus${tube / r}:${segments}`, () => new GFX.TorusGeometry(1, tube / r, 8, segments)), at, [r, r, r], rot, colour, finish);
- L75 `colour` (code): beam(a, b, t, colour, opts = {}) {
- L82 `colour` (code): return kit.cyl([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], t, len, colour, { ...opts, rot: [e.x, e.y, e.z], segments: opts.segments ?? 

## `src/mesher.js` (10)

- L7 `colour` (comment): * normal, uv, colour) per material, which is stamped into a chunk's buffers
- L29 `colour` (comment): /** A colour as the linear RGB the vertex colours are in, from a hex string or an [r, g, b] already linear. */
- L29 `colours` (comment): /** A colour as the linear RGB the vertex colours are in, from a hex string or an [r, g, b] already linear. */
- L104 `colour` (comment): * `shade` (a brightness to multiply the colour by).
- L158 `neighbours` (comment): // tile lines up with its neighbours whatever order its corners come in.
- L359 `coloured` (comment): * the side it faces, so the grain runs on across the triangles. It is coloured
- L363 `colour` (comment): * the same size; `o.colorFn(dir, lump, grain, y)` may return a colour for a
- L442 `colours` (comment): * how deep), shaded smooth, lit from above in its vertex colours: pale on top
- L444 `colours` (comment): * or darker. `col` is near-white where a material colours the leaves.
- L602 `colours` (comment): /** Stamps a part of a template here: moved to (x, y, z), turned by `yaw` and made `scale` times the size, its colours multiplied by `tint`. */

## `src/models/legacy-bake.js` (2)

- L10 `colours` (comment): * options }; the vertex colours give the colour), `cell` (the grid step,
- L10 `colour` (comment): * options }; the vertex colours give the colour), `cell` (the grid step,

## `src/models/model.js` (2)

- L15 `colours` (comment): *                attenuationDistance, opacity, side } } — vertex colours
- L16 `colour` (comment): *              give the colour

## `src/models/sdf.js` (18)

- L11 `colour` (comment): * - a colour, blended from the shapes nearest it, varied with noise and
- L39 `centre` (comment): /** p in a shape's own frame: moved to its centre and turned back by its rotation. */
- L88 `colour` (comment): * lock's tip; `id` is a number 0–1 for the lock, to vary its colour by.
- L131 `colours` (comment): // ——————————————————————————————————————— colours
- L135 `colours` (comment): // Linear, as vertex colours are.
- L249 `colour` (comment): * A tint: `tint(color, mat, part)` is asked for the colour of every shape and paint added from now on (`mat` is
- L250 `colour` (comment): * null for a paint) and gives the colour to use in its place. null leaves colours as they are given.
- L250 `colours` (comment): * null for a paint) and gives the colour to use in its place. null leaves colours as they are given.
- L266 `colour` (comment): /** A distance function, colour and bounds as sculpted, moved by the warp. */
- L481 `coloured` (comment): * shape it grows from, and is coloured `color(t, p)` from root (t 0) to
- L541 `Colour` (comment): * Colour only: inside `inside(p)` (a distance, negative inside) the surface
- L652 `Colour` (comment): /** Colour and bone weights at a point on the surface: from the shapes nearest it, and the paint on it. */
- L668 `Colours` (comment): // Colours blend over at least a grid step, or their edges come out sawn.
- L686 `normalised` (comment): // The four bones that matter most, normalised.
- L719 `colours` (comment): * colours (with the occlusion in them), triangle indices, and for each
- L721 `colour` (comment): * order. `shade(color, p, n, ao)` can finish a vertex's colour. `refine` is
- L929 `colour` (comment): // How far it bends across the edge (1 at about 30°), how far the colour changes, and how far off the surface its middle is.
- L945 `colour` (comment): // Each vertex's colour, light and bones.

## `src/models/skins.js` (4)

- L4 `Colours` (comment): * Colours for sculpts: functions of a point and its normal, in linear RGB,
- L33 `colour` (comment): * Fur by colour: `coat`'s shading with strands — noise stretched along the
- L69 `colour` (comment): /** A colour times light grain noise: for metal, bone, stone. */
- L78 `colour` (comment): /** `fn`'s colour, darker toward its bottom: dirt and shadow, `from` to `to` up y. */

## `src/moods/garage.js` (1)

- L10 `neighbour` (comment): * with a gold record behind it. Little brothers and a neighbour with a broom.

## `src/moods/london.js` (1)

- L6 `kerb` (comment): * the tour bus at the kerb, along a wet street of phone boxes and black

## `src/moods/newyork.js` (1)

- L8 `theatres` (comment): * theatres lit, the paparazzi who have followed him round the world and

## `src/moods/noir.js` (1)

- L9 `kerb` (comment): * line fizzing in a puddle by the kerb; the detective's office up off the

## `src/moods/opera.js` (2)

- L32 `theatre` (string): music: { band: 'music/band.rocknroller', theme: 'theatre', tempo: 88 },
- L45 `theatre` (string): theme: 'theatre',

## `src/moods/sydney.js` (2)

- L6 `Harbour` (comment): * House. Off the top of the Harbour Bridge's arch, where the climbers go,
- L8 `harbour` (comment): * crates on the beat and the harbour ferries the only way over the water,

## `src/moods/whitby.js` (1)

- L7 `harbour` (comment): * down, a harbour, and a pavilion at the bottom with a band in it. It is

## `src/music/band.rocknroller.js` (1)

- L92 `theatre` (code): theatre: {

## `src/ocean/shaders.js` (11)

- L34 `towards` (comment): *   uSun, uSunColor                vec3: towards the sun; its light
- L140 `skyColour` (comment): // The sky looking along d, as skyColour() in ocean/sky.js.
- L141 `skyColour` (code): vec3 skyColour(vec3 d, float cl) {
- L149 `skyColour` (code): return skyColour(normalize(vec3(d.x, 0.0, d.z) + vec3(1e-4, 0.0, 0.0)), 0.0);
- L213 `skyColour` (code): vec3 sky = mix(uDeep + uBody * (uZenith * 0.3 + uHorizon * 0.2), skyColour(rs, clouds(rs, 3)), smoothstep(-0.25, 0.0, reflect(-v, n0).y));
- L271 `skyColour` (code): col = skyColour(d, cl);
- L352 `skyColour` (comment): // The sky looking along d, as skyColour() in ocean/sky.js.
- L353 `skyColour` (code): fn skyColour(d: vec3f, cl: f32) -> vec3f {
- L361 `skyColour` (code): return skyColour(normalize(vec3f(d.x, 0.0, d.z) + vec3f(1e-4, 0.0, 0.0)), 0.0);
- L423 `skyColour` (code): let sky = mix(material.uDeep + material.uBody * (material.uZenith * 0.3 + material.uHorizon * 0.2), skyColour(rs, clouds(rs, 3)), smoothstep(-0.25, 0.
- L482 `skyColour` (code): col = skyColour(d, cl);

## `src/ocean/sky.js` (14)

- L5 `colour` (comment): * colour the dome and the water's reflections with (ocean/shaders.js), and
- L13 `towards` (comment): *     round towards +z), its colour and how strong (the moon, at night)
- L13 `colour` (comment): *     round towards +z), its colour and how strong (the moon, at night)
- L15 `colour` (comment): *   - `cloud`: the clouds' colour and how much of the sky they cover
- L17 `colours` (comment): *   - `water`: the sea's own colours: `deep` (what it is with no light in
- L67 `towards` (comment): /** Which way the sun is, from its [elevation, azimuth] in degrees: a unit [x, y, z] towards it. */
- L74 `colours` (comment): * A sky as the shaders take it: linear colours, the sun's direction, and
- L75 `colour` (comment): * its colour times its strength.
- L110 `colour` (comment): * The sky's colour looking along `d` (a unit [x, y, z]), linear, as
- L111 `skyColour` (comment): * `skyColour` in the shaders has it, with the clouds as an even veil of
- L114 `skyColour` (code): export function skyColour(light, d) {
- L152 `skyColour` (code): let col = skyColour(light, d);
- L153 `skyColour` (code): if (dy < 0) col = mix3(skyColour(light, [d[0], 0, d[2]]), water, Math.min(1, -dy * 4));
- L171 `colours` (comment): * the colours mixed in linear light, the sun moved along between its two

## `src/ocean/waves.js` (1)

- L31 `towards` (comment): *   - `wind`: the way it blows, in radians round y from +x towards +z

## `src/people/human.js` (37)

- L21 `metre` (comment): * A human, at real size (1.76 m, one world unit a metre, as the weapons
- L52 `metres` (comment): /** Each figure's measures (metres), as HUMAN_DIMENSIONS gives the man's. */
- L268 `hairColour` (string): export const FEMALE_FEATURES = Object.freeze({ beard: 'none', hair: 'long', hairColour: '#d6b57c', iris: '#4f7fb8', brows: 'fine', lipColour: '#b0626a
- L268 `lipColour` (string): export const FEMALE_FEATURES = Object.freeze({ beard: 'none', hair: 'long', hairColour: '#d6b57c', iris: '#4f7fb8', brows: 'fine', lipColour: '#b0626a
- L281 `colour` (comment): * The cloth of the later garments: its look colour (`of`, if another's), roughness, how much it shines at the
- L293 `colour` (comment): /** The hair's sheen: its own colour, a third of the way to white. */
- L294 `colour` (code): function sheenOf(GFX, colour) {
- L295 `colour` (code): const c = new GFX.Color(colour);
- L644 `hairColour` (code): const look = { ...DEFAULT_LOOK, skin: features.skin, iris: features.iris, hair: features.hairColour, ...lookIn };
- L1206 `neighbours` (comment): /** Each of tail vertices `list`'s neighbours among them (by mesh `m`'s triangles, and where a seam splits a vertex), as rings: worked out once a cut.
- L1353 `centre` (code): const centre = new GFX.Vector3(...mirror(gripOf(sex), m));
- L1359 `centre` (code): rest.setPosition(centre);
- L1456 `metres` (comment): * and held up. How high above the hand it is (metres) and how far it has turned (radians).
- L1499 `centre` (code): const to = applyAt(H, f.centre).map((v, a) => v + side[a] * (h.size[1] + TOME.clear));
- L1500 `centre` (code): aim = { point: f.centre, to, dirs: [[f.palm, side.map((v) => -v), 0.02], [f.along, normV(turnBy(H, f.along)), 0.01]] };
- L1506 `centre` (code): aim = { point: f.centre, to, dirs: [[f.palm, face, 0.012], [f.along, across.map((v) => -m * v), 0.008]] };
- L1511 `centre` (code): aim = { point: f.centre, to, dirs: [[f.palm, [0, 1, 0], 0.02], [f.along, normV(turnBy(C, [0, 0, 1])), 0.008]] };
- L1520 `centre` (code): const point = [0, 1, 2].map((a) => f.centre[a] + f.along[a] * 0.075);
- L1524 `centre` (code): const point = [0, 1, 2].map((a) => f.centre[a] + f.along[a] * 0.075);
- L1545 `centred` (comment): * How far a slab (a book: `size` across, through and up its axes `x`, `y`, `z`, centred on `at`) must move along
- L1572 `centre` (code): const centre = bookAt.middle.map((v, a) => v - across[a] * h.middle[0] + face[a] * h.middle[1] - up[a] * h.middle[2]);
- L1573 `centre` (code): const push = pushClear(fingers, centre, [across, face, up], h.size);
- L1598 `centimetre` (comment): // holes, the thumb's on the −y side) toward the fingertips; sunk a centimetre onto the fingers in them.
- L1603 `centre` (code): const at = applyAt(H, f.centre).map((v, a) => v + up[a] * (h.radius - 0.01));
- L1609 `centre` (code): const at = applyAt(H, f.centre).map((v, a) => v + up[a] * (h.radius + 0.004));
- L1722 `colours` (comment): * from him as he is (his colours, his hair), the rest as they were last set.
- L1726 `hairColour` (code): ...features, skin: look.skin, iris: look.iris, hairColour: look.hair,
- L1735 `colours` (code): const colours = {};
- L1736 `colours` (code): if (change.skin) colours.skin = change.skin;
- L1737 `colours` (code): if (change.iris) colours.iris = change.iris;
- L1738 `hairColour` (code): if (change.hairColour) colours.hair = change.hairColour;
- L1738 `colours` (code): if (change.hairColour) colours.hair = change.hairColour;
- L1738 `hairColour` (code): if (change.hairColour) colours.hair = change.hairColour;
- L1739 `colours` (code): if (Object.keys(colours).length) setLook(colours);
- L1739 `colours` (code): if (Object.keys(colours).length) setLook(colours);
- L1747 `metres` (comment): /** How far each arm is inside his body (or what he wears) as he is posed now, by side, in metres: 0 when clear. */
- L1751 `metres` (comment): /** How tall he stands, in metres, in the shape he has been given. */

## `src/people/human/body.js` (1)

- L246 `neighbouring` (comment): // Smoothed over the neighbouring bins.

## `src/people/human/carry.js` (2)

- L33 `centre` (code): const centre = [0, 1, 2].map((a) => wrist[a] * 0.45 + knuckle[a] * 0.55 + palm[a] * 0.012);
- L34 `centre` (code): return { centre, palm, along, indexTip: mirror(fingers.index.joints[3], m), thumbTip: mirror(fingers.thumb.joints[3], m) };

## `src/people/human/clearance.js` (2)

- L33 `neighbours` (comment): /** A sector left empty takes the larger of its neighbours', so there is no gap to reach through. */
- L141 `modelled` (comment): // As he stands at rest (the pose he is modelled in) the upper arm already lies against his side, under

## `src/people/human/clothes.js` (6)

- L96 `metre` (comment): * within `reach` above it, less `slope(th)` per metre down (the cloth drawn
- L793 `metre` (comment): // The skin's UV scale here (UV per metre round the edge), so the cap's knit is the same size as the shell's.
- L800 `perMetre` (code): const perMetre = du / (dp || 1);
- L820 `perMetre` (code): const uv = [part.uv[loop[kk] * 2], part.uv[loop[kk] * 2 + 1] + along[k] * perMetre];
- L1094 `millimetres` (comment): /** The knit rib at the waist (`band`) or the wrists (`cuffs`): snug, a few millimetres thick. */
- L1152 `centre` (comment): /** A rounded box: centre `c`, axes `u`, `v`, `n`, half-sizes `h`. */

## `src/people/human/data/base.js` (4)

- L10 `ltyre` (string): export const UV = 'TdW5cpjVrnKh1XBzYNV7c6TUr3IB1bRyFNWBc7fUjnNf1QVyGdXxccnU03FW1UlxEdUJcZPVcHGb1cpwb9V3cMHVAXHf1XJwxtUFcPjVu3Aj1jxwF9a6by/WinBy1gxwZta
- L14 `BnhGREYgxniGeEZPhkiGQ` (string): export const SURFACES = {"body":{"v":"AAABAAIAAwAEAAUABgAHAAgAAAAFAAkACQAFAAQACgALAAkACgAMAA0ACAAJAAsADgALAAwADwAQAA0ACwAOABEADgAPABIAEwAQAA4AEQAUABEA
- L14 `EYYRjxGBEYIRkBGREYMRhBGSEZMRhRGDEZERlBGGEYcRlRGSEYQRiBGWEZcRiRGKEZgRmRGLEYwRmhGWEYgRixGZEZsRjRGOEZwRmhGMEY` (string): export const SURFACES = {"body":{"v":"AAABAAIAAwAEAAUABgAHAAgAAAAFAAkACQAFAAQACgALAAkACgAMAA0ACAAJAAsADgALAAwADwAQAA0ACwAOABEADgAPABIAEwAQAA4AEQAUABEA
- L14 `greyt` (string): export const SURFACES = {"body":{"v":"AAABAAIAAwAEAAUABgAHAAgAAAAFAAkACQAFAAQACgALAAkACgAMAA0ACAAJAAsADgALAAwADwAQAA0ACwAOABEADgAPABIAEwAQAA4AEQAUABEA

## `src/people/human/data/shapes-female.js` (6)

- L1 `modelling` (comment): // Generated by scripts/bake-human.mjs --female from the MakeHuman project's modelling targets,
- L5 `metres` (comment): // base64 Int8 or Int16, as `bits` says, × `q` metres, in his pose), how far it moves each of his joints
- L6 `metres` (comment): // (`pivots`, metres) and how much it grows each eye's radius (`eyes`).
- L7 `gsNDkerbT` (string): export const SHAPES = {"height+":{"q":0.00000362905,"bits":16,"i":"AAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgA
- L7 `TkLRkeRbZtLkMhwLZJLuUgprUTLkweM` (string): export const SHAPES = {"height+":{"q":0.00000362905,"bits":16,"i":"AAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgA
- L7 `RnMGgREYRkkLshGkRkUKBxI` (string): export const SHAPES = {"height+":{"q":0.00000362905,"bits":16,"i":"AAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgA

## `src/people/human/data/shapes.js` (4)

- L1 `modelling` (comment): // Generated by scripts/bake-human.mjs from the MakeHuman project's modelling targets,
- L5 `metres` (comment): // base64 Int8 or Int16, as `bits` says, × `q` metres, in his pose), how far it moves each of his joints
- L6 `metres` (comment): // (`pivots`, metres) and how much it grows each eye's radius (`eyes`).
- L7 `keRbxLU` (string): export const SHAPES = {"height+":{"q":0.00000357687,"bits":16,"i":"AAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgA

## `src/people/human/features.js` (15)

- L8 `colour` (comment): * `max`, 0 the average) or a colour, with its `default`.
- L18 `modelling` (comment): * targets (CC0), the ones its modelling tab moves: each slot's `shape` says
- L31 `colour` (code): const colour = (key, label, value, { ready = false } = {}) => ({ key, label, type: 'color', default: value, ready });
- L127 `colour` (code): colour('skin', 'Tone', '#b98a70', { ready: true }),
- L172 `colour` (string): colour('iris', 'Colour', '#5a4632', { ready: true }),
- L172 `Colour` (string): colour('iris', 'Colour', '#5a4632', { ready: true }),
- L208 `colour` (string): colour('lipColour', 'Lip colour', '#a86a5e'),
- L208 `lipColour` (string): colour('lipColour', 'Lip colour', '#a86a5e'),
- L208 `colour` (string): colour('lipColour', 'Lip colour', '#a86a5e'),
- L222 `colour` (string): colour('hairColour', 'Colour', '#3b2a1f', { ready: true }),
- L222 `hairColour` (string): colour('hairColour', 'Colour', '#3b2a1f', { ready: true }),
- L222 `Colour` (string): colour('hairColour', 'Colour', '#3b2a1f', { ready: true }),
- L226 `moustache` (string): choice('moustache', 'Moustache', ['with beard', 'none', 'chevron', 'handlebar', 'pencil', 'walrus']),
- L226 `Moustache` (string): choice('moustache', 'Moustache', ['with beard', 'none', 'chevron', 'handlebar', 'pencil', 'walrus']),
- L289 `colour` (string): if (s.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`human: ${key} is a #rrggbb colour, not ${value}`);

## `src/people/human/fit.js` (1)

- L280 `metre` (comment): * comes in for each metre it falls; small, so it falls nearly straight), in

## `src/people/human/glasses.js` (6)

- L5 `centimetre` (comment): * Sunglasses, made to his face: the lenses a little more than a centimetre
- L13 `metres` (comment): * Each style: `outline(a)` → [u, v], the lens's edge in metres round its
- L16 `moulded` (comment): * bar across the brow and pads on the nose, else a moulded one whose bridge
- L54 `metres` (comment): /** A point of the left lens at [u, v] in its outline (`out` metres off the lens's surface): on a sphere, turned round the face. */
- L106 `millimetre` (comment): // The lens: rings in to its middle, its outside and inside a millimetre apart.
- L165 `moulded` (comment): // Across the nose: a wire frame's bar over the brow and its bridge between the lenses; a moulded frame's one bridge.

## `src/people/human/hair.js` (27)

- L12 `colour` (comment): * skin is painted the hair's colour where it grows (textures.js), so no
- L19 `millimetres` (comment): * millimetres over the ears and at the nape. The beard is a full beard of
- L21 `moustache` (comment): * the corner of the moustache, a neckline two fingers above the Adam's
- L53 `metres` (comment): /** How much hair grows on the scalp at `p` (rest, metres), with normal `n`: 0 to 1, soft at the hairline. */
- L58 `millimetres` (comment): // A hairline is never a clean line: it wavers, and thins out over a few millimetres.
- L66 `moustache` (comment): // The beard's top edge, by distance from the middle of the face: the moustache under the
- L68 `moustache` (comment): // From the corner of the moustache it runs straight up the cheek to the top of the sideburn, at the
- L85 `metres` (comment): // a level line under the chin, where it is trimmed (BEARD_FLOOR). In metres, [y, z] at each end.
- L93 `moustache` (comment): /** The beard's top edge over `p`: the line across the cheek, and in front, between the nose and the lip, the moustache's own line. */
- L132 `moustache` (comment): /** The mouth ringed (moustache and chin joined round the lips), out to `reach`. */
- L376 `centimetres` (comment): // there (a jacket stands a few centimetres off the skin; its collar less).
- L431 `metres` (comment): // Where along the texture each point is: evenly, or (for long hair, `rootFade` metres) the texture's
- L432 `centimetres` (comment): // fading-in roots kept to the first few centimetres, the rest of it spread over the length.
- L580 `millimetres` (comment): /** About 5 cm on top (a touch more at the front), tapering down the sides and back to a few millimetres. */
- L638 `millimetres` (comment): /** A clipper cut: a few millimetres all over, a little more on top, lying close. */
- L1049 `centimetre` (comment): * square centimetre and as long, kept to a narrower line with a clean
- L1106 `moustache` (comment): /** About 2 cm, 2.5 at the chin; the moustache shorter, to just over the lip. */
- L1114 `moustache` (comment): // Shorter toward the cheek line (the moustache keeps its length), and shorter still up the
- L1121 `moustache` (comment): /** Down the cheeks and jaw, a little forward off the chin; back toward the neck under the jaw; the moustache down and out. */
- L1160 `moustache` (comment): /** A goatee: the chin and the moustache joined round the mouth, the cheeks clean. */
- L1169 `moustache` (comment): /** A Van Dyke: a pointed chin beard, a moustache apart from it, the cheeks and the lip's corners clean. */
- L1177 `moustache` (comment): /** The chin's point longer, to 3.5 cm; the moustache a little longer than the full beard's. */
- L1196 `moustache` (comment): /** A chevron: a full, even moustache, level with the lip, trimmed at the corners of the mouth. */
- L1205 `moustache` (comment): /** A pencil moustache: a thin line high on the lip, 3 mm tall. */
- L1215 `moustache` (comment): /** A handlebar: a long moustache combed out over the lip, its ends waxed out and up past the mouth's corners. */
- L1326 `coloured` (comment): * looser, one of strays), white, to be coloured by the material. Each strand
- L1328 `colour` (comment): * toward their tips. Where there is no hair the colour is the hair's

## `src/people/human/kit.js` (5)

- L2 `modelling` (comment): * The modelling kit the human is built with: small vector helpers, a quad
- L7 `metres` (comment): * Everything is in metres, y up, the figure facing +z, its left toward +x.
- L68 `minimising` (comment): * Rotation-minimising frames along a polyline: for each point its tangent
- L170 `Normalised` (comment): /** Normalised, at most four, as [index, weight] pairs by bone name. */
- L206 `colour` (comment): // (A shade, or a colour of its own.)

## `src/people/human/martial.js` (5)

- L11 `metres` (comment): * right). Keys named `@hips` and `@root` are a move, in metres. Poses are written for one lead
- L54 `metres` (comment): * blade hand when `armed`) it is written for, `bounce` how much (metres) and how fast (rad/s) he bobs on
- L185 `centre` (comment): // palm up before the chest (tan sao) and the other guarding it at the centre line.
- L361 `metres` (comment): * moves in metres. The names with a `blade` need a weapon in the hand (the right as written).
- L476 `centre` (comment): // Wing Chun's chain punch: three quick punches up the centre line, right, left, right, each from the elbow, the body still.

## `src/people/human/motion.js` (1)

- L10 `metres` (comment): * out for a man of real size: every rise, fall and step is in metres, the

## `src/people/human/outfits.js` (1)

- L103 `metre` (comment): * `flare` out for each metre below the hips. Its cloth rides on the thighs more and more toward the hem (each

## `src/people/human/shape.js` (3)

- L12 `modelling` (comment): * his shape (features.js) is made of MakeHuman's own modelling targets,
- L39 `metres` (comment): /** One of figure `sex`'s baked shapes, unpacked once: the vertices it moves and by how much (metres), its joints and eyes. */
- L139 `litre` (comment): /** About how dense a person is, kg a litre (more muscle, a little more; more fat, a little less). */

## `src/people/human/shell.js` (5)

- L19 `metres` (comment): *   (zone { zone, y, d, x }) is, in metres; ≤ 0 outside, and -1 where it
- L125 `neighbours` (comment): // How far each stands off the skin, smoothed over its neighbours, never less than its ease.
- L143 `neighbours` (comment): // spread out over its neighbours (never lowered), so over an edge underneath it slopes down gently.
- L184 `neighbours` (comment): // The cut, made fair: each vertex on it eased toward the middle of its two neighbours along it.
- L221 `neighbours` (comment): // Rings of neighbours out from it, each relaxed toward the average of its own, the edge held.

## `src/people/human/skeleton.js` (2)

- L5 `metres` (comment): * The human's skeleton, at real size: an adult man 1.76 m tall, in metres,
- L23 `centre` (comment): /** The face's moving parts (left side): where each turns, the eye (centre, radius), the mouth's middle. */

## `src/people/human/teeth.js` (16)

- L22 `millimetres` (comment): // and height, in millimetres: the average adult crowns of the dental anatomy tables (Wheeler's),
- L104 `grey` (comment): // the crown; an incisor's edge is enamel alone, a little grey-blue and clear. The fissures between
- L120 `centres` (code): const centres = [];
- L122 `centres` (code): for (const t of teeth) { centres.push([at + t.w / 2, t]); at += t.w; }
- L125 `centres` (code): if (d <= centres[0][0]) return centres[0][1][key];
- L125 `centres` (code): if (d <= centres[0][0]) return centres[0][1][key];
- L126 `centres` (code): for (let i = 1; i < centres.length; i++) {
- L127 `centres` (code): if (d <= centres[i][0]) {
- L128 `centres` (code): const f = smooth(centres[i - 1][0], centres[i][0], d);
- L128 `centres` (code): const f = smooth(centres[i - 1][0], centres[i][0], d);
- L129 `centres` (code): return centres[i - 1][1][key] * (1 - f) + centres[i][1][key] * f;
- L129 `centres` (code): return centres[i - 1][1][key] * (1 - f) + centres[i][1][key] * f;
- L132 `centres` (code): return centres[centres.length - 1][1][key];
- L132 `centres` (code): return centres[centres.length - 1][1][key];
- L139 `centres` (code): let near = centres[0];
- L140 `centres` (code): for (const c of centres) if (Math.abs(c[0] - d) < Math.abs(near[0] - d)) near = c;

## `src/people/human/textures.js` (32)

- L11 `colours` (comment): * their colours alone). Each painter works the way a texture artist's
- L13 `colour` (comment): * covers, and the colour there (a cheek's flush, an eyebrow's hair, a
- L23 `coloured` (comment): /** A `w` × `h` canvas, every texel coloured by `fn(u, v)` → [r, g, b] (0–255); u across, v up. */
- L172 `metres` (comment): /** How much of a lip `(x, y, z)` is on (0 to 1), and how far above the slit between them it is (metres). */
- L220 `colour` (comment): * The skin's colour at a place `p` (rest, metres) with normal `n` in `zone`:
- L220 `metres` (comment): * The skin's colour at a place `p` (rest, metres) with normal `n` in `zone`:
- L224 `colour` (comment): * hair's own colour, so no skin shows between its cards), paler palms and
- L227 `skinColour` (code): function skinColour(tone, L, groom = {}) {
- L228 `hairColour` (code): const grown = groom.hairColour ? hex(groom.hairColour) : null;
- L228 `hairColour` (code): const grown = groom.hairColour ? hex(groom.hairColour) : null;
- L237 `colours` (comment): // What colours skin: blood (red), melanin (brown), and, where a vein lies under it, the blue of its depth.
- L245 `centimetre` (comment): // Mottling, at every size skin has it: broad flushes of blood, blotches a centimetre across, the
- L246 `millimetre` (comment): // millimetre speckle of the capillaries, and melanin's own unevenness over them.
- L271 `colour` (comment): // Where hair grows, its colour, streaked as the hair is.
- L305 `colour` (comment): // (Under the brows' own hairs, when he has them: in his hair's colour, softer; hers a shade darker, as her brows are.)
- L379 `skinColour` (code): return bodyPixels(size, skinColour(hex(tone), landmarks(), groom), [180, 130, 110]);
- L398 `millimetres` (comment): // Everywhere: the skin's unevenness, a few millimetres across.
- L483 `colour` (comment): /** Paints the body's UV layout texel by texel: `colour(p, n, zone)` → [r, g, b] for each texel's place on the body. */
- L484 `colour` (code): function bodyPixels(size, colour, empty = [128, 128, 128]) {
- L494 `colour` (code): const c = colour(p, n, ZONES[Z[o]]);
- L516 `millimetre` (comment): * furrows that divides it into little plates a third of a millimetre across,
- L547 `fibres` (comment): * The eye. The iris as an iris is made: fibres running out from the pupil,
- L552 `greyer` (comment): * light through the cornea gathers. The white is not white: ivory, greyer
- L574 `Fibres` (comment): // Fibres: coarse ones bent by noise, fine ones between; brighter strands over a darker ground.
- L580 `fibres` (comment): // The collarette: a crinkled ring, paler and golden, the fibres inside it finer and brighter.
- L775 `colour` (comment): * The jacket's hide: tinted by its colour, mottled as leather is, paler where
- L782 `millimetres` (comment): // A seam `d` away: the groove, and the stitching a few millimetres to one side.
- L870 `coloured` (comment): // Round the wall, one coloured stripe and a fine rib either side.
- L886 `hairColour` (string): export function humanTextures(GFX, { skin = '#c08a6c', iris = '#5a4632', size = 2048, hair: hairColour = null, style = null, beard = null, sex = 'male
- L890 `hairColour` (code): const groom = { ...(style || beard ? { hairColour, style, beard } : {}), female: sex === 'female' };
- L891 `hairColour` (string): const key = `${skin}|${iris}|${size}|${style}|${beard}|${style || beard ? hairColour : ''}|${sex}`;
- L915 `colouring` (comment): // The skin's detail is the same whatever his colouring: one for each size of map.

## `src/people/index.js` (1)

- L2 `metre` (comment): * People at real size (one world unit a metre, as the weapons are), built

## `src/people/robot-parts.js` (3)

- L8 `metres` (comment): * rest pose (metres), taking his joints and surface as the guide.
- L12 `metres` (comment): * coordinates are planar in metres, so a brushed grain keeps its scale.
- L83 `metres` (comment): * A solid of revolution about the line `p0` to `p1`: `profile` is [[s, r], ...], s along it (metres from

## `src/people/robot.js` (2)

- L18 `grey` (comment): *     const bot = createRobot(GFX, { color: 'white', trim: 'grey', frame: 'titanium' });
- L29 `grey` (string): green: '#1f7a3c', teal: '#14898a', purple: '#5a2a8a', pink: '#d8507a', grey: '#7d8087', gold: '#b8923a',

## `src/physics.js` (2)

- L451 `centre` (comment): // The centre is inside: out by the side or the top, whichever is nearer.
- L474 `centre` (comment): // The centre is inside: out by the nearest face — but never down, out of the bottom, unless the box is coming down on it

## `src/props/book-art.js` (5)

- L58 `colour` (comment): /** Foil: a gradient in the colour pass, plain white in the bump pass so it stands proud of the leather. */
- L280 `centred` (comment): /** Text centred at (x, y), letter by letter so it can be spaced. */
- L305 `millimetres` (comment): * millimetres: `s` along the unrolled cover, `z` up the book. `mode` is
- L694 `recognise` (string): 'The bees have started making something other than honey. It is dark and it smells of cold pennies and it fills the combs in the roof in shapes I almo
- L703 `grey` (string): 'A small grey man sells me the evenings. He will take nothing for them but the mornings. I thought this a bargain. I am beginning to doubt that I have

## `src/props/book.js` (4)

- L53 `colours` (comment): /** How big a 'low' cover is painted, square: its colours and shapes for a book seen from afar, the detail left out. */
- L106 `centre` (comment): * The cover's centre line at openness `a` (0 shut, 1 lying flat): its five
- L133 `centre` (comment): /** The centre line at arc length `s`: [x, y, heading], extended straight past either end. */
- L394 `millimetres` (comment): // Fine where the leaf bends through the gutter (the bend can be a few millimetres long, and a column must fall in it).

## `src/props/bookcase.js` (7)

- L9 `metre` (comment): * a map a metre of board, the grain running along each board) when that file
- L10 `colours` (comment): * is there, and plain painted boards in the same species' colours when it is
- L15 `metres` (comment): * Coordinates are metres: the middle of the footprint on the floor, the front
- L32 `colours` (comment): /** Where the wood comes from: 'library' (textures/wood.js) or 'plain' (painted colours). */
- L35 `colours` (comment): /** The colours of a plain board, by species: the same names as the library's. */
- L75 `colour` (comment): /** A board's material: the species in the finish, from the library's maps (or a plain colour). */
- L91 `metre` (comment): * metre, the grain running along `grain` ('x' for a shelf, 'y' for a side),

## `src/props/bouncy-ball.js` (10)

- L2 `colours` (comment): * A rubber bouncy ball: a smooth sphere in a rubber ball's colours (plain, swirled, marbled, tie-dyed, banded, flecked,
- L4 `mould` (comment): * in a soft rubber finish (matte with a faint sheen and the mould's seam round its middle), and a squash and stretch
- L38 `colours` (comment): * A rubber ball's patterns: plain; a swirl of two colours folded through each other (soft-edged, broad, as rubber
- L42 `colour` (comment): /** The flecks of a superball: points spread evenly over the sphere (a Fibonacci spiral), each a size and a colour. */
- L72 `colour` (comment): // One colour, the rubber a shade uneven.
- L75 `colours` (comment): // Two colours folded through each other in broad soft swirls, a fine streak of the third where they meet.
- L80 `colours` (comment): // Three colours in many thin folded bands, as rubber scraps pressed together.
- L85 `colours` (comment): // A spiral wound from pole to pole, its arms wavering, in three colours.
- L97 `colours` (comment): // Round flecks of two colours scattered evenly over it, as a superball has.
- L115 `mould` (comment): // The mould's seam: a fine darker line round the middle.

## `src/props/bowling-ball.js` (1)

- L65 `colour` (comment): // One colour of resin, only a faint cloud in it.

## `src/props/bowling-pin.js` (1)

- L3 `colour` (comment): * marbled resin finish. Surface colour is sampled in object space (not UV

## `src/props/case.js` (5)

- L6 `aluminium` (comment): * A road case: black textured laminate in an aluminium frame, an angle down
- L9 `stencilled` (comment): * front, a recessed handle in each end; PICKS stencilled on the front in
- L20 `aluminium` (comment): /** Brushed aluminium: streaked along the edge it runs down. */
- L53 `Aluminium` (comment): // Aluminium angle down every edge, a little proud of the faces.
- L63 `aluminium` (comment): // Hollow: only what shows outside the box is aluminium.

## `src/props/glass-entry.js` (1)

- L10 `metres` (comment): * Coordinates are metres: the middle of the opening on the floor, facing +z (into the room). Set it flush with the

## `src/props/glassglobe.js` (4)

- L9 `coloured` (comment): * inside for something to move: Krystal's coloured mist, a colorized map of
- L22 `colour` (comment): *     globe.setField(canvas);             // a map of colour inside the glass
- L117 `colour` (comment): // --- a field of colour, as mist: the haze (`textures/earth/haze.js`) reads a map of the Earth as it marches through the glass
- L150 `colour` (comment): * Puts a map of colour inside the glass as mist: `source` is a canvas

## `src/props/globe.js` (1)

- L7 `moulded` (comment): * polished wood, moulded top and bottom, with a gold band and a little

## `src/props/gold.js` (1)

- L8 `amongst` (comment): * in amongst them: a ruby, an emerald and a sapphire, faceted, the light

## `src/props/granite-kitchen.js` (12)

- L15 `metres` (comment): * Coordinates are metres, from the middle of the counter on the floor. The front
- L33 `metre` (comment): * The granite top's grain, in repeats a metre: twice the boulder's grain (one
- L36 `METRE` (code): export const COUNTER_GRANITE_REPEATS_PER_METRE = 2 / GRANITE_TILE_SIZE;
- L47 `metre` (comment): * counter, piece to piece, `scale` repeats a metre, rather than being stretched
- L96 `metre` (comment): // One repeat of the wood's map is a metre of board.
- L286 `grey` (string): granite = 'grey',
- L315 `colour` (comment): // The granite: the boulder's own colour and bump maps, at the boulder's grain scale.
- L316 `colour` (code): const source = createGraniteBoulder(GFX, { colour: granite, detail: 2 });
- L328 `METRE` (code): graniteMat.userData.uvScale = COUNTER_GRANITE_REPEATS_PER_METRE;
- L377 `centre` (string): box(GFX, counter, `raised cabinet centre panel ${i + 1}`, [bayW - 0.13, cabinetTop - PLINTH - 0.14, 0.012], [x, (cabinetTop + PLINTH) / 2, frontZ + 0.
- L474 `centre` (comment): * sets the run; the sink sits a little left of centre, toward the back, as is
- L478 `grey` (string): granite = 'grey',

## `src/props/groceries.js` (1)

- L220 `centre` (comment): // The bowl, front and centre: a cream bowl heaped with black beans.

## `src/props/harvest.js` (5)

- L29 `colour` (code): sculpt(s) { sculptPumpkin(s, { r: 0.22, h: 0.28, colour: cream }); },
- L40 `colour` (code): sculptPumpkin(s, { r, h, colour: cream });
- L55 `stalkColour` (code): const stalkColour = (p) => mix(rgb('#b08a3a'), rgb('#ead27a'), noise(p[0] * 40, p[1] * 6, p[2] * 40));
- L70 `stalkColour` (code): s.chain([foot, waist, top], [0.022, 0.02, 0.01], { color: stalkColour, mat: 'stalk', k: 0.03 });
- L71 `stalkColour` (code): if (i % 2) s.flake(waist, [Math.sin(a) * 0.3, 0.35 + (i % 3) * 0.12, Math.cos(a) * 0.3], [0, 1, 0], 0.02, 0.04, 0.4, { color: stalkColour, mat: 'stalk

## `src/props/lighter.js` (1)

- L21 `mould` (comment): /** Glossy red, a little deeper toward the bottom, the faint line of the mould down each side. */

## `src/props/pass.js` (1)

- L63 `colours` (comment): // The hologram: a square of foil on the front, its colours running with the angle.

## `src/props/pick.js` (3)

- L5 `colours` (comment): * A pile of guitar picks: nine of them, slid into a heap, in the colours
- L72 `colour` (comment): * shoulder to point, `color` a colour or 'tortoise' or 'pearl', `print` a
- L111 `colour` (comment): // [x, y, z, turn, tilt x, tilt z, colour, print]

## `src/props/podium.js` (3)

- L6 `towards` (comment): * tipped towards whoever stands behind it, and a colored panel on its front,
- L14 `grey` (comment): * `podium` is the plain one, with a grey panel. `podiumOf({ accent })` is one
- L81 `grey` (comment): /** The plain podium, with a grey panel. */

## `src/props/pumpkin.js` (5)

- L33 `stalkColour` (code): const stalkColour = (p) => mix(STALK_DARK, STALK, 0.5 + 0.5 * Math.sin(Math.atan2(p[0], p[2]) * 6 + p[1] * 30));
- L39 `colour` (code): export function sculptPumpkin(s, { r = 0.22, h = 0.3, k = 0.05, colour = rind(r), ribs = RIBS, stalk = true, mat = 'rind', at = [0, 0, 0], flat = true
- L45 `colour` (code): s.ellipsoid([ox + Math.sin(a) * off, cy, oz + Math.cos(a) * off], [r * 0.62, h / 2, r * 0.62], { color: colour, mat, k, rot: [0, a, 0] });
- L56 `stalkColour` (code): s.chain([p(0, top - 0.02 * q, 0), p(0.008 * q, top + 0.04 * q, 0.004 * q), p(0.026 * q, top + 0.075 * q, 0.012 * q), p(0.05 * q, top + 0.088 * q, 0.02
- L57 `stalkColour` (code): s.sphere(p(0, top - 0.01 * q, 0), r * 0.16, { color: stalkColour, mat: 'stalk', k: 0.02 * q });

## `src/props/putter.js` (11)

- L5 `metres` (comment): * A putter, built the way the swords are: at real size in metres (one engine unit is one metre), standing on its butt at
- L5 `metre` (comment): * A putter, built the way the swords are: at real size in metres (one engine unit is one metre), standing on its butt at
- L33 `metres` (comment): /** What the overall length may be set to: a short putter to a long one, in metres. */
- L39 `metres` (comment): * The head shapes. Each is the top view in metres (`length` toe to heel, `depth` face to back, `height` sole to top),
- L56 `colour` (string): const hex = (value, label) => { if (!HEX.test(value)) throw new TypeError(`${label} must be a six-digit hex colour`); return value; };
- L351 `metre` (string): 'Scale': '1 world unit = 1 metre',
- L361 `metres` (code): setLength(metres) { length = clamp(metres, PUTTER_LENGTHS.min, PUTTER_LENGTHS.max); layout(); return api; },
- L361 `metres` (code): setLength(metres) { length = clamp(metres, PUTTER_LENGTHS.min, PUTTER_LENGTHS.max); layout(); return api; },
- L408 `colour` (comment): /** The sight line's colour; it glows in this colour when `glow` is up. */
- L408 `colour` (comment): /** The sight line's colour; it glows in this colour when `glow` is up. */
- L416 `colour` (comment): /** How brightly the sight line (and, when the grip thread is its colour, the thread) shines: 0 to 1. */

## `src/props/rug.js` (11)

- L3 `colour` (comment): * dimensions, colour map, binding and fringe, and uses only engine GFX primitives.
- L9 `colourways` (comment): /** The colourways: each names the field, its light, the navy border, ivory, gold, teal, coral and the darkest tone. */
- L42 `metres` (comment): /** How far the woven pile stands above the foundation's top, in metres. */
- L349 `metres` (comment): * Build a woven, fringed Persian area rug. Coordinates are metres; the origin
- L350 `centre` (comment): * is in the centre on the floor. The returned group is self-contained.
- L358 `metres` (string): throw new RangeError('rug width must be between 1 and 8 metres.');
- L361 `metres` (string): throw new RangeError('rug depth must be between 1 and 8 metres.');
- L364 `metres` (string): throw new RangeError('rug thickness must be between 0.004 and 0.06 metres.');
- L367 `metres` (string): throw new RangeError('rug fringeLength must be between 0.015 and 0.2 metres.');
- L392 `millimetres` (comment): // The pile floats a few millimetres above the foundation. A 1 mm gap z-fought
- L448 `colourway` (comment): /** Registration for the asset viewer: the rug in each colourway, at a few sizes. */

## `src/props/snow-shovel.js` (5)

- L34 `colour` (string): const hex = (value, label) => { if (!HEX.test(value)) throw new TypeError(`${label} must be a six-digit hex colour`); return value; };
- L243 `centre` (code): const centre = pos.length / 3;
- L247 `centre` (code): idx.push(...(down ? [centre, a, b] : [centre, b, a]));
- L247 `centre` (code): idx.push(...(down ? [centre, a, b] : [centre, b, a]));
- L452 `metre` (string): 'Scale': '1 world unit = 1 metre',

## `src/props/sweets.js` (2)

- L11 `colour` (comment): * game hands each its colour); `candycorn` the three-banded kernel;
- L132 `colour` (comment): // Sugared: speckled white over the colour.

## `src/props/track-light.js` (2)

- L7 `metres` (comment): * `length` is the rail's, in metres; `cans` how many hang from it, spaced evenly along it; `drop` how far each can
- L12 `metres` (comment): * Coordinates are metres: the rail runs along x, its middle at the origin, the cans below it. `aim(point)` turns

## `src/props/vinyl.js` (3)

- L6 `stencilled` (comment): * A crate of vinyl: a slatted wooden record crate with VINYL stencilled on
- L10 `colours` (comment): * the ones behind in the colours the labels could afford; and one record
- L53 `stencilled` (comment): // VINYL, stencilled across the front boards.

## `src/props/whetstone.js` (3)

- L6 `grey` (comment): * the fine grey, its edges chamfered, its top worn into a shallow dish and
- L7 `grey` (comment): * dark and wet down the middle with grey slurry where the blade has been,
- L23 `grey` (comment): // Wet down the middle of the top, the slurry grey in it.

## `src/props/wood-board.js` (3)

- L4 `metres` (comment): * metres, lying flat on its face (+y), with its grain along its length (x).
- L19 `metre` (comment): /** Texture coordinates from the board's place: one repeat a metre, the grain along x on every face. */
- L55 `metre` (comment): // One repeat of the library's map is a metre of board: the same for every board of a species.

## `src/props/wood-chair.js` (12)

- L9 `metres` (comment): * flat arrow spindles, `spindles` of them, leaning back `rake` metres), `splay` (degrees the legs stand out, with turned
- L11 `metres` (comment): * sitter, in metres, 0 for a flat back), `arch` (how far the middle of the back rises above its ends, in metres: an arched
- L11 `metres` (comment): * sitter, in metres, 0 for a flat back), `arch` (how far the middle of the back rises above its ends, in metres: an arched
- L14 `metres` (comment): * Coordinates are metres: the middle of the seat on the floor, the front facing +z, the back at -z.
- L27 `metres` (comment): /** The starting measures of each kind, in metres: the seat's outside, its height from the floor, the back above it. */
- L66 `centre` (comment): // The dished top: a centre and NR rings out to the rim.
- L67 `centre` (code): const centre = push(0, top - dish, 0);
- L74 `centre` (code): for (let k = 0; k < NA; k++) tri(centre, ring[0][k], ring[0][(k + 1) % NA], [0, 1, 0]);
- L105 `metres` (string): if (!(Number.isFinite(o.curve) && o.curve >= 0 && o.curve <= MAX_CURVE)) throw new Error(`wood chair: curve must be 0 to ${MAX_CURVE} metres`);
- L106 `metres` (string): if (!(Number.isFinite(o.arch) && o.arch >= 0 && o.arch <= MAX_ARCH)) throw new Error(`wood chair: arch must be 0 to ${MAX_ARCH} metres`);
- L108 `metres` (string): if (!(Number.isFinite(o.rake) && o.rake >= 0 && o.rake <= 0.15)) throw new Error('wood chair: rake must be 0 to 0.15 metres');
- L438 `metres` (comment): /** One of each kind in a row along x, `gap` metres apart. Gives { group, chairs }. */

## `src/props/wood-table.js` (3)

- L10 `metres` (comment): * Coordinates are metres: the middle of the footprint on the floor, the long side along x, the front facing +z.
- L23 `metres` (comment): /** The starting measures of each kind of table: outside, in metres. */
- L194 `metres` (comment): /** One of each kind, in a row along x, `gap` metres apart, for a showroom. Gives { group, tables }. */

## `src/scenery/dungeon.js` (2)

- L43 `colour` (comment): * speckled, with a crack or two. The colour map is near white — the colour
- L43 `colour` (comment): * speckled, with a crack or two. The colour map is near white — the colour

## `src/scenery/gear/bumpers.js` (5)

- L6 `tyres` (comment): * a red oil drum, a stage monitor wedge, a palm in a tub, a stack of tyres,
- L9 `colours` (comment): * round viking shield on a stand. `rest` and `flash` are the ring's colours.
- L70 `tyres` (comment): /** A stack of tyres, three high. */
- L71 `tyres` (code): tyres(GFX, { radius, ringMat }) {
- L127 `grey` (comment): /** A rune stone: a tall grey slab with a face of cut marks, leaning. */

## `src/scenery/gear/bursts.js` (2)

- L3 `colours` (comment): * colours, and whether it billows (as steam does) rather than licks up.
- L7 `grey` (comment): *   smoke     a dense black-grey haze (New Orleans)

## `src/scenery/gear/common.js` (5)

- L29 `colour` (code): export function hangers(GFX, group, { w, d, height }, colour = '#2a2a30', r = 0.025) {
- L33 `colour` (code): const m = new GFX.Mesh(new GFX.CylinderGeometry(r, r, 8, 6), mat(GFX, colour, { metalness: 0.6 }));
- L60 `colour` (code): export function hull(GFX, group, spec, colour, { deck = '#8a6a42', depth = 0.7, rail = null } = {}) {
- L63 `colour` (code): const paint = new GFX.MeshPhysicalMaterial({ color: new GFX.Color(colour), roughness: 0.3, clearcoat: 0.6 });
- L69 `colour` (code): const gunwale = new GFX.Mesh(new GFX.TorusGeometry(1, 0.05, 6, 40), mat(GFX, rail ?? colour, { roughness: 0.4 }));

## `src/scenery/gear/compilation.js` (6)

- L12 `centred` (comment): * (`w` by `d` tiles, centred on the origin) and, if it has a front, facing
- L70 `colours` (code): const colours = ['#a8262a', '#2a5a8a', '#6a6a60', '#5a3a28'].map((c) => std(GFX, c, { roughness: 0.55, metalness: 0.4 }));
- L75 `colours` (code): const m = colours[Math.floor(rnd() * colours.length)];
- L75 `colours` (code): const m = colours[Math.floor(rnd() * colours.length)];
- L88 `colours` (code): const top = new GFX.Mesh(new GFX.CylinderGeometry(0.19, 0.19, 0.5, 14), colours[Math.floor(rnd() * colours.length)]);
- L88 `colours` (code): const top = new GFX.Mesh(new GFX.CylinderGeometry(0.19, 0.19, 0.5, 14), colours[Math.floor(rnd() * colours.length)]);

## `src/scenery/gear/decor.js` (9)

- L252 `glowColour` (code): const glowColour = venue?.look?.barNeon ?? '#ff2d95';
- L253 `glowColour` (code): const strip = new GFX.Mesh(new GFX.BoxGeometry(length * 0.9, 0.025, 0.012), new GFX.MeshBasicMaterial({ color: new GFX.Color(glowColour), toneMapped: 
- L297 `colour` (code): const colour = ['#2a7a3a', '#8a4a1a', '#3a5aa8', '#a8802a'][i % 4];
- L298 `colour` (code): const bottle = shadowed(new GFX.Mesh(new GFX.CylinderGeometry(0.03, 0.035, 0.2, 10), new GFX.MeshPhysicalMaterial({ color: new GFX.Color(colour), roug
- L338 `colours` (code): const colours = ['#ffd23a', '#2a5ad9', '#d9232f', '#7a3ae8', '#ff7a1a', '#1f8a3a', '#8a1a1a', '#101014', '#f4f0e6'];
- L339 `colours` (code): colours.forEach((c, i) => {
- L355 `colour` (comment): /** A jukebox: a rounded cabinet of chrome and wood with a lit panel that changes colour, and a bubble of coloured tubes. */
- L355 `coloured` (comment): /** A jukebox: a rounded cabinet of chrome and wood with a lit panel that changes colour, and a bubble of coloured tubes. */
- L470 `neighbour` (comment): * neighbour's back.

## `src/scenery/gear/dressing.js` (12)

- L16 `centred` (comment): * (`w` by `d` tiles, centred on the origin) and, if it has a front, facing
- L344 `stencilled` (comment): /** Wooden crates, two to a tile, the top one turned a little: battens round the edges, a stencilled band. */
- L553 `colours` (code): const colours = PAINT[venue?.look?.genre] ?? PAINT[venue?.look?.country] ?? PAINT.default;
- L554 `colours` (code): const paint = gloss(GFX, colours[Math.abs(Math.round((spec.x ?? 0) * 7 + (spec.z ?? 0) * 3)) % colours.length]);
- L554 `colours` (code): const paint = gloss(GFX, colours[Math.abs(Math.round((spec.x ?? 0) * 7 + (spec.z ?? 0) * 3)) % colours.length]);
- L556 `tyre` (code): const tyre = std(GFX, '#121214', { roughness: 0.85 });
- L569 `tyre` (code): k.cyl(0.17, 0.17, 0.14, tyre, [sx * (W / 2 - 0.02), 0.17, sz * L * 0.31], { rot: X });
- L613 `grey` (comment): /** A headstone: rounded grey stone, a darker panel where the name was, a mound in front. In the Western, a wooden cross on Boot Hill. */
- L729 `colours` (code): const colours = coats ? ['#16161a', '#3a3036', '#2a2a3a', '#4a3a2a', '#1a1a1e'] : ['#c81c34', '#e8c060', '#2a5ad8', '#16161a', '#3a8a4a', '#d860a8', '
- L733 `colours` (code): const mat = std(GFX, colours[Math.floor(rnd() * colours.length)], { roughness: coats ? 0.85 : 0.5 + rnd() * 0.3, metalness: !coats && rnd() < 0.25 ? 0
- L733 `colours` (code): const mat = std(GFX, colours[Math.floor(rnd() * colours.length)], { roughness: coats ? 0.85 : 0.5 + rnd() * 0.3, metalness: !coats && rnd() < 0.25 ? 0
- L742 `grey` (comment): /** The plant on the roof: a grey air-conditioning box with a grille, a fan going round on top, a pipe off it. */

## `src/scenery/gear/drops.js` (1)

- L44 `colour` (comment): /** A can of aerosol: a silver body, a band of colour, a dome and a cap with its nozzle. Giant. */

## `src/scenery/gear/furniture.js` (9)

- L48 `colours` (code): const colours = [[0.2, 1, 0.45], [0.2, 1, 0.45], [1, 0.8, 0.2], [1, 0.2, 0.2]];
- L55 `colours` (code): const [r, g, b] = colours[m.k];
- L96 `theatre` (comment): /** Velvet theatre seats, a row of them over every tile of the block, all facing the same way (+z, before `rot`). */
- L310 `colour` (comment): /** A camping tent: a dome of nylon in a colour of its own, a darker door at the front (+z), guy lines out to pegs. */
- L313 `colours` (code): const colours = ['#e0384a', '#2a8ad8', '#f0b02a', '#3aa858', '#8a4ad0', '#f06a2a'];
- L314 `colour` (code): const colour = colours[Math.abs(Math.round(seed * 7)) % colours.length];
- L314 `colours` (code): const colour = colours[Math.abs(Math.round(seed * 7)) % colours.length];
- L314 `colours` (code): const colour = colours[Math.abs(Math.round(seed * 7)) % colours.length];
- L315 `colour` (code): const nylon = std(GFX, colour, { roughness: 0.55 });

## `src/scenery/gear/machinery.js` (25)

- L214 `grey` (comment): /** The props department's boulder: papier-mâché painted grey, lumpy, on a cable. The talent has opinions about it. */
- L265 `stencilled` (comment): /** A wooden crate on a crane hook: slats, steel bands, stencilled. */
- L314 `centre` (code): const centre = new GFX.Mesh(new GFX.ConeGeometry(0.1, 0.34, 8), crystal);
- L315 `centre` (code): centre.rotation.x = Math.PI;
- L316 `centre` (code): centre.position.y = -height * 0.4;
- L317 `centre` (code): group.add(centre);
- L335 `colours` (code): const colours = burst ?? (steam ? { flame: '#c8d0dc', core: '#ffffff', halo: '#dce4ee' } : { flame: '#ff7a1a', core: '#fff2b0', halo: '#ffa050' });
- L338 `colours` (code): const flameMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colours.flame), transparent: true, opacity: steam ? 0.45 : 0.85, toneMapped: false, 
- L339 `colours` (code): const coreMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colours.core), transparent: true, opacity: steam ? 0.5 : 0.95, toneMapped: false, ble
- L341 `colours` (code): const haloMat = glow ? new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(colours.halo), blending: GFX.AdditiveBlending, depthWrite: false, opac
- L416 `colour` (code): const wheels = (radius, colour, inset = 0.25) => {
- L417 `tyre` (code): const tyre = dark(GFX, colour, { roughness: 0.8 });
- L417 `colour` (code): const tyre = dark(GFX, colour, { roughness: 0.8 });
- L419 `tyre` (code): const wheel = new GFX.Mesh(new GFX.CylinderGeometry(radius, radius, 0.12, 14), tyre);
- L625 `stencilled` (comment): /** A closed set: a roll-up shutter of corrugated steel, stencilled CLOSED SET; or (`look` 'bars') a gate of iron bars. */
- L746 `flashColour` (code): let flashColour = [1, 0.23, 0.54], rest = [1, 0.23, 0.54];
- L753 `flashColour` (code): flashColour = made.flash;
- L772 `flashColour` (code): flashColour = [1, 1, 0.8];
- L784 `flashColour` (code): flashColour = [1, 0.3, 0.8];
- L805 `flashColour` (code): flashColour = [1, 0.95, 0.6];
- L830 `flashColour` (code): flashColour = [1, 1, 0.6];
- L850 `flashColour` (code): flashColour = [1, 1, 1];
- L869 `flashColour` (code): flashColour = [1, 1, 0.6];
- L881 `flashColour` (code): flashColour = [1, 0.93, 0.94];
- L888 `flashColour` (code): ringMat.color.setRGB(...rest.map((v, i) => v + (flashColour[i] - v) * flash));

## `src/scenery/gear/rides.js` (18)

- L13 `colour` (code): function wheelsUnder(GFX, group, { L, S, top, r = 0.2, colour = '#16161a', hub = '#c8ccd4', inset = 0.22 }) {
- L14 `tyre` (code): const tyre = mat(GFX, colour, { roughness: 0.85 });
- L14 `colour` (code): const tyre = mat(GFX, colour, { roughness: 0.85 });
- L17 `tyre` (code): const wheel = new GFX.Mesh(new GFX.CylinderGeometry(r, r, 0.14, 16), tyre);
- L20 `centre` (code): const centre = new GFX.Mesh(new GFX.CylinderGeometry(r * 0.5, r * 0.5, 0.15, 10), cap);
- L21 `centre` (code): centre.rotation.x = Math.PI / 2;
- L22 `centre` (code): centre.position.copy(wheel.position);
- L23 `centre` (code): group.add(shadow(wheel), centre);
- L28 `colour` (code): function windows(GFX, holder, { L, S, top, n, y = -0.18, h = 0.14, colour = '#ffd890' }) {
- L29 `colour` (code): const lit = glowMat(GFX, colour);
- L127 `colour` (code): wheelsUnder(GFX, holder, { L, S, top: top + 0.14, r: 0.3, colour: '#2a1a10', hub: '#d8b050', inset: 0.1 });
- L146 `colour` (code): windows(GFX, holder, { L, S: S * 0.98, top, n: 5, y: -0.24, h: 0.2, colour: '#e8f0ff' });
- L155 `aluminium` (comment): /** An airboat: a flat aluminium hull and a great caged propeller on a frame at the stern. */
- L223 `grey` (comment): /** A bayou skiff: a flat-bottomed wooden boat, grey with age, a push pole stuck in the water at the stern. */
- L260 `colour` (code): wheelsUnder(GFX, holder, { L, S, top: top + 0.05, r: 0.17, colour: '#26282e', hub: '#8a8e98', inset: 0.2 });
- L309 `colour` (code): windows(GFX, holder, { L, S: S * 0.98, top, n: 3, y: -0.1, h: 0.12, colour: '#202838' });
- L326 `tyres` (comment): /** A festival mud trailer: a low flatbed on fat tyres with a rail round it and a tow bar, caked in mud. */
- L345 `colour` (code): wheelsUnder(GFX, holder, { L, S, top: top + 0.04, r: 0.3, colour: '#2a2218', hub: '#8a8e98', inset: 0.05 });

## `src/scenery/gear/tour.js` (13)

- L14 `Harbour` (comment): * on the Harbour Bridge, the barbecues in the Rocks, beach umbrellas, surf
- L18 `centred` (comment): * (`w` by `d` tiles, centred on the origin) and, if it has a front, facing
- L60 `metre` (comment): * its map is a metre, so the grain runs on through the bench, not stretched once
- L68 `metre` (comment): /** A slat as a box whose texture runs along its length in the world (one repeat a metre). */
- L361 `colour` (comment): /** A ski rack: a wooden frame, pairs of skis standing in it in every colour, poles hooked on. */
- L369 `colours` (code): const colours = ['#ff3a8a', '#1a5ad8', '#f0c020', '#1a1a1e', '#2aa04a', '#ff6a1a'];
- L371 `colours` (code): const c = std(GFX, colours[Math.floor(rnd() * 6)], { roughness: 0.4 });
- L548 `colours` (code): const colours = ['#2aa04a', '#f0c020', '#1a5ad8', '#e8301a'];
- L557 `colours` (code): for (const y of [0.37, 0.33 + h]) k.ring(r + 0.005, 0.015, std(GFX, colours[(i + Math.floor(rnd() * 4)) % 4]), [0, y, 0], { into: g, rot: [Math.PI / 2
- L625 `colours` (comment): // The canopy in rings of the two colours.
- L636 `colour` (comment): /** A surf rack: an A-frame of timber, the boards standing in it nose up, every colour. */
- L647 `colours` (code): const colours = ['#f4f2ec', '#ff6a1a', '#1aa8a8', '#f0c020', '#ff3a8a', '#1a5ad8'];
- L649 `colours` (code): const board = k.ball(0.5, gloss(GFX, colours[Math.floor(rnd() * 6)]), [-0.32 + i * 0.16, 0.85, (rnd() - 0.5) * 0.1], { seg: 14 });

## `src/scenery/lightshow.js` (92)

- L7 `coloured` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L7 `colour` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L15 `colours` (comment): *            the floor, in colours that chase.
- L28 `theatre` (comment): *   marquee  a theatre marquee: black letters on a lit board, fixed to a
- L60 `colour` (comment): /** A colour as [r, g, b] each 0–1, linear enough for lights. */
- L72 `colour` (comment): * The colour a fixture shows at `beat`: it steps through its `colors`, one
- L213 `colour` (code): function neonTexture(GFX, text, colour) {
- L214 `colour` (string): return cached(`neon:${text}:${colour}`, () => {
- L225 `colour` (code): ctx.shadowColor = colour;
- L228 `colour` (code): ctx.strokeStyle = colour;
- L358 `colour` (comment): /** What every fixture offers the stage's lights: where, what colour, how bright, how far it carries. */
- L361 `colour` (code): const halo = (colour, size) => {
- L362 `colour` (code): const m = new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L370 `colour` (code): const beam = (angle, colour) => {
- L373 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: beamMap, color: new GFX.Color(...colour), side: GFX.DoubleSide, opacity: 0.3, ...additive });
- L390 `colour` (code): const pool = (colour) => {
- L391 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: poolMap, color: new GFX.Color(...colour), opacity: 0.6, ...additive });
- L414 `centre` (code): const centre = [f.x, y + high, f.z];
- L415 `colour` (code): const colour = rgb(f.color ?? '#ffd59a');
- L417 `colour` (code): const crystal = new GFX.MeshStandardMaterial({ name: 'chandelier-crystal', color: new GFX.Color('#f4f0ff'), roughness: 0.05, metalness: 0.4, emissive:
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L420 `centre` (code): g.position.set(...centre);
- L464 `colour` (code): const h = halo(colour, 3.2);
- L470 `colour` (code): const p = pool(colour);
- L475 `centre` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L475 `colour` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L483 `colour` (code): tint(p.material, colour, 0.35);
- L484 `centre` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L484 `colour` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L495 `colours` (code): const colours = (f.colors ?? ['#ffd28a']).map(rgb);
- L520 `colours` (code): const c = colours[i % colours.length];
- L520 `colours` (code): const c = colours[i % colours.length];
- L531 `colour` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L531 `colours` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L540 `colours` (code): ctx.offer({ pos: mid, color: colours[0], intensity: 5, reach: 7 });
- L548 `colour` (code): const colour = rgb(f.color ?? venue.palette.lamp ?? '#ffb766');
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L565 `colour` (code): const h = halo(colour, 1.5);
- L572 `colour` (code): sources.push({ pos: at, colour, reach: f.reach ?? 5.5, strength: 0.9 });
- L579 `colour` (code): ctx.offer({ pos: at, color: colour, intensity: 6.5 * k, reach: 7 });
- L584 `colour` (comment): // ——— a PAR can on a post: a wash of colour, a shaft down, a pool where it lands. The can faces where its beam lands, lens first.
- L618 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.7 });
- L661 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.6 });
- L703 `colour` (code): sources.push({ pos: lens, colour: [0.9, 0.95, 1], reach: f.reach ?? 6, strength: 0.4 });
- L724 `centre` (code): const centre = [f.x, y + high, f.z];
- L726 `centre` (code): g.position.set(...centre);
- L761 `centre` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L761 `colour` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L789 `colour` (code): const colour = rgb(f.color ?? '#3aff7a');
- L790 `colour` (code): const material = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), opacity: 0.85, ...additive });
- L806 `colour` (code): const s = halo(colour, 0.35);
- L831 `colour` (code): const colour = f.color ?? f.colors?.[0] ?? '#ff3a8a';
- L833 `colour` (code): const tex = neonTexture(GFX, text, colour);
- L834 `colour` (code): const c = rgb(colour);
- L863 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.5 });
- L879 `colour` (code): const colour = rgb(f.color ?? '#f4f0ff');
- L895 `colour` (code): const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), toneMapped: false });
- L903 `colour` (code): const h = halo(colour, 1.6);
- L907 `colour` (code): const b = beam(0.035, colour);
- L911 `colour` (code): sources.push({ pos: from, colour, reach: f.reach ?? 4, strength: 0.6 });
- L922 `colour` (code): tint(b.material, colour, 0.5);
- L923 `colour` (code): ctx.offer({ pos: [from[0], from[1] + 0.6, from[2]], color: colour, intensity: 5, reach: 5 });
- L930 `colour` (code): const colour = rgb(f.color ?? '#fff4dc');
- L937 `colour` (code): const material = new GFX.MeshBasicMaterial({ map, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L945 `colour` (code): const b = beam(0.22, colour);
- L949 `colour` (code): sources.push({ pos: [tx, ground + 1, tz], colour, reach: f.reach ?? 5, strength: 0.8 });
- L954 `colour` (code): tint(material, colour, l);
- L955 `colour` (code): tint(b.material, colour, 0.35 * l);
- L956 `colour` (code): ctx.offer({ pos: [tx, ground + 1.4, tz], color: colour, intensity: 7 * l, reach: 6 });
- L961 `theatre` (comment): // ——— a theatre marquee: black letters on a lit board, bulbs chasing round its edge.
- L964 `colour` (code): const colour = f.color ?? '#ffd890';
- L965 `colour` (code): const c = rgb(colour);
- L1011 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.6 });
- L1026 `colour` (code): const colour = rgb(f.color ?? '#ffe2a8');
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1040 `colour` (code): const h = halo(colour, 2);
- L1045 `colour` (code): const b = beam(0.5, colour);
- L1049 `colour` (code): const p = pool(colour);
- L1053 `colour` (code): sources.push({ pos: lamp, colour, reach: f.reach ?? 6, strength: 0.9 });
- L1058 `colour` (code): tint(b.material, colour, 0.35 * out);
- L1059 `colour` (code): tint(p.material, colour, 0.5 * out);
- L1061 `colour` (code): ctx.offer({ pos: [lamp[0], lamp[1] - 0.2, lamp[2]], color: colour, intensity: 8 * out, reach: 8 });

## `src/scenery/lightshow.rocknroller-ii.js` (90)

- L7 `coloured` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L7 `colour` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L15 `colours` (comment): *            the floor, in colours that chase.
- L60 `colour` (comment): /** A colour as [r, g, b] each 0–1, linear enough for lights. */
- L72 `colour` (comment): * The colour a fixture shows at `beat`: it steps through its `colors`, one
- L213 `colour` (code): function neonTexture(GFX, text, colour) {
- L214 `colour` (string): return cached(`neon:${text}:${colour}`, () => {
- L225 `colour` (code): ctx.shadowColor = colour;
- L228 `colour` (code): ctx.strokeStyle = colour;
- L358 `colour` (comment): /** What every fixture offers the stage's lights: where, what colour, how bright, how far it carries. */
- L361 `colour` (code): const halo = (colour, size) => {
- L362 `colour` (code): const m = new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L370 `colour` (code): const beam = (angle, colour) => {
- L373 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: beamMap, color: new GFX.Color(...colour), side: GFX.DoubleSide, opacity: 0.3, ...additive });
- L390 `colour` (code): const pool = (colour) => {
- L391 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: poolMap, color: new GFX.Color(...colour), opacity: 0.6, ...additive });
- L414 `centre` (code): const centre = [f.x, y + high, f.z];
- L415 `colour` (code): const colour = rgb(f.color ?? '#ffd59a');
- L417 `colour` (code): const crystal = new GFX.MeshStandardMaterial({ name: 'chandelier-crystal', color: new GFX.Color('#f4f0ff'), roughness: 0.05, metalness: 0.4, emissive:
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L420 `centre` (code): g.position.set(...centre);
- L464 `colour` (code): const h = halo(colour, 3.2);
- L470 `colour` (code): const p = pool(colour);
- L475 `centre` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L475 `colour` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L483 `colour` (code): tint(p.material, colour, 0.35);
- L484 `centre` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L484 `colour` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L495 `colours` (code): const colours = (f.colors ?? ['#ffd28a']).map(rgb);
- L520 `colours` (code): const c = colours[i % colours.length];
- L520 `colours` (code): const c = colours[i % colours.length];
- L531 `colour` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L531 `colours` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L540 `colours` (code): ctx.offer({ pos: mid, color: colours[0], intensity: 5, reach: 7 });
- L548 `colour` (code): const colour = rgb(f.color ?? venue.palette.lamp ?? '#ffb766');
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L565 `colour` (code): const h = halo(colour, 1.5);
- L572 `colour` (code): sources.push({ pos: at, colour, reach: f.reach ?? 5.5, strength: 0.9 });
- L579 `colour` (code): ctx.offer({ pos: at, color: colour, intensity: 6.5 * k, reach: 7 });
- L584 `colour` (comment): // ——— a PAR can on a post: a wash of colour, a shaft down, a pool where it lands. The can faces where its beam lands, lens first.
- L618 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.7 });
- L661 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.6 });
- L703 `colour` (code): sources.push({ pos: lens, colour: [0.9, 0.95, 1], reach: f.reach ?? 6, strength: 0.4 });
- L724 `centre` (code): const centre = [f.x, y + high, f.z];
- L726 `centre` (code): g.position.set(...centre);
- L761 `centre` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L761 `colour` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L789 `colour` (code): const colour = rgb(f.color ?? '#3aff7a');
- L790 `colour` (code): const material = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), opacity: 0.85, ...additive });
- L806 `colour` (code): const s = halo(colour, 0.35);
- L831 `colour` (code): const colour = f.color ?? f.colors?.[0] ?? '#ff3a8a';
- L833 `colour` (code): const tex = neonTexture(GFX, text, colour);
- L834 `colour` (code): const c = rgb(colour);
- L863 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.5 });
- L879 `colour` (code): const colour = rgb(f.color ?? '#f4f0ff');
- L895 `colour` (code): const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), toneMapped: false });
- L903 `colour` (code): const h = halo(colour, 1.6);
- L907 `colour` (code): const b = beam(0.035, colour);
- L911 `colour` (code): sources.push({ pos: from, colour, reach: f.reach ?? 4, strength: 0.6 });
- L922 `colour` (code): tint(b.material, colour, 0.5);
- L923 `colour` (code): ctx.offer({ pos: [from[0], from[1] + 0.6, from[2]], color: colour, intensity: 5, reach: 5 });
- L930 `colour` (code): const colour = rgb(f.color ?? '#fff4dc');
- L937 `colour` (code): const material = new GFX.MeshBasicMaterial({ map, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L945 `colour` (code): const b = beam(0.22, colour);
- L949 `colour` (code): sources.push({ pos: [tx, ground + 1, tz], colour, reach: f.reach ?? 5, strength: 0.8 });
- L954 `colour` (code): tint(material, colour, l);
- L955 `colour` (code): tint(b.material, colour, 0.35 * l);
- L956 `colour` (code): ctx.offer({ pos: [tx, ground + 1.4, tz], color: colour, intensity: 7 * l, reach: 6 });
- L964 `colour` (code): const colour = f.color ?? '#ffd890';
- L965 `colour` (code): const c = rgb(colour);
- L1011 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.6 });
- L1026 `colour` (code): const colour = rgb(f.color ?? '#ffe2a8');
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1040 `colour` (code): const h = halo(colour, 2);
- L1045 `colour` (code): const b = beam(0.5, colour);
- L1049 `colour` (code): const p = pool(colour);
- L1053 `colour` (code): sources.push({ pos: lamp, colour, reach: f.reach ?? 6, strength: 0.9 });
- L1058 `colour` (code): tint(b.material, colour, 0.35 * out);
- L1059 `colour` (code): tint(p.material, colour, 0.5 * out);
- L1061 `colour` (code): ctx.offer({ pos: [lamp[0], lamp[1] - 0.2, lamp[2]], color: colour, intensity: 8 * out, reach: 8 });

## `src/scenery/lightshow.rocknroller-iii.js` (92)

- L7 `coloured` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L7 `colour` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L15 `colours` (comment): *            the floor, in colours that chase.
- L28 `theatre` (comment): *   marquee  a theatre marquee: black letters on a lit board, fixed to a
- L60 `colour` (comment): /** A colour as [r, g, b] each 0–1, linear enough for lights. */
- L72 `colour` (comment): * The colour a fixture shows at `beat`: it steps through its `colors`, one
- L213 `colour` (code): function neonTexture(GFX, text, colour) {
- L214 `colour` (string): return cached(`neon:${text}:${colour}`, () => {
- L225 `colour` (code): ctx.shadowColor = colour;
- L228 `colour` (code): ctx.strokeStyle = colour;
- L358 `colour` (comment): /** What every fixture offers the stage's lights: where, what colour, how bright, how far it carries. */
- L361 `colour` (code): const halo = (colour, size) => {
- L362 `colour` (code): const m = new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L367 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L370 `colour` (code): const beam = (angle, colour) => {
- L373 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: beamMap, color: new GFX.Color(...colour), side: GFX.DoubleSide, opacity: 0.3, ...additive });
- L390 `colour` (code): const pool = (colour) => {
- L391 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: poolMap, color: new GFX.Color(...colour), opacity: 0.6, ...additive });
- L414 `centre` (code): const centre = [f.x, y + high, f.z];
- L415 `colour` (code): const colour = rgb(f.color ?? '#ffd59a');
- L417 `colour` (code): const crystal = new GFX.MeshStandardMaterial({ name: 'chandelier-crystal', color: new GFX.Color('#f4f0ff'), roughness: 0.05, metalness: 0.4, emissive:
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L418 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L420 `centre` (code): g.position.set(...centre);
- L464 `colour` (code): const h = halo(colour, 3.2);
- L470 `colour` (code): const p = pool(colour);
- L475 `centre` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L475 `colour` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L483 `colour` (code): tint(p.material, colour, 0.35);
- L484 `centre` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L484 `colour` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L495 `colours` (code): const colours = (f.colors ?? ['#ffd28a']).map(rgb);
- L520 `colours` (code): const c = colours[i % colours.length];
- L520 `colours` (code): const c = colours[i % colours.length];
- L531 `colour` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L531 `colours` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L540 `colours` (code): ctx.offer({ pos: mid, color: colours[0], intensity: 5, reach: 7 });
- L548 `colour` (code): const colour = rgb(f.color ?? venue.palette.lamp ?? '#ffb766');
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L555 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L565 `colour` (code): const h = halo(colour, 1.5);
- L572 `colour` (code): sources.push({ pos: at, colour, reach: f.reach ?? 5.5, strength: 0.9 });
- L579 `colour` (code): ctx.offer({ pos: at, color: colour, intensity: 6.5 * k, reach: 7 });
- L584 `colour` (comment): // ——— a PAR can on a post: a wash of colour, a shaft down, a pool where it lands. The can faces where its beam lands, lens first.
- L618 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.7 });
- L661 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.6 });
- L703 `colour` (code): sources.push({ pos: lens, colour: [0.9, 0.95, 1], reach: f.reach ?? 6, strength: 0.4 });
- L724 `centre` (code): const centre = [f.x, y + high, f.z];
- L726 `centre` (code): g.position.set(...centre);
- L761 `centre` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L761 `colour` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L789 `colour` (code): const colour = rgb(f.color ?? '#3aff7a');
- L790 `colour` (code): const material = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), opacity: 0.85, ...additive });
- L806 `colour` (code): const s = halo(colour, 0.35);
- L831 `colour` (code): const colour = f.color ?? f.colors?.[0] ?? '#ff3a8a';
- L833 `colour` (code): const tex = neonTexture(GFX, text, colour);
- L834 `colour` (code): const c = rgb(colour);
- L863 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.5 });
- L879 `colour` (code): const colour = rgb(f.color ?? '#f4f0ff');
- L895 `colour` (code): const lensMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), toneMapped: false });
- L903 `colour` (code): const h = halo(colour, 1.6);
- L907 `colour` (code): const b = beam(0.035, colour);
- L911 `colour` (code): sources.push({ pos: from, colour, reach: f.reach ?? 4, strength: 0.6 });
- L922 `colour` (code): tint(b.material, colour, 0.5);
- L923 `colour` (code): ctx.offer({ pos: [from[0], from[1] + 0.6, from[2]], color: colour, intensity: 5, reach: 5 });
- L930 `colour` (code): const colour = rgb(f.color ?? '#fff4dc');
- L937 `colour` (code): const material = new GFX.MeshBasicMaterial({ map, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L945 `colour` (code): const b = beam(0.22, colour);
- L949 `colour` (code): sources.push({ pos: [tx, ground + 1, tz], colour, reach: f.reach ?? 5, strength: 0.8 });
- L954 `colour` (code): tint(material, colour, l);
- L955 `colour` (code): tint(b.material, colour, 0.35 * l);
- L956 `colour` (code): ctx.offer({ pos: [tx, ground + 1.4, tz], color: colour, intensity: 7 * l, reach: 6 });
- L961 `theatre` (comment): // ——— a theatre marquee: black letters on a lit board, bulbs chasing round its edge.
- L964 `colour` (code): const colour = f.color ?? '#ffd890';
- L965 `colour` (code): const c = rgb(colour);
- L1011 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.6 });
- L1026 `colour` (code): const colour = rgb(f.color ?? '#ffe2a8');
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1035 `colour` (code): const glassMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, colour[2]), toneMapped: false });
- L1040 `colour` (code): const h = halo(colour, 2);
- L1045 `colour` (code): const b = beam(0.5, colour);
- L1049 `colour` (code): const p = pool(colour);
- L1053 `colour` (code): sources.push({ pos: lamp, colour, reach: f.reach ?? 6, strength: 0.9 });
- L1058 `colour` (code): tint(b.material, colour, 0.35 * out);
- L1059 `colour` (code): tint(p.material, colour, 0.5 * out);
- L1061 `colour` (code): ctx.offer({ pos: [lamp[0], lamp[1] - 0.2, lamp[2]], color: colour, intensity: 8 * out, reach: 8 });

## `src/scenery/lightshow.rocknroller.js` (62)

- L7 `coloured` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L7 `colour` (comment): *   par      a PAR can: a coloured wash and a shaft of haze, changing colour
- L15 `colours` (comment): *            the floor, in colours that chase.
- L47 `colour` (comment): /** A colour as [r, g, b] each 0–1, linear enough for lights. */
- L59 `colour` (comment): * The colour a fixture shows at `beat`: it steps through its `colors`, one
- L181 `colour` (code): function neonTexture(GFX, text, colour) {
- L182 `colour` (string): return cached(`neon:${text}:${colour}`, () => {
- L193 `colour` (code): ctx.shadowColor = colour;
- L196 `colour` (code): ctx.strokeStyle = colour;
- L280 `colour` (comment): /** What every fixture offers the stage's lights: where, what colour, how bright, how far it carries. */
- L283 `colour` (code): const halo = (colour, size) => {
- L284 `colour` (code): const m = new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(...colour), opacity: 0.8, ...additive });
- L289 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L289 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L289 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L289 `colour` (code): const tint = (material, colour, k = 1) => material.color.setRGB(colour[0] * k, colour[1] * k, colour[2] * k);
- L292 `colour` (code): const beam = (angle, colour) => {
- L295 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: beamMap, color: new GFX.Color(...colour), side: GFX.DoubleSide, opacity: 0.3, ...additive });
- L312 `colour` (code): const pool = (colour) => {
- L313 `colour` (code): const material = new GFX.MeshBasicMaterial({ map: poolMap, color: new GFX.Color(...colour), opacity: 0.6, ...additive });
- L336 `centre` (code): const centre = [f.x, y + high, f.z];
- L337 `colour` (code): const colour = rgb(f.color ?? '#ffd59a');
- L339 `colour` (code): const crystal = new GFX.MeshStandardMaterial({ name: 'chandelier-crystal', color: new GFX.Color('#f4f0ff'), roughness: 0.05, metalness: 0.4, emissive:
- L340 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L340 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L340 `colour` (code): const flame = new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.3, colour[1] * 1.2, colour[2]), toneMapped: false });
- L342 `centre` (code): g.position.set(...centre);
- L386 `colour` (code): const h = halo(colour, 3.2);
- L392 `colour` (code): const p = pool(colour);
- L397 `centre` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L397 `colour` (code): sources.push({ pos: centre, colour, reach: f.reach ?? 8, strength: 1 });
- L405 `colour` (code): tint(p.material, colour, 0.35);
- L406 `centre` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L406 `colour` (code): ctx.offer({ pos: [f.x, centre[1] - 0.4, f.z], color: colour, intensity: 10, reach: f.reach ?? 9 });
- L417 `colours` (code): const colours = (f.colors ?? ['#ffd28a']).map(rgb);
- L442 `colours` (code): const c = colours[i % colours.length];
- L442 `colours` (code): const c = colours[i % colours.length];
- L453 `colour` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L453 `colours` (code): sources.push({ pos: mid, colour: colours[0], reach: f.reach ?? 6, strength: 0.6 });
- L462 `colours` (code): ctx.offer({ pos: mid, color: colours[0], intensity: 5, reach: 7 });
- L470 `colour` (code): const colour = rgb(f.color ?? venue.palette.lamp ?? '#ffb766');
- L477 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L477 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L477 `colour` (code): const glass = new GFX.Mesh(new GFX.SphereGeometry(0.1, 14, 10), new GFX.MeshBasicMaterial({ color: new GFX.Color(colour[0] * 1.2, colour[1] * 1.1, col
- L487 `colour` (code): const h = halo(colour, 1.5);
- L494 `colour` (code): sources.push({ pos: at, colour, reach: f.reach ?? 5.5, strength: 0.9 });
- L501 `colour` (code): ctx.offer({ pos: at, color: colour, intensity: 6.5 * k, reach: 7 });
- L506 `colour` (comment): // ——— a PAR can on a post: a wash of colour, a shaft down, a pool where it lands. The can faces where its beam lands, lens first.
- L540 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.7 });
- L583 `colour` (code): sources.push({ pos: lens, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: f.reach ?? 6, strength: 0.6 });
- L625 `colour` (code): sources.push({ pos: lens, colour: [0.9, 0.95, 1], reach: f.reach ?? 6, strength: 0.4 });
- L646 `centre` (code): const centre = [f.x, y + high, f.z];
- L648 `centre` (code): g.position.set(...centre);
- L683 `centre` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L683 `colour` (code): sources.push({ pos: centre, colour: rgb(f.colors?.[0] ?? defaults.colors[0]), reach: radius, strength: 0.5, glow: 0.4 });
- L711 `colour` (code): const colour = rgb(f.color ?? '#3aff7a');
- L712 `colour` (code): const material = new GFX.MeshBasicMaterial({ color: new GFX.Color(...colour), opacity: 0.85, ...additive });
- L728 `colour` (code): const s = halo(colour, 0.35);
- L753 `colour` (code): const colour = f.color ?? f.colors?.[0] ?? '#ff3a8a';
- L755 `colour` (code): const tex = neonTexture(GFX, text, colour);
- L756 `colour` (code): const c = rgb(colour);
- L785 `colour` (code): sources.push({ pos: at, colour: c, reach: f.reach ?? 5, strength: 0.5 });

## `src/scenery/maze.js` (2)

- L8 `neighbour` (comment): * knocked through into a neighbour (`braid`), so there are loops to dodge
- L213 `cellCentre` (code): cellCentre(i, j) {

## `src/scenery/oil.js` (10)

- L58 `grey` (string): const yellow = grainy('#e8b020', 0.18, 12), grey = grainy('#5a6068', 0.2, 12);
- L61 `grey` (code): s.mirror((m) => s.box([-1.6, 0.22, 0.5 + m * 0.42], [3.0, 0.07, 0.07], 0.02, { color: grey, mat: 'steel', k: 0.01 }));
- L64 `grey` (code): s.box([-1.8, 2.28, 0.5], [0.16, 0.08, 0.22], 0.03, { color: grey, mat: 'steel', k: 0.02 });
- L67 `grey` (code): s.box([-4.3, 0.55, 0.5], [0.3, 0.25, 0.25], 0.06, { color: grey, mat: 'steel', k: 0.02 });
- L71 `grey` (code): s.box([-3.5, 0.95, 0.5 + m * 0.42], [0.15, 0.55, 0.05], 0.05, { color: grey, mat: 'steel', k: 0.02, rot: [0, 0, 0.5] });
- L76 `grey` (code): s.cylinder([0.5, 0.25, 0.5], 0.16, 0.25, { color: grey, mat: 'steel', k: 0.02, round: 0.02 });
- L77 `grey` (code): for (const y of [0.12, 0.3, 0.48]) s.cylinder([0.5, y, 0.5], 0.21, 0.025, { color: grey, mat: 'steel', k: 0.01, round: 0.01 });
- L79 `grey` (code): s.limb([0.5, 0.36, 0.5], [0.5, 0.36, 0.8], 0.02, 0.02, { color: grey, mat: 'steel', k: 0.005 });
- L113 `colour` (comment): /** An oil drum: ribbed, its lid rimmed, a band of colour. */
- L146 `grey` (comment): /** A sunflower seed: grey-black with cream stripes from end to end. */

## `src/scenery/street.js` (5)

- L7 `colour` (comment): * frame) and where it gives light (`lights`: `[x, y, z, colour, reach]`).
- L159 `tyres` (comment): /** A stack of old tyres. */
- L160 `tyres` (code): export const tyres = {
- L161 `tyres` (string): name: 'tyres', cell: 0.03,
- L208 `tyres` (code): export const STREET = { statue, streetlamp, hydrant, mailbox, bench, bin, cone, tree, pine, shrub, rock, tyres, dumpster };

## `src/scenery/street.metrlol.js` (5)

- L7 `colour` (comment): * frame) and where it gives light (`lights`: `[x, y, z, colour, reach]`).
- L174 `tyres` (comment): /** A stack of old tyres. */
- L175 `tyres` (code): export const tyres = {
- L176 `tyres` (string): name: 'tyres', cell: 0.03,
- L214 `tyres` (code): export const STREET = { scooter, statue, streetlamp, hydrant, mailbox, bench, bin, cone, tree, pine, shrub, rock, tyres, dumpster };

## `src/scenery/vehicles.js` (9)

- L9 `colour` (comment): * colour from its `paint` material, so one bake does every colour of car.
- L9 `colour` (comment): * colour from its `paint` material, so one bake does every colour of car.
- L98 `tyre` (comment): * A wheel round the x axis at c, its face to `side` (+1: +x): the tyre
- L104 `tyre` (comment): * tyre's other sidewall and the back of the rim, its barrel and hub.
- L106 `tyre` (code): function tyre(s, c, r, w, side, { steel = false } = {}) {
- L111 `tyre` (comment): // The tyre: in (across, out) it is a rounded slab from the bead to the tread, the sidewalls bulging, the tread cut.
- L187 `tyre` (code): for (const { at, r, width, side: face } of wheels) tyre(s, at, r, width, face, { steel });
- L194 `tyre` (code): sculpt: (s) => tyre(s, [0, 0, 0], r, width, 1, { steel }),
- L505 `aluminium` (comment): // A box body on the chassis: its corner posts and rails in aluminium, ribbed along the sides, a roller door at the back.

## `src/scenery/vehicles.metrlol.js` (1)

- L7 `colour` (comment): * colour from its `paint` material, and has its `body` and `wheels` for

## `src/stage.js` (6)

- L107 `colour` (comment): *   - `sky`: a painted canvas round everything, or a colour (`backdrop`)
- L194 `grey` (comment): // Opaque all round: glass refracts whatever is behind it, and over nothing at all it would bend the renderer's stand-in grey.
- L205 `colour` (comment): // The fixtures nearest the ball: a light show sets where they are, what colour and how bright.
- L223 `towards` (comment): /** Where the key light comes from (a unit vector towards it, `lights.key.from`): move it to move the sun. */
- L226 `colour` (comment): /** Paints the sky round everything with `canvas` (or the backdrop colour if null). */
- L329 `centimetres` (comment): * surfaces laid a few centimetres apart (a road on the ground, a decal)

## `src/textures/blubber.js` (3)

- L5 `colour` (comment): * Roller's stone is: a colour map near white (the tile's colour comes from
- L5 `colour` (comment): * Roller's stone is: a colour map near white (the tile's colour comes from
- L6 `colours` (comment): * the vertex colours under it) and a bump map that raises what stands out.

## `src/textures/bog.js` (1)

- L137 `Colours` (comment): /** The bog's material; keep `uniforms.uTime.value` going to keep it brewing. Colours are linear RGB. */

## `src/textures/earth/map.js` (1)

- L103 `colour` (comment): * (transparent) sea. The alpha is what matters; the colour is the frost.

## `src/textures/facades.js` (11)

- L3 `storey` (comment): * photographs of real buildings: one storey of one bay, `TILE` metres square, to be
- L3 `metres` (comment): * photographs of real buildings: one storey of one bay, `TILE` metres square, to be
- L9 `grey` (comment): * - `curtain`: a glass curtain wall. Three panes of blue-grey reflective glass a
- L10 `storey` (comment): *   storey, each with its own tone and the soft reflection of sky and cloud (and a
- L12 `storey` (comment): *   and a spandrel panel at the foot of each storey, with the slab line across it.
- L23 `Colours` (comment): * Colours are neutral enough to be tinted by the vertex colour of the building
- L23 `colour` (comment): * Colours are neutral enough to be tinted by the vertex colour of the building
- L34 `metres` (comment): /** How many metres one tile spans, across and up. */
- L58 `grey` (comment): // Vision glass: a deep blue-grey with the sky in it, lighter high up, cloud and the street opposite as soft patches.
- L105 `storey` (comment): // The horizontal panel joint at the foot of the storey, and one halfway up.
- L125 `storey` (comment): // The glass bay: tall, in a silver frame with a transom at each storey, blue-green with the sky in it.

## `src/textures/foliage.js` (6)

- L4 `grey` (comment): * square of it each. Painted in pale, nearly grey green, light and dark leaf by leaf, so the vertex colour (a
- L4 `colour` (comment): * square of it each. Painted in pale, nearly grey green, light and dark leaf by leaf, so the vertex colour (a
- L10 `colour` (comment): * The clear ground takes the colour of the leaves round it, so a mip level that blends in a clear pixel does not
- L104 `colour` (comment): // The clear ground: the colour of the nearest leaves, spread out a few times, so the mips keep the leaves' colour.
- L104 `colour` (comment): // The clear ground: the colour of the nearest leaves, spread out a few times, so the mips keep the leaves' colour.
- L121 `colour` (comment): // Past that, the leaves' mean colour.

## `src/textures/ground.js` (7)

- L2 `colour` (comment): * Ground, painted the way the granite is: not as noise with a colour on it
- L13 `metres` (comment): * through with its stones. A tile wraps in both directions, `TILE.turf` metres
- L20 `colour` (comment): * running bond, every one its own colour and speckle with the kiln's dark flash
- L31 `metres` (comment): /** How many metres one tile of each spans. */
- L228 `grey` (code): grey: [[0.4, [150, 150, 148]], [0.3, [128, 128, 128]], [0.2, [170, 168, 162]], [0.1, [104, 104, 106]]],
- L234 `grey` (comment): * @param options `size` (2048); `kind`: 'brick', 'grey' or 'tan'; `wear` (0 to 1, how much grime and moss is in the joints, 0.4); `seed`
- L235 `metres` (comment): *   One tile is 8 bricks across (200 mm by 100 mm, with a joint of 5 mm) and 16 rows: `TILE.pavers` metres.

## `src/textures/jupiter/layout.js` (3)

- L2 `colour` (comment): * Jupiter's clouds as a 2:1 colour layout, rows from 90N down, columns from
- L9 `jrLXwbtyReXqGOaptcHn` (string): export const JUPITER_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2
- L9 `NdGWaKjGrEYdJKKV` (string): export const JUPITER_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2

## `src/textures/kitchen.js` (3)

- L52 `grey` (comment): * Honed Calacatta: warm white, soft grey clouding, and the long grey veins
- L52 `grey` (comment): * Honed Calacatta: warm white, soft grey clouding, and the long grey veins
- L149 `colour` (comment): /** The glaze is never quite even: a few soft pools of deeper colour on every tile. */

## `src/textures/lava.js` (16)

- L6 `colour` (comment): * hottest in the middle of them, the colour of the heat — red, orange,
- L48 `colour` (comment): // The colour of the heat, 0 (dull red) to 1 (nearly white).
- L409 `colour` (code): vec3 colour = heat(temperature);
- L411 `colour` (code): colour = mix(colour * 0.58, colour, coolingRim * 0.65);
- L411 `colour` (code): colour = mix(colour * 0.58, colour, coolingRim * 0.65);
- L411 `colour` (code): colour = mix(colour * 0.58, colour, coolingRim * 0.65);
- L422 `colour` (code): colour += vec3(1.0, 0.82, 0.55) * spec * 1.7 * smoothstep(0.1, 0.5, mask);
- L423 `colour` (code): gl_FragColor = vec4(colour * 1.12, mask);
- L521 `colour` (code): var colour = heat(temperature);
- L523 `colour` (code): colour = mix(colour * 0.58, colour, coolingRim * 0.65);
- L523 `colour` (code): colour = mix(colour * 0.58, colour, coolingRim * 0.65);
- L523 `colour` (code): colour = mix(colour * 0.58, colour, coolingRim * 0.65);
- L532 `colour` (code): colour += vec3f(1.0, 0.82, 0.55) * spec * 1.7 * smoothstep(0.1, 0.5, mask);
- L533 `colour` (code): return vec4f(colour * 1.12, mask);
- L600 `colourSpace` (code): const make = (data, colourSpace, wrapT) => {
- L602 `colourSpace` (code): tex.colorSpace = colourSpace;

## `src/textures/lavapit.js` (3)

- L32 `colour` (comment): // Turns a colour round the grey axis by a radians, keeping how bright it is.
- L32 `grey` (comment): // Turns a colour round the grey axis by a radians, keeping how bright it is.
- L313 `centred` (comment): * `width` by `depth` across and `sink` deep, centred on the origin with its

## `src/textures/mars/relief.js` (4)

- L10 `XGreYLZAFbYVpJayQaHrxitIskn` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `kERbyndlUGmPr` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `TyrexLAXz` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `tyReyqeMECV` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA

## `src/textures/moon/relief.js` (5)

- L10 `kErBTuecZUck` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `IHIGrEYKuFUY` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `szrDAgREyf` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `OWOTaGrEYfzGAGQO` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA
- L10 `hygRey` (string): export const RELIEF_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/wA

## `src/textures/painters.js` (52)

- L8 `Colour` (comment): * tile across and high, and each comes with a `bump` map. Colour mostly comes
- L150 `grey` (code): export const grey = (v) => [v, v, v].map((x) => Math.max(0, Math.min(255, x)));
- L161 `colour` (comment): /** Fine grain over a painted map, shared with its bump, so the speckle in the colour and the speckle in the relief agree. */
- L236 `grey` (code): return grey(Math.round(255 * k * joint));
- L282 `colour` (comment): * decoded the maps show `base`, a plain board colour; then they are painted again
- L306 `colour` (comment): /** The photograph's colour at (x, y), wrapping, from its pixel data. */
- L373 `grey` (code): return grey(Math.round(255 * k));
- L378 `theatre` (comment): /** Carpet: a field of woven pile with a diamond pattern laid in it. The theatre. */
- L388 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L407 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L418 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L433 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L445 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L480 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L496 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L509 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L527 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L540 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L551 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L563 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L578 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L590 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L606 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L618 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L625 `stencilled` (comment): /** Plywood: a sheet to the tile, screwed to the studs, with a stencilled mark. The garage. */
- L653 `grey` (code): return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
- L665 `grey` (code): return grey(Math.round(255 * k));
- L677 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L692 `grey` (code): return grey(Math.round(255 * k));
- L697 `theatre` (comment): /** Damask paper over panelling, with a gold rail: the theatre's walls. */
- L707 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L722 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L736 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L774 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L788 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L818 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L826 `storey` (comment): * fine. At a town's scale a tile is about a storey, so a wall shows three or
- L827 `storey` (comment): * four courses to a storey. The courses tile across and up; with `level`
- L851 `grey` (code): if (e < 1.1) return grey(Math.round(255 * (relief ? 0.08 : 0.5)));
- L855 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L886 `grey` (code): return grey(Math.round(255 * k));
- L890 `grey` (code): if (relief) return grey(Math.round(255 * Math.min(1, k)));
- L914 `grey` (code): return grey(Math.round(255 * Math.max(0, Math.min(1, k))));
- L932 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L937 `stencilled` (comment): /** The back of the set: scenery flats from behind, canvas on a timber frame, braced, stencilled with the stage. */
- L947 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L975 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L987 `grey` (code): return grey(Math.round(255 * Math.min(1, Math.max(0, k))));
- L1000 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L1033 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L1047 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L1058 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));

## `src/textures/pixel-kit.js` (9)

- L6 `colour` (comment): * step that puts finished pixels on a canvas as a colour map and a bump map.
- L33 `colour` (comment): /** The pixels being painted: colour (0 to 255, three floats), and a height (0 to 1). */
- L174 `colour` (comment): /** Pixels on a canvas: a colour map of its own and a bump map, both wrapping. */
- L178 `grey` (code): const grey = new Uint8ClampedArray(pixels.size * pixels.size * 4);
- L179 `grey` (code): for (let i = 0; i < pixels.height.length; i++) { grey[i * 4] = grey[i * 4 + 1] = grey[i * 4 + 2] = pixels.height[i]; grey[i * 4 + 3] = 255; }
- L179 `grey` (code): for (let i = 0; i < pixels.height.length; i++) { grey[i * 4] = grey[i * 4 + 1] = grey[i * 4 + 2] = pixels.height[i]; grey[i * 4 + 3] = 255; }
- L179 `grey` (code): for (let i = 0; i < pixels.height.length; i++) { grey[i * 4] = grey[i * 4 + 1] = grey[i * 4 + 2] = pixels.height[i]; grey[i * 4 + 3] = 255; }
- L179 `grey` (code): for (let i = 0; i < pixels.height.length; i++) { grey[i * 4] = grey[i * 4 + 1] = grey[i * 4 + 2] = pixels.height[i]; grey[i * 4 + 3] = 255; }
- L181 `grey` (code): hctx.putImageData(new ImageData(grey, pixels.size, pixels.size), 0, 0);

## `src/textures/road.js` (12)

- L3 `colour` (comment): * colour on it but as what the material is made of.
- L9 `grey` (comment): * grain (an irregular, faceted, domed particle of grey granite, dark diorite,
- L18 `grey` (comment): * Concrete is cement paste with sand in it: a mottled warm grey, the fine
- L26 `metres` (comment): * say how many metres. The maps are painted at 2048 by default, about a
- L27 `millimetre` (comment): * millimetre a pixel for asphalt, so a stone is ten pixels across and has its own
- L32 `grey` (comment): * height }`, RGBA and one grey byte a pixel) with no canvas, so they run under
- L40 `metres` (comment): /** How many metres one tile of each spans, for laying it on a street. */
- L44 `grey` (code): { w: 0.4, rgb: [128, 127, 124] }, // grey granite
- L57 `grey` (comment): *   - `age`: 0 fresh and black, 1 grey and worn to its stones (0.5)
- L85 `greyer` (comment): // The mastic: binder with sand in it, darker where it is fresh, greyer where the sun has had it.
- L209 `grey` (comment): // The paste: warm grey, clouded by the water in the mix and by the way it was floated.
- L234 `colour` (comment): // Pebbles: where the paste has worn off the coarse aggregate, round stones, each its own colour, ringed by the paste it sits in.

## `src/textures/roofing.js` (9)

- L12 `metres` (comment): * `TILE.shingles` metres across, `u` along the eave and `v` up the slope.
- L14 `grey` (comment): * A membrane is a single-ply flat roof: sheets of white, grey, black or tan
- L18 `metres` (comment): * metres across.
- L27 `metres` (comment): /** How many metres one tile of each spans. */
- L33 `grey` (code): grey: [[0.4, [112, 112, 114]], [0.3, [96, 98, 100]], [0.18, [128, 126, 124]], [0.12, [82, 84, 88]]],
- L39 `grey` (comment): * @param options `size` (2048); `color`: 'charcoal', 'brown', 'grey' or 'green'; `age` (0 new, 1 old and streaked, 0.4); `seed`
- L49 `colour` (comment): // One colour for each tab of each course.
- L84 `grey` (code): white: [212, 212, 208], grey: [150, 152, 154], black: [46, 46, 48], tan: [186, 168, 138],
- L89 `grey` (comment): * @param options `size` (2048); `tone`: 'white', 'grey', 'black' or 'tan'; `age` (0 new, 1 dirty and stained, 0.45); `seed`

## `src/textures/rooms/house.js` (2)

- L24 `colour` (code): const glow = (x, y, r, colour) => {
- L26 `colour` (code): g.addColorStop(0, colour);

## `src/textures/rooms/parlour.js` (3)

- L25 `colour` (code): const glow = (x, y, r, colour, alpha) => {
- L27 `colour` (string): g.addColorStop(0, `rgba(${colour}, ${alpha})`);
- L28 `colour` (string): g.addColorStop(1, `rgba(${colour}, 0)`);

## `src/textures/rooms/softbox.js` (1)

- L3 `grey` (comment): * grey to a dark floor below the horizon, and two soft lights high up, one

## `src/textures/rooms/studio.js` (3)

- L20 `colour` (code): const box = (x, y, w, h, colour, glow) => {
- L22 `colour` (code): ctx.shadowColor = colour;
- L24 `colour` (code): ctx.fillStyle = colour;

## `src/textures/rooms/town.js` (5)

- L16 `colour` (code): const glow = (x, y, rr, colour) => {
- L18 `colour` (code): g.addColorStop(0, colour);
- L24 `colours` (code): const colours = ['rgba(255,170,80,0.8)', 'rgba(255,60,60,0.6)', 'rgba(255,200,120,0.7)', 'rgba(80,200,255,0.5)', 'rgba(255,170,80,0.8)', 'rgba(255,120
- L25 `colours` (code): for (let k = 0; k < 12; k++) glow(width * (0.04 + k * 0.083), height * (0.38 + (k % 3) * 0.05), height * 0.06, colours[k % colours.length]);
- L25 `colours` (code): for (let k = 0; k < 12; k++) glow(width * (0.04 + k * 0.083), height * (0.38 + (k % 3) * 0.05), height * 0.06, colours[k % colours.length]);

## `src/textures/rooms/vault.js` (3)

- L3 `grey` (comment): * warm light low down from torches somewhere, a cold grey shaft from above.
- L20 `colour` (code): const glow = (x, y, r, colour) => {
- L22 `colour` (code): g.addColorStop(0, colour);

## `src/textures/rooms/venue.js` (4)

- L3 `colours` (comment): * ceiling, the venue's colours in a ring of lights round the walls, and a
- L20 `colour` (code): const glow = (x, y, r, colour) => {
- L22 `colour` (code): g.addColorStop(0, colour);
- L28 `colours` (comment): // With `strips`, strip lights overhead too, and the ring of colours fuller: what a stop's chrome catches (the moods').

## `src/textures/skies/cloudsea.js` (13)

- L87 `COLOURS` (code): const STAR_COLOURS = ['#ffffff', '#ffffff', '#dfe9ff', '#c4d6ff', '#fff2dc', '#ffd9b0'];
- L88 `COLOURS` (code): const LAMP_COLOURS = ['#ffc47a', '#ffd9a3', '#ffb062', '#ffe6c2'];
- L97 `colour` (comment): /** The plain sky, horizon and dark below, from the zenith down: latitude → colour. */
- L108 `colour` (comment): /** The colour of the plain sky at a latitude, as 0–255 RGB, eased from one stop of the ramp to the next. */
- L109 `skyColour` (code): export function skyColour(lat) {
- L394 `colour` (code): function speck(x, y, rx, ry, colour, alpha) {
- L395 `colour` (code): ctx.fillStyle = rgba(colour, alpha);
- L410 `skyColour` (code): ctx.fillStyle = rgba(skyColour(Math.PI / 2 - (y + 0.5) / k), 1);
- L416 `COLOURS` (code): const lamps = LAMP_COLOURS.map(rgb);
- L447 `COLOURS` (code): const stars = STAR_COLOURS.map(rgb);
- L453 `colour` (code): const colour = stars[Math.floor(random() * stars.length)];
- L458 `colour` (code): if (m > 0.45) speck(x, y, r * 2.6 * stretch, r * 2.6, colour, alpha * 0.12);
- L459 `colour` (code): speck(x, y, r * stretch, r, colour, alpha);

## `src/textures/skies/cosmos.js` (12)

- L5 `colour` (comment): * a handful with a glint of colour.
- L18 `colours` (comment): /** The colours the nebula drifts between. */
- L34 `coloured` (comment): /** The plain ramp, by elevation in radians — also what a canvasless backdrop is coloured with. */
- L35 `cosmosColour` (code): export function cosmosColour(elevation) {
- L126 `cosmosColour` (code): const sky = cosmosColour(elevation);
- L133 `colours` (comment): /** Round the colours continuously, so two drifts never meet at a seam. */
- L136 `colour` (code): const colour = mix(NEBULA[k % NEBULA.length], NEBULA[(k + 1) % NEBULA.length], along - k);
- L139 `colour` (code): img.data[i] = lerp(sky[0], colour[0], amount * 0.75);
- L140 `colour` (code): img.data[i + 1] = lerp(sky[1], colour[1], amount * 0.75);
- L141 `colour` (code): img.data[i + 2] = lerp(sky[2], colour[2], amount * 0.75);
- L164 `colour` (code): const colour = hue < 0.08 ? '255, 214, 170' : hue < 0.16 ? '190, 210, 255' : hue < 0.2 ? '255, 190, 240' : '255, 250, 245';
- L165 `colour` (string): ctx.fillStyle = `rgba(${colour}, ${alpha})`;

## `src/textures/skies/horizons.js` (15)

- L7 `colour` (comment): * colour, with a `glow` of its own colour where the place has one):
- L7 `colour` (comment): * colour, with a `glow` of its own colour where the place has one):
- L35 `colour` (code): sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
- L35 `colour` (code): sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
- L47 `colour` (code): const ridge = (f, colour) => {
- L48 `colour` (code): ctx.fillStyle = colour;
- L70 `colour` (code): const glowAt = (x, y, r, a = 0.5, colour = glow) => {
- L72 `colour` (code): rg.addColorStop(0, rgba(colour, a));
- L73 `colour` (code): rg.addColorStop(1, rgba(colour, 0));
- L78 `colour` (code): const mist = (colour, a = 0.35, rise = 40) => {
- L80 `colour` (code): mg.addColorStop(0, rgba(colour, 0));
- L81 `colour` (code): mg.addColorStop(1, rgba(colour, a));
- L86 `colour` (code): const plume = (x, y, colour, a = 0.25, puffs = 9, drift = 14) => {
- L90 `colour` (code): pg.addColorStop(0, rgba(colour, a * (1 - i / (puffs + 2))));
- L91 `colour` (code): pg.addColorStop(1, rgba(colour, 0));

## `src/textures/skies/skyline.js` (5)

- L8 `colour` (comment): * colour): rolling `hills`, range behind range, with a town's lights on
- L24 `colour` (code): sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
- L24 `colour` (code): sky.forEach((colour, i) => g.addColorStop(i / (sky.length - 1), colour));
- L33 `colour` (code): const ridge = (f, colour) => {
- L34 `colour` (code): ctx.fillStyle = colour;

## `src/textures/skies/town.js` (2)

- L14 `centres` (comment): * city's towers stand there instead, with data centres and their status
- L87 `centres` (comment): // Data centres: long low sheds, rows of blue and green lights along them.

## `src/textures/skyfinish.js` (3)

- L10 `colour` (comment): /** How bright a colour is, 0 to 1. */
- L16 `colours` (comment): /** Whether a sky (its colours top to bottom) is a night one. */
- L146 `colours` (comment): /** The sky's backdrop, finished: haze over the horizon, stars and the moon or clouds, as the sky's colours say. */

## `src/textures/town/paint.js` (46)

- L3 `kerbs` (comment): * (lawn, paving slabs, shingles, tar paper, pool tiles, kerbs).
- L11 `Colour` (comment): * tile across and high, and each comes with a `bump` map. Colour mostly comes
- L16 `grey` (code): import { grainFields, asphalt, azulejo, belt, block, canvas, canvasWall, carpet, checker, clapboard, cliff, cobble, concrete, corrugated, curtain, dam
- L58 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L75 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L93 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L105 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L115 `grey` (code): if (relief) return grey(Math.round(128 + (m(u, v) - 0.5) * 30));
- L132 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L137 `kerb` (comment): /** The face of a kerb: poured concrete, a rounded lip along the top, scuffed black where the tyres rub. */
- L137 `tyres` (comment): /** The face of a kerb: poured concrete, a rounded lip along the top, scuffed black where the tyres rub. */
- L138 `kerb` (code): function kerb(GFX) {
- L144 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L150 `kerb` (code): Object.assign(WALLS, { kerb, pooltile });
- L155 `storey` (comment): * A building's face, one tile across and one storey high (the canvas is
- L156 `storey` (comment): * as tall as a storey is, so nothing stretches): its wall, and its windows
- L169 `storey` (comment): * A storey's face, drawn in the 256-unit design (`draw` takes design units; a
- L173 `storey` (code): function facadeCanvas(storey, draw) {
- L174 `storey` (code): const W = 256, H = Math.round(256 * storey);
- L185 `storey` (code): const storey = 1.6;
- L231 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L231 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L234 `storey` (comment): /** An office storey: a band of glass between mullions, a spandrel panel under it. */
- L236 `storey` (code): const storey = 0.9;
- L249 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L249 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L254 `storey` (code): const storey = 1.2;
- L273 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L273 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L278 `storey` (code): const storey = 2.4;
- L288 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L288 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L293 `storey` (code): const storey = 1.0;
- L307 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L307 `storey` (code): return { map: texture(GFX, facadeCanvas(storey, draw)(false)()), bump: texture(GFX, facadeCanvas(storey, draw)(true)(), { srgb: false }) };
- L311 `storey` (code): house: { storey: 1.6, paint: (GFX) => houseFace(GFX) },
- L312 `storey` (code): 'house-door': { storey: 1.6, paint: (GFX) => houseFace(GFX, { door: true }) },
- L313 `storey` (code): gable: { storey: 1.6, paint: (GFX) => houseFace(GFX, { plain: true }) },
- L314 `storey` (code): office: { storey: 0.9, paint: officeFace },
- L315 `storey` (code): brick: { storey: 1.2, paint: brickFace },
- L316 `storey` (code): shop: { storey: 2.4, paint: shopFace },
- L317 `storey` (code): garage: { storey: 1.0, paint: garageFace },
- L333 `grey` (code): return grey(Math.round(255 * Math.min(1, k)));
- L345 `grey` (code): return grey(Math.round(255 * k));
- L428 `stencilled` (comment): /** A roll-up shutter: ribbed steel, scuffed, with CLOSED SET stencilled across it and hazard stripes at the foot. */
- L526 `colour` (comment): /** A soft round glow, for halos. White in the middle, clear at the edge: tint it with the material's colour. */

## `src/textures/town/surfaces.js` (3)

- L4 `neighbour` (comment): * the sides where it stands above its neighbour — and how it rolls.
- L17 `colour` (comment): * - `map`: its colour on the map in the corner.
- L25 `kerb` (string): sidewalk: { tex: 'slabs', top: '#c4bcac', wtex: 'kerb', wall: '#b0a898', drag: 0.55, grip: 1, map: '#a49e90' },

## `src/textures/town/textures.js` (2)

- L6 `colour` (comment): * floor texture (`paint.js`) and its bump, the colour and the night's light
- L7 `colours` (comment): * in the vertex colours, and how it shines — oil and puddles and tar

## `src/textures/venue.js` (10)

- L16 `colours` (comment): * flyer (null for a band off the bill), in one of `colours`; the bill's flyer
- L17 `billColours` (comment): * is in one of `billColours`, lettered in `billInk`; `badge` is stamped on the
- L18 `stencilled` (comment): * small one; `shutter` is the two words stencilled on a roll-up door. As
- L24 `colours` (code): colours: ['#c8302a', '#2a4a8a', '#e8a020'],
- L25 `billColours` (code): billColours: ['#1a1a20', '#3a5a3a', '#6a2a6a'],
- L63 `colour` (comment): // A flyer: a bold block of colour, a big shape, a name in poster letters, tape at the corners.
- L95 `colours` (code): flyer(10, 18, 104, 138, pick(BILL.colours), '#ffffff', BILL.headline ?? pick(BILL.bands), 'sun', -0.05);
- L96 `billColours` (code): flyer(134, 96, 112, 142, pick(BILL.billColours), BILL.billInk, pick(BILL.bands.filter((b) => b !== BILL.headline)), 'bolt', 0.04);
- L189 `stencilled` (comment): /** A roll-up shutter: ribbed steel, scuffed, with two words stencilled across it (BILL.shutter: CLOSED SET, STAFF ONLY) and hazard stripes at the foo
- L287 `colour` (comment): /** A soft round glow, for halos. White in the middle, clear at the edge: tint it with the material's colour. */

## `src/textures/wood.js` (29)

- L3 `colour` (comment): * species and a finish, a colour map and a bump map, painted at DETAIL, one
- L4 `metre` (comment): * repeat of the map a metre of board, grain along u.
- L9 `fibres` (comment): * The finishes: `raw` (the sawn surface, fibres and open pores), `sanded` (the
- L15 `fibres` (comment): * latewood in the dark band of each ring, fibres that run the length of the
- L18 `Colours` (comment): * Colours are the species' heartwood and sapwood, as a woodworker would name
- L31 `colour` (comment): * The species. `heart` is the darker heartwood, `base` the typical colour of the
- L33 `metre` (comment): * metre; `late` how dark the latewood is (0 for a diffuse-porous wood, which has
- L37 `colours` (comment): // Walnut and ash: colours sampled from reference photographs (see docs/wood.md). Walnut's maps are the photograph itself.
- L39 `greyed` (comment): // Not sampled yet: the reference photograph is greyed, so these are approximate.
- L56 `fibres` (comment): * steps: a wood's figure is soft gradients plus fine fibres). `band` is the
- L58 `fibre` (comment): * sharpened by the species' latewood; `fibre` is fine noise stretched along u so
- L69 `centre` (comment): // The cathedral: the rings bend toward the centre of the cut, and drift along the board.
- L80 `fibres` (comment): // The fibres follow the rings' bend and break up along the board: long, irregular, not scanlines.
- L81 `fibre` (code): fibre: fine(u * 0.06, v + warp * 0.15) * 0.7 + finer(u * 0.04, v + warp * 0.1) * 0.3,
- L94 `colour` (code): const colour = document.createElement('canvas');
- L95 `colour` (code): colour.width = colour.height = DETAIL;
- L95 `colour` (code): colour.width = colour.height = DETAIL;
- L98 `colour` (code): const map = texture(GFX, colour, { wrap: true });
- L103 `colour` (code): const ctx = colour.getContext('2d', { willReadFrequently: true });
- L126 `colour` (comment): // Under node there is no canvas: the material is the colour alone.
- L133 `fibreDepth` (code): const fibreDepth = sanded ? 0.45 : 1;
- L135 `colour` (code): const colour = (u, v) => {
- L137 `colour` (comment): // Heartwood to the typical board colour, the latewood darker, and the sapwood's pale flush in the figure.
- L141 `fibre` (code): const streak = (f.fibre - 0.5) * 16 * fibreDepth;
- L141 `fibreDepth` (code): const streak = (f.fibre - 0.5) * 16 * fibreDepth;
- L148 `fibre` (code): const h = 0.5 + f.late * 0.1 + (f.fibre - 0.5) * 0.25 * fibreDepth - ramp(0.72, 0.82, f.pore) * 0.2 * porosity;
- L148 `fibreDepth` (code): const h = 0.5 + f.late * 0.1 + (f.fibre - 0.5) * 0.25 * fibreDepth - ramp(0.72, 0.82, f.pore) * 0.2 * porosity;
- L153 `colour` (code): map: texture(GFX, pixels(DETAIL, colour)),
- L159 `colour` (comment): * The colour and bump maps of `species` in `finish` (one of WOOD_FINISHES),

## `src/textures/wood/walnut-photo.js` (4)

- L10 `xpkTyrEyPLa` (string): export const WALNUT_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2w
- L10 `rCgREyDMbE` (string): export const WALNUT_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2w
- L10 `TyrEA` (string): export const WALNUT_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2w
- L10 `KnCRlYorCgREyDMbE` (string): export const WALNUT_JPEG = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2w

## `src/vehicles/driving.js` (5)

- L3 `metres` (comment): * and its wheels, and gets `update(dt, input)`, `reset()` and its state. Everything is worked out in metres, seconds
- L4 `metre` (comment): * and radians, and put in the game's units (`scale` to the metre) on the way out.
- L9 `metres` (comment): * `wheelbase` what it turns about (front to back wheels, in metres), and `maxStep` the longest step it takes at once.
- L23 `Metres` (comment): /** Metres a second, forward positive. */
- L35 `metres` (comment): * `group` and rolls the wheels. Returns `speed` in metres a second.

## `src/vehicles/electric-bus.js` (1)

- L165 `centre` (string): add('led_bar_centre', box(1.82, 0.13, 0.10), M.led, [0, 1.88, -6.13]);

## `src/vehicles/electric-car.js` (6)

- L6 `metres` (comment): * at real size, in metres, and drives through the same model as the freighter (`vehicles/driving`) on numbers of its
- L17 `metre` (comment): * sets how big a metre is in the game's units (0.41 sits it in the town's traffic).
- L23 `metres` (comment): /** The car's measures, in metres. */
- L41 `metres` (comment): /** How it drives, in metres, seconds and radians (see `vehicles/driving` for what each is). 38 m/s is 137 km/h. */
- L66 `metre` (comment): * @param {number} [options.scale] Game units to the metre (default 1).
- L180 `centre` (string): add('led_bar_centre', box(1.14, 0.08, 0.055), M.led, [0, 0.715, 3.35]);

## `src/vehicles/freighter.js` (8)

- L4 `metres` (comment): * at the back run on duals). It is built from plain shapes at real size, in metres, as the putter and the swords are,
- L17 `metre` (comment): * `scale` sets how big a metre is in the game's units (the traffic is about 0.4 of a tile to the metre, so a freighter
- L17 `metre` (comment): * `scale` sets how big a metre is in the game's units (the traffic is about 0.4 of a tile to the metre, so a freighter
- L18 `metres` (comment): * there is `scale: 0.41`). The driving is worked out in metres and seconds and put in the game's units on the way out:
- L25 `metres` (comment): /** The truck's measures, in metres. */
- L44 `metres` (comment): * How it drives, in metres, seconds and radians. Speeds are m/s (22 is 79 km/h); `accel`, `brake`, `coast` and
- L68 `metre` (comment): * @param {number} [options.scale] Game units to the metre (default 1).
- L146 `centre` (string): add('led_bar_centre', box(1.82, 0.13, 0.10), M.led, [0, 1.86, -6.18]);

## `src/vehicles/index.js` (1)

- L2 `metres` (comment): * The vehicles you drive: built at real size, in metres, with their wheels that roll and steer and the model

## `src/venue/dig.js` (3)

- L176 `centre` (code): const centre = (start, sign) => (sign > 0 ? start - lo : start + lo + width - 1);
- L180 `centre` (code): cur.z = centre(p.z, lz);
- L183 `centre` (code): cur.x = centre(p.x, lx);

## `src/venue/foemesh.js` (1)

- L76 `colour` (comment): /** A plain figure for a foe with no model (yet): a capsule and a head, in a colour by how it gets about. */

## `src/venue/helpers.js` (3)

- L41 `centre` (code): export const centre = (p) => p.tile(Math.floor(p.length / 2), 0);
- L47 `colour` (comment): * A wash of colour on a room: PAR cans on its back wall, each aimed at the
- L51 `centre` (code): const mid = centre(p);

## `src/venue/scenery.js` (10)

- L138 `colour` (comment): /** A target on the floor to roll onto: rings and chevrons pointing in, in a spotlight's colour. */
- L177 `colour` (code): function doorSign(GFX, width, word, colour) {
- L183 `colour` (code): ctx.fillStyle = colour;
- L184 `colour` (code): ctx.shadowColor = colour;
- L214 `colour` (code): const colour = venue.palette.exit ?? '#ff3fa4';
- L219 `colour` (code): new GFX.MeshBasicMaterial({ name: 'target', map, color: new GFX.Color(map ? '#ffffff' : colour), transparent: true, depthWrite: false, toneMapped: fal
- L225 `colour` (code): ring.material.color.set(colour);
- L244 `colour` (code): const glow = new GFX.MeshStandardMaterial({ name: 'door-lamp', color: new GFX.Color(colour), emissive: new GFX.Color(colour), emissiveIntensity: 2.2 }
- L244 `colour` (code): const glow = new GFX.MeshStandardMaterial({ name: 'door-lamp', color: new GFX.Color(colour), emissive: new GFX.Color(colour), emissiveIntensity: 2.2 }
- L245 `colour` (code): const sign = doorSign(GFX, width, last ? (signs.last ?? 'END') : (venue.look.exitSign ?? signs.exit ?? 'EXIT'), colour);

## `src/venue/venue.js` (46)

- L30 `Colour` (comment): /** Colour index for wall tops: the last colour in a palette's `tiles`. */
- L30 `colour` (comment): /** Colour index for wall tops: the last colour in a palette's `tiles`. */
- L49 `colours` (comment): * colours down the sides), `ambient`, `trap`, `lift`, `lamp` (a colour) and
- L49 `colour` (comment): * colours down the sides), `ambient`, `trap`, `lift`, `lamp` (a colour) and
- L308 `centres` (comment): * centres) when nothing is near; crawlers and flyers only go round it.
- L551 `colours` (comment): /** sRGB hex to linear RGB — vertex colours are linear. */
- L575 `colour` (comment): * of the venue from being black, and what gives each one its colour.
- L578 `lampColour` (code): const lampColour = linearRGB(venue.palette.lamp ?? '#ffb060').map((v) => v * 1.1);
- L586 `colour` (code): const colour = linearRGB((f.colors?.[0]) ?? '#ffffff');
- L588 `colour` (code): return { pos: [f.x, y, f.z], reach: f.reach ?? 6, colour: colour.map((v) => v * k) };
- L588 `colour` (code): return { pos: [f.x, y, f.z], reach: f.reach ?? 6, colour: colour.map((v) => v * k) };
- L600 `zapColour` (code): const zapColour = linearRGB(venue.palette.zap ?? '#3acbff').map((v) => v * 0.28);
- L601 `exitColour` (code): const exitColour = linearRGB(venue.palette.exit ?? '#ff3fa4').map((v) => v * 0.4);
- L602 `colour` (code): const glow = (sources, x, y, z, reach, colour, out) => {
- L611 `colour` (code): const col = s.colour ?? colour;
- L611 `colour` (code): const col = s.colour ?? colour;
- L617 `lampColour` (code): glow(lamps, x, y, z, 5.5, lampColour, out);
- L619 `zapColour` (code): glow(zaps, x, y, z, 2.6, zapColour, out);
- L620 `exitColour` (code): glow(exits, x, y, z, 4, exitColour, out);
- L643 `tileColours` (code): const tileColours = palette.tiles.map(linearRGB);
- L644 `exitColour` (code): const exitColour = linearRGB(palette.exit ?? '#2a2a36');
- L645 `trapColour` (code): const trapColour = linearRGB(palette.trap ?? '#3a3a40');
- L646 `stickyColour` (code): const stickyColour = linearRGB(palette.sticky ?? '#8a6a3a');
- L647 `iceColour` (code): const iceColour = linearRGB(palette.ice ?? '#cfe6f4');
- L648 `wallColours` (code): const wallColours = (palette.walls ?? palette.tiles).map(linearRGB);
- L651 `colourAt` (code): const colourAt = (i) => tileColours[((i % tileColours.length) + tileColours.length) % tileColours.length];
- L651 `tileColours` (code): const colourAt = (i) => tileColours[((i % tileColours.length) + tileColours.length) % tileColours.length];
- L651 `tileColours` (code): const colourAt = (i) => tileColours[((i % tileColours.length) + tileColours.length) % tileColours.length];
- L651 `tileColours` (code): const colourAt = (i) => tileColours[((i % tileColours.length) + tileColours.length) % tileColours.length];
- L651 `tileColours` (code): const colourAt = (i) => tileColours[((i % tileColours.length) + tileColours.length) % tileColours.length];
- L666 `colours` (code): const face = (out, a, b, c, normal, colours, uvs) => {
- L669 `colours` (code): out.color.push(...colours[0], ...colours[1], ...colours[2]);
- L669 `colours` (code): out.color.push(...colours[0], ...colours[1], ...colours[2]);
- L669 `colours` (code): out.color.push(...colours[0], ...colours[1], ...colours[2]);
- L718 `exitColour` (code): if (c.kind === 'exit') base = exitColour;
- L720 `trapColour` (code): else if (c.trap) base = trapColour;
- L721 `stickyColour` (code): else if (c.fx === 'sticky') base = stickyColour;
- L722 `iceColour` (code): else if (c.fx === 'ice') base = iceColour;
- L723 `colourAt` (code): else base = c.kind === 'wall' ? colourAt(CAP) : colourAt(c.color);
- L723 `colourAt` (code): else base = c.kind === 'wall' ? colourAt(CAP) : colourAt(c.color);
- L753 `colourAt` (code): const y = c.base + 0.002, floorCol = colourAt(0).map((v) => v * tint);
- L763 `wallColours` (code): const wallBase = wallColours[((c.color % wallColours.length) + wallColours.length) % wallColours.length];
- L763 `wallColours` (code): const wallBase = wallColours[((c.color % wallColours.length) + wallColours.length) % wallColours.length];
- L763 `wallColours` (code): const wallBase = wallColours[((c.color % wallColours.length) + wallColours.length) % wallColours.length];
- L763 `wallColours` (code): const wallBase = wallColours[((c.color % wallColours.length) + wallColours.length) % wallColours.length];
- L767 `neighbour` (comment): // [ends, this tile's heights there, neighbour, its heights there, outward]

## `src/weapons/blade-curve.js` (13)

- L6 `metres` (comment): * Distances are metres from the root; `u` runs 0 at the root to 1 at the point.
- L13 `bladeCentreline` (code): export function bladeCentreline({ length, bend, hook = 0, talon = 0, samples = 512 }) {
- L15 `centre` (code): const centre = [[0, 0]];
- L18 `centre` (code): const [x, y] = centre[i - 1];
- L19 `centre` (code): centre.push([x - Math.sin(phi) * (length / samples), y + Math.cos(phi) * (length / samples)]);
- L22 `centre` (comment): /** The centre of the blade at `u`, and which way it is heading there. */
- L26 `centre` (code): x: centre[k][0] + (centre[k + 1][0] - centre[k][0]) * t,
- L26 `centre` (code): x: centre[k][0] + (centre[k + 1][0] - centre[k][0]) * t,
- L26 `centre` (code): x: centre[k][0] + (centre[k + 1][0] - centre[k][0]) * t,
- L27 `centre` (code): y: centre[k][1] + (centre[k + 1][1] - centre[k][1]) * t,
- L27 `centre` (code): y: centre[k][1] + (centre[k + 1][1] - centre[k][1]) * t,
- L27 `centre` (code): y: centre[k][1] + (centre[k + 1][1] - centre[k][1]) * t,
- L34 `centre` (code): reach: centre[samples][1],

## `src/weapons/blade-mist.js` (4)

- L2 `bladeCentreline` (code): import { bladeCentreline } from './blade-curve.js';
- L45 `centred` (comment): /** One ray-marched ellipsoid of mist, centred at `position`, drawn after the blade. */
- L84 `metres` (comment): * Dimensions are local weapon-space metres. The sheath starts visible and
- L125 `bladeCentreline` (code): const line = bladeCentreline({ length, bend, hook, talon });

## `src/weapons/broadsword.js` (4)

- L1 `METRE` (code): import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';
- L22 `METRE` (code): export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;
- L22 `METRE` (code): export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;
- L27 `metres` (comment): * leather grip. It is built at measured real-world scale, in metres, and

## `src/weapons/common.js` (110)

- L7 `bladeCentreline` (code): import { bladeCentreline } from './blade-curve.js';
- L10 `metres` (comment): /** Weapon geometry is expressed in metres: one engine unit equals one metre. */
- L10 `metre` (comment): /** Weapon geometry is expressed in metres: one engine unit equals one metre. */
- L11 `METRE` (code): export const WEAPON_WORLD_UNITS_PER_METRE = 1;
- L107 `centre` (comment): // centre the 54 mm shell in the pommel envelope: narrow point outward,
- L188 `colour` (string): function createGranitePommel(GFX, radius, colour = 'grey') {
- L188 `grey` (string): function createGranitePommel(GFX, radius, colour = 'grey') {
- L189 `colour` (string): if (!Object.hasOwn(GRANITES, colour)) throw new Error(`no granite called ${colour}; choose ${Object.keys(GRANITES).join(', ')}`);
- L189 `colour` (string): if (!Object.hasOwn(GRANITES, colour)) throw new Error(`no granite called ${colour}; choose ${Object.keys(GRANITES).join(', ')}`);
- L190 `colour` (code): const { mesh, geometry } = createGraniteBoulder(GFX, { colour, detail: 3 });
- L205 `selectedColour` (code): let selectedColour = colour;
- L205 `colour` (code): let selectedColour = colour;
- L209 `colour` (code): get colour() { return selectedColour; },
- L209 `selectedColour` (code): get colour() { return selectedColour; },
- L210 `setColour` (code): setColour(name) {
- L212 `selectedColour` (code): if (name !== selectedColour) {
- L213 `colour` (code): const replacement = createGraniteBoulder(GFX, { colour: name, detail: 3 });
- L217 `selectedColour` (code): selectedColour = name;
- L224 `graniteColour` (string): function createWeaponPommel(GFX, spec, { style = 'marble', metal, material, graniteColour = 'grey' } = {}) {
- L224 `grey` (string): function createWeaponPommel(GFX, spec, { style = 'marble', metal, material, graniteColour = 'grey' } = {}) {
- L227 `graniteColour` (code): if (style === 'granite') return createGranitePommel(GFX, spec.marbleRadius, graniteColour);
- L314 `centres` (code): const centres = points.map((point) => new GFX.Vector3(...point));
- L317 `sampledCentres` (code): const sampledCentres = [];
- L333 `centres` (code): for (let segment = 0; segment < centres.length - 1; segment++) {
- L334 `centres` (code): const p0 = centres[Math.max(0, segment - 1)];
- L335 `centres` (code): const p1 = centres[segment];
- L336 `centres` (code): const p2 = centres[segment + 1];
- L337 `centres` (code): const p3 = centres[Math.min(centres.length - 1, segment + 2)];
- L337 `centres` (code): const p3 = centres[Math.min(centres.length - 1, segment + 2)];
- L340 `sampledCentres` (code): sampledCentres.push(catmullRom(p0, p1, p2, p3, t));
- L345 `sampledCentres` (code): sampledCentres.push(centres.at(-1).clone());
- L345 `centres` (code): sampledCentres.push(centres.at(-1).clone());
- L351 `sampledCentres` (code): positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);
- L351 `sampledCentres` (code): positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);
- L351 `sampledCentres` (code): positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);
- L353 `sampledCentres` (code): for (let i = 1; i < sampledCentres.length - 1; i++) {
- L354 `sampledCentres` (code): const tangent = sampledCentres[i + 1].clone()
- L355 `sampledCentres` (code): .sub(sampledCentres[i - 1]).normalize();
- L361 `sampledCentres` (code): const vertex = sampledCentres[i].clone()
- L369 `sampledCentres` (code): const finalPoint = sampledCentres.at(-1);
- L412 `centreline` (comment): // Keep the rough-hewn silhouette mirrored about the grip centreline.
- L501 `centre` (string): throw new TypeError('lightning guard requires a finite centre, positive span and thickness');
- L522 `centre` (comment): // The 20.5 mm centre-root diameter gives the quillons extra visual weight;
- L538 `centres` (code): const centres = stations.map((point) => new GFX.Vector3(...point));
- L541 `sampledCentres` (code): const sampledCentres = [];
- L554 `centres` (code): for (let segment = 0; segment < centres.length - 1; segment++) {
- L555 `centres` (code): const p0 = centres[Math.max(0, segment - 1)];
- L556 `centres` (code): const p1 = centres[segment];
- L557 `centres` (code): const p2 = centres[segment + 1];
- L558 `centres` (code): const p3 = centres[Math.min(centres.length - 1, segment + 2)];
- L558 `centres` (code): const p3 = centres[Math.min(centres.length - 1, segment + 2)];
- L561 `sampledCentres` (code): sampledCentres.push(catmullRom(p0, p1, p2, p3, t));
- L566 `sampledCentres` (code): sampledCentres.push(centres.at(-1).clone());
- L566 `centres` (code): sampledCentres.push(centres.at(-1).clone());
- L572 `sampledCentres` (code): positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);
- L572 `sampledCentres` (code): positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);
- L572 `sampledCentres` (code): positions.push(sampledCentres[0].x, sampledCentres[0].y, sampledCentres[0].z);
- L573 `sampledCentres` (code): for (let i = 1; i < sampledCentres.length - 1; i++) {
- L574 `sampledCentres` (code): const tangent = sampledCentres[i + 1].clone()
- L575 `sampledCentres` (code): .sub(sampledCentres[i - 1]).normalize();
- L581 `sampledCentres` (code): const vertex = sampledCentres[i].clone()
- L588 `sampledCentres` (code): const finalPoint = sampledCentres.at(-1);
- L743 `centre` (comment): // A broad, shallow groove: never cut through the centre of the steel.
- L804 `centres` (code): const centres = points.map((p) => new GFX.Vector3(...p));
- L806 `centres` (code): for (let i = 0; i < centres.length; i++) {
- L807 `centres` (code): const tangent = centres[Math.min(i + 1, centres.length - 1)].clone()
- L807 `centres` (code): const tangent = centres[Math.min(i + 1, centres.length - 1)].clone()
- L808 `centres` (code): .sub(centres[Math.max(i - 1, 0)]).normalize();
- L813 `centres` (code): const point = centres[i].clone()
- L819 `centres` (code): for (let i = 0; i < centres.length - 1; i++) {
- L829 `centres` (code): positions.push(centres[0].x, centres[0].y, centres[0].z);
- L829 `centres` (code): positions.push(centres[0].x, centres[0].y, centres[0].z);
- L829 `centres` (code): positions.push(centres[0].x, centres[0].y, centres[0].z);
- L831 `centres` (code): positions.push(centres.at(-1).x, centres.at(-1).y, centres.at(-1).z);
- L831 `centres` (code): positions.push(centres.at(-1).x, centres.at(-1).y, centres.at(-1).z);
- L831 `centres` (code): positions.push(centres.at(-1).x, centres.at(-1).y, centres.at(-1).z);
- L835 `centres` (code): const a = (centres.length - 1) * radialSegments + j;
- L836 `centres` (code): const b = (centres.length - 1) * radialSegments + next;
- L1086 `bladeCentreline` (code): const line = bladeCentreline({ length, bend, hook, talon });
- L1130 `tipCentre` (code): const tipCentre = { x: end.x + heading.x * 0.004, y: end.y + heading.y * 0.004 };
- L1132 `tipCentre` (code): [tipCentre.x, tipCentre.y, 0], [tipRadius * 1.02, tipLength, tipRadius * 1.02], [32, 20]);
- L1132 `tipCentre` (code): [tipCentre.x, tipCentre.y, 0], [tipRadius * 1.02, tipLength, tipRadius * 1.02], [32, 20]);
- L1183 `tipCentre` (code): lowestY: Math.min(end.y - tipRadius, tipCentre.y - tipDrop),
- L1190 `metres` (comment): /** Same dominant-face projection as rock-granite's laySurface(), in world metres. */
- L1393 `graniteColour` (string): graniteColour = 'grey',
- L1393 `grey` (string): graniteColour = 'grey',
- L1397 `graniteColour` (code): const pommelAsset = createGranitePommel(GFX, spec.marbleRadius, graniteColour);
- L1545 `graniteColour` (string): graniteColour = 'grey',
- L1545 `grey` (string): graniteColour = 'grey',
- L1550 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');
- L1552 `graniteColour` (code): return createGraniteHandleAssembly(GFX, group, spec, { gripColor, graniteColour, wrapStyle, threadColor });
- L1555 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');
- L1557 `colour` (string): throw new TypeError('threadColor must be a six-digit hex colour');
- L1566 `graniteColour` (code): style: pommelStyle, metal: hiltMetal, material: hiltMaterial, graniteColour,
- L1781 `graniteColour` (string): graniteColour = 'grey',
- L1781 `grey` (string): graniteColour = 'grey',
- L1799 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(gripColor)) throw new TypeError('gripColor must be a six-digit hex colour');
- L1801 `colour` (string): throw new TypeError('threadColor must be a six-digit hex colour');
- L1814 `graniteColour` (code): hiltMetal, gripColor, threadColor, graniteColour,
- L1986 `graniteColour` (code): graniteColour: pommelAsset.kind === 'granite' ? pommelAsset.colour : null,
- L1986 `colour` (code): graniteColour: pommelAsset.kind === 'granite' ? pommelAsset.colour : null,
- L1997 `metre` (string): 'Scale': '1 world unit = 1 metre',
- L2003 `colour` (string): : pommelAsset.kind === 'granite' ? `Granite rock (${pommelAsset.colour})`
- L2009 `graniteColour` (code): get graniteColour() { return pommelAsset.kind === 'granite' ? pommelAsset.colour : null; },
- L2009 `colour` (code): get graniteColour() { return pommelAsset.kind === 'granite' ? pommelAsset.colour : null; },
- L2030 `setGraniteColour` (code): setGraniteColour(name) {
- L2032 `setColour` (code): pommelAsset.setColour(name);
- L2044 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('gripColor must be a six-digit hex colour');
- L2045 `colour` (comment): // A metal grip has no leather to dye: the colour is kept but not drawn.
- L2054 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('threadColor must be a six-digit hex colour');

## `src/weapons/dagger.js` (5)

- L1 `METRE` (code): import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';
- L7 `metres` (comment): * crossguard span and compact grip length differ. All dimensions are in metres.
- L28 `METRE` (code): export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;
- L28 `METRE` (code): export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;
- L59 `metres` (comment): * blade. Dimensions are in metres.

## `src/weapons/greatsword.js` (4)

- L1 `METRE` (code): import { buildWeapon, WEAPON_WORLD_UNITS_PER_METRE } from './common.js';
- L7 `metres` (comment): * guard-bar thickness differ. All dimensions are in metres.
- L28 `METRE` (code): export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;
- L28 `METRE` (code): export const WORLD_UNITS_PER_METRE = WEAPON_WORLD_UNITS_PER_METRE;

## `src/weapons/index.js` (3)

- L1 `catalogue` (comment): /** The measured, display-ready weapon catalogue. All dimensions are in metres. */
- L1 `metres` (comment): /** The measured, display-ready weapon catalogue. All dimensions are in metres. */
- L3 `METRE` (code): export { bladeGeometry, buildWeapon, createWeaponHandleAssembly, createWeaponPommelMarble, MARBLE_POMMEL, MARBLE_POMMEL_RADIUS, WEAPON_WORLD_UNITS_PER

## `src/weapons/morningstar.js` (3)

- L9 `metres` (comment): * grip / marble pommel assembly. All dimensions are in metres.
- L152 `metre` (string): 'Scale': '1 world unit = 1 metre',
- L167 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('gripColor must be a six-digit hex colour');

## `src/weapons/staff.js` (12)

- L184 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(c)) throw new TypeError(`${name} must be a six-digit hex colour`);
- L274 `headCentre` (code): let headCentre = 0;
- L297 `centre` (comment): // Where the roots' lip meets the topper: its seat. The topper's centre rises above it.
- L388 `headCentre` (code): headCentre = cy;
- L404 `colour` (code): const asset = createJewelBoulder(GFX, { colour: kind, mist: true, size: scale });
- L413 `centre` (comment): // The sword's egg hangs point-down; stand it on its broad end by turning it end over end about its centre.
- L429 `centre` (comment): // The orb group's origin is its centre, and so is the egg holder's.
- L437 `centre` (comment): // The top of the staff: the topper's centre and its half-height.
- L438 `headCentre` (code): const dims = () => HEAD_Y + headCentre + topperSpec(topperKind === 'none' ? 'orb' : topperKind).b;
- L479 `metre` (string): Scale: '1 world unit = 1 metre',
- L507 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('gripColor must be a six-digit hex colour');
- L512 `colour` (string): if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('threadColor must be a six-digit hex colour');

## `src/weapons/variants.js` (9)

- L65 `graniteColour` (string): const GRANITE_DEFAULTS = Object.freeze({ gripColor: '#101010', graniteColour: 'grey' });
- L65 `grey` (string): const GRANITE_DEFAULTS = Object.freeze({ gripColor: '#101010', graniteColour: 'grey' });
- L67 `colour` (code): const colour = options.graniteColour ?? options.graniteColor ?? GRANITE_DEFAULTS.graniteColour;
- L67 `graniteColour` (code): const colour = options.graniteColour ?? options.graniteColor ?? GRANITE_DEFAULTS.graniteColour;
- L67 `graniteColour` (code): const colour = options.graniteColour ?? options.graniteColor ?? GRANITE_DEFAULTS.graniteColour;
- L68 `colour` (string): if (!Object.hasOwn(GRANITES, colour)) throw new Error(`no granite called ${colour}; choose ${Object.keys(GRANITES).join(', ')}`);
- L68 `colour` (string): if (!Object.hasOwn(GRANITES, colour)) throw new Error(`no granite called ${colour}; choose ${Object.keys(GRANITES).join(', ')}`);
- L71 `graniteColour` (code): graniteColour: colour,
- L71 `colour` (code): graniteColour: colour,

## `test/americanize-markdown.test.js` (9)

- L7 `Colour` (string): assert.equal(americanizeMarkdown('The Colour of the Neighbour.'), 'The Color of the Neighbor.');
- L7 `Neighbour` (string): assert.equal(americanizeMarkdown('The Colour of the Neighbour.'), 'The Color of the Neighbor.');
- L8 `colourable` (string): assert.equal(americanizeMarkdown('colourable and coloured'), 'colorable and colored');
- L8 `coloured` (string): assert.equal(americanizeMarkdown('colourable and coloured'), 'colorable and colored');
- L12 `colour` (string): const input = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolour here';
- L12 `colour` (string): const input = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolour here';
- L12 `ncolour` (string): const input = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolour here';
- L13 `colour` (string): const expected = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolor here';
- L13 `colour` (string): const expected = 'Use `colour` for the value.\n\n```js\n// colour\n```\n\ncolor here';

## `test/asset-viewer-bowling-ball.test.js` (1)

- L25 `colours` (string): assert.ok(viewer.includes("'Randomise colours'"));

## `test/asset-viewer-gif.test.js` (2)

- L77 `colourAt` (code): const colourAt = (f, x, y) => {
- L84 `colourAt` (code): for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px.set([...colourAt(f, x, y), 255], (y * W + x) * 4);

## `test/banana-dagger.test.js` (3)

- L67 `centred` (comment): // The grip and blade are in one plane: the blade is as thin as the dagger's, centred on z = 0.
- L198 `millimetre` (comment): // Where the peel leaves the neck it sits within a millimetre of it, not out on a flange.
- L235 `colour` (string): 'a grip colour is accepted by the shared API but has no leather to dye');

## `test/book.test.js` (1)

- L134 `neighbours` (comment): // Middle lines of neighbours stay clear by a good part of a leaf's pitch, however the spine is rolled.

## `test/bouncy-ball.test.js` (1)

- L38 `colours` (string): test('every bouncy-ball design paints its own colours, without finger holes', () => {

## `test/bowling-ball-palettes.test.js` (1)

- L6 `colour` (string): test('the randomizer returns a complete coordinated four-colour palette', () => {

## `test/bowling-ball.test.js` (2)

- L24 `colours` (string): test('repaints colours in place without replacing shell geometry', () => {
- L56 `colour` (string): test('supports size and colour aliases, and rejects invalid radii', () => {

## `test/broadsword.test.js` (6)

- L9 `METRE` (code): WORLD_UNITS_PER_METRE,
- L14 `modelled` (string): test('broadsword is modelled at real-world scale with the spark marble as its pommel', () => {
- L16 `METRE` (code): assert.equal(WORLD_UNITS_PER_METRE, 1);
- L21 `metre` (string): assert.ok(Math.abs(sword.dimensions.overallLength - 0.99) < 0.015, 'overall length is close to one metre');
- L88 `colour` (string): test('leather grip colour is independent and validated', () => {
- L100 `colours` (string): test('rejects unknown metals and invalid grip colours at construction', () => {

## `test/electric-car.test.js` (3)

- L21 `centre` (code): assert.ok(car.parts.led_bar_centre.getWorldPosition(at).z > 3, 'the light bar is at the nose');
- L117 `centre` (string): for (const name of ['led_bar_centre', 'led_bar_wing_l', 'led_bar_wing_r', 'headlamp_l', 'headlamp_r', 'bolt_badge', 'bumper']) {
- L123 `centre` (string): for (const name of ['led_bar_centre', 'headlamp_l', 'bolt_badge']) assert.ok(boxOf(car.parts[name]).min.z < face.max.z, `${name} is on the face`);

## `test/facades-texture.test.js` (1)

- L19 `colours` (string): test('the colours are what the photographs show', () => {

## `test/flora-cards.test.js` (2)

- L32 `coloured` (string): test('the foliage atlas is leaves on a clear ground, coloured right to its edge', () => {
- L37 `colour` (comment): // No clear pixel is black: the mips keep the leaves' colour.

## `test/fog.test.js` (2)

- L11 `colour` (string): test('a scene has no fog until it is given one, and a fog is a colour and a density', () => {
- L30 `colour` (comment): // (As every colour is held here: in linear light.)

## `test/freighter.test.js` (3)

- L20 `centre` (code): assert.ok(f.parts.led_bar_centre.getWorldPosition(new GFX.Vector3()).z > 8);
- L57 `metres` (comment): /** The numbers and the loop the freighter was made with, as the page it came from has them (metres, seconds, the truck nosed toward −z). */
- L145 `metres` (string): near(a.speed, b.speed, 1e-12, 'the same speed in metres a second');

## `test/gfx.test.js` (2)

- L26 `centred` (string): test('the camera is centred unless its lens is shifted', () => {
- L112 `colour` (string): test('a material with an emissive map glows only where the map says, over the colour map\'s layout, in both languages', async () => {

## `test/granite-kitchen.test.js` (1)

- L22 `grey` (string): assert.deepEqual(Object.keys(GRANITES), ['grey', 'pink', 'black', 'white', 'green']);

## `test/ground-texture.test.js` (2)

- L68 `colours` (string): test('pavers: a joint between every brick, bricks of different colours, tiling', () => {
- L78 `colours` (string): assert.ok(reds.size > 3, `colours ${reds.size}`);

## `test/helpers/webaudio.js` (2)

- L39 `createAnalyser` (string): createAnalyser() { return node('analyser'); }
- L39 `analyser` (string): createAnalyser() { return node('analyser'); }

## `test/heroes.test.js` (10)

- L13 `METRES` (string): 'yarn/ball': ['createBall', 'TILE_METRES'],
- L76 `behaviour` (string): test('the metal player shares the original mace scale, roll transform, and damage behaviour', async () => {
- L205 `behaviour` (string): test('metal and clear-glass Egg keep Marc geometry and behaviour with optional white-yellow mist', async () => {
- L239 `centre` (code): const centre = misty.mist.material.uniforms.uDuoC.value;
- L242 `centre` (code): assert.ok(Math.abs(centre.x - white.x) < 1e-7 && Math.abs(centre.y - white.y) < 1e-7 && Math.abs(centre.z - white.z) < 1e-7,
- L242 `centre` (code): assert.ok(Math.abs(centre.x - white.x) < 1e-7 && Math.abs(centre.y - white.y) < 1e-7 && Math.abs(centre.z - white.z) < 1e-7,
- L242 `centre` (code): assert.ok(Math.abs(centre.x - white.x) < 1e-7 && Math.abs(centre.y - white.y) < 1e-7 && Math.abs(centre.z - white.z) < 1e-7,
- L243 `colour` (string): 'the mist colour is white away from its radial centre, with no yellow side band');
- L243 `centre` (string): 'the mist colour is white away from its radial centre, with no yellow side band');
- L244 `centre` (string): assert.equal(uniforms.uCore.value, 0.9, 'the yellow accent comes from the radial centre glow');

## `test/human.test.js` (4)

- L252 `hairColour` (code): him.customize({ eyeSize: 0.4, hairColour: '#c8a060', hair: 'sidePart' });
- L392 `moustache` (string): for (const k of ['age', 'freckles', 'scars', 'tattoo', 'moustache', 'stubble', 'lipColour']) assert.ok(!SLOTS[k].ready, `${k} is not built yet`);
- L392 `lipColour` (string): for (const k of ['age', 'freckles', 'scars', 'tattoo', 'moustache', 'stubble', 'lipColour']) assert.ok(!SLOTS[k].ready, `${k} is not built yet`);
- L622 `centred` (comment): // (The box is centred on the book's origin, so its middle is where the book is.)

## `test/jupiter.test.js` (1)

- L12 `colour` (string): test('the clouds are a 2:1 colour JPEG, as large as the layout says', async () => {

## `test/library.test.js` (1)

- L77 `catalogues` (string): test('the catalogues list every sculpted character and prop by name, and they bake', async () => {

## `test/lightshow.test.js` (3)

- L19 `colour` (string): test('a fixture with one colour, or on static, never changes colour', () => {
- L19 `colour` (string): test('a fixture with one colour, or on static, never changes colour', () => {
- L24 `colours` (string): test('a chase steps through its colours, one every `every` beats, and fades across the end of each step', () => {

## `test/martial.test.js` (1)

- L147 `millimetres` (comment): // (A couple of millimetres: the same tolerance as the other clips, a little over for the sword's second hand.)

## `test/moods.test.js` (3)

- L69 `cancelled` (code): const a = { keyframes, options, cancelled: false, cancel() { a.cancelled = true; } };
- L69 `cancelled` (code): const a = { keyframes, options, cancelled: false, cancel() { a.cancelled = true; } };
- L126 `cancelled` (code): assert.ok(grain.animations[0].cancelled, 'the grain stops dancing when it goes');

## `test/morningstar-weapon.test.js` (1)

- L53 `colour` (string): test('morningstar leather grip colour is independent of its metal finish', () => {

## `test/ocean.test.js` (2)

- L9 `skyColour` (code): import { mixSky, SKIES, skyColour, skyLight, sunDirection } from '../src/ocean/sky.js';
- L87 `skyColour` (code): assert.ok(skyColour(light, [0, 1, 0]).every((c) => c >= 0 && Number.isFinite(c)));

## `test/podium.test.js` (1)

- L35 `towards` (string): test('the reading surface rises towards the far (+z) edge, so it faces the speaker behind it', () => {

## `test/putter.test.js` (2)

- L136 `colours` (string): test('the grip, thread, face insert and glowing sight line are colours set live', () => {
- L142 `colour` (string): assert.equal(putter.accentMaterial.emissive.getHexString(), '39ff88', 'the sight line shines in its own colour');

## `test/road-texture.test.js` (2)

- L10 `neighbours` (comment): /** How much a tile jumps across its own wrap, against how much it changes between any two neighbours inside it: about 1 when it tiles. */
- L58 `grey` (string): test('concrete is pale grey, tiles, and each finish is its own', () => {

## `test/rock-jewel.test.js` (14)

- L26 `colour` (code): const jewel = createJewelBoulder(GFX, { colour: 'emerald' });
- L30 `colour` (code): assert.equal(jewel.colour, JEWELS.emerald);
- L36 `colour` (code): for (const name of JEWEL_CHOICES) assert.equal(createJewelBoulder(GFX, { colour: name }).colour, JEWELS[name]);
- L36 `colour` (code): for (const name of JEWEL_CHOICES) assert.equal(createJewelBoulder(GFX, { colour: name }).colour, JEWELS[name]);
- L37 `colour` (string): assert.equal(createJewelBoulder(GFX, { color: '#ABCDEF' }).colour, '#abcdef');
- L38 `colour` (code): assert.throws(() => createJewelBoulder(GFX, { colour: 'pearl' }), /no jewel called pearl/);
- L43 `colour` (code): const jewel = createJewelBoulder(GFX, { colour: 'ruby' });
- L45 `setColour` (code): jewel.setColour('amethyst');
- L48 `setColour` (code): jewel.setColour('x', '#102030');
- L49 `colour` (code): assert.equal(jewel.colour, '#102030');
- L63 `colour` (code): const rock = createJewelRock(GFX, { colour: 'topaz', radius: 0.5 });
- L65 `colour` (code): assert.equal(rock.colour, JEWELS.topaz);
- L68 `setColour` (code): rock.setColour('garnet').setMist(false);
- L69 `colour` (code): assert.equal(rock.colour, JEWELS.garnet, 'the color follows the stone');

## `test/roofing-texture.test.js` (5)

- L34 `colours` (string): test('the shingle colours differ, and slots are cut between the tabs', () => {
- L35 `grey` (string): const charcoal = mean(paintShingles({ size: 256, color: 'charcoal' })), grey = mean(paintShingles({ size: 256, color: 'grey' }));
- L35 `grey` (string): const charcoal = mean(paintShingles({ size: 256, color: 'charcoal' })), grey = mean(paintShingles({ size: 256, color: 'grey' }));
- L36 `grey` (string): assert.ok(grey > charcoal + 15, `${charcoal} vs ${grey}`);
- L36 `grey` (string): assert.ok(grey > charcoal + 15, `${charcoal} vs ${grey}`);

## `test/rug.test.js` (8)

- L30 `colourway` (string): test('the rug keeps its default size and the wool colourway', () => {
- L42 `colourway` (string): test('each colourway is a full palette with the same keys', () => {
- L46 `colour` (string): assert.deepEqual(Object.keys(RUG_PALETTES[name]).sort(), keys, `${name} has every colour`);
- L50 `colourway` (string): assert.equal(new Set(fields).size, fields.length, 'each colourway has its own field colour');
- L50 `colour` (string): assert.equal(new Set(fields).size, fields.length, 'each colourway has its own field colour');
- L53 `colourway` (string): test('a rug takes its colourway, size and fringe, and records them', () => {
- L59 `colourway` (string): test('an unknown colourway is refused before anything is built', () => {
- L63 `colourways` (string): test('the asset viewer registers the rug with its colourways and sizes as options', () => {

## `test/snow-shovel.test.js` (2)

- L31 `towards` (string): test('the scoop is hollow: a floor with rolled walls that run out towards the lip, and a lip bent forward', () => {
- L96 `colour` (code): assert.throws(() => createSnowShovel(GFX, { gripColor: 'red' }), /six-digit hex colour/);

## `test/staff-weapon.test.js` (4)

- L12 `metre` (string): test('the staff is an all-wood, metre-scale weapon with the Krystal orb on top by default', () => {
- L27 `centre` (string): assert.ok(orb.position.y > staff.dimensions.cradleDepth, 'the orb centre is above the cradle lip');
- L52 `colours` (string): test('wood and grip colours are customizable at creation and afterwards', () => {
- L188 `colour` (code): assert.equal(staff.topperAsset.colour, JEWELS[gem]);

## `test/variants.test.js` (20)

- L10 `colour` (comment): /** Whether every colour in `set` is within a few steps of `hex` (cloth is mottled, skin rosier toward the front). */
- L13 `colours` (comment): /** The colours (as hex) each part/material is made in, read off a sculpt. */
- L14 `coloursOf` (code): function coloursOf(def) {
- L26 `recoloured` (string): test('a character reports what can be recoloured, and what colour it is now', () => {
- L26 `colour` (string): test('a character reports what can be recoloured, and what colour it is now', () => {
- L31 `colour` (comment): // The coat is one colour: its parts are best changed together.
- L33 `colour` (comment): // What is not a colour (how high a boot is) is not offered.
- L35 `colour` (comment): // A bare arm has no colour of its own.
- L60 `colours` (string): test('three-digit hex colours mean what they say', () => {
- L65 `recoloured` (string): test('a coat recoloured brings its skirts with it, a hat is recoloured by its colour, and the rest is as it was', () => {
- L65 `recoloured` (string): test('a coat recoloured brings its skirts with it, a hat is recoloured by its colour, and the rest is as it was', () => {
- L65 `colour` (string): test('a coat recoloured brings its skirts with it, a hat is recoloured by its colour, and the rest is as it was', () => {
- L66 `coloursOf` (code): const was = coloursOf(cop);
- L68 `coloursOf` (code): const now = coloursOf(cop.variant({
- L78 `moustache` (string): assert.ok(!same('brows/hair'), 'the moustache and brows');
- L83 `colour` (string): test('a hair colour reaches the hair, the beard and the crest; fur worn over the shoulders is not hair', () => {
- L84 `coloursOf` (code): const was = coloursOf(viking), now = coloursOf(viking.variant({ hair: '#b0502a' }));
- L84 `coloursOf` (code): const was = coloursOf(viking), now = coloursOf(viking.variant({ hair: '#b0502a' }));
- L89 `colour` (string): test('a skin tone reaches bare arms drawn in a colour of their own', () => {
- L90 `coloursOf` (code): const now = coloursOf(viking.variant({ skin: '#6f4120' }));

## `test/venue-kit-extras.test.js` (1)

- L9 `coloured` (string): test('a foe with no model yet is a stand-in coloured by how it gets about, and animating it is safe', () => {

## `test/weapon-variants.test.js` (25)

- L130 `centre` (string): 'the centre of the flipped Madness arch sits below the guard root');
- L237 `colour` (string): 'changing the leather colour leaves its thread untouched');
- L242 `colour` (string): 'changing the thread colour leaves the leather untouched');
- L286 `colours` (string): test('named weapon families use their requested default metals and grip colours', () => {
- L372 `centre` (code): const centre = new GFX.Vector3().setFromMatrixPosition(weapon.pommelAsset.mist.matrixWorld).applyMatrix4(eggMistUniforms.uInverse.value);
- L373 `centre` (code): assert.ok(centre.length() < 1e-6, 'the inverse takes the egg back to its own middle');
- L528 `graniteColour` (string): assert.equal(weapon.graniteColour, 'grey');
- L528 `grey` (string): assert.equal(weapon.graniteColour, 'grey');
- L592 `centreline` (string): 'granite shard guard profile is symmetrical across the grip centreline');
- L595 `centre` (string): 'the guard has no separate socket: its centre meets the molded grip/blade neck');
- L601 `setGraniteColour` (code): weapon.setGraniteColour('pink');
- L602 `graniteColour` (code): assert.equal(weapon.graniteColour, 'pink');
- L603 `colour` (code): assert.equal(weapon.pommelAsset.colour, 'pink');
- L606 `colour` (string): 'changing the stone colour updates the entire stone assembly');
- L610 `grey` (string): assert.deepEqual(GRANITE_CHOICES, ['grey', 'pink', 'black', 'white', 'green']);
- L611 `colour` (code): for (const colour of GRANITE_CHOICES) {
- L612 `graniteColour` (code): assert.equal(createGraniteSword(GFX, { graniteColour: colour }).graniteColour, colour);
- L612 `colour` (code): assert.equal(createGraniteSword(GFX, { graniteColour: colour }).graniteColour, colour);
- L612 `graniteColour` (code): assert.equal(createGraniteSword(GFX, { graniteColour: colour }).graniteColour, colour);
- L612 `colour` (code): assert.equal(createGraniteSword(GFX, { graniteColour: colour }).graniteColour, colour);
- L613 `graniteColour` (code): assert.equal(createGraniteDagger(GFX, { graniteColour: colour }).graniteColour, colour);
- L613 `colour` (code): assert.equal(createGraniteDagger(GFX, { graniteColour: colour }).graniteColour, colour);
- L613 `graniteColour` (code): assert.equal(createGraniteDagger(GFX, { graniteColour: colour }).graniteColour, colour);
- L613 `colour` (code): assert.equal(createGraniteDagger(GFX, { graniteColour: colour }).graniteColour, colour);
- L615 `graniteColour` (code): assert.throws(() => createGraniteDagger(GFX, { graniteColour: 'blue' }), /no granite/);
