import BaseComponent from "./BaseComponent";

export default class SaveableComponent extends BaseComponent {
  src = null;

  srcIsValid = true;

  modified = false;

  constructor(node, object, fileExtension) {
    super(node, object);
    this.fileExtension = fileExtension;
  }
}
