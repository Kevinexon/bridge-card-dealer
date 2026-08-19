# Warstwa testów Playwright e2e — plan implementacyjny

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować siatkę bezpieczeństwa (Playwright e2e + testy jednostkowe czystych funkcji) chroniącą aplikację przed regresją podczas nadchodzącego refaktoru nazewnictwa.

**Architecture:** Selektory oparte o `data-testid` dodawane addytywnie do szablonów, opakowane w Page Object Model mówiący językiem brydża. Testy opisują poprawne reguły brydżowe; cztery znane bugi są oznaczone jako pominięte z odwołaniem do pliku i linii, zamiast utrwalać błędne zachowanie.

**Tech Stack:** Angular 21 (signals, zoneless), Angular Material 21, Tailwind 4, Vitest (`@angular/build:unit-test`, `vitest/globals`), Playwright (Chromium), Prettier.

**Spec:** `docs/superpowers/specs/2026-08-19-playwright-e2e-design.md`

## Postęp

Stan na 2026-08-19, gałąź `feature/playwright-e2e`.

| Task                                    | Status          | Commit    |
| --------------------------------------- | --------------- | --------- |
| 1. Prettier                             | ✅ zrobione     | `79b369a` |
| 2. Testy `card.util` + usunięcie speców | ✅ zrobione     | `0cb84a7` |
| 3. Testy `bidding.util`                 | ✅ zrobione     | `455e942` |
| 4. Infrastruktura Playwright            | ✅ zrobione     | `a4457c6` |
| 5. Page Object + testidy rąk            | ✅ zrobione     | `e3521ad` |
| 6. Licytacja e2e                        | ✅ zrobione     | `b7787c0` |
| 7. Rozgrywka e2e                        | ⬜ **następne** |           |
| 8. Tryb trenera e2e                     | ⬜              |           |
| 9. Skrypt `testids.mjs`                 | ⬜              |           |
| 10. Weryfikacja końcowa                 | ⬜              |           |

Zweryfikowany stan po Tasku 6:

```
npm run e2e                  →  EXIT=0   12 passed | 1 skipped
npx ng test --watch=false    →  EXIT=0   31 passed | 2 skipped
npm run format:check         →  EXIT=0
```

**Ważna zmiana względem pierwotnego planu.** Krok weryfikacyjny w Tasku 6
(zdjęcie `fixme` i sprawdzenie, czy testy naprawdę padają) obalił dwie z pięciu
usterek opisanych w specu. Szczegóły w sekcji 10 specu; skrót:

- „wyjście rozgrywającego zamiast LHO" **nie jest bugiem** — `onBidding`
  wywołuje `changePlayerTurn()` zaraz po `endBiddingFase()`. Test usunięty.
- bug rekontry jest realny w danych, ale **niewidoczny w UI** — zostaje tylko
  test jednostkowy, test e2e usunięty jako bezprzedmiotowy.
- pas w koło **rzuca `TypeError`, ale Angular go połyka** — test przepisany
  z asercji na widoczność na asercję błędów konsoli.

Skutek dla liczb w Taskach 7-10: `bidding.spec.ts` ma **8 testów + 1 `fixme`**,
nie 8 + 3. Oczekiwane sumy w krokach weryfikacyjnych niższych zadań należy
liczyć od tej bazy (12 passed + 1 skipped po Tasku 6).

**Do rozstrzygnięcia w Tasku 8:** bug „martwy widok dziadka" opiera się
wyłącznie na odczycie kodu, bez testu — czyli dokładnie tak samo jak obalona
usterka o wyjściu. Zweryfikować empirycznie przed pozostawieniem go w
dokumentacji.

## Global Constraints

- Zmiany w `src/` ograniczają się do **dodania atrybutów `data-testid`** oraz usunięcia trzech plików `.spec.ts`. Żadnych zmian logiki, klas CSS, tekstów UI ani struktury DOM.
- Nazwy `data-testid` są dokładnie takie, jak w sekcji 7 specu. Nie wymyślać własnych.
- `tsconfig.json` ma `noPropertyAccessFromIndexSignature: true` — dostęp do zmiennych środowiskowych wyłącznie przez `process.env['CI']`, nigdy `process.env.CI`.
- Testy jednostkowe używają globalnych `describe/it/expect` bez importów (`tsconfig.spec.json` deklaruje `"types": ["vitest/globals"]`), spójnie z istniejącym kodem.
- Playwright: **wyłącznie Chromium**, viewport **1920×1080**.
- Nie naprawiać żadnego z pięciu znanych bugów (spec sekcja 10). Ten plan je dokumentuje, nie usuwa.
- Nie podpinać Playwrighta do CI — workflow GitHub Actions jest zepsuty i naprawiany osobno.
- Po każdej zmianie kod ma być sformatowany Prettierem.
- Commit po każdym zadaniu. Wiadomości commitów po polsku, bez polskich znaków diakrytycznych.

## Struktura plików

| Plik                                           | Odpowiedzialność                                           |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `.prettierignore`                              | wyłączenia formatowania                                    |
| `playwright.config.ts`                         | konfiguracja runnera, webServer, viewport                  |
| `e2e/tsconfig.json`                            | wsparcie edytora dla testów e2e (poza `tsconfig.app.json`) |
| `e2e/pages/table.page.ts`                      | Page Object — jedyne miejsce znające `data-testid`         |
| `e2e/smoke.spec.ts`                            | stan startowy aplikacji                                    |
| `e2e/bidding.spec.ts`                          | licytacja                                                  |
| `e2e/play.spec.ts`                             | rozgrywka                                                  |
| `e2e/trainer.spec.ts`                          | tryb edycji, zakrywanie rąk, alerty, panel                 |
| `src/app/main-page/utils/card.util.spec.ts`    | testy talii i kart                                         |
| `src/app/main-page/utils/bidding.util.spec.ts` | testy reguł licytacji                                      |
| `scripts/testids.mjs`                          | weryfikacja spójności kontraktu testid                     |

Cała wiedza o selektorach jest **wyłącznie** w `table.page.ts`. Pliki `*.spec.ts` w `e2e/` nie mogą zawierać ani jednego `getByTestId` — inaczej refaktor przestanie być bezpieczny.

---

### Task 1: Prettier

**Files:**

- Modify: `package.json`
- Create: `.prettierignore`

**Interfaces:**

- Produces: skrypty `npm run format` i `npm run format:check` używane w kryteriach akceptacji wszystkich kolejnych zadań.

- [ ] **Step 1: Zainstaluj Prettiera**

```bash
npm install --save-dev prettier
```

Konfiguracja już istnieje w `package.json` (sekcja `"prettier"`: `printWidth: 100`, `singleQuote: true`, parser `angular` dla `*.html`). Nie duplikować jej w osobnym pliku.

- [ ] **Step 2: Utwórz `.prettierignore`**

```
dist/
node_modules/
.angular/
out-tsc/
package-lock.json
public/
test-results/
playwright-report/
```

- [ ] **Step 3: Dodaj skrypty do `package.json`**

W sekcji `"scripts"`, obok istniejących:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 4: Sformatuj całe repozytorium**

