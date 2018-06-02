import THREE from "../../vendor/three";
import Command from "../Command";

/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

/**
 * @param object THREE.Object3D
 * @param mapName string
 * @param newMap THREE.Texture
 * @constructor
 */

export default class SetMaterialMapCommand extends Command {
  constructor(object, mapName, newMap, materialSlot) {
    super();

    this.type = "SetMaterialMapCommand";
    this.name = "Set Material." + mapName;

    this.object = object;
    this.material = this.editor.getObjectMaterial(object, materialSlot);

    this.oldMap = object !== undefined ? this.material[mapName] : undefined;
    this.newMap = newMap;

    this.mapName = mapName;
  }

  execute() {
    this.material[this.mapName] = this.newMap;
    this.material.needsUpdate = true;

    this.editor.signals.materialChanged.dispatch(this.material);
  }

  undo() {
    this.material[this.mapName] = this.oldMap;
    this.material.needsUpdate = true;

    this.editor.signals.materialChanged.dispatch(this.material);
  }

  toJSON() {
    const output = super.toJSON();

    // Note: The function 'extractFromCache' is copied from Object3D.toJSON()

    // extract data from the cache hash
    // remove metadata on each item
    // and return as array
    function extractFromCache(cache) {
      const values = [];
      for (const key in cache) {
        const data = cache[key];
        delete data.metadata;
        values.push(data);
      }
      return values;
    }

    // serializes a map (THREE.Texture)

    function serializeMap(map) {
      if (map === null || map === undefined) return null;

      const meta = {
        geometries: {},
        materials: {},
        textures: {},
        images: {}
      };

      const json = map.toJSON(meta);
      const images = extractFromCache(meta.images);
      if (images.length > 0) json.images = images;
      json.sourceFile = map.sourceFile;

      return json;
    }

    output.objectUuid = this.object.uuid;
    output.mapName = this.mapName;
    output.newMap = serializeMap(this.newMap);
    output.oldMap = serializeMap(this.oldMap);

    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);

    function parseTexture(json) {
      let map = null;
      if (json !== null) {
        const loader = new THREE.ObjectLoader();
        const images = loader.parseImages(json.images);
        const textures = loader.parseTextures([json], images);
        map = textures[json.uuid];
        map.sourceFile = json.sourceFile;
      }
      return map;
    }

    this.object = this.editor.objectByUuid(json.objectUuid);
    this.mapName = json.mapName;
    this.oldMap = parseTexture(json.oldMap);
    this.newMap = parseTexture(json.newMap);
  }
}
