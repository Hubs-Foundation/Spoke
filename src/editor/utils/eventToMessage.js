export default function eventToMessage(event) {
  if (!event) return "";
  if (event.message) return event.message;
  const target = event.target;
  if (target) {
    const targetHtml = event.target.outerHTML;
    if (event.target.error) return `Error on element ${targetHtml}. "${target.error.message}"`;
    if (event.target.src) return `Error on element ${targetHtml}. Failed to load "${target.src}"`;
    return "Unknown error on element ${targetHtml}.";
  }
  return `Unknown error: "${JSON.stringify(event)}"`;
}
