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
npx ng test --watch=false --test-path-pattern=bidding   # single file
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

Do not "fix" these incidentally — they are tracked and scheduled. See
`docs/superpowers/specs/2026-08-19-playwright-e2e-design.md` section 10.

1. **Passing out throws.** Four passes make `isBiddingFaseOver` return true,
   `findHighestBid` returns `undefined`, and `findDeclarer` dereferences it —
   `TypeError: Cannot read properties of undefined (reading 'bidder')`. Angular's
   global error handler swallows it, so the app stays on screen and simply never
   produces a contract. Any test for this must assert on console errors, not on
   what is visible. `bidding.util.ts:136-146`, `table.ts:224-230`
2. **Redoubled contracts report `isDoubled: false`.** `isDoubled ?? isRedubled ?? false`
   — `??` does not catch `false`. Currently invisible in the UI because
   `tricks-count.html` tests `isRedubled` before `isDoubled`, so XX still renders;
   the flag is wrong for any future consumer. `bidding.util.ts:73`
3. **`isContractDoubledOrRedubled` matches the contract on `biddingValue` +
   `bidder` only, ignoring suit**, so a double placed before the real contract
   can be miscounted. `bidding.util.ts:167`
4. **The dummy view is dead code.** `hand.html` implements a full four-column
   dummy layout, but `table.html` never passes the `isDummy` input.
5. **Undoing a finished trick leaves the trick counter untouched.** A completed
   trick stays in `playedCards` as a four-element array — the signal is only
   cleared when a fifth card is played (`addPlayedCard`, `table.ts:216-222`).
   So `onUndoTrick` mistakes a finished trick for a trick in progress: it
   returns the four cards to the hands but never removes the entry from
   `playedTricks`. A second click fixes the counter, having already returned the
   cards. `onUndoCard` breaks the same way — three cards left on the table
   against a counter of 1. `table.ts:169-181`, condition on `table.ts:170`

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

GitHub Pages, static HTML. Two mechanisms currently conflict and neither is
verified working: `.github/workflows/jekyll-gh-pages.yml` is an untouched Jekyll
template that will never build an Angular app, while `angular.json` defines an
`angular-cli-ghpages` deploy target run manually. `baseHref` there is
`https://kevinexon.github.io/bridge-card-dealer/` while `src/index.html` declares
`<base href="/">`. Fixing this is a scheduled task, not an accident to correct
in passing.
