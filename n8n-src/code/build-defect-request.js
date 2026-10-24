function buildDefectRequest(result, prompt, retryErrors = []) {
  const evidence = { title: result.title || result.testCaseTitle || '', automatedTestName: result.automatedTestName || '', testCaseId: result.caseId || '', errorMessage: result.errorMessage || '', stackTrace: String(result.stackTrace || '').split('\n').slice(0, 40).join('\n'), storyKey: result.storyKey || '', story: result.story || { title: '', acceptanceCriteria: [] }, runUrl: result.runUrl || '' };
  const user = String(prompt.userTemplate || '').replace('{{failedResultJson}}', JSON.stringify(evidence, null, 2));
  return { messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: retryErrors.length ? `${user}\nValidation errors from the prior response: ${retryErrors.join('; ')}` : user }], response_format: { type: 'json_schema', json_schema: { name: 'defect_draft', strict: true, schema: prompt.schema } } };
}

if (typeof module !== 'undefined') module.exports = { buildDefectRequest };
