import Command from "./Command";

export default class MultiCmdsCommand extends Command {
  constructor(editor, cmdArray) {
    super(editor);
    this.cmdArray = cmdArray !== undefined ? cmdArray : [];
  }

  execute() {
    for (const command of this.cmdArray) {
      command.execute();
    }
  }

  undo() {
    for (let i = this.cmdArray.length - 1; i >= 0; i--) {
      this.cmdArray[i].undo();
    }
  }

  toString() {
    return `MultiCmdsCommand id: ${this.id} commands:\n  ${this.cmdArray.map(cmd => cmd.toString()).join("\n  ")}`;
  }
}
