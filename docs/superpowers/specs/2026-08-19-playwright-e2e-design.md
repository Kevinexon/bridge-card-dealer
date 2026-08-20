# Warstwa testów: Playwright e2e + testy jednostkowe utils

Data: 2026-08-19
Status: zatwierdzony do implementacji

## 1. Cel

Zbudować siatkę bezpieczeństwa dla aplikacji **przed** planowanym refaktorem
nazewnictwa i jakości kodu. Refaktor dotknie praktycznie każdego pliku w
`src/`, a dziś nie ma żadnego wiarygodnego pokrycia testami. Bez tej siatki
refaktor byłby zmianą wykonywaną na ślepo.

Cel drugorzędny: udokumentować w formie wykonywalnej specyfikacji pięć
znanych błędów logiki brydżowej, żeby ich późniejsza naprawa była
weryfikowalna.

## 2. Kontekst aplikacji

BridgeCardDealer to narzędzie trenera brydża do odtwarzania rozdań w celach
edukacyjnych. Trener układa ręce, prowadzi licytację i rozgrywkę, dowolnie
cofa ruchy, zakrywa i odkrywa ręce — a następnie robi z tego zrzuty ekranu i
nagrania do analiz.

Stos: Angular 21 (signals, zoneless — brak `zone.js` w zależnościach),
Angular Material 21, Tailwind 4, Vitest przez `@angular/build:unit-test`.
Deploy: GitHub Pages jako statyczny HTML.

Architektura: jedna trasa `/stolik`, komponent `Table` jako smart container z
całym stanem, komponenty prezentacyjne w `ui/`, czysta logika w `utils/`.
`TableService` trzyma talię 52 kart jako pojedyncze źródło prawdy; każda karta
niesie własne `hand` i `isPlayed`. Faza licytacji i faza rozgrywki są
rozróżniane jednym warunkiem: `contract() == null`.

## 3. Determinizm

Aplikacja jest w pełni deterministyczna: brak `Math.random()`, `Date`,
`crypto`, wywołań sieciowych i persystencji. Stan jest czystą funkcją
sekwencji kliknięć.

Konsekwencja zweryfikowana empirycznie: `createDeck()` iteruje figury w pętli
zewnętrznej, a kolory w wewnętrznej, więc `dealNewDeck()` z podziałem `i % 4`
zawsze przydziela **każdemu graczowi jeden pełny kolor** (North — piki, East —
kiery, South — kara, West — trefle). Przycisk „Rozdaj ponownie" nie zmienia
niczego przy kolejnych kliknięciach.

Testy utrwalają ten rozkład jako stan startowy. Jeśli w przyszłości rozdanie
ma być tasowane, będzie to świadoma zmiana z aktualizacją testu — a nie cicha
regresja.

Dla Playwrighta determinizm oznacza, że jedynym realnym źródłem niestabilności
są animacje (ripple Material, drag&drop CDK). Są wyłączane globalnie.

## 4. Zakres

W zakresie:

- konfiguracja `@playwright/test` i skrypt `npm run e2e`
- atrybuty `data-testid` w szablonach produkcyjnych (zmiany wyłącznie
  addytywne)
- Page Object Model dla stołu
- scenariusze e2e: smoke, licytacja, rozgrywka, tryb trenera
- testy jednostkowe czystych funkcji w `utils/`
- usunięcie trzech istniejących plików `.spec.ts`
- dodanie `prettier` do devDependencies i skryptu `npm run format` —
  konfiguracja Prettiera istnieje dziś w `package.json`, ale sam pakiet nie
  jest zainstalowany, więc kryterium formatowania jest obecnie niewykonalne
- `CLAUDE.md` — utrwalenie wyników tej analizy w repozytorium (patrz sekcja 11)
- `scripts/testids.mjs` — weryfikacja spójności kontraktu testid (sekcja 11)

Poza zakresem tej fazy:

