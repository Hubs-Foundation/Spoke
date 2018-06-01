import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param cmdArray array containing command objects
 * @constructor
 */

const MultiCmdsCommand = function(cmdArray) {
  Command.call(this);

  this.type = "MultiCmdsCommand";
  this.name = "Multiple Changes";

  this.cmdArray = cmdArray !== undefined ? cmdArray : [];
};

MultiCmdsCommand.prototype = {
  execute: function() {
    this.editor.signals.sceneGraphChanged.active = false;

    for (let i = 0; i < this.cmdArray.length; i++) {
      this.cmdArray[i].execute();
    }

    this.editor.signals.sceneGraphChanged.active = true;
    this.editor.signals.sceneGraphChanged.dispatch();
  },

  undo: function() {
    this.editor.signals.sceneGraphChanged.active = false;

    for (let i = this.cmdArray.length - 1; i >= 0; i--) {
      this.cmdArray[i].undo();
    }

    this.editor.signals.sceneGraphChanged.active = true;
    this.editor.signals.sceneGraphChanged.dispatch();
  },

  toJSON: function() {
    const output = Command.prototype.toJSON.call(this);

    const cmds = [];
    for (let i = 0; i < this.cmdArray.length; i++) {
      cmds.push(this.cmdArray[i].toJSON());
    }
    output.cmds = cmds;

    return output;
  },

  fromJSON: function(json) {
    Command.prototype.fromJSON.call(this, json);

    const cmds = json.cmds;
    for (let i = 0; i < cmds.length; i++) {
      const cmd = new window[cmds[i].type](); // creates a new object of type "json.type"
      cmd.fromJSON(cmds[i]);
      this.cmdArray.push(cmd);
    }
  }
};

export default MultiCmdsCommand;
