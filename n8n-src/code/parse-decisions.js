const SEVERITIES = ['1 - Critical', '2 - High', '3 - Medium', '4 - Low'];
function parseDecisions(body, drafts = []) {
  if (body == null) return { reviewer: '', approved: [], rejected: [], errors: [], timedOut: true };
  const errors = [], approved = [], rejected = [], byKey = new Map(drafts.filter((draft) => draft.status !== 'needs_human').map((draft) => [draft.dedupKey, draft]));
  const reviewer = String(body.reviewer || '').trim();
  if (!reviewer) errors.push('Reviewer name is required');
  for (const key of Object.keys(body)) if (key.startsWith('decision__') && !byKey.has(key.slice(10))) errors.push(`Unknown draft key: ${key.slice(10)}`);
  for (const [key, draft] of byKey) {
    const decision = body[`decision__${key}`];
    if (decision === 'approve') {
      const severity = body[`severity__${key}`] || draft.suggestedSeverity;
      const priority = Number(body[`priority__${key}`] || draft.suggestedPriority);
      if (!SEVERITIES.includes(severity) || ![1, 2, 3, 4].includes(priority)) { errors.push(`Invalid severity or priority for ${key}`); continue; }
      approved.push({ ...draft, reviewer, title: body[`title__${key}`] || draft.title, severity, priority, reproSteps: String(body[`repro__${key}`] || (draft.reproSteps || []).join('\n')).split(/\r?\n/).map((line) => line.trim()).filter(Boolean) });
    } else rejected.push({ ...draft, reviewer });
  }
  return { reviewer, approved, rejected, errors, timedOut: false };
}
if (typeof module !== 'undefined') module.exports = { parseDecisions, SEVERITIES };
