export default function getFixtureUrl(path) {
  return new URL(path, "https://localhost:9091");
}
