import EditorNodeMixin from "./EditorNodeMixin";
import Model from "../objects/Model";
import { PropertyBinding } from "three";
import { setStaticMode, StaticModes } from "../StaticMode";

export default class KitPieceNode extends EditorNodeMixin(Model) {
  static legacyComponentName = "kit-piece";

  static nodeName = "Kit Piece";

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    loadAsync(
      (async () => {
        const { src, pieceId } = json.components.find(c => c.name === "kit-piece").props;

        await node.load(src, pieceId);

        node.collidable = !!json.components.find(c => c.name === "collidable");
        node.walkable = !!json.components.find(c => c.name === "walkable");

        const loopAnimationComponent = json.components.find(c => c.name === "loop-animation");

        if (loopAnimationComponent && loopAnimationComponent.props) {
          const { clip, activeClipIndex } = loopAnimationComponent.props;

          if (activeClipIndex !== undefined) {
            node.activeClipIndex = loopAnimationComponent.props.activeClipIndex;
          } else if (clip !== undefined && node.model && node.model.animations) {
            // DEPRECATED: Old loop-animation component stored the clip name rather than the clip index
            node.activeClipIndex = node.model.animations.findIndex(animation => animation.name === clip);
          }
        }

        const shadowComponent = json.components.find(c => c.name === "shadow");

        if (shadowComponent) {
          node.castShadow = shadowComponent.props.cast;
          node.receiveShadow = shadowComponent.props.receive;
        }
      })()
    );

    return node;
  }

  constructor(editor) {
    super(editor);

    this._canonicalUrl = "";
    this.collidable = true;
    this.walkable = true;
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value, this.pieceId).catch(console.error);
  }

  loadGLTF(src, pieceId) {
    return this.editor.gltfCache.getPiece(src, pieceId);
  }

  async load(src, pieceId) {
    const nextSrc = src || "";
    const nextpieceId = pieceId || null;

    if (nextSrc === this._canonicalUrl && nextpieceId === this.pieceId) {
      return;
    }

    // this._src = src;
    // this._pieceId = pieceId;
    this._canonicalUrl = nextSrc;

    if (this.model) {
      this.remove(this.model);
      this.model = null;
    }

    if (this.errorMesh) {
      this.remove(this.errorMesh);
      this.errorMesh = null;
    }

    if (this.src)
      try {
        const { accessibleUrl, files } = await this.editor.api.resolveMedia(src);

        await super.load(accessibleUrl, pieceId);

        this.model.position.set(0, 0, 0);

        this.editor.emit("objectsChanged", [this]);

        if (files) {
          // Revoke any object urls from the SketchfabZipLoader.
          for (const key in files) {
            URL.revokeObjectURL(files[key]);
          }
        }
      } catch (e) {
        console.error(e);
      }

    if (!this.model) {
      return this;
    }

    this.model.traverse(object => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.envMap = this.editor.scene.environmentMap;
        object.material.needsUpdate = true;
      }
    });

    this.castShadow = true;
    this.receiveShadow = true;

    return this;
  }

  updateStaticModes() {
    if (!this.model) return;

    setStaticMode(this.model, StaticModes.Static);

    if (this.model.animations && this.model.animations.length > 0) {
      for (const animation of this.model.animations) {
        for (const track of animation.tracks) {
          const { nodeName: uuid } = PropertyBinding.parseTrackName(track.name);
          const animatedNode = this.model.getObjectByProperty("uuid", uuid);

          if (!animatedNode) {
            throw new Error(`Model.updateStaticModes: Couldn't find object with uuid: "${uuid}"`);
          }

          setStaticMode(animatedNode, StaticModes.Dynamic);
        }
      }
    }
  }

  serialize() {
    const components = {
      "kit-piece": {
        src: this._canonicalUrl,
        pieceId: this.pieceId
      },
      shadow: {
        cast: this.castShadow,
        receive: this.receiveShadow
      }
    };

    if (this.activeClipIndex !== -1) {
      components["loop-animation"] = {
        activeClipIndex: this.activeClipIndex
      };
    }

    if (this.collidable) {
      components.collidable = {};
    }

    if (this.walkable) {
      components.walkable = {};
    }

    return super.serialize(components);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.updateStaticModes();
    this._canonicalUrl = source._canonicalUrl;
    this.collidable = source.collidable;
    this.walkable = source.walkable;
    return this;
  }
}
