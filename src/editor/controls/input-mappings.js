let nextId = 1;
const Id = () => nextId++;

export const Fly = {
  moveLeft: Id(),
  moveRight: Id(),
  moveX: Id(),
  moveForward: Id(),
  moveBackward: Id(),
  moveZ: Id(),
  lookDeltaX: Id(),
  lookDeltaY: Id(),
  lookX: Id(),
  lookY: Id(),
  boost: Id()
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
