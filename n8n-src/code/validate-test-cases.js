function validateTestCases(data, acceptanceCriteriaCount) {
  const errors = [];
  const cases = Array.isArray(data && data.cases) ? data.cases : [];
  const positiveCoverage = new Set();
  const types = new Set();
  cases.forEach((item, index) => {
    types.add(item.type);
    if (!Array.isArray(item.steps) || item.steps.length === 0) errors.push(`Case ${index + 1} has no steps`);
    if (item.type === 'positive' && Array.isArray(item.acRefs)) item.acRefs.forEach((ref) => positiveCoverage.add(ref));
  });
  for (let ref = 1; ref <= acceptanceCriteriaCount; ref += 1) {
    if (!positiveCoverage.has(ref)) errors.push(`Missing positive coverage for AC ${ref}`);
  }
  if (!types.has('negative')) errors.push('At least one negative case is required');
  if (!types.has('edge')) errors.push('At least one edge case is required');
  const normalized = cases.map((item, index) => ({ ...item, id: `TC-${data.storyKey}-${String(index + 1).padStart(2, '0')}` }));
  return { valid: errors.length === 0, errors, cases: normalized };
}

if (typeof module !== 'undefined') module.exports = { validateTestCases };