Run: `npm run format`
Expected: lista przeformatowanych plików. To jest jedyny moment w tym planie, kiedy Prettier zmienia istniejący kod — dlatego siedzi w osobnym commicie, żeby nie zaszumić diffów kolejnych zadań.

- [ ] **Step 5: Sprawdź, że nic się nie zepsuło**

Run: `npx ng build`
Expected: build przechodzi.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: dodaj prettier do devDependencies i sformatuj repozytorium

Konfiguracja prettiera byla w package.json od poczatku, ale sam pakiet
nigdy nie zostal zainstalowany.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Testy jednostkowe `card.util` i usunięcie martwych speców

**Files:**

- Create: `src/app/main-page/utils/card.util.spec.ts`
- Delete: `src/app/app.spec.ts`, `src/app/main-page/feature/table/table.spec.ts`, `src/app/main-page/ui/bidding-table/bidding-table.spec.ts`

**Interfaces:**

- Consumes: `createCard`, `createDeck` z `card.util.ts`.
- Produces: nic dla kolejnych zadań.

Usunięcie i dodanie są w jednym zadaniu celowo: Vitest kończy się błędem, gdy nie znajdzie ani jednego pliku testowego, więc repozytorium nie może przejść przez stan „zero testów".

- [ ] **Step 1: Napisz testy**

Utwórz `src/app/main-page/utils/card.util.spec.ts`:

```ts
import { createCard, createDeck } from './card.util';

describe('createCard', () => {
  it('maps rank to sort value', () => {
    expect(createCard('spades', 'A').sortValue).toBe(14);
    expect(createCard('spades', '10').sortValue).toBe(10);
    expect(createCard('spades', '2').sortValue).toBe(2);
  });

  it('maps suit to its symbol', () => {
    expect(createCard('spades', 'A').suit).toBe('♠');
    expect(createCard('hearts', 'A').suit).toBe('♥');
    expect(createCard('diamonds', 'A').suit).toBe('♦');
    expect(createCard('clubs', 'A').suit).toBe('♣');
  });

  it('builds the image path from suit and rank', () => {
    expect(createCard('clubs', 'K').imgUrl).toBe('cards/clubs_K.jpg');
  });

  it('starts every card in the North hand and unplayed', () => {
    const card = createCard('hearts', '7');
    expect(card.hand).toBe('North');
    expect(card.isPlayed).toBeUndefined();
  });
});

describe('createDeck', () => {
  it('creates 52 cards', () => {
    expect(createDeck()).toHaveLength(52);
  });

  it('creates 13 cards of each suit', () => {
    const deck = createDeck();
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      expect(deck.filter((card) => card.color === suit)).toHaveLength(13);
    }
  });

  it('creates no duplicates', () => {
    const deck = createDeck();
    const keys = new Set(deck.map((card) => `${card.color}_${card.name}`));
    expect(keys.size).toBe(52);
  });

  it('orders the deck so that dealing by index gives each seat one whole suit', () => {
    // Utrwala obecne, deterministyczne zachowanie dealNewDeck() — patrz spec sekcja 3.
    // Zmiana tego testu musi byc swiadoma decyzja, nie cicha regresja.
    const deck = createDeck();
    const seats = ['North', 'East', 'South', 'West'] as const;
    const suitsPerSeat = seats.map(
      (_, seatIndex) => new Set(deck.filter((_, i) => i % 4 === seatIndex).map((c) => c.color)),
    );
    expect(suitsPerSeat.map((s) => [...s])).toEqual([
      ['spades'],
      ['hearts'],
      ['diamonds'],
      ['clubs'],
    ]);
  });
});
```

- [ ] **Step 2: Uruchom i zobacz, że przechodzą**

Run: `npx ng test --watch=false`
Expected: nowe testy PASS; dwa stare spece nadal FAIL (`app.spec.ts` i `bidding-table.spec.ts`). Exit code 1.

- [ ] **Step 3: Usuń trzy martwe pliki spec**

```bash
git rm src/app/app.spec.ts src/app/main-page/feature/table/table.spec.ts src/app/main-page/ui/bidding-table/bidding-table.spec.ts
```

Powody: `app.spec.ts` sprawdza `<h1>` z tekstem, którego w `app.html` nie ma; `bidding-table.spec.ts` pada na `NG0950` (wymagany input bez wartości); `table.spec.ts` to pusty smoke z generatora. Ich rolę przejmuje Playwright.

- [ ] **Step 4: Uruchom testy ponownie**

Run: `npx ng test --watch=false`
Expected: wszystkie PASS, exit code 0.

- [ ] **Step 5: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: testy jednostkowe card.util, usuniecie martwych specow

Trzy spece z generatora zastapione testami czystych funkcji: dwa z nich
byly czerwone (brakujacy <h1>, NG0950), trzeci byl pustym smoke testem.
Rola testow komponentowych przechodzi na Playwrighta.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Testy jednostkowe `bidding.util`

**Files:**

- Create: `src/app/main-page/utils/bidding.util.spec.ts`

**Interfaces:**

- Consumes: `createBidding`, `createContract`, `lastNotPass`, `isLastBidderEnemy`, `calculateMinLevel`, `lastBiddedColorSeniority`, `isBiddingFaseOver`, `findHighestBid`, `findDeclarer`, `isContractDoubledOrRedubled`, typ `Bidding` — wszystko z `bidding.util.ts`.
- Produces: nic dla kolejnych zadań.

To zadanie pokrywa bugi 1, 3 i 4 z listy znanych usterek. Testy opisujące poprawne reguły brydżowe są oznaczone `it.skip` z komentarzem — to odpowiednik `test.fixme()` z Playwrighta. Naprawa buga w przyszłej fazie polega na usunięciu `.skip`.

- [ ] **Step 1: Napisz testy**

Utwórz `src/app/main-page/utils/bidding.util.spec.ts`:

```ts
import {
  Bidding,
  calculateMinLevel,
  createBidding,
  createContract,
  findDeclarer,
  findHighestBid,
  isBiddingFaseOver,
  isContractDoubledOrRedubled,
  isLastBidderEnemy,
  lastBiddedColorSeniority,
  lastNotPass,
} from './bidding.util';

const pass = (bidder: Bidding['bidder']) => createBidding(bidder, 'PASS', 'pass');

describe('lastNotPass', () => {
  it('returns null for an empty history', () => {
    expect(lastNotPass([])).toBeNull();
  });

  it('returns null when everyone passed', () => {
    expect(lastNotPass([pass('North'), pass('East')])).toBeNull();
  });

  it('returns the most recent non-pass call', () => {
    const history = [createBidding('North', 1, 'clubs'), pass('East')];
    expect(lastNotPass(history)?.color).toBe('clubs');
  });
});

describe('isLastBidderEnemy', () => {
  it('treats the other partnership as opponents', () => {
    expect(isLastBidderEnemy(createBidding('East', 1, 'clubs'), 'North')).toBe(true);
    expect(isLastBidderEnemy(createBidding('West', 1, 'clubs'), 'South')).toBe(true);
    expect(isLastBidderEnemy(createBidding('North', 1, 'clubs'), 'East')).toBe(true);
  });

  it('treats partner and self as allies', () => {
    expect(isLastBidderEnemy(createBidding('South', 1, 'clubs'), 'North')).toBe(false);
    expect(isLastBidderEnemy(createBidding('North', 1, 'clubs'), 'North')).toBe(false);
  });
});

describe('calculateMinLevel', () => {
  it('starts at level 1', () => {
    expect(calculateMinLevel([])).toBe(1);
  });

  it('stays at the last bid level for suit contracts', () => {
    expect(calculateMinLevel([createBidding('North', 1, 'spades')])).toBe(1);
    expect(calculateMinLevel([createBidding('North', 3, 'hearts')])).toBe(3);
  });

  it('raises the level after notrump, since nothing outranks NT at that level', () => {
    expect(calculateMinLevel([createBidding('North', 1, 'NT')])).toBe(2);
  });

  it('ignores passes, doubles and redoubles', () => {
    const history = [
      createBidding('North', 2, 'diamonds'),
      createBidding('East', 'X', 'double'),
      pass('South'),
    ];
    expect(calculateMinLevel(history)).toBe(2);
  });
});

describe('lastBiddedColorSeniority', () => {
  it('returns 0 when nothing was bid', () => {
    expect(lastBiddedColorSeniority([])).toBe(0);
  });

  it('ranks clubs below diamonds below hearts below spades below notrump', () => {
    const seniority = (color: Parameters<typeof createBidding>[2]) =>
      lastBiddedColorSeniority([createBidding('North', 1, color)]);
    expect(seniority('clubs')).toBe(1);
    expect(seniority('diamonds')).toBe(2);
    expect(seniority('hearts')).toBe(3);
    expect(seniority('spades')).toBe(4);
    expect(seniority('NT')).toBe(5);
  });
});

describe('isBiddingFaseOver', () => {
  it('does not end the auction before four calls', () => {
    const history = [createBidding('North', 1, 'spades'), pass('East'), pass('South')];
    expect(isBiddingFaseOver(history, history[2])).toBe(false);
  });

  it('ends the auction on three passes following a bid', () => {
    const history = [
      createBidding('North', 1, 'spades'),
      pass('East'),
      pass('South'),
      pass('West'),
    ];
    expect(isBiddingFaseOver(history, history[3])).toBe(true);
  });

  it('ends the auction when all four players pass', () => {
    const history = [pass('North'), pass('East'), pass('South'), pass('West')];
    expect(isBiddingFaseOver(history, history[3])).toBe(true);
  });
});

describe('findHighestBid', () => {
  it('returns the last real bid, ignoring passes and doubles', () => {
    const history = [
      createBidding('North', 1, 'clubs'),
      createBidding('East', 2, 'hearts'),
      createBidding('South', 'X', 'double'),
      pass('West'),
    ];
    expect(findHighestBid(history).color).toBe('hearts');
  });

  it('returns undefined for a passed-out auction — root cause of the pass-out crash', () => {
    // Bug 1: Table.endBiddingFase przekazuje to dalej do findDeclarer, ktory
    // czyta .bidder z undefined. Patrz table.ts:224-230.
    const history = [pass('North'), pass('East'), pass('South'), pass('West')];
    expect(findHighestBid(history)).toBeUndefined();
  });
});

describe('findDeclarer', () => {
  it('names the partner who bid the contract suit first', () => {
    const history = [
      createBidding('North', 1, 'hearts'),
      pass('East'),
      createBidding('South', 2, 'hearts'),
      pass('West'),
    ];
    expect(findDeclarer(history, history[2])).toBe('North');
  });

  it('names the bidder when nobody in the partnership bid the suit earlier', () => {
    const history = [createBidding('East', 1, 'spades')];
    expect(findDeclarer(history, history[0])).toBe('East');
  });
});

describe('isContractDoubledOrRedubled', () => {
  it('returns null for an undoubled contract', () => {
    const history = [createBidding('North', 1, 'spades'), pass('East')];
    expect(isContractDoubledOrRedubled(history, history[0])).toBeNull();
  });

  it('detects a double', () => {
    const history = [createBidding('North', 1, 'spades'), createBidding('East', 'X', 'double')];
    expect(isContractDoubledOrRedubled(history, history[0])).toBe('X');
  });

  it('detects a redouble', () => {
    const history = [
      createBidding('North', 1, 'spades'),
      createBidding('East', 'X', 'double'),
      createBidding('South', 'XX', 'redouble'),
    ];
    expect(isContractDoubledOrRedubled(history, history[0])).toBe('XX');
  });

  it.skip('ignores a double that was applied to an earlier contract', () => {
    // Bug 4: findIndex dopasowuje po biddingValue + bidder, z pominieciem koloru,
    // wiec trafia w 1 clubs zamiast w 1 spades i doklada kontre sprzed kontraktu.
    // Patrz bidding.util.ts:167.
    const history = [
      createBidding('North', 1, 'clubs'),
      createBidding('East', 'X', 'double'),
      createBidding('North', 1, 'spades'),
      pass('East'),
      pass('South'),
      pass('West'),
    ];
    expect(isContractDoubledOrRedubled(history, history[2])).toBeNull();
  });
});

describe('createContract', () => {
  it('creates an undoubled contract', () => {
    const contract = createContract(createBidding('North', 4, 'spades'), 'North', false, false);
    expect(contract.isDoubled).toBe(false);
    expect(contract.isRedubled).toBe(false);
    expect(contract.declarer).toBe('North');
  });

  it('creates a doubled contract', () => {
    const contract = createContract(createBidding('North', 4, 'spades'), 'North', true, false);
    expect(contract.isDoubled).toBe(true);
    expect(contract.isRedubled).toBe(false);
  });

  it.skip('marks a redoubled contract as doubled as well', () => {
    // Bug 3: isDoubled ?? isRedubled ?? false — operator ?? nie lapie wartosci
    // false, bo false nie jest nullish, wiec kontrakt z rekontra raportuje
    // isDoubled: false. Patrz bidding.util.ts:73.
    const contract = createContract(createBidding('North', 4, 'spades'), 'North', false, true);
    expect(contract.isRedubled).toBe(true);
    expect(contract.isDoubled).toBe(true);
  });
});
```

- [ ] **Step 2: Uruchom testy**

Run: `npx ng test --watch=false`
Expected: wszystkie PASS, dwa oznaczone jako skipped. Exit code 0.

- [ ] **Step 3: Zweryfikuj, że pominięte testy faktycznie łapią bugi**

Tymczasowo zamień oba `it.skip` na `it` i uruchom ponownie.
Expected: dokładnie 2 FAIL. Jeśli przechodzą — test jest źle napisany i nie opisuje buga. Przywróć `.skip` przed commitem.

- [ ] **Step 4: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: testy jednostkowe regul licytacji w bidding.util

Pokrywa minimalny poziom odzywki, starszenstwo kolorow, wykrywanie konca
licytacji, wyznaczanie rozgrywajacego oraz kontre i rekontre.

Bugi 3 i 4 opisane testami oznaczonymi it.skip z odwolaniem do pliku
i linii. Bug 1 udokumentowany asercja na undefined w findHighestBid.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Infrastruktura Playwright

**Files:**

