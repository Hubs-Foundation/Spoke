export default function getFixtureUrl(path) {
  return new URL(path, "https://hubs.local:9090");
}
