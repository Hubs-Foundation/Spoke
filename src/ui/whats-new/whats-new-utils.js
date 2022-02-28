import markdownit from "markdown-it";
const markdown = markdownit();

function formatDate(value) {
  return value && new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export async function* getUpdates() {
  let cursor = null;
  let hasMore = true;

  do {
    const response = await fetch(
      `/api/v1/whats-new?source=${process.env.GITHUB_REPO}&${cursor ? `cursor=${cursor}` : ""}`
    );

    let pullRequests = [];

    try {
      const resp = await response.json();

      const moreCursor = resp.moreCursor;
      pullRequests = resp.pullRequests;

      if (moreCursor) {
        cursor = moreCursor;
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error("Error when fetching whats-new", e);
      hasMore = false;
    }

    yield pullRequests.map(pullRequest => ({
      ...pullRequest,
      formattedMergedAt: formatDate(pullRequest.mergedAt),
      formattedBody: markdown.render(pullRequest.body)
    }));
  } while (hasMore);
}

export function getLatestUpdate() {
  return getUpdates()
    .next()
    .then(result => (result.value && result.value.length > 0 ? result.value[0] : null));
}
