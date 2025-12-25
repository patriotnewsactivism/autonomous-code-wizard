import assert from 'node:assert';
import { test } from 'node:test';
import { analyzeCode } from '../lib/analyzer.js';

const sampleCode = `var message = "Hello"\nif (message == "Hello") {\n  console.log(message)\n}`;

test('analyzeCode returns concise summary counts', () => {
  const result = analyzeCode(sampleCode);

  assert.strictEqual(result.stats.errors, 1);
  assert.strictEqual(result.stats.warnings, 2);
  assert.strictEqual(result.stats.suggestions, 2);
  assert.match(result.summary, /error/);
});

test('analyzeCode converts common issues in a single pass', () => {
  const result = analyzeCode(sampleCode);

  assert.ok(!result.fixedCode.includes('var '));
  assert.ok(!/(^|[^=!<>])==([^=])/.test(result.fixedCode));
  assert.ok(result.fixedCode.includes('=== "Hello"'));
  assert.ok(result.fixedCode.includes('console.log(message);'));
});

test('analyzeCode leaves clean code untouched', () => {
  const cleanCode = `const name = "Sam";\nif (name === "Sam") {\n  return name;\n}`;
  const result = analyzeCode(cleanCode);

  assert.strictEqual(result.issues.length, 0);
  assert.strictEqual(result.fixedCode.trim(), cleanCode.trim());
  assert.strictEqual(result.summary, 'No issues found.');
});
