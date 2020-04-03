import Mousetrap from "mousetrap";
import isInputSelected from "../utils/isInputSelected";

const _globalCallbacks = {};
const _originalStopCallback = Mousetrap.prototype.stopCallback;

Mousetrap.prototype.stopCallback = function(e, element, combo, sequence) {
  const self = this;

  if (self.paused) {
    return true;
  }

  if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
    return false;
  }

  return _originalStopCallback.call(self, e, element, combo);
};

Mousetrap.prototype.bindGlobal = function(keys, callback, action) {
  const self = this;
  self.bind(keys, callback, action);

  if (keys instanceof Array) {
    for (let i = 0; i < keys.length; i++) {
      _globalCallbacks[keys[i]] = true;
    }
    return;
  }

  _globalCallbacks[keys] = true;
};

Mousetrap.prototype.unbindGlobal = function(keys, callback, action) {
  const self = this;
  self.unbind(keys, callback, action);

  if (keys instanceof Array) {
    for (let i = 0; i < keys.length; i++) {
      delete _globalCallbacks[keys[i]];
    }
    return;
  }

  delete _globalCallbacks[keys];
};

Mousetrap.init();

function initializeValue(source, initialState, state, resetKeys, value, reset, resetPosition = true) {
  if (!source) return;

  for (const sourceKey in source) {
    if (Object.prototype.hasOwnProperty.call(source, sourceKey)) {
      const targetKey = source[sourceKey];

      if (sourceKey === "event") {
        for (const { defaultValue, action, reset } of targetKey) {
          if (action !== undefined && defaultValue !== undefined) {
            initialState[action] = defaultValue;
            state[action] = defaultValue;

            if (reset) {
              resetKeys.push(action);
            }
          }
        }
        continue;
      } else if (sourceKey === "position") {
        initialState[targetKey] = { x: 0, y: 0 };
        state[targetKey] = state[targetKey] !== undefined ? state[targetKey] : { x: 0, y: 0 };

        if (resetPosition) {
          resetKeys.push(targetKey);
        }
        continue;
      }

      initialState[targetKey] = value;
      state[targetKey] = state[targetKey] !== undefined ? state[targetKey] : value;

      if (reset) {
        resetKeys.push(targetKey);
      }
    }
  }
}

function normalizeWheel(value) {
  if (value === 0) {
    return value;
  }

  return value > 0 ? 1 : -1;
}

function mergeMappings(mappings) {
  const output = {
    keyboard: {
      pressed: {},
      keyup: {},
      keydown: {},
      hotkeys: {},
      globalHotkeys: {}
    },
    mouse: {
      click: {},
      dblclick: {},
      move: {},
      wheel: {},
      pressed: {},
      mouseup: {},
      mousedown: {}
    },
    computed: []
  };

  for (const mapping of mappings.values()) {
    const { keyboard, mouse, computed } = mapping;

    if (keyboard) {
      if (keyboard.pressed) Object.assign(output.keyboard.pressed, keyboard.pressed);
      if (keyboard.keyup) Object.assign(output.keyboard.keyup, keyboard.keyup);
      if (keyboard.keydown) Object.assign(output.keyboard.keydown, keyboard.keydown);
      if (keyboard.hotkeys) Object.assign(output.keyboard.hotkeys, keyboard.hotkeys);
      if (keyboard.globalHotkeys) Object.assign(output.keyboard.globalHotkeys, keyboard.globalHotkeys);
    }

    if (mouse) {
      if (mouse.click) Object.assign(output.mouse.click, mouse.click);
      if (mouse.dblclick) Object.assign(output.mouse.dblclick, mouse.dblclick);
      if (mouse.move) Object.assign(output.mouse.move, mouse.move);
      if (mouse.wheel) Object.assign(output.mouse.wheel, mouse.wheel);
      if (mouse.pressed) Object.assign(output.mouse.pressed, mouse.pressed);
      if (mouse.mouseup) Object.assign(output.mouse.mouseup, mouse.mouseup);
      if (mouse.mousedown) Object.assign(output.mouse.mousedown, mouse.mousedown);
    }

    if (computed) {
      for (const obj of computed) {
        output.computed.push(obj);
      }
    }
  }

  return output;
}

function deleteValues(state, mappingObj) {
  for (const key in mappingObj) {
    if (!Object.prototype.hasOwnProperty.call(mappingObj, key)) continue;
    const action = mappingObj[key];
    delete state[action];
  }
}

const mouseButtons = ["left", "middle", "right", "button4", "button5"];

const SPECIAL_ALIASES = {
  option: "alt",
  command: "meta",
  return: "enter",
  escape: "esc",
  plus: "+",
  mod: /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "control"
};

