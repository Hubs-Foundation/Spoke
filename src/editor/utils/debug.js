export function serializeVector2(value) {
  return `Vector2 { x: ${value.x}, y: ${value.y} }`;
}

export function serializeVector3(value) {
  return `Vector3 { x: ${value.x}, y: ${value.y}, z: ${value.z} }`;
}

export function serializeEuler(value) {
  return `Euler { x: ${value.x}, y: ${value.y}, z: ${value.z} }`;
}

export function serializeColor(value) {
  return `Color { r: ${value.r}, g: ${value.g}, b: ${value.b}, hex: #${value.getHexString()}`;
}

export function serializeVector4(value) {
  return `Vector4 { x: ${value.x}, y: ${value.y}, z: ${value.z}, w: ${value.w} }`;
}

export function serializeQuaternion(value) {
  return `Quaternion { x: ${value.x}, y: ${value.y}, z: ${value.z}, w: ${value.w} }`;
}

export function serializeObject3D(value) {
  if (!value) return value;

  return `${value.constructor.name} "${value.name}"`;
}

export function serializeObject3DArray(value) {
  return value.map(o => serializeObject3D(o)).join(",");
}

export function serializeProperty(value) {
  if (typeof value !== "object" || value === null) {
    return value;
  } else if (value.isVector2) {
    return serializeVector2(value);
  } else if (value.isVector3) {
    return serializeVector3(value);
  } else if (value.isEuler) {
    return serializeEuler(value);
  } else if (value.isColor) {
    return serializeColor(value);
  } else if (value.isVector4) {
    return serializeVector4(value);
  } else if (value.isQuaternion) {
    return serializeQuaternion(value);
  } else if (value.isObject3D) {
    return `${value.constructor.name} "${value.name}"`;
  } else if (value.constructor) {
    return value.constructor.name;
  } else {
    return value.toString();
  }
}

export function serializeProperties(properties) {
  const debugProperties = {};

  for (const propertyName in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, propertyName)) {
      debugProperties[propertyName] = serializeProperty(properties[propertyName]);
    }
  }

  return debugProperties;
}
