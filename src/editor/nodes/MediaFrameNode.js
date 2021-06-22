import {
  Object3D,
  BoxBufferGeometry,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  ShaderMaterial,
  Mesh,
  Vector3,
  DoubleSide
} from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export const MediaType = {
  ALL: "all",
  ALL_2D: "all-2d",
  MODEL: "model",
  IMAGE: "image",
  VIDEO: "video",
  PDF: "pdf"
};

export default class MediaFrameNode extends EditorNodeMixin(Object3D) {
  static componentName = "media-frame";

  static nodeName = "Media Frame";

  static _geometry = new BoxBufferGeometry();

  constructor(editor) {
    super(editor);

    this.mediaType = MediaType.ALL_2D;

    const box = new Mesh(
      MediaFrameNode._geometry,
      new ShaderMaterial({
        uniforms: {
          opacity: { value: 1 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main()
            {
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
              vUv = uv;
            }
          `,
        fragmentShader: `
            // adapted from https://www.shadertoy.com/view/Mlt3z8
            float bayerDither2x2( vec2 v ) {
              return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
            }
            float bayerDither4x4( vec2 v ) {
              vec2 P1 = mod( v, 2.0 );
              vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
              return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
            }

            varying vec2 vUv;
            uniform float opacity;
            void main() {
              float alpha = max(step(0.45, abs(vUv.x - 0.5)), step(0.45, abs(vUv.y - 0.5))) - 0.5;
              if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= alpha * opacity ) discard;
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
          `,
        side: DoubleSide
      })
    );

    const previewMaterial = new MeshBasicMaterial();
    previewMaterial.side = DoubleSide;
    previewMaterial.transparent = true;
    previewMaterial.opacity = 0.5;

    const previewMesh = new Mesh(new PlaneBufferGeometry(1, 1, 1, 1), previewMaterial);
    box.add(previewMesh);

    previewMesh.layers.set(1);
    box.layers.set(1);

    this.helper = box;
    this.add(box);

    this.onDeselect();
  }

  onSelect() {
    this.helper.material.uniforms.opacity.value = 1.0;
  }

  onDeselect() {
    this.helper.material.uniforms.opacity.value = 0.5;
  }

  copy(source, recursive = true) {
    if (recursive) {
      this.remove(this.helper);
    }

    this.mediaType = source.mediaType;

    super.copy(source, recursive);

    if (recursive) {
      const helperIndex = source.children.findIndex(child => child === source.helper);

      if (helperIndex !== -1) {
        this.helper = this.children[helperIndex];
      }
    }

    return this;
  }

  serialize() {
    return super.serialize({
      "media-frame": {
        mediaType: this.mediaType
      }
    });
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);
    const mediaFrame = json.components.find(c => c.name === "media-frame");
    node.mediaType = mediaFrame.props.mediaType;
    return node;
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("media-frame", {
      mediaType: this.mediaType,
      bounds: new Vector3().copy(this.scale)
    });
    // We use scale to configure bounds, we don't actually want to set the node's scale
    this.scale.setScalar(1);
    this.addGLTFComponent("networked", {
      id: this.uuid
    });
  }
}
