import EditorNodeMixin from "./EditorNodeMixin";
import Model from "../objects/Model";
import { PropertyBinding } from "three";
import { setStaticMode, StaticModes } from "../StaticMode";
import cloneObject3D from "../utils/cloneObject3D";
import { isKitPieceNode, getComponent } from "../gltf/moz-hubs-components";

export default class KitPieceNode extends EditorNodeMixin(Model) {
  static legacyComponentName = "kit-piece";

  static experimental = true;

  static nodeName = "Kit Piece";

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    loadAsync(
      (async () => {
        const { src, pieceId, subPieces } = json.components.find(c => c.name === "kit-piece").props;

        await node.load(src, pieceId);

        // TODO update the sub-piece deserialization method
        if (node.subPieces) {
          for (const { name, materialName } of subPieces) {
            const object = node.subPieces.find(o => o.name === name);

            if (object && object.materialChoices) {
              const material = object.materialChoices.find(m => m.name === materialName);

              if (material) {
                object.material = material;
              }
            }
          }
        }

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
    this.subPieces = [];
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value, this.pieceId).catch(console.error);
  }

  async loadGLTF(src, pieceId) {
    const loader = this.editor.gltfCache.getLoader(src);
    const { json } = await loader.getDependency("root");

    if (!Array.isArray(json.nodes)) {
      throw new Error("glTF file has no nodes.");
    }

    const nodeIndex = json.nodes.findIndex(nodeDef => isKitPieceNode(nodeDef, pieceId));

    if (nodeIndex === undefined) {
      throw new Error(`Couldn't find kit piece with id ${pieceId}`);
    }

    const piece = await loader.getDependency("node", nodeIndex, {
      cacheKey: `kit-piece:${pieceId}`,
      loadDefaultMaterial: true
    });

    const clonedPiece = cloneObject3D(piece);

    // TODO: Traverse the clonedPiece and load default materials for all of the sub-pieces
    // Store each alt-material index, name, and mesh reference in the materialSlots array

    const subPieces = [];

    clonedPiece.traverse(child => {
      const kitAltMaterials = getComponent("kit-alt-materials");

      if (kitAltMaterials) {
        const { defaultMaterials, altMaterials } = kitAltMaterials;

        const options = kitAltMaterials[primitiveIndex].map(materialIndex => ({
          label: json.materials[materialIndex].name || `Material ${materialIndex}`,
          value: { primitiveIndex, materialIndex }
        }));

        subPieces.push(child);
      }
    });

    const materialSlots = [];
    const pendingDefaultMaterials = [];

    const kitAltMaterials = getComponent("kit-alt-materials");

    let primitiveIndex = 0;

    mesh.traverse(child => {
      if (child.material && primitiveIndex < altMaterials.length) {
        const options = altMaterials[primitiveIndex].map(materialIndex => ({
          label: json.materials[materialIndex].name || `Material ${materialIndex}`,
          value: { primitiveIndex, materialIndex }
        }));

        const value = options.find(o => o.value.materialIndex === defaultMaterials[primitiveIndex]) || null;

        materialSlots.push({
          name: child.name,
          value,
          options
        });

        pendingDefaultMaterials.push(
          this.loader
            .getDependency("material", defaultMaterials[primitiveIndex])
            .then(material => (child.material = material))
        );

        primitiveIndex++;
      }
    });

    mesh.userData.subPiece = {
      materialSlots
    };

    await Promise.all(pendingDefaultMaterials);
  }

  async load(src, pieceId) {
    const nextSrc = src || "";
    const nextPieceId = pieceId || null;

    if (nextSrc === this._canonicalUrl && nextPieceId === this.pieceId) {
      return;
    }

    // this._src = src;
    // this._pieceId = pieceId;
    this._canonicalUrl = nextSrc;

    if (this.model) {
      this.editor.renderer.removeBatchedObject(this.model);
      this.remove(this.model);
      this.model = null;
    }

    if (this.errorMesh) {
      this.remove(this.errorMesh);
      this.errorMesh = null;
    }

    if (this._canonicalUrl && nextPieceId) {
      try {
        const { accessibleUrl, files } = await this.editor.api.resolveMedia(src);

        if (this.model) {
          this.editor.renderer.removeBatchedObject(this.model);
        }

        await super.load(accessibleUrl, nextPieceId);

        if (this.model) {
          this.editor.renderer.addBatchedObject(this.model);
        }

        if (this.model) {
          this.model.position.set(0, 0, 0);

          this.model.traverse(object => {
            if (object.userData.subPiece) {
              this.subPieces.push(object);
            }
          });
        }

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

  onAdd() {
    if (this.model) {
      this.editor.renderer.addBatchedObject(this.model);
    }
  }

  onRemove() {
    if (this.model) {
      this.editor.renderer.removeBatchedObject(this.model);
    }
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
        pieceId: this.pieceId,
        // TODO update the sub-piece serialization method
        subPieces: this.subPieces.map(subPiece => ({
          name: subPiece.name,
          materialName: subPiece.material.name
        }))
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

    // TODO update the sub-piece copy method
    if (this.model) {
      this.model.traverse(object => {
        if (object.isKitSubPiece) {
          this.subPieces.push(object);
        }
      });
    }

    return this;
  }

  prepareForExport(ctx) {
    super.prepareForExport();
    this.addGLTFComponent("shadow", {
      cast: this.castShadow,
      receive: this.receiveShadow
    });

    // TODO: Support exporting more than one active clip.
    if (this.activeClip) {
      const activeClipIndex = ctx.animations.indexOf(this.activeClip);

      if (activeClipIndex === -1) {
        throw new Error(
          `Error exporting model "${this.name}" with url "${this._canonicalUrl}". Animation could not be found.`
        );
      } else {
        this.addGLTFComponent("loop-animation", {
          activeClipIndex: activeClipIndex
        });
      }
    }

    if (this.model) {
      // Clear kit-piece extension data
      this.model.userData = {};

      this.model.traverse(child => {
        if (child.userData.subPiece) {
          delete child.userData.subPiece;
        }
      });
    }
  }
}
