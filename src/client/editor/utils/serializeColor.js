/**
 * TODO: THREE.Color's .toJSON method returns a number. Spoke's format currently expects hex strings.
 * In a future serialization format we should avoid having to call this method when serializing color props.
 **/
export default function serializeColor(color) {
  return "#" + color.getHexString();
}
