function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function csv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildReviewSheet(groups) {
  const headers = ['Story', 'Case ID', 'Title', 'Type', 'Priority', 'AC refs', 'Preconditions', 'Step #', 'Action', 'Expected', 'Test data'];
  const rows = [headers];
  const tables = groups.map(({ storyKey, cases }) => {
    const body = cases.flatMap((item) => item.steps.map((step, index) => {
      rows.push([storyKey, item.id, item.title, item.type, item.priority, item.acRefs.join(', '), item.preconditions.join('; '), index + 1, step.action, step.expected, item.testData]);
      return `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.priority)}</td><td>${escapeHtml(item.acRefs.join(', '))}</td><td>${escapeHtml(index + 1)}</td><td>${escapeHtml(step.action)}</td><td>${escapeHtml(step.expected)}</td></tr>`;
    }).join(''));
    return `<section><h2>${escapeHtml(storyKey)}</h2><table><thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Priority</th><th>AC refs</th><th>Step</th><th>Action</th><th>Expected</th></tr></thead><tbody>${body}</tbody></table></section>`;
  }).join('');
  return { csv: rows.map((row) => row.map(csv).join(',')).join('\n') + '\n', html: `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;margin:32px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d1d5db;padding:8px;text-align:left}th{background:#0f766e;color:#fff}section{margin-bottom:28px}</style></head><body><h1>ShopEasy UAT Test Case Review</h1>${tables}</body></html>` };
}

if (typeof module !== 'undefined') module.exports = { buildReviewSheet };
