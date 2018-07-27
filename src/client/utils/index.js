export function last(arr) {
  if (!arr || !arr.length) return null;
  return arr[arr.length - 1];
}

export function getSrcObject(src) {
  if (src instanceof Object || typeof src === "object") {
    return src;
  }
  if (src instanceof String || typeof src === "string") {
    return {
      path: src,
      isValid: true
    };
  }
  return {
    path: "",
    isValid: true
  };
}
