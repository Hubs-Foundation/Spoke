import Command from "./commands/Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

export default class History {
  constructor(editor) {
    this.editor = editor;
    this.undos = [];
    this.redos = [];
    this.lastCmdTime = new Date();
    this.idCounter = 0;

    this.historyDisabled = false;

    //Set editor-reference in Command

    Command.editor = editor;
  }

  execute(cmd, optionalName) {
    const lastCmd = this.undos[this.undos.length - 1];
    const timeDifference = new Date().getTime() - this.lastCmdTime.getTime();

    const isUpdatableCmd =
      lastCmd &&
      lastCmd.updatable &&
      cmd.updatable &&
      lastCmd.object === cmd.object &&
      lastCmd.type === cmd.type &&
      lastCmd.attributeName === cmd.attributeName;

    if (isUpdatableCmd && timeDifference < 1000) {
      lastCmd.update(cmd);
      cmd = lastCmd;
    } else {
      // the command is not updatable and is added as a new part of the history

      this.undos.push(cmd);
      cmd.id = ++this.idCounter;
    }
    cmd.name = optionalName !== undefined ? optionalName : cmd.name;
    cmd.execute();

    this.lastCmdTime = new Date();

    // clearing all the redo-commands

    this.redos = [];
    this.editor.signals.historyChanged.dispatch(cmd);
  }

  undo() {
    if (this.historyDisabled) {
      alert("Undo/Redo disabled while scene is playing.");
      return;
    }

    let cmd = undefined;

    if (this.undos.length > 0) {
      cmd = this.undos.pop();
    }

    if (cmd !== undefined) {
      cmd.undo();
      this.redos.push(cmd);
      this.editor.signals.historyChanged.dispatch(cmd);
    }

    return cmd;
  }

  redo() {
    if (this.historyDisabled) {
      alert("Undo/Redo disabled while scene is playing.");
      return;
    }

    let cmd = undefined;

    if (this.redos.length > 0) {
      cmd = this.redos.pop();
    }

    if (cmd !== undefined) {
      cmd.execute();
      this.undos.push(cmd);
      this.editor.signals.historyChanged.dispatch(cmd);
    }

    return cmd;
  }

  clear() {
    this.undos = [];
    this.redos = [];
    this.idCounter = 0;

    this.editor.signals.historyChanged.dispatch();
  }
}