export default class InputManager {
  constructor(canvas) {
    this.canvas = canvas;

    this.mappings = new Map();
    this.mapping = {};
    this.initialState = {};
    this.state = {};
    this.resetKeys = [];
    this.boundingClientRect = this.canvas.getBoundingClientRect();
    this.mouseDownTarget = null;

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("wheel", this.onWheel);
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousedown", this.onWindowMouseDown);
    canvas.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mouseup", this.onWindowMouseUp);
    canvas.addEventListener("dblclick", this.onDoubleClick);
    canvas.addEventListener("click", this.onClick);
    canvas.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("blur", this.onWindowBlur);
  }

  enableInputMapping(key, mapping) {
    this.mappings.set(key, mapping);
    this.setInputMapping(mergeMappings(this.mappings));
  }

  disableInputMapping(key) {
    const mapping = this.mappings.get(key);

    if (mapping) {
      const state = this.state;
      const { keyboard, mouse, computed } = mapping;

      if (keyboard) {
        if (keyboard.pressed) deleteValues(state, keyboard.pressed);
        if (keyboard.keyup) deleteValues(state, keyboard.keyup);
        if (keyboard.keydown) deleteValues(state, keyboard.keydown);

        const hotkeys = keyboard.hotkeys;

        if (hotkeys) {
          for (const binding in hotkeys) {
            if (!Object.prototype.hasOwnProperty.call(hotkeys, binding)) continue;
            Mousetrap.unbind(binding);
          }
          deleteValues(state, keyboard.hotkeys);
        }

        const globalHotkeys = keyboard.globalHotkeys;

        if (globalHotkeys) {
          for (const binding in globalHotkeys) {
            if (!Object.prototype.hasOwnProperty.call(globalHotkeys, binding)) continue;
            Mousetrap.unbindGlobal(binding);
          }
          deleteValues(state, keyboard.globalHotkeys);
        }
      }

      if (mouse) {
        if (mouse.click) deleteValues(state, mouse.click);
        if (mouse.dblclick) deleteValues(state, mouse.dblclick);
        if (mouse.move) deleteValues(state, mouse.move);
        if (mouse.wheel) deleteValues(state, mouse.wheel);
        if (mouse.pressed) deleteValues(state, mouse.pressed);
        if (mouse.mouseup) deleteValues(state, mouse.mouseup);
        if (mouse.mousedown) deleteValues(state, mouse.mousedown);
      }

      if (computed) {
        for (const obj of computed) {
          delete state[obj.action];
        }
      }

      this.mappings.delete(key);
      this.setInputMapping(mergeMappings(this.mappings));
    }
  }

  setInputMapping(mapping) {
    this.mapping = mapping;

    const initialState = {};
    const state = this.state;
    const resetKeys = [];

    const keyboard = mapping.keyboard;

    if (keyboard) {
      initializeValue(keyboard.pressed, initialState, state, resetKeys, 0, false);
      initializeValue(keyboard.keydown, initialState, state, resetKeys, 0, true);
      initializeValue(keyboard.keyup, initialState, state, resetKeys, 0, true);

      const hotkeys = keyboard.hotkeys;

      if (hotkeys) {
        for (const binding in hotkeys) {
          if (!Object.prototype.hasOwnProperty.call(hotkeys, binding)) continue;

          const action = hotkeys[binding];
          Mousetrap.bind(binding, () => {
            state[action] = true;
            return false;
          });
          initialState[action] = false;
          state[action] = false;
          resetKeys.push(action);
        }
      }

      const globalHotkeys = keyboard.globalHotkeys;

      if (globalHotkeys) {
        for (const binding in globalHotkeys) {
          if (!Object.prototype.hasOwnProperty.call(globalHotkeys, binding)) continue;

          const action = globalHotkeys[binding];
          Mousetrap.bindGlobal(binding, () => {
            state[action] = true;
            return false;
          });
          initialState[action] = false;
          state[action] = false;
          resetKeys.push(action);
        }
      }
    }

    const mouse = mapping.mouse;

    if (mouse) {
      initializeValue(mouse.click, initialState, state, resetKeys, 0, true);
      initializeValue(mouse.dblclick, initialState, state, resetKeys, 0, true);
      initializeValue(mouse.move, initialState, state, resetKeys, 0, true, false);
      initializeValue(mouse.wheel, initialState, state, resetKeys, 0, true);
      initializeValue(mouse.pressed, initialState, state, resetKeys, 0, false);
      initializeValue(mouse.mousedown, initialState, state, resetKeys, 0, true);
      initializeValue(mouse.mouseup, initialState, state, resetKeys, 0, true);
    }

    const computed = mapping.computed;

    if (computed) {
      for (const computedProp of computed) {
        const { action, transform, defaultValue, reset } = computedProp;
        const value = defaultValue !== undefined ? defaultValue : transform(this, computedProp, null, null);

        if (action === undefined) {
          throw new Error(`Action is undefined for ${computedProp}`);
        }

        initialState[action] = value;
        state[action] = value;

        if (reset) {
          resetKeys.push(action);
        }
      }
    }

    this.initialState = initialState;
    this.resetKeys = resetKeys;
  }