- Create: `playwright.config.ts`, `e2e/tsconfig.json`, `e2e/smoke.spec.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**

- Produces: `npm run e2e`; `baseURL` `http://localhost:4200`; katalog `e2e/` jako `testDir`. Wszystkie kolejne zadania dodają pliki do `e2e/`.

- [ ] **Step 1: Zainstaluj Playwrighta**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Utwórz `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

const VIEWPORT = { width: 1920, height: 1080 };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    viewport: VIEWPORT,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
```

Uwaga: `process.env['CI']`, nie `process.env.CI` — `tsconfig.json` ma `noPropertyAccessFromIndexSignature: true`.

`retries: 0` jest celowe. Aplikacja nie ma żadnej losowości (spec sekcja 3), więc test niestabilny oznacza błąd w teście, nie pecha — i ma być widoczny od razu, a nie maskowany ponowieniem.

- [ ] **Step 3: Utwórz `e2e/tsconfig.json`**

Katalog `e2e/` leży poza `tsconfig.app.json` (który obejmuje tylko `src/**/*.ts`). Playwright transpiluje własnym esbuildem i działa bez tego pliku, ale bez niego edytor nie podpowiada typów.

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../out-tsc/e2e",
    "types": ["node"]
  },
  "include": ["**/*.ts", "../playwright.config.ts"]
}
```

- [ ] **Step 4: Dodaj skrypty i wpisy `.gitignore`**

W `package.json`, sekcja `"scripts"`:

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

Na końcu `.gitignore`:

```
# Playwright
/test-results
/playwright-report
/blob-report
/playwright/.cache
```

- [ ] **Step 5: Napisz najprostszy możliwy test**

Utwórz `e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('redirects the root path to the table', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/stolik$/);
});
```

- [ ] **Step 6: Uruchom**

Run: `npm run e2e`
Expected: 1 passed. Playwright sam wystartuje `ng serve` i poczeka na port 4200.

- [ ] **Step 7: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: konfiguracja Playwright dla Chromium 1920x1080

webServer podnosi ng serve automatycznie. retries: 0 celowo - aplikacja
nie ma zadnej losowosci, wiec test niestabilny oznacza blad w tescie.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Page Object + testidy rąk i kart

**Files:**

- Create: `e2e/pages/table.page.ts`
- Modify: `src/app/main-page/ui/hand/hand.html`, `e2e/smoke.spec.ts`

**Interfaces:**

- Produces: klasa `TablePage` używana we wszystkich kolejnych zadaniach. Typy eksportowane z tego pliku: `Seat = 'North' | 'East' | 'South' | 'West'`, `Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'`, `Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A'`, stała `SEATS: readonly Seat[]`. Metody: `goto()`, `hand(seat)`, `card(suit, rank)`, `expectHandSize(seat, n)`, `expectTurn(seat)`, `toggleHandVisibility(seat)`, `dragCard(suit, rank, {to})`.

- [ ] **Step 1: Napisz test, który jeszcze nie ma jak przejść**

Zastąp całą zawartość `e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { SEATS, TablePage } from './pages/table.page';

test.describe('initial state', () => {
  test('redirects the root path to the table', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/stolik$/);
  });

  test('deals thirteen cards to every seat', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    for (const seat of SEATS) {
      await table.expectHandSize(seat, 13);
    }
  });

  test('deals one complete suit to each seat', async ({ page }) => {
    // Utrwala deterministyczny rozklad z card.util.ts — patrz spec sekcja 3.
    const table = new TablePage(page);
    await table.goto();
    await expect(table.hand('North').getByTestId('card-spades-A')).toBeVisible();
    await expect(table.hand('East').getByTestId('card-hearts-A')).toBeVisible();
    await expect(table.hand('South').getByTestId('card-diamonds-A')).toBeVisible();
    await expect(table.hand('West').getByTestId('card-clubs-A')).toBeVisible();
  });

  test('starts the auction with North on turn', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.expectTurn('North');
  });
});
```

- [ ] **Step 2: Uruchom i zobacz porażkę**

Run: `npm run e2e`
Expected: FAIL — `Cannot find module './pages/table.page'`.

- [ ] **Step 3: Napisz Page Object**

Utwórz `e2e/pages/table.page.ts`:

```ts
import { expect, Locator, Page } from '@playwright/test';

export type Seat = 'North' | 'East' | 'South' | 'West';
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type BidSuit = Suit | 'NT';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export const SEATS: readonly Seat[] = ['North', 'East', 'South', 'West'];

const NO_ANIMATIONS = `*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}`;

export class TablePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/stolik');
    // Ripple Material i animacje drag&drop CDK to jedyne zrodlo niestabilnosci
    // w tej aplikacji — cala reszta jest deterministyczna (spec sekcja 3).
    await this.page.addStyleTag({ content: NO_ANIMATIONS });
    await expect(this.hand('North')).toBeVisible();
  }

  hand(seat: Seat): Locator {
    return this.page.getByTestId(`hand-${seat}`);
  }

  card(suit: Suit, rank: Rank): Locator {
    return this.page.getByTestId(`card-${suit}-${rank}`);
  }

  async expectHandSize(seat: Seat, expected: number): Promise<void> {
    await expect(this.hand(seat).locator('[data-testid^="card-"]')).toHaveCount(expected);
  }

  async expectTurn(seat: Seat): Promise<void> {
    await expect(this.hand(seat).locator('.bg-indigo-300')).toBeVisible();
  }

  async toggleHandVisibility(seat: Seat): Promise<void> {
    await this.page.getByTestId(`hand-${seat}-visibility`).click();
  }

  async dragCard(suit: Suit, rank: Rank, options: { to: Seat }): Promise<void> {
    const from = await this.card(suit, rank).boundingBox();
    const to = await this.hand(options.to).boundingBox();
    if (!from || !to) {
      throw new Error(`Cannot drag ${suit} ${rank} to ${options.to}: element not laid out`);
    }
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height / 2;
    const endX = to.x + to.width / 2;
    const endY = to.y + to.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    // CDK drag-drop ignoruje pojedynczy skok myszy — potrzebuje serii ruchow,
    // zeby uznac gest za przeciagniecie i wyemitowac cdkDropListDropped.
    const steps = 12;
    for (let step = 1; step <= steps; step++) {
      await this.page.mouse.move(
        startX + ((endX - startX) * step) / steps,
        startY + ((endY - startY) * step) / steps,
      );
    }
    await this.page.mouse.up();
  }
}
```

Uwaga do `expectTurn`: klasa `bg-indigo-300` (`hand.html:32`) jest jedynym istniejącym wskaźnikiem czyjej jest tury. To świadomy wyjątek od zasady „żadnych selektorów CSS" — dodanie dedykowanego atrybutu wymagałoby zmiany logiki szablonu, co wykracza poza zakres. Wyjątek jest zamknięty w jednej metodzie Page Objectu.

- [ ] **Step 4: Dodaj testidy do `hand.html`**

Trzy zmiany, wyłącznie dopisanie atrybutów:

1. Na kontenerze `cdkDropList` (linie 1-8), obok `[id]="handName()"`:
   `[attr.data-testid]="'hand-' + handName()"`
2. Na `<img>` karty w ręce (linia 16), obok `[alt]`:
   `[attr.data-testid]="'card-' + item.color + '-' + item.name"`
3. Na przycisku widoczności (linia 50):
   `[attr.data-testid]="'hand-' + handName() + '-visibility'"`

Bloku dziadka (linie 57-76) **nie ruszać** — `isDummy` nigdy nie jest ustawiane, więc to martwy kod (bug 5). Dodanie tam testidów sugerowałoby, że jest używany.

- [ ] **Step 5: Uruchom testy**

Run: `npm run e2e`
Expected: 4 passed.

- [ ] **Step 6: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: Page Object stolu + testidy rak i kart, smoke e2e

Page Object jest jedynym miejscem znajacym data-testid, dzieki czemu
nadchodzacy refaktor dotknie jednego pliku zamiast wszystkich asercji.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Licytacja

**Files:**

- Create: `e2e/bidding.spec.ts`
- Modify: `e2e/pages/table.page.ts`, `src/app/main-page/ui/bidding-panel/bidding-panel.html`, `src/app/main-page/ui/bidding-table/bidding-table.html`, `src/app/main-page/ui/admin-panel/admin-panel.html`, `src/app/main-page/ui/tricks-count/tricks-count.html`

**Interfaces:**

- Consumes: `TablePage`, `Seat`, `BidSuit`, `SEATS` z Tasku 5.
- Produces: metody `TablePage`: `bidLevelButton(level)`, `bidSuit(suit)`, `doubleButton()`, `redoubleButton()`, `biddingColumn(seat)`, `contractDisplay()`, `bidLevel(level)`, `bid(level, suit)`, `pass()`, `double()`, `redouble()`, `openAdminTab(name)`, `undoBid()`, `resetBidding()`, `setDealer(seat)`.

- [ ] **Step 1: Napisz testy**

Utwórz `e2e/bidding.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { TablePage } from './pages/table.page';

