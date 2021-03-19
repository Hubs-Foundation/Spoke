import EditorNodeMixin from "./EditorNodeMixin";
import Model from "../objects/Model";
import { PropertyBinding } from "three";
import { setStaticMode, StaticModes } from "../StaticMode";
import cloneObject3D from "../utils/cloneObject3D";
import { getComponents } from "../gltf/moz-hubs-components";
import { isKitPieceNode, getComponent, getGLTFComponent, traverseGltfNode } from "../gltf/moz-hubs-components";
import { RethrownError } from "../utils/errors";

export default class KitPieceNode extends EditorNodeMixin(Model) {
  static componentName = "kit-piece";

  static experimental = true;

  static hideInElementsPanel = true;

  static useMultiplePlacementMode = true;

  static nodeName = "Kit Piece";

  static async deserialize(editor, json, loadAsync, onError) {
    const node = await super.deserialize(editor, json);

    loadAsync(
      (async () => {
        const { kitId, pieceId, subPiecesConfig } = json.components.find(c => c.name === "kit-piece").props;

        await node.load(kitId || "architecture-kit", pieceId, subPiecesConfig, onError);

        node.collidable = !!json.components.find(c => c.name === "collidable");
        node.walkable = !!json.components.find(c => c.name === "walkable");
        node.combine = !!json.components.find(c => c.name === "combine");

        const loopAnimationComponent = json.components.find(c => c.name === "loop-animation");

        if (loopAnimationComponent && loopAnimationComponent.props) {
          const { clip, activeClipIndices } = loopAnimationComponent.props;

          if (clip !== undefined && node.model && node.model.animations) {
            // DEPRECATED: Old loop-animation component stored the clip name rather than the clip index
            const clipIndex = node.model.animations.findIndex(animation => animation.name === clip);

            if (clipIndex !== -1) {
              node.activeClipItems = node.getActiveItems([clipIndex]);
            }
          } else {
            node.activeClipItems = node.getActiveItems(activeClipIndices);
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
    this.combine = true;
    this._kitId = null;
    this._pieceId = null;
    this.subPieces = [];
    this.materialIds = [];
  }

  get src() {
    return this._canonicalUrl;
  }

  set src(value) {
    throw new Error("Cannot set src directly on a KitPieceNode");
  }

  get kitId() {
    return this._kitId;
  }

  set kitId(value) {
    this.load(value, this.pieceId).catch(console.error);
  }

  get pieceId() {
    return this._pieceId;
  }

  set pieceId(value) {
    this.load(this.kitId, value).catch(console.error);
  }

  getMaterialIdForMaterialSlot(subPieceId, materialSlotId) {
    const subPiece = this.subPieces.find(s => s.id === subPieceId);
    const materialSlot = subPiece && subPiece.materialSlots.find(m => m.id === materialSlotId);
    return materialSlot && materialSlot.value ? materialSlot.value.id : undefined;
  }

  async loadMaterialSlot(subPieceId, materialSlotId, materialId) {
    const subPiece = this.subPieces.find(s => s.id === subPieceId);

    if (!subPiece) {
      return;
    }

    const materialSlot = subPiece.materialSlots.find(m => m.id === materialSlotId);

    if (!materialSlot) {
      return;
    }

    const _materialId = this.materialIds.find(m => m.id === materialId);

    if (!_materialId) {
      return;
    }

    const loader = this.editor.gltfCache.getLoader(this._src);

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
    const loader = this.editor.gltfCache.getLoader(src, { addUnknownExtensionsToUserData: true });
    const { json } = await loader.getDependency("root");

    if (!Array.isArray(json.nodes)) {
      throw new Error("glTF file has no nodes.");
    }

    const nodeIndex = json.nodes.findIndex(nodeDef => isKitPieceNode(nodeDef, pieceId));

    if (nodeIndex == -1) {
      throw new Error(`Could not find node definition for piece ${pieceId}`);
    }

    if (nodeIndex === undefined) {
      throw new Error(`Couldn't find kit piece with id ${pieceId}`);
    }

    // Load the default (white) material if we are using alt materials, otherwise load the material defined in the glTF primitive
    let loadDefaultMaterial = false;

    traverseGltfNode(json, nodeIndex, nodeDef => {
      if (getGLTFComponent(nodeDef, "kit-alt-materials")) {
        loadDefaultMaterial = true;
      }
    });

    const piece = await loader.getDependency("node", nodeIndex, {
      cacheKey: `kit-piece:${pieceId}`,
      loadDefaultMaterial
    });

    if (!piece) {
      throw new Error(`Could not load node for piece ${pieceId}`);
    }

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

          // This could produce a duplicate material option if the default material is already in the list
          options.push(defaultValue);

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

  async load(kitId, pieceId, subPiecesConfig, onError) {
    const nextKitId = kitId || null;
    const nextPieceId = pieceId || null;

    this.hideErrorIcon();
    this.showLoadingCube();

    if (nextKitId === this.kitId && nextPieceId === this.pieceId) {
      return;
    }

    this._kitId = kitId;
    this._pieceId = pieceId;

    const source = this.editor.getSource(kitId);

    if (this.model) {
      this.editor.renderer.removeBatchedObject(this.model);
      this.remove(this.model);
      this.model = null;
    }

    this._canonicalUrl = (source && source.kitUrl) || "";

    try {
      if (this._canonicalUrl && nextPieceId) {
        const { accessibleUrl, files } = await this.editor.api.resolveMedia(this._canonicalUrl);

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

            if (object.material && object.material.isMeshStandardMaterial) {
              object.material.envMap = this.editor.scene.environmentMap;
              object.material.needsUpdate = true;
            }
          });

          this.castShadow = true;
          this.receiveShadow = true;
        }

        if (files) {
          // Revoke any object urls from the SketchfabZipLoader.
          for (const key in files) {
            if (Object.prototype.hasOwnProperty.call(files, key)) {
              URL.revokeObjectURL(files[key].url);
            }
          }
        }
      }
    } catch (error) {
      this.showErrorIcon();

      const kitPieceError = new RethrownError(
        `Error loading kit piece. Kit Url: "${this._canonicalUrl}" Kit Id: "${this._kitId}" Piece Id: "${this.pieceId}"`,
        error
      );

      if (onError) {
        onError(this, kitPieceError);
      }

      console.error(kitPieceError);
    }

    this.editor.emit("objectsChanged", [this]);
    this.editor.emit("selectionChanged");
    this.hideLoadingCube();

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
        kitId: this.kitId,
        pieceId: this.pieceId,
        subPiecesConfig
      },
      shadow: {
        cast: this.castShadow,
        receive: this.receiveShadow
      }
    };

    if (this.activeClipIndices.length > 0) {
      components["loop-animation"] = {
        activeClipIndices: this.activeClipIndices
      };
    }

    if (this.collidable) {
      components.collidable = {};
    }

    if (this.walkable) {
      components.walkable = {};
    }

    if (this.combine) {
      components.combine = {};
    }

    return super.serialize(components);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.updateStaticModes();
    this._canonicalUrl = source._canonicalUrl;
    this._kitId = source._kitId;
    this._pieceId = source._pieceId;
    this.collidable = source.collidable;
    this.walkable = source.walkable;
    this.combine = source.combine;

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

    const clipIndices = this.activeClipIndices.map(index => {
      return ctx.animations.indexOf(this.model.animations[index]);
    });

    this.model.traverse(child => {
      const components = getComponents(child);

      if (components && components["loop-animation"]) {
        delete components["loop-animation"];
      }
    });

    if (clipIndices.length > 0) {
      this.addGLTFComponent("loop-animation", {
        activeClipIndices: clipIndices
      });
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
