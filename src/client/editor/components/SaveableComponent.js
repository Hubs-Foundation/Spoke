import BaseComponent from "./BaseComponent";

export default class SaveableComponent extends BaseComponent {
  uri = null;

  modified = false;

  constructor(fileExtension) {
    super();
    this.fileExtension = fileExtension;
  }
}