test.describe('bidding', () => {
  test('records calls in the bidder column', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'clubs');
    await table.bid(1, 'hearts');
    await table.bid(1, 'spades');
    await table.pass();

    await expect(table.biddingColumn('North')).toContainText('1');
    await expect(table.biddingColumn('East')).toContainText('1');
    await expect(table.biddingColumn('West')).toContainText('PASS');
  });

  test('disables suits ranking below the last bid at the same level', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'hearts');
    await table.bidLevel(1);

    await expect(table.bidSuit('clubs')).toHaveClass(/bidding-button-disabled/);
    await expect(table.bidSuit('diamonds')).toHaveClass(/bidding-button-disabled/);
    await expect(table.bidSuit('spades')).not.toHaveClass(/bidding-button-disabled/);
  });

  test('requires a higher level after a notrump bid', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'NT');

    await expect(table.bidLevelButton(1)).toHaveClass(/bidding-button-disabled/);
    await expect(table.bidLevelButton(2)).not.toHaveClass(/bidding-button-disabled/);
  });

  test('allows a double only over an opponent bid', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await expect(table.doubleButton()).toHaveClass(/bidding-button-disabled/);

    await table.bid(1, 'clubs');
    await expect(table.doubleButton()).not.toHaveClass(/bidding-button-disabled/);

    await table.double();
    await expect(table.doubleButton()).toHaveClass(/bidding-button-disabled/);
    await expect(table.redoubleButton()).not.toHaveClass(/bidding-button-disabled/);
  });

  test('ends the auction after three passes and shows the contract', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.pass();
    await table.pass();

    await expect(table.contractDisplay()).toContainText('North');
    await expect(table.contractDisplay()).toContainText('♠');
  });

  test('undoes a single call', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.undoBid();

    await expect(table.biddingColumn('East')).not.toContainText('PASS');
    await table.expectTurn('East');
  });

  test('clears the whole auction', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.resetBidding();

    await expect(table.biddingColumn('North')).not.toContainText('1');
    await table.expectTurn('North');
  });

  test('shifts the columns when the dealer is not North', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.setDealer('East');
    await table.bid(1, 'spades');

    await expect(table.biddingColumn('East')).toContainText('1');
    await expect(table.biddingColumn('North')).not.toContainText('1');
  });

  test.fixme('ends the deal without a contract when everyone passes', async ({ page }) => {
    // Bug 1: cztery pasy powoduja crash. isBiddingFaseOver zwraca true,
    // findHighestBid zwraca undefined, findDeclarer czyta .bidder z undefined.
    // Patrz bidding.util.ts:136-146 oraz table.ts:224-230.
    const table = new TablePage(page);
    await table.goto();
    await table.pass();
    await table.pass();
    await table.pass();
    await table.pass();

    await expect(table.contractDisplay()).toBeHidden();
  });

  test.fixme('gives the opening lead to the declarer left-hand opponent', async ({ page }) => {
    // Bug 2: endBiddingFase ustawia ture na rozgrywajacego zamiast na gracza
    // po jego lewej. Patrz table.ts:227.
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.pass();
    await table.pass();
    await table.pass();

    await table.expectTurn('East');
  });

  test.fixme('shows XX for a redoubled contract', async ({ page }) => {
    // Bug 3: createContract ustawia isDoubled: false przy rekontrze, bo
    // operator ?? nie lapie wartosci false. Patrz bidding.util.ts:73.
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.double();
    await table.redouble();
    await table.pass();
    await table.pass();
    await table.pass();

    await expect(table.contractDisplay()).toContainText('XX');
  });
});
```

- [ ] **Step 2: Uruchom i zobacz porażkę**

Run: `npm run e2e bidding`
Expected: FAIL — `table.bid is not a function`.

- [ ] **Step 3: Rozszerz Page Object**

Dopisz do klasy `TablePage`:

```ts
  bidLevelButton(level: number): Locator {
    return this.page.getByTestId(`bid-level-${level}`);
  }

  bidSuit(suit: BidSuit): Locator {
    return this.page.getByTestId(`bid-suit-${suit}`);
  }

  doubleButton(): Locator {
    return this.page.getByTestId('bid-double');
  }

  redoubleButton(): Locator {
    return this.page.getByTestId('bid-redouble');
  }

  biddingColumn(seat: Seat): Locator {
    return this.page.getByTestId(`bidding-column-${seat}`);
  }

  contractDisplay(): Locator {
    return this.page.getByTestId('contract-display');
  }

  async bidLevel(level: number): Promise<void> {
    await this.bidLevelButton(level).click();
  }

  async bid(level: number, suit: BidSuit): Promise<void> {
    await this.bidLevel(level);
    await this.bidSuit(suit).click();
  }

  async pass(): Promise<void> {
    await this.page.getByTestId('bid-pass').click();
  }

  async double(): Promise<void> {
    await this.doubleButton().click();
  }

  async redouble(): Promise<void> {
    await this.redoubleButton().click();
  }

  async openAdminTab(name: 'Rozdanie' | 'Cofnij'): Promise<void> {
    await this.page.getByRole('tab', { name }).click();
  }

  async undoBid(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('undo-bid').click();
  }

  async resetBidding(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('reset-bidding').click();
  }

  async setDealer(seat: Seat): Promise<void> {
    await this.openAdminTab('Rozdanie');
    await this.page.getByTestId(`dealer-${seat}`).click();
  }
