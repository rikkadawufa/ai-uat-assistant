function sha1(value) {
  return require('crypto').createHash('sha1').update(String(value || '')).digest('hex');
}

// Replace machine-specific roots in traceback paths so reviewers and Bugs never see local folders.
function redactPaths(trace) {
  return String(trace || '').replace(/"(?:[A-Za-z]:)?[\\/][^"]*?([\\/])(Lib|tests_shopeasy|shopeasy)\1/g, (match, separator, folder) => `"${folder === 'Lib' ? '<python>' : '<project>'}${separator}${folder}${separator}`);
}

function parseResult(result) {
  const comment = String(result?.comment || '');
  const storyKey = (comment.match(/(?:^|;)story=([^;]+)/) || [, ''])[1];
  const storyId = (comment.match(/(?:^|;)storyId=([^;]+)/) || [, ''])[1];
  const caseId = (comment.match(/(?:^|;)case=([^;]+)/) || [, ''])[1];
  const automatedTestName = String(result?.automatedTestName || '');
  return {
    ...result,
    storyKey,
    storyId,
    caseId,
    dedupKey: `dk-${sha1(automatedTestName).slice(0, 8)}`,
    traceability: storyId ? 'complete' : 'missing',
    stackTrace: redactPaths(result?.stackTrace).split('\n').slice(0, 40).join('\n'),
  };
}

if (typeof module !== 'undefined') module.exports = { parseResult, redactPaths, sha1 };
