function decodeHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAcceptanceCriteria(value) {
  const html = String(value ?? '');
  const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => decodeHtml(match[1])).filter(Boolean);
  return items.length ? items : decodeHtml(html).split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function parseStory(workItem) {
  const fields = workItem?.fields || {};
  const title = String(fields['System.Title'] || '');
  const match = title.match(/\[([^\]]+)\]/);
  return {
    id: workItem?.id,
    key: match ? match[1] : title.trim(),
    title: title.replace(/^\[[^\]]+\]\s*/, ''),
    description: decodeHtml(fields['System.Description']),
    acceptanceCriteria: parseAcceptanceCriteria(fields['Microsoft.VSTS.Common.AcceptanceCriteria']),
    tags: String(fields['System.Tags'] || '').split(';').map((tag) => tag.trim()).filter(Boolean),
  };
}

if (typeof module !== 'undefined') module.exports = { parseStory, parseAcceptanceCriteria, decodeHtml };
