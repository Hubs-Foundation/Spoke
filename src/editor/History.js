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
    this.debug = false;
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

      if (this.debug) {
        console.log(`update: ${cmd}`);
      }
    } else {
      // the command is not updatable and is added as a new part of the history
      this.undos.push(cmd);
      cmd.id = ++this.idCounter;
      cmd.execute();

      if (this.debug) {
        console.log(`execute: ${cmd}`);
      }
    }

    this.lastCmdTime = new Date();

    // clearing all the redo-commands

    this.redos = [];

    return cmd;
  }

  revert(checkpointId) {
    let cmd = undefined;

    if (this.undos.length === 0) {
      return;
    }

    const lastCmd = this.undos[this.undos.length - 1];

    if (lastCmd && checkpointId > lastCmd.id) {
      console.warn("Tried to revert back to an undo action with an id greater than the last action");
      return;
    }

    do {
      if (this.undos.length > 0) {
        cmd = this.undos.pop();
      } else {
        cmd = undefined;
      }

      if (cmd !== undefined) {
        cmd.undo();
        this.redos.push(cmd);

        if (this.debug) {
          console.log(`revert: ${cmd}`);
        }
      }
    } while (cmd && checkpointId !== cmd.id);
  }

  undo() {
    let cmd = undefined;

    if (this.undos.length > 0) {
      cmd = this.undos.pop();
    }

    if (cmd !== undefined) {
      cmd.undo();
      this.redos.push(cmd);

      if (this.debug) {
        console.log(`undo: ${cmd}`);
      }
    }

    return cmd;
  }

  redo() {
    let cmd = undefined;

    if (this.redos.length > 0) {
      cmd = this.redos.pop();
    }

    if (cmd !== undefined) {
      cmd.execute(true);
      this.undos.push(cmd);

      if (this.debug) {
        console.log(`redo: ${cmd}`);
      }
    }

    return cmd;
  }

  getDebugLog() {
    return this.undos.map(cmd => cmd.toString()).join("\n");
  }

  clear() {
    this.undos = [];
    this.redos = [];
    this.idCounter = 0;
  }
}
