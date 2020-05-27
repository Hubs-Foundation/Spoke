import { GLTFLoader } from "../gltf/GLTFLoader";
import { GLTFExporter } from "../gltf/GLTFExporter";
import JSZip from "jszip";
import ThumbnailRenderer from "../renderer/ThumbnailRenderer";
import { getComponent } from "../gltf/moz-hubs-components";

async function getBlobContentHash(blob) {
  const imageBuffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-1", imageBuffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("");
}

export default class KitPackager {
  constructor() {
    this.thumbnailWidth = 256;
    this.thumbnailHeight = 256;
  }

  async package(kitName, url, onProgress) {
    onProgress("Loading glb...");

    const loader = new GLTFLoader(url, undefined, { revokeObjectURLs: false, addUnknownExtensionsToUserData: true });

    const { scene, json } = await loader.loadGLTF();

    const pendingMaterials = [];

    if (json.materials) {
      for (let i = 0; i < json.materials.length; i++) {
        pendingMaterials.push(loader.getDependency("material", i));
      }
    }

    const materials = await Promise.all(pendingMaterials);

    const pieces = [];

    const kitPieceComponents = {};

    scene.traverse(object => {
      const kitPieceComponent = getComponent(object, "kit-piece");
      if (kitPieceComponent) {
        kitPieceComponents[kitPieceComponent.id] = kitPieceComponent;
        pieces.push(object.clone());
      }

      const altMaterialsComponent = getComponent(object, "kit-alt-materials");

      if (altMaterialsComponent) {
        altMaterialsComponent.defaultMaterials = altMaterialsComponent.defaultMaterials.map(
          ({ material, ...rest }) => ({
            ...rest,
            material: materials[material]
          })
        );

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

      const thumbnailBlob = await thumbnailRenderer.generateThumbnail(piece, this.thumbnailWidth, this.thumbnailHeight);

      const exportedComponent = kitPieceComponents[component.id];
      const thumbnailFileName = exportedComponent.name + ".jpeg";

      thumbnailsFolder.file(thumbnailFileName, thumbnailBlob);
      exportedComponent.thumbnailUrl = "./thumbnails/" + thumbnailFileName;
    }

    const exporter = new GLTFExporter({
      mode: "gltf",
      onlyVisible: false,
      includeCustomExtensions: true
    });

    const chunks = await exporter.exportChunks(scene);

    const bufferDefs = chunks.json.buffers;

    if (chunks.buffers.length === 1) {
      const bufferDef = bufferDefs[0];
      const bufferBlob = chunks.buffers[0];
      const contentHash = await getBlobContentHash(bufferBlob);
      const bufferUrl = "buffer-" + contentHash + ".bin";
      bufferDef.uri = bufferUrl;
      zip.file(bufferUrl, bufferBlob);
    } else {
      for (let i = 0; chunks.buffers.length; i++) {
        const bufferDef = bufferDefs[i];
        const bufferBlob = chunks.buffers[i];
        const contentHash = await getBlobContentHash(bufferBlob);
        const bufferUrl = "buffer" + i + "-" + contentHash + ".bin";
        bufferDef.uri = bufferUrl;
        zip.file(bufferUrl, bufferBlob);
      }
    }

    const imageDefs = chunks.json.images;
    const imageChunks = chunks.images;

    for (let i = 0; i < imageChunks.length; i++) {
      const imageDef = imageDefs[i];
      const imageBlob = imageChunks[i].blob;
      const contentHash = await getBlobContentHash(imageBlob);
      const mimeType = imageDef.mimeType;
      const fileExtension = mimeType === "image/png" ? ".png" : ".jpg";
      const imageUrl = imageDef.name + "-" + contentHash + fileExtension;
      imageDef.uri = imageUrl;
      zip.file(imageUrl, imageBlob);
    }

    const jsonString = JSON.stringify(chunks.json);
    const jsonBlob = new Blob([jsonString], { type: "application/json" });
    const contentHash = await getBlobContentHash(jsonBlob);
    const gltfUrl = kitName + "-" + contentHash + ".gltf";
    zip.file(gltfUrl, jsonBlob);

    const zipBlob = await zip.generateAsync({ type: "blob" }, ({ percent, currentFile }) => {
      if (currentFile) {
        onProgress(`Zipping "${currentFile}" ${percent.toFixed(2)}% complete`);
      }
    });

    return zipBlob;
  }
}