```

- [ ] **Step 4: Dodaj testidy do `bidding-panel.html`**

- `data-testid="bid-pass"` na divie z tekstem PASS
- `data-testid="bid-double"` na divie X
- `data-testid="bid-redouble"` na divie XX
- `[attr.data-testid]="'bid-level-' + level"` na divie wewnątrz `@for (level of levels(); track level)`
- `[attr.data-testid]="'bid-suit-' + color.name"` na divie wewnątrz `@for (color of colors(); track color.name)`

- [ ] **Step 5: Dodaj testidy do `bidding-table.html`**

- `data-testid="bidding-table"` na zewnętrznym divie
- `data-testid="bidding-column-North"` na pierwszym divie kolumny, analogicznie `bidding-column-East`, `bidding-column-South`, `bidding-column-West` na kolejnych trzech
- `data-testid="bidding-entry"` na każdym z czterech `<span class="bidding-value">`

- [ ] **Step 6: Dodaj testidy dealera i cofania do `admin-panel.html`**

Na `<mat-button-toggle>` w grupie dealera: `data-testid="dealer-North"`, `dealer-East`, `dealer-South`, `dealer-West`.

Na przyciskach w zakładce „Cofnij": `data-testid="reset-bidding"` („Cofnij licytacje"), `data-testid="undo-bid"` („Cofnij odzywkę"), `data-testid="reset-play"` („Cofnij rogrywkę"), `data-testid="undo-trick"` („Cofnij lewę"), `data-testid="undo-card"` („Cofnij kartę").

Atrybut `data-testid` na komponencie Material ląduje na elemencie hosta — `getByTestId(...).click()` działa poprawnie.

- [ ] **Step 7: Dodaj `contract-display` do `tricks-count.html`**

Na divie `<div class="w-2/3 text-xl flex items-end justify-center">`: `data-testid="contract-display"`.

- [ ] **Step 8: Uruchom pełny zestaw**

Run: `npm run e2e`
Expected: 12 passed, 3 skipped, 0 failed.

- [ ] **Step 9: Zweryfikuj, że testy `fixme` faktycznie opisują bugi**

Zamień tymczasowo `test.fixme` na `test` w trzech miejscach i uruchom.
Expected: dokładnie 3 FAIL. Jeśli któryś przechodzi — test jest źle napisany i nie opisuje buga. Przywróć `fixme` przed commitem.

- [ ] **Step 10: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: e2e licytacji + testidy panelu i tabeli licytacji

Pokrywa kolejnosc odzywek, blokade nielegalnych, kontre i rekontre,
zakonczenie licytacji, cofanie oraz przesuniecie kolumn dla dealera
innego niz North.

Bugi 1, 2 i 3 opisane testami test.fixme() z odwolaniem do pliku i linii.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Rozgrywka

**Files:**

- Create: `e2e/play.spec.ts`
- Modify: `e2e/pages/table.page.ts`, `src/app/main-page/ui/play-area/play-area.html`, `src/app/main-page/ui/tricks-count/tricks-count.html`

**Interfaces:**

- Consumes: `TablePage` z Tasków 5-6.
- Produces: metody `playedCard(seat)`, `playCard(suit, rank)`, `seatOnTurn()`, `playFromSeat(seat)`, `playRoundOfHighestCards()`, `bidToContract(level, suit)`, `expectTricks({ns, ew})`, `undoCard()`, `undoTrick()`, `resetPlay()`.

- [ ] **Step 1: Napisz testy**

Utwórz `e2e/play.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { SEATS, TablePage } from './pages/table.page';

test.describe('play', () => {
  test('moves a played card from the hand onto the table', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    const leader = await table.seatOnTurn();

    await table.playFromSeat(leader);
    await expect(table.playedCard(leader)).toBeVisible();
    await table.expectHandSize(leader, 12);
  });

  test('awards the trick and gives the lead to its winner', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.playRoundOfHighestCards();

    // North trzyma wszystkie piki, czyli kolor atutowy — wygrywa kazda lewe.
    await table.expectTricks({ ns: 1, ew: 0 });
    await table.expectTurn('North');
  });

  test('lets a trump beat a higher card of the led suit', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    // Kontrakt w kierach: North wychodzi w piki (jedyny kolor, jaki ma),
    // East przebija kierem, bo kiery to jego jedyny kolor i zarazem atu.
    await table.bidToContract(1, 'hearts');
    await table.playRoundOfHighestCards();

    await table.expectTricks({ ns: 0, ew: 1 });
    await table.expectTurn('East');
  });

  test('awards the trick to the highest card of the led suit without trumps', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    // Bez atu wygrywa najwyzsza karta koloru wyjscia — pozostali tylko zrzucaja.
    await table.bidToContract(1, 'NT');
    await table.playRoundOfHighestCards();

    await table.expectTricks({ ns: 1, ew: 0 });
    await table.expectTurn('North');
  });

  test('undoes the last card and returns the turn', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    const leader = await table.seatOnTurn();
    await table.playFromSeat(leader);
    await table.undoCard();

    await expect(table.playedCard(leader)).toBeHidden();
    await table.expectHandSize(leader, 13);
    await table.expectTurn(leader);
  });

  test('undoes a completed trick', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.playRoundOfHighestCards();
    await table.expectTricks({ ns: 1, ew: 0 });

    await table.undoTrick();
    await table.expectTricks({ ns: 0, ew: 0 });
  });

  test('resets the whole play', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.playRoundOfHighestCards();
    await table.resetPlay();

    await table.expectTricks({ ns: 0, ew: 0 });
    for (const seat of SEATS) {
      await table.expectHandSize(seat, 13);
    }
  });
});
```

- [ ] **Step 2: Uruchom i zobacz porażkę**

Run: `npm run e2e play`
Expected: FAIL — `table.bidToContract is not a function`.

- [ ] **Step 3: Rozszerz Page Object**

```ts
  playedCard(seat: Seat): Locator {
    return this.page.getByTestId(`played-card-${seat}`);
  }

  async playCard(suit: Suit, rank: Rank): Promise<void> {
    // Karty w rece sa pozycjonowane absolutnie i nachodza na siebie, wiec
    // klikniecie we wspolrzedne trafiloby w sasiada. dispatchEvent omija
    // hit-testing i wywoluje handler bezposrednio na wlasciwym elemencie.
    await this.card(suit, rank).dispatchEvent('click');
  }

  async seatOnTurn(): Promise<Seat> {
    for (const seat of SEATS) {
      if (await this.hand(seat).locator('.bg-indigo-300').isVisible()) {
        return seat;
      }
    }
    throw new Error('No seat is marked as being on turn');
  }

  /** Zagrywa pierwsza karte z reki danego gracza (najwyzsza — reka jest posortowana). */
  async playFromSeat(seat: Seat): Promise<void> {
    await this.hand(seat).locator('[data-testid^="card-"]').first().dispatchEvent('click');
  }

  /** Rozgrywa pelna lewe, za kazdym razem pierwsza karta gracza na turze. */
  async playRoundOfHighestCards(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      await this.playFromSeat(await this.seatOnTurn());
    }
  }

  /** Doprowadza licytacje do kontraktu otwierajacego i trzech pasow. */
  async bidToContract(level: number, suit: BidSuit): Promise<void> {
    await this.bid(level, suit);
    await this.pass();
    await this.pass();
    await this.pass();
    await expect(this.contractDisplay()).toBeVisible();
  }

  async expectTricks(expected: { ns: number; ew: number }): Promise<void> {
    await expect(this.page.getByTestId('tricks-ns')).toHaveText(String(expected.ns));
    await expect(this.page.getByTestId('tricks-ew')).toHaveText(String(expected.ew));
  }

  async undoCard(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('undo-card').click();
  }

  async undoTrick(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('undo-trick').click();
  }

  async resetPlay(): Promise<void> {
    await this.openAdminTab('Cofnij');
    await this.page.getByTestId('reset-play').click();
  }
