# Input

The input module translates keyboard, pointer, touch, and gamepad activity into movement, view changes, held boost state, and one-shot game actions.

```js
import { createInput } from 'madness-engine/input';

const input = createInput(surface, {
  anchor: () => ({ x: playerScreenX, y: playerScreenY }),
});
```

`surface` is the element that receives pointer and touch input. The `anchor` callback returns the ball's screen position in CSS pixels, using the same viewport coordinate space as pointer events. The pointer push is calculated from the distance and direction between the pointer and this anchor.

## Reading input

Call the methods from the game's update loop:

| Method | Returns |
|---|---|
| `stick()` | `{ x, y }` movement input, clamped to a unit-length vector. |
| `view(dt)` | `{ turn, tilt, zoom }` changes accumulated since the previous call. Angles are in radians; zoom is a multiplicative factor. |
| `take()` | Array of one-shot action names received since the previous call. |
| `boost()` | Whether the configured boost input is currently held. |
| `rev()` | Alias for `boost()`, retained for the rolling games. |
| `press(name)` | Adds a one-shot action from a game-specific button or other source. |
| `setBoost(held)` | Sets an on-screen boost button's held state. |
| `setRev(held)` | Alias for `setBoost(held)`. |
| `pointing` | Whether the pointer is currently controlling movement. |

The module does not move the camera or player automatically. Apply the returned values to the game's movement and view systems.

## Default controls

- Arrow keys or WASD control movement.
- Hold the left mouse button or touch the surface to push toward the pointer.
- The right or middle mouse button can drag to turn and tilt the view.
- The mouse wheel zooms.
- Two-finger touch gestures zoom, rotate, and tilt.
- A gamepad's left stick or D-pad controls movement. Its right stick controls the view, and shoulder buttons zoom.

The view can also be changed with Q/E, plus/minus, and C to reset. Default one-shot actions include start, pause, mute, and home. Space starts by default; it acts as boost only when a game configures boost.

## Game-specific actions and boost

`createInput` accepts these optional settings:

- `presses`: maps keyboard `KeyboardEvent.code` values to action names. A value may be a string or an array of strings.
- `padPresses`: a function that maps gamepad button state to named actions. It receives `b(index)`, `sx`, and `sy`.
- `boost`: `{ pad, element }`, where `pad` is an array of gamepad button indexes and `element` is the ID of an on-screen held button.

For an on-screen button built by the game, call `setBoost(true)` on pointer-down and `setBoost(false)` on pointer-up, pointer-cancel, and pointer-leave.

The input module attaches event listeners to the surface and the window. Treat it as part of the game view's lifetime; create it when the view starts and do not keep creating replacements during normal frame updates.
