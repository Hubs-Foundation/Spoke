import markdownit from "markdown-it";
const markdown = markdownit();

function formatBody(body) {
  const paragraphs = body.split("\r\n\r\n").filter(l => l.trim());

  const paraAndImage = [paragraphs[0]];
  if (paragraphs[1] && paragraphs[1].includes("![")) {
    paraAndImage.push(paragraphs[1]);
  }

  return markdown.render(paraAndImage.join("\r\n\r\n"));
}

function formatDate(value) {
  return value && new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export async function getUpdatesPage(page, perPage = 30) {
  const endpoint = "https://api.github.com/repos/mozilla/spoke/pulls";

  const params = new URLSearchParams({
    sort: "created",
    direction: "desc",
    state: "closed",
    base: "master",
    per_page: perPage,
    page
  });
  // Read-only, public access token.
  const token = "de8cbfb4cc0281c7b731c891df431016c29b0ace";

  const pulls = await fetch(`${endpoint}?${params}`, {
    headers: { authorization: `token ${token}` }
  }).then(resp => resp.json());

  if (pulls.length === 0) {
    return { updates: [], hasMore: false };
  }

  const updates = pulls.filter(p => p.merged_at && p.labels.some(l => l.name === "whats new"));

  if (updates.length === 0) {
    return { updates, hasMore: true };
  }

  updates.sort((a, b) => a.merged_at < b.merged_at);

  for (const update of updates) {
    update.formattedMergedAt = formatDate(update.merged_at);
    update.formattedBody = formatBody(update.body);
  }

  return { updates, hasMore: true };
}

export async function getLatestUpdate() {
  const maxPages = 5;
  let pageIndex = 0;
  let page;
  do {
    page = await getUpdatesPage(pageIndex, 5);
    pageIndex++;
  } while (page.updates.length === 0 && page.hasMore && pageIndex < maxPages);

  return page.updates[0];
}
