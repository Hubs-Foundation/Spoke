import BaseComponent from "./BaseComponent";

export default class SaveableComponent extends BaseComponent {
  src = null;

  modified = false;

  constructor(node, object, fileExtension) {
    super(node, object);
    this.fileExtension = fileExtension;
  }
}
