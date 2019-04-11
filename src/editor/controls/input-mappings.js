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
  moveLeft: Symbol("moveLeft"),
  moveRight: Symbol("moveRight"),
  moveX: Symbol("moveX"),
  moveForward: Symbol("moveForward"),
  moveBackward: Symbol("moveBackward"),
  moveZ: Symbol("moveZ"),
  lookDeltaX: Symbol("lookDeltaX"),
  lookDeltaY: Symbol("lookDeltaY"),
  lookX: Symbol("lookX"),
  lookY: Symbol("lookY"),
  boost: Symbol("boost")
};

export const Spoke = {
  flyMode: Symbol("flyMode"),
  enableFlyMode: Symbol("enableFlyMode"),
  disableFlyMode: Symbol("disableFlyMode"),
  pan: Symbol("pan"),
  mouseDeltaX: Symbol("mouseDeltaX"),
  mouseDeltaY: Symbol("mouseDeltaY"),
  zoom: Symbol("zoom"),
  zoomDeltaY: Symbol("zoomDeltaY"),
  orbit: Symbol("orbit"),
  alt: Symbol("alt"),
  cmd: Symbol("cmd"),
  ctrl: Symbol("ctrl"),
  cmdOrCtrl: Symbol("cmdOrCtrl"),
  shift: Symbol("shift"),
  rightMouse: Symbol("rightMouse"),
  leftMouse: Symbol("leftMouse"),
  select: Symbol("select"),
  clickEvent: Symbol("clickEvent"),
  doubleClick: Symbol("doubleClick"),
  focusSelection: Symbol("focusSelection"),
  focus: Symbol("focus"),
  translateMode: Symbol("translateMode"),
  rotateMode: Symbol("rotateMode"),
  scaleMode: Symbol("scaleMode"),
  rotationSpaceToggle: Symbol("rotationSpaceToggle"),
  snapToggle: Symbol("snapToggle"),
  undo: Symbol("undo"),
  redo: Symbol("redo"),
  z: Symbol("z"),
  s: Symbol("s"),
  saveProject: Symbol("saveProject"),
  d: Symbol("d"),
  duplicateSelected: Symbol("duplicateSelected"),
  deleteSelected: Symbol("deleteSelected")
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
    click: {
      event: Spoke.clickEvent
    },
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
      left: Spoke.click,
      right: Spoke.disableFlyMode
    },
    move: {
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
      x: Spoke.rotationSpaceToggle,
      z: Spoke.z,
      d: Spoke.d,
      backspace: Spoke.deleteSelected,
      delete: Spoke.deleteSelected
    }
  },
  computed: [
    or(Spoke.cmd, Spoke.ctrl, Spoke.cmdOrCtrl),
    mouseEventToScreenSpaceCoords(Spoke.clickEvent, Spoke.select),
    mouseEventToScreenSpaceCoords(Spoke.doubleClickEvent, Spoke.focus),
    copy(Spoke.rightMouse, Spoke.flyMode),
    and(Spoke.alt, Spoke.rightMouse, Spoke.orbit),
    normalizeWheel(Spoke.zoomDeltaY, Spoke.zoom),
    metaHotkey(Spoke.cmdOrCtrl, Spoke.z, Spoke.shift, false, Spoke.undo),
    metaHotkey(Spoke.cmdOrCtrl, Spoke.z, Spoke.shift, true, Spoke.redo),
    and(Spoke.cmdOrCtrl, Spoke.d, Spoke.duplicateSelected),
    and(Spoke.cmdOrCtrl, Spoke.s, Spoke.saveProject),
    andNot(Spoke.s, Spoke.cmdOrCtrl, Spoke.snapToggle)
  ]
};
