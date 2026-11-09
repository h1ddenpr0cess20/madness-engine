# Human World

A test world for the human (`madness-engine/people/human`).

- The town is Gravemoor, from the rpg-test-world game (`src/world/`, with its colliders in `src/collide.js`), shot at night in the engine's horror mood.
- You are the human, with the banana broadsword.
- The crowd is the same man in random colours of skin, eyes, shirt, jeans, shoes, soles and briefs. Each carries one of the engine's other weapons, with the swing that suits it: daggers thrust, greatswords chop with both hands, morningstars smite, and swords slash.
- They wander until they see you, then run at you shouting and swing when in reach.
- Three hits put one down, and he gets up again a few seconds later somewhere else. Twelve put you down.

```sh
npm install
npm run dev
```

Controls:

- WASD or the arrow keys to walk, or hold the mouse to walk toward it. Shift runs.
- Space, J or F to swing. Y to yell.
- Q and E turn the view, the wheel zooms, and C resets the view.

URL options:

- `?mobs=20` sets how many there are (default 14).
- `?detail=0.6` builds the crowd coarser, for slow machines. Everyone is at full detail by default.

Posing is the expensive part, because the skin is moved on the CPU. The six nearest people are posed every frame, and the rest every other frame.
