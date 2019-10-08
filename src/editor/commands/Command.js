/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

export default class Command {
  constructor(editor) {
    this.editor = editor;
    this.id = -1;
  }

  execute(_redo) {}

  shouldUpdate(_newCommand) {
    return false;
  }

  update(_command) {}

  undo() {}

  toString() {
    return `${this.constructor.name} id: ${this.id}`;
  }
}