- naprawa pięciu znanych bugów logiki brydżowej (osobna faza, po testach)
- refaktor nazewnictwa (osobna faza)
- uruchamianie Playwrighta w CI — splątane z zepsutym workflow GitHub Actions,
  naprawiane razem z resztą infrastruktury
- testy wizualne (screenshoty) — rendering różni się między Windows a Linux w
  CI, wymaga osobnej decyzji

## 5. Testy jednostkowe czystych funkcji

Vitest jest już skonfigurowany i `ng test` poprawnie zwraca exit code 1 przy
niepowodzeniu, więc nadaje się do CI bez zmian.

Usuwamy trzy istniejące pliki: `app.spec.ts` (sprawdza `<h1>` z tekstem
„Hello, BridgeCardDealer", którego w szablonie nie ma), `bidding-table.spec.ts`
(pada na `NG0950` — brak wymaganego inputu) oraz `table.spec.ts` (pusty smoke z
generatora). Nie piszemy testów komponentów opartych o TestBed — ich rolę
przejmuje Playwright.

Dodajemy testy dla czystych funkcji, gdzie koszt jest minimalny, a diagnostyka
precyzyjna:

`bidding.util.spec.ts`

- `calculateMinLevel` — pusta historia, po odzywce w kolorze, po odzywce NT
  (wymusza podniesienie poziomu), z pominięciem PASS/X/XX
- `lastBiddedColorSeniority` — starszeństwo trefle < kara < kiery < piki < NT
- `isLastBidderEnemy` — dla każdej z czterech pozycji
- `lastNotPass` — pomija pasy, zwraca `null` dla samych pasów
- `isBiddingFaseOver` — trzy pasy po odzywce kończą; cztery pasy od otwarcia
  kończą; dwa pasy nie kończą
- `findHighestBid` — ignoruje PASS/X/XX
- `findDeclarer` — rozgrywającym jest ten z pary, kto **pierwszy** licytował
  kolor kontraktu, także gdy najwyższą odzywkę złożył partner
- `isContractDoubledOrRedubled` — brak kontry, kontra, rekontra
- `createContract` — poprawne flagi dla kontraktu czystego, z kontrą i z
  rekontrą

`card.util.spec.ts`

- `createCard` — mapowanie wartości, symbolu i ścieżki obrazka
- `createDeck` — 52 unikalne karty, 13 w każdym kolorze

`trick.util.ts` nie zawiera logiki (sam interfejs), więc go pomijamy.
`determineTrickWinner` jest dziś prywatną metodą `TableService` — testujemy ją
przez e2e; wydzielenie jej do `utils/` to kandydat na fazę refaktoru.

## 6. Infrastruktura Playwright

- `@playwright/test` jako devDependency, testy w katalogu `e2e/`
- `playwright.config.ts` w katalogu głównym
- `webServer` uruchamiający `ng serve` na porcie 4200, z
  `reuseExistingServer: true` lokalnie
- **tylko Chromium** — aplikacja jest jednoosobowym narzędziem desktopowym;
  Firefox i WebKit potroiłyby czas przy zerowej wartości. Do dołożenia, gdy
  pojawi się potrzeba.
- **sztywny viewport 1920×1080** — layout to `h-screen` z trzema rzędami i
  intensywnym pozycjonowaniem absolutnym (`play-area.html`); przy mniejszym
  oknie karty zachodzą na siebie
- **globalne wyłączenie animacji** przez wstrzyknięcie CSS
  (`* { transition: none !important; animation: none !important; }`) —
  ripple Material i animacje drag&drop CDK to jedyne realne źródło flake'a
- `npm run e2e` jako skrypt w `package.json`
- dodanie `@playwright/test`, `playwright` i katalogów wynikowych
  (`test-results/`, `playwright-report/`) do `.gitignore`

## 7. Kontrakt data-testid

Selektory oparto o `data-testid`, a nie o klasy CSS ani teksty UI, ponieważ
nadchodzący refaktor zmieni jedno i drugie. Testid jest kontraktem testowym i
ma pozostać stabilny.

Nazwy są po angielsku i semantyczne — opisują rolę, nie wygląd.

| Obszar             | testid                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Ręka               | `hand-North`, `hand-East`, `hand-South`, `hand-West`                                       |
| Karta w ręce       | `card-spades-A` (globalnie unikalne)                                                       |
| Zakrycie ręki      | `hand-North-visibility`                                                                    |
| Poziom odzywki     | `bid-level-1` … `bid-level-7`                                                              |
| Kolor odzywki      | `bid-suit-clubs`, `bid-suit-diamonds`, `bid-suit-hearts`, `bid-suit-spades`, `bid-suit-NT` |
| Odzywki specjalne  | `bid-pass`, `bid-double`, `bid-redouble`                                                   |
| Tabela licytacji   | `bidding-table`, `bidding-column-North`, `bidding-entry`                                   |
| Karta na stole     | `played-card-North`                                                                        |
| Licznik lew        | `tricks-ns`, `tricks-ew`, `contract-display`                                               |
| Panel trenera      | `admin-panel`, `admin-toggle`, `deal-new`, `edit-mode-toggle`, `board-number`              |
| Dealer i założenia | `dealer-North`, `vulnerable-NS`, `vulnerable-WE`                                           |
| Cofanie            | `undo-bid`, `reset-bidding`, `undo-card`, `undo-trick`, `reset-play`                       |
| Alerty             | `alert-dialog`, `alert-input`, `alert-panel`, `alert-item`                                 |

Karta jest w danym momencie albo w ręce, albo na stole — `isPlayed` filtruje ją
z `sortedHandDeck`, więc `card-spades-A` nigdy nie występuje dwukrotnie.

Zmiany w kodzie produkcyjnym są wyłącznie addytywne: dopisanie atrybutu, bez
ruszania logiki, klas i wyglądu.

## 8. Page Object Model

`e2e/pages/table.page.ts` opakowuje stół w język brydżowy, nie w język DOM:

```ts
await table.goto();
await table.bid('North', 1, 'spades');
await table.pass();
await table.double();
await table.playCard('East', 'hearts', 'A');
await table.expectTurn('South');
await table.expectTricks({ ns: 1, ew: 0 });
await table.expectHandSize('North', 12);
await table.enableEditMode();
await table.dragCard('spades', 'A', { to: 'South' });
await table.setDealer('East');
await table.undoCard();
```

Uzasadnienie: refaktor nazewnictwa dotknie wtedy jednego pliku, a nie
kilkudziesięciu asercji rozsianych po testach.

## 9. Scenariusze e2e

**A. Smoke** (`e2e/smoke.spec.ts`)

- aplikacja startuje na `/stolik`
- widoczne cztery ręce, każda po 13 kart
- rozkład startowy: każdy gracz ma jeden pełny kolor
- dealer domyślnie North, tura należy do North
- widoczny panel licytacji, niewidoczny licznik lew

**B. Licytacja** (`e2e/bidding.spec.ts`)

- legalna sekwencja 1♣ – 1♥ – 1♠ – PASS trafia do właściwych kolumn tabeli
- po odzywce 1♠ poziom 1 jest zablokowany dla kolorów młodszych
- po odzywce w NT minimalny poziom rośnie
- X aktywne tylko po odzywce przeciwnika, nieaktywne po własnej i po X
- XX aktywne tylko po kontrze przeciwnika
- trzy pasy po odzywce kończą licytację, pojawia się kontrakt i licznik lew
- cztery pasy od otwarcia kończą rozdanie bez kontraktu — **`fixme`, bug 1**
- tura po zakończeniu licytacji należy do gracza po lewej od rozgrywającego
  — **`fixme`, bug 2**
- kontrakt z rekontrą wyświetla XX w liczniku lew — **`fixme`, bug 3**
- kontra złożona przed właściwym kontraktem nie jest do niego doliczana
  — **`fixme`, bug 4**
- `undo-bid` cofa jedną odzywkę i przywraca turę
- `reset-bidding` czyści całą licytację i wraca do dealera
- start od dealera innego niż North przesuwa kolumny w tabeli

**C. Rozgrywka** (`e2e/play.spec.ts`)

- zagranie czterech kart zamyka lewę i zwiększa licznik właściwej strony
- zwycięzca lewy wychodzi do następnej
- atu bije wyższą kartę koloru wyjścia
- przy braku atu wygrywa najwyższa karta koloru wyjścia
- zagrana karta znika z ręki i pojawia się na stole po właściwej stronie
- `undo-card` cofa ostatnią kartę i przywraca turę
- `undo-trick` cofa całą lewę
- `reset-play` czyści rozgrywkę i oddaje wyjście graczowi po lewej od
  rozgrywającego

**D. Tryb trenera** (`e2e/trainer.spec.ts`)

- tryb edycji: przeciągnięcie karty z North do South zmienia liczniki 13→12 i
  13→14
- w trybie edycji kliknięcie w kartę nie zagrywa jej
- przycisk widoczności zakrywa rękę rewersem i odkrywa ponownie
- alert: kliknięcie odzywki w tabeli otwiera dialog, wpisany tekst pojawia się
  w panelu alertów, a przy odzywce widnieje znacznik
- zmiana dealera resetuje rozdanie
- przełączniki założeń zmieniają oznaczenie stron
- zmiana numeru rozdania jest widoczna w panelu licytacji i w liczniku lew

## 10. Obsługa znanych bugów

Testy opisują **poprawne reguły brydżowe**. Scenariusze, które na obecnym
kodzie nie przechodzą, oznaczamy `test.fixme()` (e2e) lub `it.skip()`
(jednostkowe) z komentarzem wskazującym plik i linię. Suite pozostaje zielony,
a bugi są udokumentowane jako wykonywalna specyfikacja. Naprawa każdego z nich
sprowadza się do usunięcia jednego znacznika.

Alternatywa — utrwalenie obecnego, błędnego zachowania — zamieniłaby testy w
cement na bugach i została odrzucona.

**Każdy wpis poniżej został zweryfikowany empirycznie: znacznik zdjęty, test
uruchomiony, upadek potwierdzony.** Pierwotna lista z analizy zawierała pięć
pozycji; dwie z nich weryfikacja obaliła lub zawęziła (patrz na końcu sekcji).

1. **Pas w koło rzuca wyjątkiem.** `isBiddingFaseOver` przy czterech pasach
   zwraca `true`, `findHighestBid` zwraca `undefined`, a `findDeclarer` czyta
   z tego `.bidder`. Zaobserwowany błąd:
   `TypeError: Cannot read properties of undefined (reading 'bidder')`.
   Globalny handler Angulara przechwytuje wyjątek, więc **aplikacja nie znika
   z ekranu** — kontrakt po prostu nigdy nie powstaje. Test musi więc sprawdzać
   błędy w konsoli, a nie widoczność elementów; asercja na ukryty kontrakt
   przechodzi trywialnie i nie wykrywa niczego.
   `bidding.util.ts:136-146`, `table.ts:224-230`. Test e2e, `fixme`.
2. **Kontrakt z rekontrą ma `isDoubled: false`.** Operator `??` nie łapie
   wartości `false`, bo `false` nie jest nullish. `bidding.util.ts:73`.
   Dziś **niewidoczne w UI**, bo `tricks-count.html` sprawdza `isRedubled`
   przed `isDoubled`, więc XX renderuje się poprawnie mimo błędnej flagi.
   Test jednostkowy, `it.skip` — e2e nie ma czego sprawdzać.
3. **`isContractDoubledOrRedubled` identyfikuje kontrakt po `biddingValue` i
   `bidder`, bez koloru.** Przy sekwencji 1♣ … 1♠ tego samego gracza trafia w
   pierwszą odzywkę i może policzyć kontrę sprzed właściwego kontraktu.
   `bidding.util.ts:167`. Test jednostkowy, `it.skip`.
4. **Widok dziadka jest martwy.** `hand.html` zawiera pełny layout ręki dziadka
   rozłożonej w cztery kolumny, ale `table.html` nigdy nie przekazuje inputu
   `isDummy`. Bez testu — to nie błąd zachowania, tylko funkcja nieuruchomiona,
   a docelowe zachowanie nie zostało uzgodnione.
5. **„Cofnij lewę" po zakończonej lewie nie zmniejsza licznika.** Zakończona
   lewa zostaje w `playedCards` jako czteroelementowa tablica — sygnał jest
   czyszczony dopiero przy zagraniu piątej karty (`addPlayedCard`,
   `table.ts:216-222`). `onUndoTrick` rozpoznaje więc lewę zakończoną jako
   „lewę w toku": zdejmuje cztery karty ze stołu i oddaje je do rąk, ale nie
   usuwa wpisu z `playedTricks`. Licznik dalej pokazuje 1. Dopiero drugie
   kliknięcie trafia w drugą gałąź i poprawia licznik — kartami, które wróciły
   już przy pierwszym. Ta sama przyczyna psuje „Cofnij kartę": po pełnej lewie
   zostają na stole trzy karty przy liczniku 1. Warunek w `table.ts:170`
   (i `table.ts:152`) musiałby odróżniać `length < 4` od `length === 4`.
   `table.ts:169-181`. Test e2e, `fixme`.

   Znalezione w Tasku 7, nie w analizie statycznej — oba objawy zweryfikowane
   przebiegiem w przeglądarce, nie odczytem kodu.

**Odrzucone po weryfikacji:** pierwotna analiza raportowała, że po licytacji
wychodzi rozgrywający zamiast gracza po jego lewej, na podstawie odczytu
`table.ts:227` w izolacji. Test e2e to obalił: `onBidding` wywołuje
`changePlayerTurn()` bezpośrednio po `endBiddingFase()`, więc wyjście przypada
poprawnie lewemu przeciwnikowi rozgrywającego. To nie jest bug.

## 11. Warstwa oszczędzania kontekstu

Cel: ograniczyć koszt ponownego dochodzenia do tych samych wniosków w kolejnych
sesjach pracy z asystentem.

Pomiar, na którym oparto decyzję: całe źródło to 50 KB / 1543 linie / 28 plików,
czyli około 13-15k tokenów przy oknie kontekstu 1M. Jednorazowe przeczytanie
projektu kosztuje więc ~1,5% kontekstu i **nie jest wąskim gardłem**. Wąskim
gardłem jest powtarzanie analizy architektury w każdej nowej sesji (~25-30k
tokenów za każdym razem). Dlatego odrzucono generyczne generatory inwentarza
komponentów, grafy zależności signali i dumpy AST — przy tej skali kosztowałyby
w utrzymaniu więcej, niż oszczędzają.

**`CLAUDE.md`** (powstaje przed implementacją) — mapa architektury, przepływ
stanu, komendy, zachowania nieoczywiste, lista znanych bugów z odwołaniami do
plików i linii, konwencje do zachowania. Plik ładowany automatycznie na starcie
każdej sesji.

**`scripts/testids.mjs`** (powstaje razem z atrybutami, w fazie e2e) — czyta
wszystkie `data-testid` z `src/`, porównuje ze zbiorem używanym w `e2e/` i
raportuje różnicę. Tryb `--check` kończy się kodem 1 przy rozjeździe, więc
nadaje się do CI i do weryfikacji po refaktorze. Wartość jest podwójna:
zabezpiecza poprawność kontraktu testowego, a przy okazji zastępuje czytanie
kilkunastu szablonów trzema linijkami outputu.

## 12. Kryteria akceptacji

- `npm run e2e` przechodzi lokalnie na czysto sklonowanym repozytorium
- `npm test` przechodzi i zwraca exit code 0
- żaden test nie jest niestabilny w trzech kolejnych uruchomieniach
- zmiany w `src/` ograniczają się do dodanych atrybutów `data-testid` oraz
  usunięcia trzech plików `.spec.ts`
- cztery bugi oznaczone `test.fixme()` z odwołaniem do pliku i linii
- kod sformatowany Prettierem
