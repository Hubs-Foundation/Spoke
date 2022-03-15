import { addIsHelperFlag } from "./utils";
import { Text } from "troika-three-text";

export default class TroikaTextHelper extends Text {
  constructor(node) {
    super();
    this.node = node;
    this.name = "TroikaTextHelper";
    this.update();
    addIsHelperFlag(this);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }

  update() {
    const clipRectMinMax = [...this.node.clipRectMin.toArray(), ...this.node.clipRectMax.toArray()];
    const clipRect = !clipRectMinMax.every(value => value == 0) ? clipRectMinMax : null;

    this.text = this.node.text;
    this.anchorX = this.node.anchorX;
    this.anchorY = this.node.anchorY;
    this.color = this.node.color;
    this.curveRadius = this.node.curveRadius;
    this.depthOffset = this.node.depthOffset;
    this.direction = this.node.direction;
    this.fillOpacity = this.node.fillOpacity;
    this.fontSize = this.node.fontSize;
    this.textAlign = this.node.textAlign;
    this.letterSpacing = this.node.letterSpacing;
    this.clipRect = clipRect;
    this.lineHeight = this.node.lineHeight;
    this.outlineBlur = this.node.outlineBlur;
    this.outlineColor = this.node.outlineColor;
    this.outlineOffsetX = this.node.outlineOffsetX;
    this.outlineOffsetY = this.node.outlineOffsetY;
    this.outlineOpacity = this.node.outlineOpacity;
    this.outlineWidth = this.node.outlineWidth;
    this.overflowWrap = this.node.overflowWrap;
    this.strokeColor = this.node.strokeColor;
    this.strokeOpacity = this.node.strokeOpacity;
    this.strokeWidth = this.node.strokeWidth;
    this.textAlign = this.node.textAlign;
    this.textIndent = this.node.textIndent;
    this.whiteSpace = this.node.whiteSpace;
    this.maxWidth = this.node.maxWidth;
    this.sync();
  }
}
