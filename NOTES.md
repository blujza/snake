# Notes

## What playtesting found

- The snake rendered as a row of plain colored squares — it didn't read as
  a snake at all, just disconnected blocks.
- The game speed was fixed and too fast right from the start, making it
  hard to get comfortable before losing.
- The food was a plain shape (first a square, then a red circle) with no
  visual identity.
- After a visual pass to round out the snake's body, the rendering looked
  pixelated and the movement felt choppier than the original blocky
  version — turned out to be caused by a leftover `image-rendering:
  pixelated` CSS rule (meant for the old blocky look) combined with the
  canvas not being scaled for high-DPI screens.
- Pressing Space on the Game Over screen did nothing — the only way to
  restart was clicking the "Restart" button.

## What I asked the agent to change

1. Make the snake actually look like a snake: connected, rounded body
   segments with a distinguishable head (eyes facing the direction of
   travel) instead of a line of separate squares.
2. Slow down the base movement speed, and instead make the game
   progressively speed up as the score increases.
3. Turn the red dot/circle food into an apple (body, highlight, stem,
   leaf).
4. Fix the pixelated/choppy rendering introduced by the snake-shape
   change — removed the `pixelated` image-rendering CSS rule and added
   devicePixelRatio-aware canvas scaling so shapes stay crisp on HiDPI
   displays.
5. Make the Space key also restart the game from the Game Over screen
   (previously Space only toggled pause during an active run).
