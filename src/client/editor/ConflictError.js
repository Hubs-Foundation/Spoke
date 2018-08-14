export default class ConflictError extends Error {
  constructor(message, type, uri, handler) {
    const trueProto = new.target.prototype;
    super(message);
    this.type = type;
    this.uri = uri;
    this.handler = handler;
    Object.setPrototypeOf(this, trueProto);
  }
}
