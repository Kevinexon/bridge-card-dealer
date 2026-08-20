# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

A bridge trainer's tool for replaying deals for teaching purposes. The trainer
arranges hands, runs the bidding and the play, undoes moves freely, and hides or
reveals hands — then takes screenshots and screen recordings for analysis.

This is not a game against an AI. There is no opponent, no scoring, no
persistence. Every action is driven by the trainer. Design features for the
"operator drives everything manually" scenario.

UI text is Polish. Code identifiers are English.

## Commands

```bash
npm start                    # ng serve on http://localhost:4200
npm run build                # production build into dist/
npm test                     # Vitest via @angular/build:unit-test (watch mode)
npx ng test --watch=false    # single run; exits 1 on failure, safe for CI
npx ng test --watch=false --include=src/app/main-page/utils/bidding.util.spec.ts  # single file
npx ng test --watch=false --filter=findDeclarer                                   # single test by name
```

Do not pipe `ng test` through `tail`/`head` when you care about the exit code —
the pipeline reports the exit status of the last command, not of `ng test`.

## Architecture

Single route `/stolik` lazy-loading `Table`, which is the only stateful
component. Everything under `ui/` is presentational; all rules logic lives in
pure functions under `utils/`.

```
TableService.deck : Card[]        <- single source of truth for all 52 cards
  |  every Card carries its own .hand and .isPlayed
  |- northHand/eastHand/...  = computed(filter over .hand)
  '- playedTricks : Trick[]

Table (feature/table/table.ts)
  |- dealer, linesVulnerable, number, cardsMovementEnabled   <- model(), driven by AdminPanel
  |- whichHandsTurn : linkedSignal(dealer)                   <- changing dealer resets the turn
  |- biddingHistory : Bidding[]
  |- contract : Contract | null                              <- null means "still bidding"
  '- playedCards : Card[]                                    <- current trick, 0-4 cards
```

**`contract() == null` is the phase switch.** It drives which components
`table.html` renders: bidding panel and bidding table while bidding, play area
and trick counter once a contract exists. There is no separate phase enum.

**Hands are derived, not stored.** There is one deck signal; a "hand" is a
`computed` filter over it. Moving a card between hands sets `card.hand`; playing
a card sets `card.isPlayed`. Both are in-place mutations followed by
`this.deck.set([...this.deck()])` to re-broadcast. The same pattern (mutate, then
re-set with a spread) is used for `biddingHistory` and `playedCards` throughout
`table.ts`. It works, but it is why the undo paths are fragile — be careful when
touching them.

**Zoneless.** `zone.js` is not a dependency and `angular.json` declares no
polyfills. Angular 21 runs change detection off signals alone. No component sets
`ChangeDetectionStrategy.OnPush` yet.

## Non-obvious behaviours

**The deal is fixed, and gives each player one complete suit.** `createDeck()`
loops ranks in the outer loop and suits in the inner one, so `dealNewDeck()`'s
`i % 4` split maps index straight onto suit: North gets all spades, East all
hearts, South all diamonds, West all clubs. "Rozdaj ponownie" produces the same
result every time. `card.util.ts` holds a commented-out alternative ordering that
would produce mixed hands.

**The app has no randomness at all** — no `Math.random`, `Date`, `crypto`,
network or storage. State is a pure function of the click sequence. This makes
e2e tests unusually stable; the only flake sources are Material ripples and CDK
drag animations.

**Bidding legality is enforced in the UI, not in a validator.** `BiddingPanel`
disables illegal buttons via `calculateMinLevel` and `lastBiddedColorSeniority`.
Nothing rejects an illegal bid that arrives by another path.

## Known bugs

**All four behavioural bugs from spec section 10 were fixed on 2026-08-20.** The
tests that documented them are live — no `fixme`, no `skip` anywhere in the
suite. The fixes, so they are not "cleaned up" back into bugs:

1. **Passing out.** `findHighestBid` is typed `Bidding | undefined` — it really
   can return nothing — and `endBiddingFase` returns early when it does. A
   passed-out auction produces no contract and no exception; the app stays in
   the bidding phase. Do not narrow that return type back.
   `bidding.util.ts:136`, `table.ts:224-232`
