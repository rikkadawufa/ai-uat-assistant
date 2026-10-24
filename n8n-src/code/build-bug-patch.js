function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function buildBugPatch(draft) {
  const runUrl = `https://dev.azure.com/${draft.org}/${draft.project}/_testManagement/runs?_a=runCharts&runId=${draft.runId}`;
  const storyUrl = `https://dev.azure.com/${draft.org}/_apis/wit/workItems/${draft.storyId}`;
  const steps = (draft.reproSteps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  const html = `<p>${escapeHtml(draft.summary)}</p><ol>${steps}</ol><h3>Expected</h3><p>${escapeHtml(draft.expected)}</p><h3>Actual</h3><p>${escapeHtml(draft.actual)}</p><h3>Evidence</h3>${draft.caseId ? `<p>Test case: ${escapeHtml(draft.caseId)}</p>` : ''}<p>${escapeHtml(draft.errorMessage)}</p><pre>${escapeHtml(String(draft.stackTrace || '').split('\n').slice(0, 15).join('\n'))}</pre><p><a href="${escapeHtml(runUrl)}">Test run</a>${draft.storyId ? '' : ' — Traceability missing'}</p><p>Drafted by AI, reviewed and approved by ${escapeHtml(draft.reviewer)} on ${escapeHtml(draft.date)}</p>`;
  const patch = [{ op: 'add', path: '/fields/System.Title', value: draft.title }, { op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: html }, { op: 'add', path: '/fields/Microsoft.VSTS.Common.Severity', value: draft.severity }, { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: draft.priority }, { op: 'add', path: '/fields/System.Tags', value: `shopeasy-demo; ai-drafted; qa-approved; ${draft.dedupKey}` }];
  if (draft.storyId) patch.push({ op: 'add', path: '/relations/-', value: { rel: 'System.LinkTypes.Related', url: storyUrl } });
  patch.push({ op: 'add', path: '/relations/-', value: { rel: 'Hyperlink', url: runUrl } });
  return patch;
}
if (typeof module !== 'undefined') module.exports = { buildBugPatch, escapeHtml };
