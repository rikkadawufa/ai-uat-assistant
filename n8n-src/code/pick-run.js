function completedUatRuns(runs = []) {
  return runs.filter((run) => String(run.name || '').startsWith('ShopEasy UAT') && run.state === 'Completed').sort((a, b) => Number(b.id) - Number(a.id));
}

function pickRun(runs, requestedId) {
  const eligible = completedUatRuns(runs);
  return requestedId === undefined || requestedId === null || requestedId === '' ? eligible[0] || null : eligible.find((run) => String(run.id) === String(requestedId)) || null;
}

function pickRecentRuns(runs, now = new Date()) {
  const cutoff = new Date(now).getTime() - 7 * 24 * 60 * 60 * 1000;
  const eligible = completedUatRuns(runs).filter((run) => new Date(run.completedDate).getTime() >= cutoff);
  return { current: eligible[0] || null, previous: eligible[1] || null };
}

if (typeof module !== 'undefined') module.exports = { pickRun, pickRecentRuns, completedUatRuns };