```

- [ ] **Step 4: Dodaj testidy do `play-area.html`**

W każdym z czterech bloków `@case` dodaj na `<img>` statyczny atrybut odpowiadający pozycji: `data-testid="played-card-North"` w `@case ('North')`, `played-card-South` w `@case ('South')`, `played-card-East` w `@case ('East')`, `played-card-West` w `@case ('West')`.

- [ ] **Step 5: Dodaj testidy liczników do `tricks-count.html`**

Na divie z wartością NS (`<div class="font-bold">{{ tricksNS() }}</div>`): `data-testid="tricks-ns"`.
Na odpowiadającym mu divie z `{{ tricksEW() }}`: `data-testid="tricks-ew"`.

- [ ] **Step 6: Uruchom pełny zestaw**

Run: `npm run e2e`
Expected: 19 passed, 3 skipped, 0 failed.

- [ ] **Step 7: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: e2e rozgrywki + testidy stolu i licznika lew

Pokrywa zagranie karty, przyznanie lewy, wyjscie zwyciezcy oraz cofanie
karty, lewy i calej rozgrywki.

Karty klikane przez dispatchEvent — w rece nachodza na siebie absolutnym
pozycjonowaniem, wiec klikniecie we wspolrzedne trafialoby w sasiada.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Tryb trenera

**Files:**

- Create: `e2e/trainer.spec.ts`
- Modify: `e2e/pages/table.page.ts`, `src/app/main-page/ui/admin-panel/admin-panel.html`, `src/app/main-page/ui/alert-info-dialog/alert-info-dialog.html`, `src/app/main-page/ui/alert-panel/alert-panel.html`, `src/app/main-page/ui/bidding-panel/bidding-panel.html`

**Interfaces:**

- Consumes: `TablePage` z Tasków 5-7.
- Produces: metody `enableEditMode()`, `dealNew()`, `setBoardNumber(n)`, `setVulnerable(line)`, `alertItems()`, `addAlert(seat, text)`, `expectVulnerable(seat, isVulnerable)`.

- [ ] **Step 1: Napisz testy**

Utwórz `e2e/trainer.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { TablePage } from './pages/table.page';

test.describe('trainer controls', () => {
  test('moves a card between hands in edit mode', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'South' });

    await table.expectHandSize('North', 12);
    await table.expectHandSize('South', 14);
  });

  test('does not play a card while edit mode is on', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bidToContract(1, 'spades');
    await table.enableEditMode();
    await table.playCard('spades', 'A');

    await table.expectHandSize('North', 13);
  });

  test('hides and reveals a hand', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    const ace = table.card('spades', 'A');
    await expect(ace).toHaveAttribute('src', /spades_A/);

    await table.toggleHandVisibility('North');
    await expect(ace).toHaveAttribute('src', /reverse/);

    await table.toggleHandVisibility('North');
    await expect(ace).toHaveAttribute('src', /spades_A/);
  });

  test('attaches an alert to a call and shows it in the alert panel', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'clubs');
    await table.addAlert('North', 'Otwarcie przygotowawcze');

    await expect(table.alertItems()).toHaveCount(1);
    await expect(table.alertItems().first()).toContainText('Otwarcie przygotowawcze');
  });

  test('changing the dealer resets the deal', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.bid(1, 'spades');
    await table.setDealer('South');

    await expect(table.biddingColumn('North')).not.toContainText('1');
    await table.expectTurn('South');
  });

  test('shows the board number in the bidding panel', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.setBoardNumber(7);

    await expect(page.getByTestId('bidding-panel-board-number')).toHaveText('7');
  });

  test('marks a partnership as vulnerable', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.expectVulnerable('North', false);

    await table.setVulnerable('NS');
    await table.expectVulnerable('North', true);
    await table.expectVulnerable('South', true);
    await table.expectVulnerable('East', false);
  });

  test('redeals the standard layout after cards were moved', async ({ page }) => {
    const table = new TablePage(page);
    await table.goto();
    await table.enableEditMode();
    await table.dragCard('spades', 'A', { to: 'South' });
    await table.expectHandSize('North', 12);

    await table.dealNew();
    await table.expectHandSize('North', 13);
    await expect(table.hand('North').getByTestId('card-spades-A')).toBeVisible();
  });
});
```

- [ ] **Step 2: Uruchom i zobacz porażkę**

Run: `npm run e2e trainer`
Expected: FAIL — `table.enableEditMode is not a function`.

- [ ] **Step 3: Rozszerz Page Object**

```ts
  alertItems(): Locator {
    return this.page.getByTestId('alert-item');
  }

  async enableEditMode(): Promise<void> {
    await this.openAdminTab('Rozdanie');
    await this.page.getByTestId('edit-mode-toggle').click();
  }

  async dealNew(): Promise<void> {
    await this.openAdminTab('Rozdanie');
    await this.page.getByTestId('deal-new').click();
  }

  async setBoardNumber(value: number): Promise<void> {
    await this.openAdminTab('Rozdanie');
    await this.page.getByTestId('board-number').fill(String(value));
  }

  async setVulnerable(line: 'NS' | 'WE'): Promise<void> {
    await this.openAdminTab('Rozdanie');
    await this.page.getByTestId(`vulnerable-${line}`).click();
  }

  async expectVulnerable(seat: Seat, isVulnerable: boolean): Promise<void> {
    // Klasa .vulnerable (hand.html:40) jest jedynym wskaznikiem zalozen —
    // drugi swiadomy wyjatek od zasady "zadnych selektorow CSS", obok expectTurn.
    const marker = this.hand(seat).locator('.vulnerable');
    await (isVulnerable ? expect(marker).toBeVisible() : expect(marker).toHaveCount(0));
  }

  async addAlert(seat: Seat, text: string): Promise<void> {
    await this.biddingColumn(seat).getByTestId('bidding-entry').last().click();
    await this.page.getByTestId('alert-input').fill(text);
    await this.page.getByTestId('alert-confirm').click();
  }
