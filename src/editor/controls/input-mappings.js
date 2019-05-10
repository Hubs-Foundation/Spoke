import THREE from "../../vendor/three";

function and(sourceAction1, sourceAction2, outputAction) {
  return {
    transform: input => input.get(sourceAction1) && input.get(sourceAction2),
    action: outputAction
  };
}

function andNot(trueAction, falseAction, outputAction) {
  return {
    transform: input => input.get(trueAction) && !input.get(falseAction),
    action: outputAction
  };
}

function or(sourceAction1, sourceAction2, outputAction) {
  return {
    transform: input => input.get(sourceAction1) || input.get(sourceAction2),
    action: outputAction
  };
}

function copy(sourceAction, outputAction) {
  return {
    transform: input => input.get(sourceAction),
    action: outputAction
  };
}

function metaHotkey(metaAction, keyAction, shiftAction, expectedShiftValue, outputAction) {
  return {
    transform: input => input.get(metaAction) && input.get(keyAction) && input.get(shiftAction) == expectedShiftValue,
    action: outputAction
  };
}

function normalizeWheel(sourceAction, outputAction) {
  return {
    transform: input => {
      const value = input.get(sourceAction);

      if (value === 0) {
        return value;
      }

      return value > 0 ? 1 : -1;
    },
    action: outputAction
  };
}

function mouseEventToScreenSpaceCoords(sourceAction, outputAction) {
  return {
    defaultValue: null,
    state: new THREE.Vector2(),
    transform: (input, computed) => {
      const event = input.get(sourceAction);

      if (event) {
        const rect = input.boundingClientRect;
        return computed.state.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          ((event.clientY - rect.top) / rect.height) * -2 + 1
        );
      }

      return null;
    },
    action: outputAction
  };
}

export const Fly = {
  moveLeft: "moveLeft",
  moveRight: "moveRight",
  moveX: "moveX",
  moveForward: "moveForward",
  moveBackward: "moveBackward",
  moveZ: "moveZ",
  lookDeltaX: "lookDeltaX",
  lookDeltaY: "lookDeltaY",
  lookX: "lookX",
  lookY: "lookY",
  boost: "boost"
};

export const Spoke = {
  flyMode: "flyMode",
  enableFlyMode: "enableFlyMode",
  disableFlyMode: "disableFlyMode",
  pan: "pan",
  mouseDeltaX: "mouseDeltaX",
  mouseDeltaY: "mouseDeltaY",
  zoom: "zoom",
  zoomDeltaY: "zoomDeltaY",
  orbit: "orbit",
  alt: "alt",
  cmd: "cmd",
  ctrl: "ctrl",
  cmdOrCtrl: "cmdOrCtrl",
  shift: "shift",
  rightMouse: "rightMouse",
  leftMouse: "leftMouse",
  clickEvent: "clickEvent",
  doubleClick: "doubleClick",
  focusSelection: "focusSelection",
  focus: "focus",
  translateMode: "translateMode",
  rotateMode: "rotateMode",
  scaleMode: "scaleMode",
  rotationSpaceToggle: "rotationSpaceToggle",
  snapToggle: "snapToggle",
  undo: "undo",
  redo: "redo",
  z: "z",
  s: "s",
  saveProject: "saveProject",
  d: "d",
  duplicateSelected: "duplicateSelected",
  deleteSelected: "deleteSelected",
  mouseMoveEvent: "mouseMoveEvent",
  move: "move",
  snapModifier: "snapModifier",
  selecting: "selecting",
  selectEnd: "selectEnd",
  selectCoords: "selectCoords",
  mouseUpEvent: "mouseUpEvent"
};

export const FlyMapping = {
  keyboard: {
    pressed: {
      w: Fly.moveForward,
      a: Fly.moveLeft,
      s: Fly.moveBackward,
      d: Fly.moveRight,
      shift: Fly.boost
    }
  },
  mouse: {
    move: {
      movementX: Fly.lookDeltaX,
      movementY: Fly.lookDeltaY
    }
  },
  computed: [
    {
      transform: input => input.get(Fly.moveRight) - input.get(Fly.moveLeft),
      action: Fly.moveX
    },
    {
      transform: input => input.get(Fly.moveBackward) - input.get(Fly.moveForward),
      action: Fly.moveZ
    },
    {
      transform: input => -input.get(Fly.lookDeltaX) / input.canvas.clientWidth,
      action: Fly.lookX
    },
    {
      transform: input => -input.get(Fly.lookDeltaY) / input.canvas.clientHeight,
      action: Fly.lookY
    }
  ]
};

export const SpokeMapping = {
  mouse: {
    dblclick: {
      event: Spoke.doubleClickEvent
    },
    wheel: {
      deltaY: Spoke.zoomDeltaY
    },
    pressed: {
      left: Spoke.leftMouse,
      middle: Spoke.pan,
      right: Spoke.rightMouse
    },
    mousedown: {
      right: Spoke.enableFlyMode
    },
    mouseup: {
      event: Spoke.mouseUpEvent,
      left: Spoke.selectEnd,
      right: Spoke.disableFlyMode
    },
    move: {
      event: Spoke.mouseMoveEvent,
      movementX: Spoke.mouseDeltaX,
      movementY: Spoke.mouseDeltaY
    }
  },
  keyboard: {
    pressed: {
      alt: Spoke.alt,
      control: Spoke.ctrl,
      meta: Spoke.cmd,
      shift: Spoke.shift
    },
    keydown: {
      f: Spoke.focusSelection,
      w: Spoke.translateMode,
      e: Spoke.rotateMode,
      r: Spoke.scaleMode,
      s: Spoke.s,
      x: Spoke.snapToggle,
      z: Spoke.z,
      d: Spoke.d,
      backspace: Spoke.deleteSelected,
      delete: Spoke.deleteSelected
    }
  },
  computed: [
    or(Spoke.cmd, Spoke.ctrl, Spoke.cmdOrCtrl),
    mouseEventToScreenSpaceCoords(Spoke.mouseUpEvent, Spoke.selectCoords),
    mouseEventToScreenSpaceCoords(Spoke.doubleClickEvent, Spoke.focus),
    mouseEventToScreenSpaceCoords(Spoke.mouseMoveEvent, Spoke.move),
    copy(Spoke.rightMouse, Spoke.flyMode),
    and(Spoke.alt, Spoke.leftMouse, Spoke.orbit),
    normalizeWheel(Spoke.zoomDeltaY, Spoke.zoom),
    metaHotkey(Spoke.cmdOrCtrl, Spoke.z, Spoke.shift, false, Spoke.undo),
    metaHotkey(Spoke.cmdOrCtrl, Spoke.z, Spoke.shift, true, Spoke.redo),
    and(Spoke.cmdOrCtrl, Spoke.d, Spoke.duplicateSelected),
    and(Spoke.cmdOrCtrl, Spoke.s, Spoke.saveProject),
    andNot(Spoke.z, Spoke.cmdOrCtrl, Spoke.rotationSpaceToggle),
    copy(Spoke.cmdOrCtrl, Spoke.snapModifier),
    copy(Spoke.leftMouse, Spoke.selecting)
  ]
};