2. **Redoubled contracts.** `isDoubled: (isDoubled ?? false) || (isRedubled ?? false)`.
   The old `??` chain did not catch `false`, because `false` is not nullish.
   `bidding.util.ts:73`
3. **`isContractDoubledOrRedubled` matches on suit too**, not just
   `biddingValue` + `bidder`, so a double placed before the real contract is no
   longer counted against it. `bidding.util.ts:167`
4. **Undo of a finished trick.** A completed trick stays in `playedCards` as a
   four-element array until a fifth card is played (`addPlayedCard`), so
   emptiness alone cannot tell a finished trick from one in progress — that is
   what `isTrickInProgress()` (`length > 0 && length < 4`) is for. Both
   `onUndoCard` and `onUndoTrick` route the finished case to the `playedTricks`
   branch. Note `playedCards` and `Trick.playedCards` are **the same array
   reference** (`handleTrickCompletion` stores it as-is), so re-broadcasting
   needs a fresh array — a `set()` with the same reference is a no-op under
   signal equality. `table.ts:151-191`

Still open, and deliberately not a behavioural bug:

- **The dummy view is dead code.** `hand.html` implements a full four-column
  dummy layout, but `table.html` never passes the `isDummy` input, so the branch
  is unreachable from the UI. Untested, because the intended behaviour has never
  been agreed. Decide what it should do before touching it.

**Not a bug, despite appearances:** `endBiddingFase` sets the turn to the
declarer, but `onBidding` calls `changePlayerTurn()` immediately afterwards, so
the opening lead correctly falls to the declarer's left-hand opponent. Reading
`table.ts:227` in isolation suggests otherwise — it was reported as a bug once
and disproved by an e2e test.

## Conventions

**`data-testid` attributes are a test contract.** They are deliberately English
and semantic so they survive refactoring of Tailwind classes and Polish UI text.
Never rename one without updating `e2e/pages/table.page.ts`. The inventory lives
in the spec, section 7.

**Naming debt, deliberately unaddressed so far.** A rename pass is planned; until
then expect these and do not half-fix them: `Card` has both `color` (the suit
name, e.g. `'spades'`) and `suit` (the symbol, e.g. `'♠'`); `Fase` is used where
`Phase` is meant; `isRedubled`, `isBackword` and `hendDeck` are typos carried
through several files; vulnerability uses `'WE'` while methods say `Ew`; outputs
are prefixed `on` against the Angular style guide.

## Deployment

GitHub Pages, static HTML, live at
`https://kevinexon.github.io/bridge-card-dealer/`. Fixed and verified on the
live URL on 2026-08-20.

`.github/workflows/deploy.yml` runs on every push to `main`: `npm ci`, unit
tests as a gate, `ng build --base-href=/bridge-card-dealer/`, then a force-push
of `dist/BridgeCardDealer/browser` to the `gh-pages` branch. Pushing that branch
triggers GitHub's own `pages build and deployment`, which publishes it.

Three constraints that shaped this, so it is not "simplified" back into a bug:

- **Pages serves from the `gh-pages` branch**, not from a workflow artifact
  (`build_type: legacy`, `source: gh-pages`). Publishing via
  `actions/deploy-pages` would mean switching the source to "GitHub Actions" in
  repo settings, which needs **admin** on the repo — the account used here has
  push only.
- **The app is served from a subdirectory**, so the build needs
  `--base-href=/bridge-card-dealer/`. `src/index.html` keeps `<base href="/">`
  for local dev; the build flag overrides it. The manual `ng deploy` target in
  `angular.json` carries the same relative path, so both routes produce
  identical output.
- **`404.html` is a copy of `index.html`** and `.nojekyll` is present. The first
  makes deep links like `/stolik` reach the Angular router (Pages serves
  `404.html` with a 404 status; the router then takes over). The second stops
  Pages from running the output through Jekyll.

What was wrong before: `jekyll-gh-pages.yml`, an untouched marketplace template,
built the _source repo_ with Jekyll and published the rendered README over the
app on every push to `main`. The public URL returned 200 and showed README text
with no `app-root` at all.