```

- [ ] **Step 4: Dodaj pozostałe testidy do `admin-panel.html`**

- `data-testid="admin-panel"` na zewnętrznym divie
- `data-testid="admin-toggle"` na przycisku z ikoną `menu`
- `data-testid="board-number"` na `<input matInput type="number">`
- `data-testid="deal-new"` na przycisku „Rozdaj ponownie"
- `data-testid="edit-mode-toggle"` na `<mat-slide-toggle>`
- `data-testid="vulnerable-NS"` i `data-testid="vulnerable-WE"` na odpowiadających `<mat-button-toggle>`

- [ ] **Step 5: Dodaj testidy do dialogu alertu i panelu alertów**

W `alert-info-dialog.html`:

- `data-testid="alert-input"` na `<textarea matInput>`
- `data-testid="alert-confirm"` na przycisku „Ok"
- `data-testid="alert-cancel"` na przycisku „Anuluj"

W `alert-panel.html`:

- `data-testid="alert-panel"` na zewnętrznym divie
- `data-testid="alert-item"` na divie wewnątrz `@for`

- [ ] **Step 6: Dodaj testid numeru rozdania w `bidding-panel.html`**

Na divie `<div class="text-4xl px-2 w-1/3 text-center">{{ number() }}</div>`: `data-testid="bidding-panel-board-number"`.

To jedyny testid spoza tabeli w sekcji 7 specu — jest uzupełniany w Tasku 10, żeby kontrakt pozostał kompletny.

- [ ] **Step 7: Uruchom pełny zestaw**

Run: `npm run e2e`
Expected: 27 passed, 3 skipped, 0 failed.

- [ ] **Step 8: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "test: e2e trybu trenera + testidy panelu, dialogu i alertow

Pokrywa przenoszenie kart drag&drop, blokade zagrywania w trybie edycji,
zakrywanie reki rewersem, alerty odzywek i zmiane dealera.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Skrypt weryfikacji kontraktu testid

**Files:**

- Create: `scripts/testids.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: `data-testid` w `src/**/*.html`, wywołania `getByTestId` w `e2e/**/*.ts`.
- Produces: `npm run testids` (raport) oraz `npm run testids:check` (exit 1 przy rozjeździe).

- [ ] **Step 1: Napisz skrypt**

Utwórz `scripts/testids.mjs`:

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Zbiera sciezki plikow o podanych rozszerzeniach, rekurencyjnie. */
function collect(dir, extensions) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...collect(path, extensions));
    } else if (extensions.some((ext) => path.endsWith(ext))) {
      found.push(path);
    }
  }
  return found;
}

/** Wyciaga literalne testidy oraz prefiksy testidow budowanych dynamicznie. */
function declaredIds(files) {
  const literal = new Set();
  const dynamic = new Set();
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const [, id] of source.matchAll(/\bdata-testid="([^"{]+)"/g)) {
      literal.add(id);
    }
    // [attr.data-testid]="'card-' + item.color + '-' + item.name"
    for (const [, prefix] of source.matchAll(/\[attr\.data-testid\]="'([^']+)'/g)) {
      dynamic.add(prefix);
    }
  }
  return { literal, dynamic };
}

/** Wyciaga testidy uzywane w testach e2e. */
function usedIds(files) {
  const used = new Set();
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const [, id] of source.matchAll(/getByTestId\(`([^`]+)`\)/g)) {
      used.add(id);
    }
    for (const [, id] of source.matchAll(/getByTestId\('([^']+)'\)/g)) {
      used.add(id);
    }
  }
  return used;
}

/** Zamienia `hand-${seat}` na prefiks `hand-`, zeby porownac z szablonem. */
function toPrefix(id) {
  const index = id.indexOf('${');
  return index === -1 ? id : id.slice(0, index);
}

const { literal, dynamic } = declaredIds(collect('src', ['.html']));
const used = usedIds(collect('e2e', ['.ts']));

const declared = [...literal, ...dynamic].sort();
const missing = [...used]
  .map(toPrefix)
  .filter(
    (id) =>
      !literal.has(id) &&
      ![...dynamic].some((prefix) => id.startsWith(prefix) || prefix.startsWith(id)),
  )
  .sort();

console.log(`Zadeklarowane w src/ (${declared.length}):`);
for (const id of declared) {
  console.log(`  ${id}`);
}

if (missing.length > 0) {
  console.error(`\nUzywane w e2e/, ale nieobecne w src/ (${missing.length}):`);
  for (const id of missing) {
    console.error(`  ${id}`);
  }
  if (process.argv.includes('--check')) {
    process.exit(1);
  }
} else {
  console.log('\nKontrakt spojny: kazdy testid uzywany w e2e/ istnieje w src/.');
}
```

- [ ] **Step 2: Dodaj skrypty do `package.json`**

```json
"testids": "node scripts/testids.mjs",
"testids:check": "node scripts/testids.mjs --check"
```

- [ ] **Step 3: Uruchom na spójnym repozytorium**

Run: `npm run testids:check`
Expected: lista zadeklarowanych testidów, komunikat o spójności, exit code 0.

- [ ] **Step 4: Sprawdź, że skrypt faktycznie łapie rozjazd**

Usuń tymczasowo `data-testid="bid-pass"` z `bidding-panel.html`.

Run: `npm run testids:check`
Expected: `bid-pass` na liście brakujących, exit code 1.

Przywróć atrybut i uruchom ponownie — exit code 0.

- [ ] **Step 5: Sformatuj i zacommituj**

```bash
npm run format
git add -A
git commit -m "chore: skrypt weryfikacji spojnosci kontraktu data-testid

npm run testids:check konczy sie kodem 1, gdy test uzywa testid
nieobecnego w szablonach. Zabezpiecza kontrakt testowy podczas
nadchodzacego refaktoru nazewnictwa.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Weryfikacja końcowa

**Files:**

- Modify: `docs/superpowers/specs/2026-08-19-playwright-e2e-design.md`

**Interfaces:**

- Consumes: wszystko z Tasków 1-9.

- [ ] **Step 1: Testy jednostkowe**

Run: `npx ng test --watch=false`
Expected: wszystkie PASS, 2 skipped, exit code 0.

- [ ] **Step 2: Pełny zestaw e2e, trzy razy pod rząd**

Run: `npm run e2e` — trzykrotnie.
Expected: za każdym razem identyczny wynik: 27 passed, 3 skipped, 0 failed. Jakakolwiek różnica między przebiegami oznacza niestabilny test — znaleźć przyczynę, nie dodawać `retries`.

- [ ] **Step 3: Formatowanie i build**

Run: `npm run format:check`
Expected: brak plików do przeformatowania.

Run: `npx ng build`
Expected: build przechodzi.

- [ ] **Step 4: Kontrakt testid**

Run: `npm run testids:check`
Expected: exit code 0.

- [ ] **Step 5: Zweryfikuj zakres zmian w `src/`**

Run: `git diff dcec71a --stat -- src/`
Expected: wyłącznie dodane atrybuty `data-testid`, reformatowanie z Tasku 1 oraz trzy usunięte pliki `.spec.ts`. Żadnych zmian logiki. Jeśli diff pokazuje cokolwiek innego — cofnąć tę zmianę.

- [ ] **Step 6: Uzupełnij spec o testid dodany w Tasku 8**

Dopisz wiersz do tabeli w sekcji 7 specu:

```
| Numer rozdania w panelu | `bidding-panel-board-number` |
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: uzupelnienie kontraktu testid w specu

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
