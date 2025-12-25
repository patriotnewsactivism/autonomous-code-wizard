const consoleLogRegex = /\bconsole\.log\b/;
const varRegex = /\bvar\s+([a-zA-Z_$][\w$]*)/;
const looseEqualityRegex = /(^|[^=!<>])==([^=])/g;

export function analyzeCode(code) {
  if (typeof code !== 'string') {
    throw new TypeError('Code must be a string');
  }

  const issues = [];
  const fixedLines = [];
  const lines = code.split('\n');

  for (let index = 0; index < lines.length; index++) {
    const originalLine = lines[index];
    const lineNumber = index + 1;
    const trimmed = originalLine.trim();

    let workingLine = originalLine;

    if (consoleLogRegex.test(originalLine)) {
      issues.push({
        type: 'warning',
        category: 'logging',
        line: lineNumber,
        description: 'Remove console logging in production code.',
        severity: 'medium',
      });
    }

    const varMatch = originalLine.match(varRegex);
    if (varMatch) {
      const [variableName] = varMatch.slice(1);
      workingLine = workingLine.replace(varRegex, `let ${variableName}`);
      issues.push({
        type: 'error',
        category: 'best-practice',
        line: lineNumber,
        description: `Use block-scoped declarations instead of var for ${variableName}.`,
        severity: 'high',
      });
    }

    let equalityFixes = 0;
    workingLine = workingLine.replace(looseEqualityRegex, (match, prefix, suffix) => {
      equalityFixes += 1;
      return `${prefix}===${suffix}`;
    });

    if (equalityFixes > 0) {
      issues.push({
        type: 'warning',
        category: 'best-practice',
        line: lineNumber,
        description: 'Prefer strict equality checks (===) over loose equality.',
        severity: 'medium',
      });
    }

    const needsSemicolon =
      trimmed.length > 0 &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(',') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*');

    if (needsSemicolon) {
      workingLine = `${workingLine.replace(/\s+$/, '')};`;
      issues.push({
        type: 'suggestion',
        category: 'syntax',
        line: lineNumber,
        description: 'Terminate statements with semicolons for consistency.',
        severity: 'low',
      });
    }

    fixedLines.push(workingLine);
  }

  const errorCount = issues.filter((item) => item.type === 'error').length;
  const warningCount = issues.filter((item) => item.type === 'warning').length;
  const suggestionCount = issues.filter((item) => item.type === 'suggestion').length;

  const summary =
    issues.length === 0
      ? 'No issues found.'
      : `${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${
          warningCount === 1 ? '' : 's'
        }, ${suggestionCount} suggestion${suggestionCount === 1 ? '' : 's'}`;

  return {
    issues,
    fixedCode: fixedLines.join('\n'),
    summary,
    stats: {
      total: issues.length,
      errors: errorCount,
      warnings: warningCount,
      suggestions: suggestionCount,
    },
  };
}
