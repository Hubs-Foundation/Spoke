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

export async function* getUpdates(perPage = 30) {
  let cursor = null;
  let hasMore = true;

  do {
    const cursorStr = cursor ? `, after: "${cursor}"` : "";

    const query = `query {
      repository(owner: "${process.env.GITHUB_ORG}", name: "${process.env.GITHUB_REPO}") {
        pullRequests(labels: ["whats new"], states: [MERGED], first: ${perPage}, orderBy: { field: UPDATED_AT, direction: DESC }${cursorStr}) {
          edges {
            node {
              title
              url
              mergedAt
              body
            }
            cursor
          }
        }
      }
    }`;

    // Read-only, public access token.
    const token = process.env.GITHUB_PUBLIC_TOKEN;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: { authorization: `token ${token}` }
    });

    const json = await response.json();

    if (json.errors) {
      let message = "Error fetching pull requests from GitHub:";

      for (const error of json.errors) {
        message += "\n" + error.message;
      }

      throw new Error(message);
    }

    const edges = json.data.repository.pullRequests.edges;

    if (edges.length < perPage) {
      hasMore = false;
    } else {
      cursor = edges[perPage - 1].cursor;
    }

    yield edges.map(({ node }) => ({
      ...node,
      formattedMergedAt: formatDate(node.mergedAt),
      formattedBody: formatBody(node.body)
    }));
  } while (hasMore);
}

export function getLatestUpdate() {
  return getUpdates(1)
    .next()
    .then(result => (result.value && result.value.length > 0 ? result.value[0] : null));
}
