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
    if (change === "position" || change === "scale" || change === "rotation") return;
    else if (change === "color" || change === "strokeColor" || change === "outlineColor") {
      this.troikaText[change] = new Color(this[change]);
    } else this.troikaText[change] = this[change];
    this.troikaText.sync();
  }

  onRemove() {
    this.remove(this.troikaText);
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
    this.add(this.troikaText);
    this.troikaText.sync();
  }

  copy(source) {
    super.copy(source, true);
    this.text = source.text;
    this.anchorX = source.anchorX;
    this.anchorY = source.anchorY;
    this.color = new Color(source.color);
    this.curveRadius = source.curveRadius;
    this.depthOffset = source.depthOffset;
    this.direction = source.direction;
    this.fillOpacity = source.fillOpacity;
    this.font = source.font;
    this.fontSize = source.fontSize;
    this.textAlign = source.textAlign;
    this.letterSpacing = source.letterSpacing;
    this.lineHeight = source.lineHeight;
    this.outlineBlur = source.outlineBlur;
    this.outlineColor = new Color(source.outlineColor);
    this.outlineOffsetX = source.outlineOffsetX;
    this.outlineOffsetY = source.outlineOffsetY;
    this.outlineOpacity = source.outlineOpacity;
    this.outlineWidth = source.outlineWidth;
    this.overflowWrap = source.overflowWrap;
    this.strokeColor = new Color(source.strokeColor);
    this.strokeOpacity = source.strokeOpacity;
    this.strokeWidth = source.strokeWidth;
    this.textAlign = source.textAlign;
    this.textIndent = source.textIndent;
    this.whiteSpace = source.whiteSpace;
    this.maxWidth = source.maxWidth;
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
    return super.serialize({
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
  }

  prepareForExport() {
    super.prepareForExport();
    this.addGLTFComponent("troika-text", {
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
    });

    this.replaceObject();
  }
}
