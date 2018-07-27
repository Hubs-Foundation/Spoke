export function last(arr) {
  if (!arr || !arr.length) return null;
  return arr[arr.length - 1];
}

export function getSrcObject(src) {
  if (src instanceof Object) {
    return src;
  }
  if (src instanceof String) {
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
