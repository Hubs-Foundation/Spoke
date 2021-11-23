// This is a port of https://github.com/protectwise/troika/tree/master/packages/troika-three-text
// that has been made functional and restyled for Mozilla Hubs and Spoke (hubs.mozilla.com)
// by @jamesckane at Paradowski Creative (paradowski.com)

import { Color, Object3D } from "three";
import EditorNodeMixin from "../../../../src/editor/nodes/EditorNodeMixin";
import { Text } from "troika-three-text";

export default class TroikaTextNode extends EditorNodeMixin(Object3D) {
  static legacyComponentName = "troika-text";

  static nodeName = "Troika Text";

  constructor(editor) {
    super(editor);
    this.editor = editor;
    this.scene = editor.scene;
    this.text = "Text";
    this.anchorX = "left";
    this.anchorY = "top";
    this.color = new Color();
    this.curveRadius = 0;
    this.depthOffset = 0;
    this.direction = "auto";
    this.fillOpacity = 1;
    this.font;
    this.fontSize = 10;
    this.textAlign = "left";
    this.letterSpacing = 0;
    // this.clipRect = "";  // Todo, implement later
    this.lineHeight = 1;
    this.outlineBlur = 0;
    this.outlineColor = new Color();
    this.outlineOffsetX = 0;
    this.outlineOffsetY = 0;
    this.outlineOpacity = 1;
    this.outlineWidth = 0;
    this.overflowWrap = "normal";
    this.strokeColor = new Color();
    this.strokeOpacity = 1;
    this.strokeWidth = 0;
    this.textAlign = "left";
    this.textIndent = 0;
    this.whiteSpace = "normal";
    this.maxWidth = 9999; // The serialize method can't seem to handle a value of Infinity, just feed it ~10k meters
    this.troikaText = new Text();
  }

  onChange(change) {
    // change is undefined when serialize returns - but whole node has been updated
    // change will be named if coming from a UI input
    if (change === "position") this.troikaText.position.copy(this.position);
    else if (change === "scale") this.troikaText.scale.copy(this.position);
    else if (change === "rotation") this.troikaText.rotation.copy(this.rotation);
    else if (change === "color" || change === "strokeColor" || change === "outlineColor") {
      this.troikaText[change] = new Color(this[change]);
    } else this.troikaText[change] = this[change];
    this.troikaText.sync();
  }

  onRemove() {
    this.scene.remove(this.troikaText);
    this.troikaText.dispose();
  }

  onAdd() {
    this.troikaText = new Text();
    this.troikaText.text = this.text;
    this.troikaText.anchorX = this.anchorX;
    this.troikaText.anchorY = this.anchorY;
    this.troikaText.color = this.color;
    this.troikaText.curveRadius = this.curveRadius;
    this.troikaText.depthOffset = this.depthOffset;
    this.troikaText.direction = this.direction;
    this.troikaText.fillOpacity = this.fillOpacity;
    this.troikaText.font = this.font;
    this.troikaText.fontSize = this.fontSize;
    this.troikaText.textAlign = this.textAlign;
    this.troikaText.letterSpacing = this.letterSpacing;
    this.troikaText.lineHeight = this.lineHeight;
    this.troikaText.outlineBlur = this.outlineBlur;
    this.troikaText.outlineColor = this.outlineColor;
    this.troikaText.outlineOffsetX = this.outlineOffsetX;
    this.troikaText.outlineOffsetY = this.outlineOffsetY;
    this.troikaText.outlineOpacity = this.outlineOpacity;
    this.troikaText.outlineWidth = this.outlineWidth;
    this.troikaText.overflowWrap = this.overflowWrap;
    this.troikaText.strokeColor = this.strokeColor;
    this.troikaText.strokeOpacity = this.strokeOpacity;
    this.troikaText.strokeWidth = this.strokeWidth;
    this.troikaText.textAlign = this.textAlign;
    this.troikaText.textIndent = this.textIndent;
    this.troikaText.whiteSpace = this.whiteSpace;
    this.troikaText.maxWidth = this.maxWidth;
    this.troikaText.position.copy(this.position);
    this.troikaText.rotation.copy(this.rotation);
    this.troikaText.scale.copy(this.scale);
    this.scene.add(this.troikaText);
    this.troikaText.sync();
  }

