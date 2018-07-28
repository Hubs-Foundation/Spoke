export default class SceneLoaderError extends Error {
  constructor(message, url, originalError) {
    super(message);
    this.url = url;
    this.originalError = originalError;
  }
}
