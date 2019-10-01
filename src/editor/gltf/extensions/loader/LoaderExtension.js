export class LoaderExtension {
  constructor(loader, options) {
    this.loader = loader;
    this.options = options;
    this.extensionNames = [];
  }

  onLoad() {}
}