  handleEventMappings(eventMappings, event) {
    for (let i = 0; i < eventMappings.length; i++) {
      const eventMapping = eventMappings[i];
      const { handler, action } = eventMapping;
      const result = handler(event, this, eventMapping);
      if (action) {
        this.state[action] = result;
      }
    }
  }

  handleKeyMappings(keyMappings, event, value) {
    let eventKey = event.key;

    if (!eventKey) {
      eventKey = String.fromCharCode(event.which || event.code);
    }

    eventKey = eventKey.toLowerCase();

    let preventDefault = false;

    for (const key in keyMappings) {
      if (!Object.prototype.hasOwnProperty.call(keyMappings, key)) continue;

      const action = keyMappings[key];

      if (eventKey === key) {
        this.state[action] = value;
        preventDefault = true;
        continue;
      }

      const specialAlias = SPECIAL_ALIASES[key];

      if (eventKey === specialAlias) {
        this.state[action] = value;
        preventDefault = true;
      }
    }

    return preventDefault;
  }

  handlePosition(positionAction, event) {
    const position = this.state[positionAction];

    if (position) {
      const rect = this.boundingClientRect;
      position.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      position.y = ((event.clientY - rect.top) / rect.height) * -2 + 1;
    }
  }

  onKeyDown = event => {
    if (isInputSelected()) return;

    let preventDefault = false;

    const keyboardMapping = this.mapping.keyboard;

    if (!keyboardMapping) return;

    if (keyboardMapping.event) {
      this.handleEventMappings(keyboardMapping.event, event);
      preventDefault = true;
    }

    const pressedMapping = keyboardMapping.pressed;

    if (pressedMapping) {
      preventDefault = this.handleKeyMappings(pressedMapping, event, 1);
    }

    const keydownMapping = keyboardMapping.keydown;

    if (keydownMapping) {
      preventDefault = this.handleKeyMappings(keydownMapping, event, 1);
    }

    if (preventDefault) {
      event.preventDefault();
    }
  };

  onKeyUp = event => {
    if (isInputSelected()) return;

    let preventDefault = false;

    const keyboardMapping = this.mapping.keyboard;

    if (!keyboardMapping) return;

    if (keyboardMapping.event) {
      this.handleEventMappings(keyboardMapping.event, event);
      preventDefault = true;
    }

    const pressedMapping = keyboardMapping.pressed;

    if (pressedMapping) {
      preventDefault = this.handleKeyMappings(pressedMapping, event, 0);
    }

    const keyupMapping = keyboardMapping.keyup;

    if (keyupMapping) {
      preventDefault = this.handleKeyMappings(keyupMapping, event, 0);
    }

    if (preventDefault) {
      event.preventDefault();
    }
  };

  onWindowMouseDown = event => {
    this.mouseDownTarget = event.target;
  };

  onMouseDown = event => {
    this.mouseDownTarget = event.target;

    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const buttonKey = mouseButtons[event.button];

    const pressedMapping = mouseMapping.pressed;

    if (pressedMapping) {
      const action = pressedMapping[buttonKey];

      if (action) {
        this.state[action] = 1;
      }
    }

    const mousedownMapping = mouseMapping.mousedown;

    if (mousedownMapping) {
      const action = mousedownMapping[buttonKey];

      if (action) {
        this.state[action] = 1;
      }

      if (mousedownMapping.event) {
        this.handleEventMappings(mousedownMapping.event, event);
      }

      if (mousedownMapping.position) {
        this.handlePosition(mousedownMapping.position, event);
      }
    }
  };

  onWindowMouseUp = event => {
    const canvas = this.canvas;
    const mouseDownTarget = this.mouseDownTarget;

    this.mouseDownTarget = null;

    if (event.target === canvas || mouseDownTarget !== canvas) {
      return;
    }

    this.onMouseUp(event);
  };

  onMouseUp = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const buttonKey = mouseButtons[event.button];

    const pressedMapping = mouseMapping.pressed;

    if (pressedMapping) {
      const action = pressedMapping[buttonKey];

      if (action) {
        this.state[action] = 0;
      }
    }

