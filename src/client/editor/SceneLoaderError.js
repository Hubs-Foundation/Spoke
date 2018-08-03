export default class SceneLoaderError extends Error {
  constructor(message, url, type, originalError) {
    super(message);
    this.name = "SceneLoaderError";
    this.url = url;
    this.errorType = type;
    this.originalError = originalError;
  }
}
