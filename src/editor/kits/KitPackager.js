import { GLTFLoader } from "../gltf/GLTFLoader";
import { GLTFExporter } from "../gltf/GLTFExporter";
import JSZip from "jszip";
import ThumbnailRenderer from "../renderer/ThumbnailRenderer";
import { getComponent } from "../gltf/moz-hubs-components";

export default class KitPackager {
  constructor() {
    this.thumbnailWidth = 256;
    this.thumbnailHeight = 256;
  }

  async package(kitName, url, onProgress) {
    onProgress("Loading glb...");

    const loader = new GLTFLoader(url, undefined, { revokeObjectURLs: false });

    const { scene, json } = await loader.loadGLTF();

    const pendingMaterials = [];

    if (json.materials) {
      for (let i = 0; i < json.materials.length; i++) {
        pendingMaterials.push(loader.getDependency("material", i));
      }
    }

    const materials = await Promise.all(pendingMaterials);

    const pieces = [];

    scene.traverse(object => {
      if (getComponent(object, "kit-piece")) {
        pieces.push(object);
      }

      const altMaterialsComponent = getComponent(object, "kit-alt-materials");

      if (altMaterialsComponent) {
        altMaterialsComponent.defaultMaterials = altMaterialsComponent.defaultMaterials.map(({ name, material }) => ({
          name,
          material: materials[material]
        }));

        altMaterialsComponent.altMaterials = altMaterialsComponent.altMaterials.map(primitiveAltMaterials =>
          primitiveAltMaterials.map(materialIndex => materials[materialIndex])
        );
      }
    });

    if (pieces.length === 0) {
      throw new Error("No kit pieces defined in kit");
    }

    const thumbnailRenderer = new ThumbnailRenderer();

    const zip = new JSZip();
    const thumbnailsFolder = zip.folder("thumbnails");

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      const component = getComponent(piece, "kit-piece");

      onProgress(`Generating thumbnail for "${component.name}" ${i} out of ${pieces.length}`);

      // Wait for 5ms so we don't lock up the UI thread
      await new Promise(resolve => setTimeout(resolve, 5));

      const clonedPiece = piece.clone();

      clonedPiece.traverse(object => {
        const altMaterialsComponent = getComponent(object, "kit-alt-materials");

        if (!altMaterialsComponent || !altMaterialsComponent.defaultMaterials) {
          return;
        }

        let materialSlotIndex = 0;
        const defaultMaterials = altMaterialsComponent.defaultMaterials;

        object.traverse(child => {
          if (child.material && materialSlotIndex < defaultMaterials.length) {
            child.material = defaultMaterials[materialSlotIndex];
            materialSlotIndex++;
          }
        });
      });

      const thumbnailBlob = await thumbnailRenderer.generateThumbnail(
        piece.clone(),
        this.thumbnailWidth,
        this.thumbnailHeight
      );
      const thumbnailFileName = component.name + ".jpeg";

      thumbnailsFolder.file(thumbnailFileName, thumbnailBlob);
      component.thumbnailUrl = "./thumbnails/" + thumbnailFileName;
    }

    const exporter = new GLTFExporter({
      mode: "gltf",
      onlyVisible: false,
      includeCustomExtensions: true
    });

    const chunks = await exporter.exportChunks(scene);

    zip.file(kitName + ".gltf", JSON.stringify(chunks.json));

    if (chunks.buffers.length === 1) {
      zip.file("scene.bin", chunks.buffers[0]);
    } else {
      for (let i = 0; chunks.buffers.length; i++) {
        zip.file(`buffer${i}.bin`, chunks.buffers[i]);
      }
    }

    const imageDefs = chunks.json.images;
    const imageBlobs = chunks.images;

    for (let i = 0; i < imageBlobs.length; i++) {
      zip.file(imageDefs[i].uri, imageBlobs[i]);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" }, ({ percent, currentFile }) => {
      if (currentFile) {
        onProgress(`Zipping "${currentFile}" ${percent.toFixed(2)}% complete`);
      }
    });

    return zipBlob;
  }
}
