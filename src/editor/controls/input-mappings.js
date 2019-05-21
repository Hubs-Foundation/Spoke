function requestPointerLockHandler(filter) {
  return {
    handler: (event, input) => {
      const shouldRequest = filter ? filter(event, input) : true;

      if (shouldRequest) {
        input.canvas.requestPointerLock();
      }
    }
  };
}

function exitPointerLockHandler(filter) {
  return {
    handler: (event, input) => {
      const shouldExit = filter ? filter(event, input) : true;

      if (shouldExit && document.pointerLockElement === input.canvas) {
        document.exitPointerLock();
      }
    }
  };
}

function booleanEventHandler(outputAction) {
  return {
    reset: true,
    defaultValue: false,
    handler: () => true,
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
  lookX: "lookX",
  lookY: "lookY",
  boost: "boost"
};

export const Spoke = {
  focus: "focus",
  focusPosition: "focusPosition",
  focusSelection: "focusSelection",
  zoomDelta: "zoomDelta",
  enableFlyMode: "enableFlyMode",
  disableFlyMode: "disableFlyMode",
  flying: "flying",
  selecting: "selecting",
  selectStart: "selectStart",
  selectStartPosition: "selectStartPosition",
  selectEnd: "selectEnd",
  selectEndPosition: "selectEndPosition",
  cursorPosition: "cursorPosition",
  cursorDeltaX: "cursorDeltaX",
  cursorDeltaY: "cursorDeltaY",
  panning: "panning",
  setTranslateMode: "setTranslateMode",
  setRotateMode: "setRotateMode",
  setScaleMode: "setScaleMode",
  toggleSnapMode: "toggleSnapMode",
  invertSnap: "invertSnap",
  toggleRotationSpace: "toggleRotationSpace",
  deleteSelected: "deleteSelected",
  undo: "undo",
  redo: "redo",
  duplicateSelected: "duplicateSelected",
  saveProject: "saveProject",
  deselect: "deselect"
};

export const XR = {};

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
      normalizedMovementX: Fly.lookX,
      normalizedMovementY: Fly.lookY
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
    }
  ]
};

export const SpokeMapping = {
  mouse: {
    dblclick: {
      event: [booleanEventHandler(Spoke.focus)],
      position: Spoke.focusPosition
    },
    wheel: {
      normalizedDeltaY: Spoke.zoomDelta
    },
    pressed: {
      left: Spoke.selecting,
      middle: Spoke.panning,
      right: Spoke.flying
    },
    mousedown: {
      event: [requestPointerLockHandler(event => event.button === 2)],
      left: Spoke.selectStart,
      position: Spoke.selectStartPosition,
      right: Spoke.enableFlyMode
    },
    mouseup: {
      event: [exitPointerLockHandler(event => event.button === 2)],
      left: Spoke.selectEnd,
      position: Spoke.selectEndPosition,
      right: Spoke.disableFlyMode
    },
    move: {
      position: Spoke.cursorPosition,
      normalizedMovementX: Spoke.cursorDeltaX,
      normalizedMovementY: Spoke.cursorDeltaY
    }
  },
  keyboard: {
    pressed: {
      mod: Spoke.invertSnap
    },
    hotkeys: {
      f: Spoke.focusSelection,
      w: Spoke.setTranslateMode,
      e: Spoke.setRotateMode,
      r: Spoke.setScaleMode,
      x: Spoke.toggleSnapMode,
      z: Spoke.toggleRotationSpace,
      backspace: Spoke.deleteSelected,
      del: Spoke.deleteSelected,
      "mod+z": Spoke.undo,
      "mod+shift+z": Spoke.redo,
      "mod+d": Spoke.duplicateSelected,
      esc: Spoke.deselect
    },
    globalHotkeys: {
      "mod+s": Spoke.saveProject
    }
  }
};

export const XRMapping = {};
