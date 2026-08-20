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

/**
 * Testid uzyty w tescie jako szablon znamy tylko do miejsca interpolacji.
 * Zwracamy ten prefiks i informacje, ze porownanie ma byc przedrostkowe.
 */
function toLookup(id) {
  const index = id.indexOf('${');
  if (index === -1) {
    return { value: id, byPrefix: false };
  }
  return { value: id.slice(0, index), byPrefix: true };
}

/**
 * Sparametryzowany testid moze byc w szablonie zbudowany dynamicznie przez
 * [attr.data-testid] albo wypisany literalnie dla kazdej wartosci
 * (dealer-North, dealer-East, ...). Uznajemy go za pokryty w obu przypadkach.
 *
 * Ograniczenie: przy porownaniu przedrostkowym wystarczy jeden literal, wiec
 * usuniecie dealer-North przy zachowanym dealer-East przejdzie kontrole. Bez
 * uruchomienia testow nie da sie ustalic, jakie wartosci przyjmuje parametr.
 */
function isCovered({ value, byPrefix }, literal, dynamic) {
  if (byPrefix) {
    return (
      [...literal].some((id) => id.startsWith(value)) ||
      [...dynamic].some((prefix) => value.startsWith(prefix) || prefix.startsWith(value))
    );
  }
  return literal.has(value) || [...dynamic].some((prefix) => value.startsWith(prefix));
}

const { literal, dynamic } = declaredIds(collect('src', ['.html']));
const used = usedIds(collect('e2e', ['.ts']));

const declared = [...literal, ...dynamic].sort();
const missing = [...used]
  .map(toLookup)
  .filter((lookup) => !isCovered(lookup, literal, dynamic))
  .map((lookup) => (lookup.byPrefix ? `${lookup.value}*` : lookup.value))
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
