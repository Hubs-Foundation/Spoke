export function insertSeparator(children, separatorFn) {
  if (!Array.isArray(children)) {
    return children;
  }

  const length = children.length;

  if (length === 1) {
    return children[0];
  }

  return children.reduce((acc, item, idx) => {
    acc.push(item);

    if (idx !== length - 1) {
      acc.push(separatorFn(idx));
    }

    return acc;
  }, []);
}

export function unique(arr, maybeComp) {
  const set = new Set();
  const newArr = [];

  let comp = maybeComp;

  if (typeof comp === "undefined") {
    comp = item => item;
  } else if (typeof comp === "string") {
    comp = item => item[maybeComp];
  }

  for (const item of arr) {
    const key = comp(item);

    if (set.has(key)) continue;

    newArr.push(item);

    set.add(key);
  }

  return newArr;
}

export const isApple = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

export const cmdOrCtrlString = isApple ? "⌘" : "ctrl";

export function getStepSize(event, smallStep, mediumStep, largeStep) {
  if (event.altKey) {
    return smallStep;
  } else if (event.shiftKey) {
    return largeStep;
  }
  return mediumStep;
}

export function clamp(value, min, max) {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  }
  return value;
}

export function toPrecision(value, precision) {
  const p = 1 / precision;
  return Math.round(value * p) / p;
}

// https://stackoverflow.com/a/26188910
export function camelPad(str) {
  return (
    str
      // Look for long acronyms and filter out the last letter
      .replace(/([A-Z]+)([A-Z][a-z])/g, " $1 $2")
      // Look for lower-case letters followed by upper-case letters
      .replace(/([a-z\d])([A-Z])/g, "$1 $2")
      // Look for lower-case letters followed by numbers
      .replace(/([a-zA-Z])(\d)/g, "$1 $2")
      .replace(/^./, function(str) {
        return str.toUpperCase();
      })
      // Remove any white space left around the word
      .trim()
  );
}

// https://stackoverflow.com/a/18650828
export function bytesToSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}
