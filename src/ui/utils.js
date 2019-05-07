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
