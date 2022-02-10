// This is a port of https://github.com/protectwise/troika/tree/master/packages/troika-three-text
// that has been made functional and restyled for Mozilla Hubs and Spoke (hubs.mozilla.com)
// by @jamesckane at Paradowski Creative (paradowski.com)

import { Color, Object3D, Vector2 } from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import TroikaTextHelper from "../helpers/TroikaTextHelper";

export default class TroikaTextNode extends EditorNodeMixin(Object3D) {
  static componentName = "text";

  static nodeName = "Troika Text";

  constructor(editor) {
    super(editor);
    this.editor = editor;
    this.scene = editor.scene;
    this.text = "Text";
    this.anchorX = "center";
    this.anchorY = "middle";
    this.color = new Color();
    this.curveRadius = 0;
    this.depthOffset = 0;
    this.direction = "auto";
    this.fillOpacity = 1;
    this.fontSize = 0.075;
    this.textAlign = "left";
    this.letterSpacing = 0;
    this.clipRectMin = new Vector2(0, 0);
    this.clipRectMax = new Vector2(0, 0);
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

    this.helper = new TroikaTextHelper(this);
    this.add(this.helper);
  }

  onChange() {
    this.helper.update();
  }

  onRemove() {
    this.helper.dispose();
  }

  onAdd() {
    this.helper.update();
  }

  copy(source) {
    super.copy(source, false);

    this.remove(this.helper);

    for (let i = 0; i < source.children.length; i++) {
      const child = source.children[i];
      if (child === source.helper) {
        this.helper = new TroikaTextHelper(this);
        this.add(this.helper);
      } else {
        this.add(child.clone());
      }
    }

    this.text = source.text;
    this.anchorX = source.anchorX;
    this.anchorY = source.anchorY;
    this.color = source.color.clone();
    this.curveRadius = source.curveRadius;
    this.depthOffset = source.depthOffset;
    this.direction = source.direction;
    this.fillOpacity = source.fillOpacity;
    this.fontSize = source.fontSize;
    this.textAlign = source.textAlign;
    this.letterSpacing = source.letterSpacing;
    this.clipRectMin = source.clipRectMin.clone();
    this.clipRectMax = source.clipRectMax.clone();
    this.lineHeight = source.lineHeight;
    this.outlineBlur = source.outlineBlur;
    this.outlineColor = source.outlineColor.clone();
    this.outlineOffsetX = source.outlineOffsetX;
    this.outlineOffsetY = source.outlineOffsetY;
    this.outlineOpacity = source.outlineOpacity;
    this.outlineWidth = source.outlineWidth;
    this.overflowWrap = source.overflowWrap;
    this.strokeColor = source.strokeColor.clone();
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
    const props = json.components.find(c => c.name === "text").props;

    Object.keys(props).forEach(key => {
      if (["color", "strokeColor", "outlineColor"].includes(key)) node[key] = new Color(props[key]);
      else if (key.startsWith("clipRect")) node[key] = new Vector2().fromArray(props[key]);
      else node[key] = props[key];
    });
    return node;
  }

  serialize() {
    const serialized = super.serialize({
      text: {
        text: this.text,
        anchorX: this.anchorX,
        anchorY: this.anchorY,
        color: this.color,
        curveRadius: this.curveRadius,
        depthOffset: this.depthOffset,
        direction: this.direction,
        fillOpacity: this.fillOpacity,
        fontSize: this.fontSize,
        letterSpacing: this.letterSpacing,
        clipRectMin: this.clipRectMin.toArray(),
        clipRectMax: this.clipRectMax.toArray(),
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
    this.remove(this.helper);

    const clipRectMinMax = [...this.clipRectMin.toArray(), ...this.clipRectMax.toArray()];
    const clipRect = !clipRectMinMax.every(value => value == 0) ? clipRectMinMax : null;

    this.addGLTFComponent("text", {
      value: this.text,
      anchorX: this.anchorX,
      anchorY: this.anchorY,
      color: this.color,
      curveRadius: this.curveRadius,
      depthOffset: this.depthOffset,
      direction: this.direction,
      fillOpacity: this.fillOpacity,
      fontSize: this.fontSize,
      letterSpacing: this.letterSpacing,
      clipRect,
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
