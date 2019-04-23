function initializeValue(source, initialState, state, resetKeys, value, reset) {
  if (!source) return;

  for (const sourceKey in source) {
    if (source.hasOwnProperty(sourceKey)) {
      const targetKey = source[sourceKey];

      if (sourceKey === "event") {
        if (typeof targetKey === "object" && targetKey !== null) {
          const defaultValue = targetKey.defaultValue === undefined ? null : targetKey.defaultValue;

          initialState[targetKey.action] = defaultValue;
          state[targetKey.action] = state[targetKey] !== undefined ? state[targetKey] : defaultValue;

          if (targetKey.reset && targetKey.action) {
            resetKeys.push(targetKey.action);
          }
        } else {
          initialState[targetKey] = null;
          state[targetKey] = state[targetKey] !== undefined ? state[targetKey] : null;
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

function isInputSelected() {
  const el = document.activeElement;
  const nodeName = el.nodeName;
  return el.isContentEditable || nodeName === "INPUT" || nodeName === "SELECT" || nodeName === "TEXTAREA";
}

function mergeMappings(mappings) {
  const output = {
    keyboard: {
      pressed: {},
      keyup: {},
      keydown: {}
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
    const action = mappingObj[key];
    delete state[action];
  }
}

const mouseButtons = ["left", "middle", "right", "button4", "button5"];

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
    window.addEventListener("resize", this.onResize);
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
    }

    const mouse = mapping.mouse;

    if (mouse) {
      initializeValue(mouse.click, initialState, state, resetKeys, 0, true);
      initializeValue(mouse.dblclick, initialState, state, resetKeys, 0, true);
      initializeValue(mouse.move, initialState, state, resetKeys, 0, true);
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

  onKeyDown = event => {
    if (isInputSelected()) return;

    let preventDefault = false;

    const keyboardMapping = this.mapping.keyboard;

    if (!keyboardMapping) return;

    if (keyboardMapping.event) {
      this.state[keyboardMapping.event] = event;
      preventDefault = true;
    }

    const pressedMapping = keyboardMapping.pressed;

    if (pressedMapping) {
      const action = pressedMapping[event.key.toLowerCase()];

      if (action) {
        this.state[action] = 1;
        preventDefault = true;
      }
    }

    const keydownMapping = keyboardMapping.keydown;

    if (keydownMapping) {
      const action = keydownMapping[event.key.toLowerCase()];

      if (action) {
        this.state[action] = 1;
        preventDefault = true;
      }
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
      this.state[keyboardMapping.event] = event;
      preventDefault = true;
    }

    const pressedMapping = keyboardMapping.pressed;

    if (pressedMapping) {
      const key = pressedMapping[event.key.toLowerCase()];

      if (key) {
        this.state[key] = 0;
        preventDefault = true;
      }
    }

    const keyupMapping = keyboardMapping.keyup;

    if (keyupMapping) {
      const key = keyupMapping[event.key.toLowerCase()];

      if (key) {
        this.state[key] = 1;
        preventDefault = true;
      }
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

      const eventAction = mousedownMapping.event;

      if (eventAction) {
        this.state[eventAction] = event;
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

      const eventAction = mouseupMapping.event;

      if (eventAction) {
        this.state[eventAction] = event;
      }
    }
  };

  onMouseMove = event => {
    event.stopPropagation();

    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const moveMapping = mouseMapping.move;

    if (!moveMapping) return;

    for (const key in moveMapping) {
      if (moveMapping.hasOwnProperty(key)) {
        if (key === "event") {
          this.state[moveMapping[key]] = event;
        } else if (key === "movementX" || key === "movementY") {
          this.state[moveMapping[key]] += event[key];
        } else {
          this.state[moveMapping[key]] = event[key];
        }
      }
    }
  };

  onWheel = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const wheelMapping = mouseMapping.wheel;

    if (!wheelMapping) return;

    for (const key in wheelMapping) {
      if (wheelMapping.hasOwnProperty(key)) {
        if (key === "event") {
          this.state[wheelMapping[key]] = event;
        } else if (key === "deltaX" || key === "deltaY") {
          this.state[wheelMapping[key]] += event[key];
        } else {
          this.state[wheelMapping[key]] = event[key];
        }
      }
    }
  };

  onClick = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const clickMapping = mouseMapping.click;

    if (clickMapping && clickMapping.event) {
      const eventMapping = clickMapping.event;
      let value;
      let action;

      if (typeof eventMapping === "object" && eventMapping !== null) {
        action = eventMapping.action;

        if (eventMapping.handler) {
          value = eventMapping.handler(event, this);
        } else {
          value = event;
        }
      } else {
        value = event;
        action = eventMapping;
      }

      if (action) {
        this.state[action] = value;
      }
    }
  };

  onDoubleClick = event => {
    const mouseMapping = this.mapping.mouse;

    if (!mouseMapping) return;

    const dblclickMapping = mouseMapping.dblclick;

    if (dblclickMapping && dblclickMapping.event) {
      const eventMapping = dblclickMapping.event;
      let value;
      let action;

      if (typeof eventMapping === "object" && eventMapping !== null) {
        action = eventMapping.action;

        if (eventMapping.handler) {
          value = eventMapping.handler(event, this);
        } else {
          value = event;
        }
      } else {
        value = event;
        action = eventMapping;
      }

      if (action) {
        this.state[action] = value;
      }
    }
  };

  onContextMenu = event => {
    event.preventDefault();
  };

  onResize = () => {
    this.boundingClientRect = this.canvas.getBoundingClientRect();
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
      this.state[key] = this.initialState[key];
    }
  }

  get(key) {
    return this.state[key] || 0;
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousemove", this.onMouseMove);
  }
}
