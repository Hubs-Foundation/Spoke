/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

export default class History {
  constructor() {
    this.undos = [];
    this.redos = [];
    this.lastCmdTime = new Date();
    this.idCounter = 0;
    this.commandUpdatesEnabled = true; // Used for testing
  }

  execute(cmd) {
    const lastCmd = this.undos[this.undos.length - 1];
    const timeDifference = new Date().getTime() - this.lastCmdTime.getTime();

    if (
      this.commandUpdatesEnabled &&
      lastCmd &&
      lastCmd.constructor === cmd.constructor &&
      timeDifference < 1000 &&
      lastCmd.shouldUpdate(cmd)
    ) {
      lastCmd.update(cmd);
      cmd = lastCmd;
    } else {
      // the command is not updatable and is added as a new part of the history
      this.undos.push(cmd);
      cmd.id = ++this.idCounter;
      cmd.execute();
    }

    this.lastCmdTime = new Date();

    // clearing all the redo-commands

    this.redos = [];
  }

  undo() {
    let cmd = undefined;

    if (this.undos.length > 0) {
      cmd = this.undos.pop();
    }

    if (cmd !== undefined) {
      cmd.undo();
      this.redos.push(cmd);
    }

    return cmd;
  }

  redo() {
    let cmd = undefined;

    if (this.redos.length > 0) {
      cmd = this.redos.pop();
    }

    if (cmd !== undefined) {
      cmd.execute();
      this.undos.push(cmd);
    }

    return cmd;
  }

  clear() {
    this.undos = [];
    this.redos = [];
    this.idCounter = 0;
  }
}