  copy(source) {
    super.copy(source, false);
    this.troikaText = new Text();
    this.troikaText.text = source.text;
    this.troikaText.anchorX = source.anchorX;
    this.troikaText.anchorY = source.anchorY;
    this.troikaText.color = source.color;
    this.troikaText.curveRadius = source.curveRadius;
    this.troikaText.depthOffset = source.depthOffset;
    this.troikaText.direction = source.direction;
    this.troikaText.fillOpacity = source.fillOpacity;
    this.troikaText.font = source.font;
    this.troikaText.fontSize = source.fontSize;
    this.troikaText.textAlign = source.textAlign;
    this.troikaText.letterSpacing = source.letterSpacing;
    this.troikaText.lineHeight = source.lineHeight;
    this.troikaText.outlineBlur = source.outlineBlur;
    this.troikaText.outlineColor = source.outlineColor;
    this.troikaText.outlineOffsetX = source.outlineOffsetX;
    this.troikaText.outlineOffsetY = source.outlineOffsetY;
    this.troikaText.outlineOpacity = source.outlineOpacity;
    this.troikaText.outlineWidth = source.outlineWidth;
    this.troikaText.overflowWrap = source.overflowWrap;
    this.troikaText.strokeColor = source.strokeColor;
    this.troikaText.strokeOpacity = source.strokeOpacity;
    this.troikaText.strokeWidth = source.strokeWidth;
    this.troikaText.textAlign = source.textAlign;
    this.troikaText.textIndent = source.textIndent;
    this.troikaText.whiteSpace = source.whiteSpace;
    this.troikaText.maxWidth = source.maxWidth;
    return this;
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const props = json.components.find(c => c.name === "troika-text").props;

    Object.keys(props).forEach(key => {
      if (key === "position") node.troikaText.position.copy(props.position);
      else if (key === "scale") node.troikaText.scale.copy(props.scale);
      else if (key === "rotation" || key === "quaternion") node.troikaText.rotation.copy(props.rotation);
      else if (key === "color" || key === "strokeColor" || key === "outlineColor") {
        node[key] = new Color(props[key]);
        node.troikaText[key] = new Color(props[key]);
      } else {
        node[key] = props[key];
        node.troikaText[key] = props[key];
      }
    });
    node.troikaText.sync();
    return node;
  }

  serialize() {
    const serialized = super.serialize({
      "troika-text": {
        text: this.text,
        anchorX: this.anchorX,
        anchorY: this.anchorY,
        color: this.color,
        curveRadius: this.curveRadius,
        depthOffset: this.depthOffset,
        direction: this.direction,
        fillOpacity: this.fillOpacity,
        font: this.font,
        fontSize: this.fontSize,
        letterSpacing: this.letterSpacing,
        lineHeight: this.lineHeight,
        outlineBlur: this.outlineBlur,
        outlineColor: this.outlineColor,
        outlineOffsetX: this.outlineOffsetX,
        outlineOffsetY: this.outlineOffsetY,
        outlineOpacity: this.outlineOpacity,
        outlineWidth: this.outlineWidth,
        overflowWrap: this.overflowWrap,
        strokeColor: this.strokeColor,
        strokeOpacity: this.strokeOpacity,
        strokeWidth: this.strokeWidth,
        textAlign: this.textAlign,
        textIndent: this.textIndent,
        whiteSpace: this.whiteSpace,
        maxWidth: this.maxWidth
      }
    });
    return serialized;
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("troika-text", {
      text: this.troikaText.text,
      anchorX: this.troikaText.anchorX,
      anchorY: this.troikaText.anchorY,
      color: this.troikaText.color,
      curveRadius: this.troikaText.curveRadius,
      depthOffset: this.troikaText.depthOffset,
      direction: this.troikaText.direction,
      fillOpacity: this.troikaText.fillOpacity,
      font: this.troikaText.font,
      fontSize: this.troikaText.fontSize,
      letterSpacing: this.troikaText.letterSpacing,
      lineHeight: this.troikaText.lineHeight,
      outlineBlur: this.troikaText.outlineBlur,
      outlineColor: this.troikaText.outlineColor,
      outlineOffsetX: this.troikaText.outlineOffsetX,
      outlineOffsetY: this.troikaText.outlineOffsetY,
      outlineOpacity: this.troikaText.outlineOpacity,
      outlineWidth: this.troikaText.outlineWidth,
      overflowWrap: this.troikaText.overflowWrap,
      strokeColor: this.troikaText.strokeColor,
      strokeOpacity: this.troikaText.strokeOpacity,
      strokeWidth: this.troikaText.strokeWidth,
      textAlign: this.troikaText.textAlign,
      textIndent: this.troikaText.textIndent,
      whiteSpace: this.troikaText.whiteSpace,
      maxWidth: this.troikaText.maxWidth
    });
  }
}
