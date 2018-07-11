/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

export default class Command {
  constructor() {
    this.id = -1;
    this.inMemory = false;
    this.updatable = false;
    this.type = "";
    this.name = "";

    this.editor = Command.editor;
  }
}
