import EditorNodeMixin from "./EditorNodeMixin";
import Model from "../objects/Model";
import { PropertyBinding } from "three";
import { setStaticMode, StaticModes } from "../StaticMode";
import cloneObject3D from "../utils/cloneObject3D";
import { isKitPieceNode, getComponent, getGLTFComponent } from "../gltf/moz-hubs-components";

export default class KitPieceNode extends EditorNodeMixin(Model) {
  static legacyComponentName = "kit-piece";

  static experimental = true;

  static nodeName = "Kit Piece";

  static async deserialize(editor, json, loadAsync) {
    const node = await super.deserialize(editor, json);

    loadAsync(
      (async () => {
        const { src, pieceId, subPiecesConfig } = json.components.find(c => c.name === "kit-piece").props;

        await node.load(src, pieceId, subPiecesConfig);

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
    this._pieceId = null;
    this.subPieces = [];
    this.materialIds = [];
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    this.load(value, this.pieceId).catch(console.error);
  }

  get pieceId() {
    return this._pieceId;
  }

  set pieceId(value) {
    this.load(this.src, value).catch(console.error);
  }

  getMaterialIdForMaterialSlot(subPieceId, materialSlotId) {
    const subPiece = this.subPieces.find(s => s.id === subPieceId);
    const materialSlot = subPiece.materialSlots.find(m => m.id === materialSlotId);
    return materialSlot.value ? materialSlot.value.id : undefined;
  }

  async loadMaterialSlot(subPieceId, materialSlotId, materialId) {
    const loader = this.editor.gltfCache.getLoader(this._src);
    const _materialId = this.materialIds.find(m => m.id === materialId);
    const subPiece = this.subPieces.find(s => s.id === subPieceId);
    const materialSlot = subPiece.materialSlots.find(m => m.id === materialSlotId);
    materialSlot.value = _materialId;

    const material = await loader.getDependency("material", _materialId.index);

    if (materialSlot.value && materialSlot.value.id === materialId) {
      materialSlot.object.material = material;

      if (material.isMeshStandardMaterial) {
        material.envMap = this.editor.scene.environmentMap;
        material.needsUpdate = true;
      }
    }
  }

  async loadGLTF(src, pieceId, subPiecesConfig = {}) {
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

    const materialIds = this.materialIds;
    const materialDefs = json.materials || [];

    materialIds.length = 0;

    for (let i = 0; i < materialDefs.length; i++) {
      const materialDef = materialDefs[i];
      const materialId = getGLTFComponent(materialDef, "material-id");

      if (materialId) {
        materialIds.push({
          index: i,
          ...materialId
        });
      }
    }

    // TODO: Traverse the clonedPiece and load default materials for all of the sub-pieces
    // Store each alt-material index, name, and mesh reference in the materialSlots array

    this.subPieces.length = 0;

    clonedPiece.traverse(object => {
      const kitAltMaterials = getComponent(object, "kit-alt-materials");

      if (kitAltMaterials) {
        const { id, name, defaultMaterials, altMaterials } = kitAltMaterials;

        // subPieceConfig = { [subpieceName]: materialId }
        const subPieceConfig = subPiecesConfig[id] || {};

        for (const { id, material: materialIndex } of defaultMaterials) {
          if (!subPieceConfig[id]) {
            const materialId = materialIds.find(m => m.index === materialIndex);
            subPieceConfig[id] = materialId ? materialId.id : undefined;
          }
        }

        if (defaultMaterials.length !== altMaterials.length) {
          console.warn(
            `Kit subPiece ${name} has ${defaultMaterials.length} default materials and ${altMaterials.length} alternate materials. They should be the same.`
          );
        }

        const primitives = [];

        object.traverse(o => {
          if (o.isMesh && primitives.length < defaultMaterials.length) {
            primitives.push(o);
          }
        });

        if (defaultMaterials.length !== primitives.length) {
          console.warn(
            `Kit subPiece ${name} has ${defaultMaterials.length} default materials and ${primitives.length} primitives. They should be the same.`
          );
        }

        const materialSlots = [];

        for (let i = 0; i < defaultMaterials.length; i++) {
          const { id, name, material: defaultMaterialIndex } = defaultMaterials[i];
          const primitive = primitives[i];
          const options = altMaterials[i].map(materialIndex => {
            return materialIds.find(m => m.index === materialIndex);
          });
          const defaultValue = materialIds.find(m => m.index === defaultMaterialIndex);
          const value = materialIds.find(m => m.id === subPieceConfig[id]) || defaultValue;

          materialSlots.push({
            id,
            name,
            object: primitive,
            value,
            options
          });
        }

        this.subPieces.push({
          id,
          name,
          object,
          materialSlots
        });
      }
    });

    const pendingMaterials = [];

    for (const subPiece of this.subPieces) {
      for (const { object, value } of subPiece.materialSlots) {
        if (value) {
          pendingMaterials.push(
            loader.getDependency("material", value.index).then(material => (object.material = material))
          );
        }
      }
    }

    await Promise.all(pendingMaterials);

    return clonedPiece;
  }

  async load(src, pieceId, subPiecesConfig) {
    const nextSrc = src || "";
    const nextPieceId = pieceId || null;

    if (nextSrc === this._canonicalUrl && nextPieceId === this.pieceId) {
      return;
    }

    this._pieceId = pieceId;
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

        await super.load(accessibleUrl, nextPieceId, subPiecesConfig);

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
    const subPiecesConfig = {};

    for (const subPiece of this.subPieces) {
      const subPieceConfig = {};

      for (const materialSlot of subPiece.materialSlots) {
        subPieceConfig[materialSlot.id] = materialSlot.value ? materialSlot.value.id : null;
      }

      subPiecesConfig[subPiece.id] = subPieceConfig;
    }

    const components = {
      "kit-piece": {
        src: this._canonicalUrl,
        pieceId: this.pieceId,
        subPiecesConfig
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
    this._pieceId = source._pieceId;
    this.collidable = source.collidable;
    this.walkable = source.walkable;

    // TODO update the sub-piece copy method
    if (this.model) {
      const subPieceObjects = {};

      this.model.traverse(object => {
        const kitAltMaterials = getComponent(object, "kit-alt-materials");
        if (kitAltMaterials) {
          subPieceObjects[kitAltMaterials.id] = object;
        }
      });

      for (const subPiece of source.subPieces) {
        const subPieceObject = subPieceObjects[subPiece.id];

        const primitives = [];

        subPieceObject.traverse(o => {
          if (o.isMesh && primitives.length < subPiece.materialSlots.length) {
            primitives.push(o);
          }
        });

        const materialSlots = [];

        for (let i = 0; i < primitives.length; i++) {
          const materialSlot = subPiece.materialSlots[i];

          materialSlots.push({
            ...materialSlot,
            object: primitives[i]
          });
        }

        this.subPieces.push({
          ...subPiece,
          object: subPieceObject,
          materialSlots
        });
      }

      this.materialIds = source.materialIds.slice(0);
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
