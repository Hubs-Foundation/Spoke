export const types = {
  color: Symbol("color"),
  number: Symbol("number"),
  boolean: Symbol("boolean"),
  file: Symbol("file")
};

export function getDisplayName(name) {
  if (name.includes("-")) {
    return name
      .split("-")
      .map(([f, ...rest]) => f.toUpperCase() + rest.join(""))
      .join(" ");
  } else {
    const displayName = name.replace(/[A-Z]/g, " $&");
    return displayName[0].toUpperCase() + displayName.substr(1);
  }
}

export function getFilePath(image) {
  return image && image.src.substr(image.baseURI.length - 1);
}

export function getDefaultsFromSchema(schema) {
  const defaults = {};
  schema.forEach(prop => {
    defaults[prop.name] = prop.default;
  });
  return defaults;
}
