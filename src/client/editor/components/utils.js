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
  const fullPath = image.src.substr(image.baseURI.length);
  // TODO Shouldn't have to hardcode api path here.
  return fullPath.replace("api/files/", "");
}

export function getDefaultsFromSchema(schema) {
  const defaults = {};
  schema.forEach(prop => {
    defaults[prop.name] = prop.default;
  });
  return defaults;
}
