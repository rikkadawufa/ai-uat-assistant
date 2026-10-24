function collectNumbers(value, set) {
  if (typeof value === 'number') set.add(String(value));
  else if (Array.isArray(value)) value.forEach((item) => collectNumbers(item, set));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectNumbers(item, set));
}

// A number followed by one of these nouns must equal the metric it names, not just any computed value.
const COUNT_CLAIMS = [
  [/(\d+)\s+passed\b/gi, 'passed', (m) => m.passed],
  [/(\d+)\s+failed\b/gi, 'failed', (m) => m.failed],
  [/(\d+)\s+blocked\b/gi, 'blocked', (m) => m.blocked],
  [/(\d+)\s+total\b/gi, 'total', (m) => m.total],
  [/(\d+)\s+(?:open\s+)?(?:defects?|bugs?)\b/gi, 'open bugs', (m) => Object.values(m.openBugs || {}).reduce((sum, count) => sum + count, 0)],
  [/(\d+)\s+stor(?:y|ies)\s+at\s+risk\b/gi, 'stories at risk', (m) => (m.storiesAtRisk || []).length],
  [/(\d+)\s+untested\s+stor(?:y|ies)\b/gi, 'untested stories', (m) => (m.untestedStories || []).length],
];
// Severity wording must match criticalIssues: a count must equal it, "no ..." needs zero, and a bare mention needs at least one.
const SEVERITY_CLAIM = /(\b(?:no|zero|without)\s+)?(?:(\d+)\s+)?(?:open\s+)?(?:high[- ]severity|critical|sev(?:erity)?[- ]?[12])\s+(?:open\s+)?(?:defects?|bugs?|issues?)\b/gi;

// Returns claim errors plus the counts the claims verified, which are allowed even when no metric holds them literally.
function checkClaims(text, metrics) {
  const errors = [], verified = new Set();
  for (const [pattern, label, actual] of COUNT_CLAIMS) {
    for (const match of text.matchAll(pattern)) {
      if (Number(match[1]) === actual(metrics)) verified.add(match[1]);
      else errors.push(`Claimed ${match[1]} ${label}, computed ${actual(metrics)}`);
    }
  }
  if (Array.isArray(metrics.criticalIssues)) {
    const critical = metrics.criticalIssues.length;
    for (const match of text.matchAll(SEVERITY_CLAIM)) {
      const claimed = match[1] ? 0 : match[2] !== undefined ? Number(match[2]) : null;
      if (claimed === null ? critical === 0 : claimed !== critical) errors.push(`Unsupported high-severity claim "${match[0].trim()}": computed ${critical} high-severity defects`);
      else if (match[2] !== undefined) verified.add(match[2]);
    }
  }
  return { errors, verified };
}

function checkReportNumbers(summary, metrics) {
  const permitted = new Set();
  collectNumbers(metrics, permitted);
  const text = `${summary.headline || ''} ${summary.summary || ''}`;
  const claims = checkClaims(text, metrics);
  const numbers = text.match(/\d+(?:\.\d+)?/g) || [];
  const invalidNumbers = numbers.filter((number) => !permitted.has(number) && !permitted.has(String(Number(number))) && !claims.verified.has(number));
  const readinessLabels = ['GREEN', 'AMBER', 'RED'];
  const presentLabels = readinessLabels.filter((label) => new RegExp(`\\b${label}\\b`).test(text));
  const readinessValid = !metrics.readiness || (presentLabels.length === 1 && presentLabels[0] === metrics.readiness);
  const errors = [...(readinessValid ? [] : [`Headline must contain only readiness ${metrics.readiness}`]), ...claims.errors];
  return { valid: invalidNumbers.length === 0 && errors.length === 0, invalidNumbers, errors };
}

if (typeof module !== 'undefined') module.exports = { checkReportNumbers };
