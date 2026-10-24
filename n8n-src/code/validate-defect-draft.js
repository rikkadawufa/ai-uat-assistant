function validateDefectDraft(draft, errorMessage) {
  const errors = [];
  const actual = String(draft.actual || '');
  const message = String(errorMessage || '').trim();
  const evidence = message.match(/\d+(?:\.\d+)?|["'][^"']+["']/g) || [];
  if (evidence.length ? !evidence.some((token) => actual.includes(token)) : !actual.toLowerCase().includes(message.toLowerCase())) errors.push('Actual result lacks error-message evidence');
  if (String(draft.title || '').length > 90 || !/^\[[^\]]+\] .+/.test(String(draft.title || ''))) errors.push('Title must be at most 90 characters and use [Area] phenomenon format');
  if (!['1 - Critical', '2 - High', '3 - Medium', '4 - Low'].includes(draft.suggestedSeverity)) errors.push('Invalid suggested severity');
  if (![1, 2, 3, 4].includes(Number(draft.suggestedPriority))) errors.push('Invalid suggested priority');
  if (!['high', 'medium', 'low'].includes(draft.confidence)) errors.push('Invalid confidence');
  return { valid: errors.length === 0, errors };
}

if (typeof module !== 'undefined') module.exports = { validateDefectDraft };
