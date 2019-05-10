import Command from "./Command";

export default class MultiCmdsCommand extends Command {
  constructor(cmdArray) {
    super();
    this.type = "MultiCmdsCommand";
    this.name = "Multiple Changes";

    this.cmdArray = cmdArray !== undefined ? cmdArray : [];
  }

  execute() {
    this.editor.signals.sceneGraphChanged.active = false;

    for (const command of this.cmdArray) {
      command.execute();
    }

    this.editor.signals.sceneGraphChanged.active = true;
    this.editor.signals.sceneGraphChanged.dispatch();
  }

  undo() {
    this.editor.signals.sceneGraphChanged.active = false;

    for (let i = this.cmdArray.length - 1; i >= 0; i--) {
      this.cmdArray[i].undo();
    }

    this.editor.signals.sceneGraphChanged.active = true;
    this.editor.signals.sceneGraphChanged.dispatch();
  }
}
