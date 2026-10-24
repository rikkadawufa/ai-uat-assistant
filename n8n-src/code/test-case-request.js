function buildStoryQuery() {
  return "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'User Story' AND [System.Tags] CONTAINS 'shopeasy-demo' ORDER BY [System.Id]";
}

function selectStories(stories, storyKeys) {
  const wanted = new Set((storyKeys || []).map((key) => String(key).trim().toUpperCase()).filter(Boolean));
  const selected = wanted.size ? stories.filter((story) => wanted.has(String(story.key).toUpperCase())) : stories;
  if (!selected.length) throw new Error(`No shopeasy-demo stories match storyKeys: ${[...wanted].join(', ') || '(all)'}`);
  return selected;
}

function buildTestCaseRequest(story, prompt, previousErrors = []) {
  const storyJson = JSON.stringify({
    storyKey: story.key,
    title: story.title,
    story: story.description,
    acceptanceCriteria: story.acceptanceCriteria.map((text, index) => ({ ac: index + 1, text })),
  }, null, 2);
  const messages = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.userTemplate.replace('{{storyJson}}', storyJson) },
  ];
  if (previousErrors.length) {
    messages.push({ role: 'user', content: `Your previous answer failed validation:\n- ${previousErrors.join('\n- ')}\nReturn the complete corrected JSON.` });
  }
  return {
    temperature: 0.2,
    response_format: { type: 'json_schema', json_schema: { name: 'test_cases', strict: true, schema: prompt.schema } },
    messages,
  };
}

function readLlmJson(response) {
  const content = response && response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
  if (typeof content !== 'string' || !content.trim()) return { data: null, error: 'LLM response has no message content' };
  try {
    return { data: JSON.parse(content), error: null };
  } catch (error) {
    return { data: null, error: `LLM content is not valid JSON: ${error.message}` };
  }
}

function countByType(cases) {
  const counts = { positive: 0, negative: 0, edge: 0 };
  cases.forEach((item) => { if (item.type in counts) counts[item.type] += 1; });
  return counts;
}

function summaryComment(cases, file) {
  const counts = countByType(cases);
  return `Generated ${cases.length} test cases (${counts.positive} positive / ${counts.negative} negative / ${counts.edge} edge) for QA review — file: ${file}`;
}

function summarizeStories(stories) {
  const generated = stories.filter((story) => story.status === 'generated');
  const skipped = stories.filter((story) => story.status === 'skipped');
  const needsHuman = stories.filter((story) => story.status === 'needs_human');
  return {
    generated: generated.length,
    skipped: skipped.length,
    needsHuman: needsHuman.length,
    cases: generated.reduce((total, story) => total + story.cases.length, 0),
    stories: {
      generated: generated.map((story) => story.key),
      skipped: skipped.map((story) => story.key),
      needsHuman: needsHuman.map((story) => ({ key: story.key, errors: story.errors })),
    },
  };
}

if (typeof module !== 'undefined') module.exports = { buildStoryQuery, selectStories, buildTestCaseRequest, readLlmJson, countByType, summaryComment, summarizeStories };
