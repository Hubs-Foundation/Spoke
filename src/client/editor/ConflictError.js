export default class ConflictError extends Error {
  constructor(message, type, uri, handler) {
    super(message);
    this.name = "ConflictError";
    this.type = type;
    this.uri = uri;
    this.handler = handler;
  }
}
