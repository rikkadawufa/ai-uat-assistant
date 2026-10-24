function computeMetrics({ results = [], bugs = [], stories = [], previousResults = [] }) {
  const count = (outcome) => results.filter((item) => item.outcome === outcome).length;
  const total = results.length;
  const passed = count('Passed');
  const failed = count('Failed');
  const blocked = results.filter((item) => item.outcome === 'Blocked' || item.outcome === 'NotExecuted').length;
  const executable = total - blocked;
  const passRate = executable ? Number((passed / executable * 100).toFixed(1)) : 0;
  const executionProgress = total ? Number((executable / total * 100).toFixed(1)) : 0;
  const activeBugs = bugs.filter((bug) => !['Closed', 'Resolved'].includes(bug.state));
  const openBugs = activeBugs.reduce((all, bug) => { all[bug.severity] = (all[bug.severity] || 0) + 1; return all; }, {});
  const criticalIssues = activeBugs.filter((bug) => ['1 - Critical', '2 - High'].includes(bug.severity));
  const coverage = stories.map((story) => {
    const storyResults = results.filter((item) => item.storyKey === story.key);
    return { storyKey: story.key, tests: storyResults.length, passed: storyResults.filter((item) => item.outcome === 'Passed').length, failed: storyResults.filter((item) => item.outcome === 'Failed').length, blocked: storyResults.filter((item) => ['Blocked', 'NotExecuted'].includes(item.outcome)).length };
  });
  const untestedStories = coverage.filter((item) => item.tests === 0).map((item) => item.storyKey);
  const storiesAtRisk = coverage.filter((item) => item.failed || item.blocked).map((item) => item.storyKey);
  const hasSev1 = criticalIssues.some((bug) => bug.severity === '1 - Critical');
  const hasSev2 = criticalIssues.some((bug) => bug.severity === '2 - High');
  const readiness = passRate >= 95 && !hasSev1 && !hasSev2 && blocked === 0 ? 'GREEN' : passRate >= 80 && !hasSev1 ? 'AMBER' : 'RED';
  const previousPassed = previousResults.filter((item) => item.outcome === 'Passed').length;
  const previousFailed = previousResults.filter((item) => item.outcome === 'Failed').length;
  return { total, passed, failed, blocked, passRate, executionProgress, openBugs, criticalIssues, storyCoverage: coverage, untestedStories, storiesAtRisk, outstanding: { blocked: results.filter((item) => ['Blocked', 'NotExecuted'].includes(item.outcome)).map((item) => item.automatedTestName || item.title), untestedStories, missingAcceptanceCriteria: stories.filter((story) => !story.acceptanceCriteria || story.acceptanceCriteria.length === 0).map((story) => story.key) }, readiness, readinessReasons: readiness === 'GREEN' ? ['All release gates met'] : [`Pass rate ${passRate}%`, ...(blocked ? [`${blocked} blocked tests`] : []), ...(criticalIssues.length ? [`${criticalIssues.length} high-severity defects`] : [])], delta: previousResults.length ? { passed: passed - previousPassed, failed: failed - previousFailed } : null };
}

if (typeof module !== 'undefined') module.exports = { computeMetrics };
