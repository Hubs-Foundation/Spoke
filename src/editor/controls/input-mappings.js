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
  moveDown: "moveDown",
  moveUp: "moveUp",
  moveY: "moveY",
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
  toggleTransformPivot: "toggleTransformPivot",
  modifier: "modifier",
  shift: "shift",
  toggleTransformSpace: "toggleTransformSpace",
  deleteSelected: "deleteSelected",
  undo: "undo",
  redo: "redo",
  duplicateSelected: "duplicateSelected",
  groupSelected: "groupSelected",
  saveProject: "saveProject",
  cancel: "cancel",
  rotateLeft: "rotateLeft",
  rotateRight: "rotateRight",
  incrementGridHeight: "incrementGridHeight",
  decrementGridHeight: "decrementGridHeight"
};

export const FlyMapping = {
  keyboard: {
    pressed: {
      w: Fly.moveForward,
      a: Fly.moveLeft,
      s: Fly.moveBackward,
      d: Fly.moveRight,
      r: Fly.moveDown,
      t: Fly.moveUp,
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
      transform: input => input.get(Fly.moveUp) - input.get(Fly.moveDown),
      action: Fly.moveY
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
      mod: Spoke.modifier,
      shift: Spoke.shift
    },
    hotkeys: {
      "=": Spoke.incrementGridHeight,
      "-": Spoke.decrementGridHeight,
      f: Spoke.focusSelection,
      t: Spoke.setTranslateMode,
      r: Spoke.setRotateMode,
      y: Spoke.setScaleMode,
      q: Spoke.rotateLeft,
      e: Spoke.rotateRight,
      g: Spoke.grab,
      z: Spoke.toggleTransformSpace,
      x: Spoke.toggleTransformPivot,
      c: Spoke.toggleSnapMode,
      backspace: Spoke.deleteSelected,
      del: Spoke.deleteSelected,
      "mod+z": Spoke.undo,
      "mod+shift+z": Spoke.redo,
      "mod+d": Spoke.duplicateSelected,
      "mod+g": Spoke.groupSelected,
      esc: Spoke.cancel
    },
    globalHotkeys: {
      "mod+s": Spoke.saveProject
    }
  }
};
