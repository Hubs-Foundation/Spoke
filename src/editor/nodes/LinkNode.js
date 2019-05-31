import EditorNodeMixin from "./EditorNodeMixin";
import { Object3D, TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide } from "three";
import eventToMessage from "../utils/eventToMessage";
import linkIconUrl from "../../assets/link-icon.png";

let linkHelperTexture = null;

export default class LinkNode extends EditorNodeMixin(Object3D) {
  static legacyComponentName = "link";

  static nodeName = "Link";

  static async load() {
    linkHelperTexture = await new Promise((resolve, reject) => {
      new TextureLoader().load(linkIconUrl, resolve, null, e => reject(`Error loading Image. ${eventToMessage(e)}`));
    });
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { href } = json.components.find(c => c.name === "link").props;

    node.href = href;

    return node;
  }

  constructor(editor) {
    super(editor);

    this.href = "";

    const geometry = new PlaneGeometry();
    const material = new MeshBasicMaterial();
    material.map = linkHelperTexture;
    material.side = DoubleSide;
    material.transparent = true;
    this.helper = new Mesh(geometry, material);
    this.helper.layers.set(1);
    this.add(this.helper);
  }

  copy(source, recursive) {
    super.copy(source, recursive);

    this.href = source.href;

    return this;
  }

  serialize() {
    return super.serialize({
      link: {
        href: this.href
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("link", {
      href: this.href
    });
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
    this.replaceObject();
  }
}
