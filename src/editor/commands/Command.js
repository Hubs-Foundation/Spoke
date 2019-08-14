/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

export default class Command {
  constructor(editor) {
    this.editor = editor;
    this.id = -1;
    this.updatable = false;
  }

  execute() {}

  update(_command) {}

  undo() {}
}
