import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import JSZip from "jszip";
import ThumbnailRenderer from "../renderer/ThumbnailRenderer";
import eventToMessage from "../utils/eventToMessage";
import { getKitPieceComponent } from "./kit-piece-utils";

export default class KitPackager {
  constructor() {
    this.thumbnailWidth = 256;
    this.thumbnailHeight = 256;
  }

  async package(kitName, url, onProgress) {
    onProgress("Loading glb...");

    const gltf = await new Promise((resolve, reject) => new GLTFLoader().load(url, resolve, undefined, reject));

    const pieces = [];

    gltf.scene.traverse(object => {
      if (getKitPieceComponent(object)) {
        pieces.push(object);
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
      const component = getKitPieceComponent(piece);
      onProgress(`Generating thumbnail for "${component.name}" ${i} out of ${pieces.length}`);

      // Wait for 5ms so we don't lock up the UI thread
      await new Promise(resolve => setTimeout(resolve, 5));

      const thumbnailBlob = await thumbnailRenderer.generateThumbnail(
        piece.clone(),
        this.thumbnailWidth,
        this.thumbnailHeight
      );
      const thumbnailFileName = component.name + ".jpeg";

      thumbnailsFolder.file(thumbnailFileName, thumbnailBlob);
      component.thumbnailUrl = "./thumbnails/" + thumbnailFileName;
    }

    const exporter = new GLTFExporter();

    const chunks = await new Promise((resolve, reject) => {
      exporter.parseChunks(
        gltf.scene,
        resolve,
        e => {
          reject(new Error(`Error exporting scene. ${eventToMessage(e)}`));
        },
        {
          mode: "gltf",
          onlyVisible: false,
          includeCustomExtensions: true,
          animations: gltf.animations
        }
      );
    });

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