    const mouseupMapping = mouseMapping.mouseup;

    if (mouseupMapping) {
      const action = mouseupMapping[buttonKey];

      if (action) {
        this.state[action] = 1;
      }

      if (mouseupMapping.event) {
        this.handleEventMappings(mouseupMapping.event, event);
      }

      if (mouseupMapping.position) {
        this.handlePosition(mouseupMapping.position, event);
      }
    }
  };

  onMouseMove = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const moveMapping = mouseMapping.move;

    if (!moveMapping) return;

    for (const key in moveMapping) {
      if (Object.prototype.hasOwnProperty.call(moveMapping, key)) {
        if (key === "event") {
          this.handleEventMappings(moveMapping.event, event);
        } else if (key === "movementX" || key === "movementY") {
          this.state[moveMapping[key]] += event[key];
        } else if (key === "normalizedMovementX") {
          this.state[moveMapping[key]] += -event.movementX / this.canvas.clientWidth;
        } else if (key === "normalizedMovementY") {
          this.state[moveMapping[key]] += -event.movementY / this.canvas.clientHeight;
        } else if (key === "position") {
          this.handlePosition(moveMapping.position, event);
        } else {
          this.state[moveMapping[key]] = event[key];
        }
      }
    }
  };

  onWheel = event => {
    const mouseMapping = this.mapping.mouse;

    event.preventDefault();

    if (!mouseMapping) return false;

    const wheelMapping = mouseMapping.wheel;

    if (!wheelMapping) return false;

    for (const key in wheelMapping) {
      if (Object.prototype.hasOwnProperty.call(wheelMapping, key)) {
        if (key === "event") {
          this.handleEventMappings(wheelMapping.event, event);
        } else if (key === "deltaX" || key === "deltaY") {
          this.state[wheelMapping[key]] += event[key];
        } else if (key === "normalizedDeltaX") {
          this.state[wheelMapping[key]] = normalizeWheel(event.deltaX);
        } else if (key === "normalizedDeltaY") {
          this.state[wheelMapping[key]] = normalizeWheel(event.deltaY);
        } else {
          this.state[wheelMapping[key]] = event[key];
        }
      }
    }

    return false;
  };

  onClick = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const clickMapping = mouseMapping.click;

    if (clickMapping && clickMapping.event) {
      this.handleEventMappings(mouseMapping.event, event);
    }

    if (clickMapping.position) {
      this.handlePosition(clickMapping.position, event);
    }
  };

  onDoubleClick = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const dblclickMapping = mouseMapping.dblclick;

    if (!dblclickMapping) {
      return;
    }

    if (dblclickMapping.event) {
      this.handleEventMappings(dblclickMapping.event, event);
    }

    if (dblclickMapping.position) {
      this.handlePosition(dblclickMapping.position, event);
    }
  };

  onContextMenu = event => {
    event.preventDefault();
  };

  onResize = () => {
    this.boundingClientRect = this.canvas.getBoundingClientRect();
  };

  onWindowBlur = () => {
    const initialState = this.initialState;

    for (const key in initialState) {
      if (Object.prototype.hasOwnProperty.call(initialState, key)) {
        this.state[key] = initialState[key];
      }
    }
  };

  update(dt, time) {
    const computed = this.mapping.computed;

    if (computed) {
      for (let i = 0; i < computed.length; i++) {
        const computedProp = computed[i];
        const { action, transform } = computedProp;
        this.state[action] = transform(this, computedProp, dt, time);
      }
    }
  }

  reset() {
    for (let i = 0; i < this.resetKeys.length; i++) {
      const key = this.resetKeys[i];

      const actionState = this.state[key];
      const initialActionState = this.initialState[key];

      if (typeof actionState === "object" && typeof initialState === "object") {
        if (actionState !== null && initialActionState !== null) {
          this.state[key] = Object.assign(this.state[key], initialActionState);
        } else if (initialActionState !== null) {
          this.state[key] = Object.assign({}, initialActionState);
        }
      } else {
        this.state[key] = initialActionState;
      }
    }
  }

  get(key) {
    return this.state[key] || 0;
  }

  dispose() {
    const canvas = this.canvas;

    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    canvas.removeEventListener("wheel", this.onWheel);
    canvas.removeEventListener("mousemove", this.onMouseMove);
    canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousedown", this.onWindowMouseDown);
    canvas.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mouseup", this.onWindowMouseUp);
    canvas.removeEventListener("dblclick", this.onDoubleClick);
    canvas.removeEventListener("click", this.onClick);
    canvas.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener("blur", this.onWindowBlur);
  }
}
