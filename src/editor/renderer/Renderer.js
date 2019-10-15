import { Vector2, Color, MeshBasicMaterial, MeshNormalMaterial } from "three";
import { BatchManager } from "@mozillareality/three-batch-manager";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import OutlinePass from "./OutlinePass";
import { getCanvasBlob } from "../utils/thumbnails";
import makeRenderer from "./makeRenderer";

/**
 * @author mrdoob / http://mrdoob.com/
 */

class RenderMode {
  constructor(renderer, editor) {
    this.name = "Default";
    this.renderer = renderer;
    this.editor = editor;
    this.passes = [];
    this.enableShadows = false;
  }

  render() {}
}

class ShadowsRenderMode extends RenderMode {
  constructor(renderer, editor) {
    super(renderer, editor);
    this.name = "Shadows";
    this.effectComposer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(editor.scene, editor.camera);
    this.effectComposer.addPass(this.renderPass);
    this.renderHelpersPass = new RenderPass(editor.helperScene, editor.camera);
    this.renderHelpersPass.clear = false;
    this.effectComposer.addPass(this.renderHelpersPass);

    const canvasParent = renderer.domElement.parentElement;

    this.outlinePass = new OutlinePass(
      new Vector2(canvasParent.offsetWidth, canvasParent.offsetHeight),
      editor.scene,
      editor.camera,
      editor.selectedTransformRoots
    );
    this.outlinePass.edgeColor = new Color("#006EFF");
    this.outlinePass.renderToScreen = true;
    this.effectComposer.addPass(this.outlinePass);
    this.enableShadows = true;
  }

  onSceneSet() {
    this.renderer.shadowMap.enabled = this.enableShadows;
    this.editor.scene.traverse(object => {
      if (object.setShadowsEnabled) {
        object.setShadowsEnabled(this.enableShadows);
      }
    });
    this.renderPass.scene = this.editor.scene;
    this.renderPass.camera = this.editor.camera;
    this.outlinePass.renderScene = this.editor.scene;
    this.outlinePass.renderCamera = this.editor.camera;
  }

  onResize() {
    const canvasParent = this.renderer.domElement.parentElement;
    this.renderer.setSize(canvasParent.offsetWidth, canvasParent.offsetHeight, false);
  }

  render(dt) {
    this.effectComposer.render(dt);
  }
}

class NoShadowsRenderMode extends ShadowsRenderMode {
  constructor(renderer, editor) {
    super(renderer, editor);
    this.name = "No Shadows";
    this.enableShadows = false;
  }
}

class WireframeRenderMode extends ShadowsRenderMode {
  constructor(renderer, editor) {
    super(renderer, editor);
    this.name = "Wireframe";
    this.enableShadows = false;
    this.renderPass.overrideMaterial = new MeshBasicMaterial({ wireframe: true });
  }
}

class NormalsRenderMode extends ShadowsRenderMode {
  constructor(renderer, editor) {
    super(renderer, editor);
    this.name = "Normals";
    this.enableShadows = false;
    this.renderPass.overrideMaterial = new MeshNormalMaterial();
  }
}

export default class Renderer {
  constructor(editor, canvas) {
    this.editor = editor;
    this.canvas = canvas;

    const context = canvas.getContext("webgl2", { antialias: true });

    const renderer = makeRenderer(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, {
      canvas,
      context
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer = renderer;

    this.renderMode = new ShadowsRenderMode(renderer, editor);
    this.renderModes = [
      this.renderMode,
      new NoShadowsRenderMode(renderer, editor),
      new WireframeRenderMode(renderer, editor),
      new NormalsRenderMode(renderer, editor)
    ];

    this.screenshotRenderer = makeRenderer(1920, 1080);

    editor.scene.background = new Color(0xaaaaaa);

    const camera = editor.camera;
    this.camera = camera;
  }

  update(dt) {
    this.batchManager.update();
    this.renderMode.render(dt);
  }

  setRenderMode(mode) {
    this.renderMode = mode;
    this.renderMode.onSceneSet();
    this.renderMode.onResize();
  }

  onSceneSet = () => {
    console.log("onSceneSet", this.editor.scene.name);
    this.batchManager = new BatchManager(this.editor.scene, this.renderer);
    this.renderMode.onSceneSet();

    // for (const batch of this.batchManager.batches) {
    //   this.editor.scene.add(batch);
    // }

    this.batchManager.scene = this.editor.scene;
  };

  addBatchedObject(object) {
    if (!this.batchManager) {
      return;
    }
    console.log("addBatchedObject", this.editor.scene.name);
    object.traverse(child => {
      if (child.isMesh) {
        if (this.batchManager.addMesh(child));
      }
    });
  }

  removeBatchedObject(object) {
    if (!this.batchManager) {
      return;
    }
    object.traverse(child => {
      if (child.isMesh) {
        if (this.batchManager.removeMesh(child));
      }
    });
  }

  removeObject(rootObject) {
    if (!this.batchingEnabled) return;

    rootObject.traverse(object => {
      if (object.isMesh) {
        this.batchManager.removeMesh(object);
      }
    });
  }

  onResize = () => {
    const camera = this.camera;
    const canvas = this.canvas;

    camera.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
    camera.updateProjectionMatrix();

    this.renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, false);
    this.renderMode.onResize();
  };

  takeScreenshot = async (width = 1920, height = 1080) => {
    const { screenshotRenderer, camera } = this;

    const originalRenderer = this.renderer;
    this.renderer = screenshotRenderer;

    this.editor.disableUpdate = true;
    const prevAspect = camera.aspect;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.layers.disable(1);

    screenshotRenderer.setSize(width, height, true);

    screenshotRenderer.render(this.editor.scene, camera);

    this.editor.scene.traverse(child => {
      if (child.isNode) {
        child.onRendererChanged();
      }
    });

    screenshotRenderer.render(this.editor.scene, camera);

    camera.layers.enable(1);

    camera.updateMatrixWorld();
    const cameraTransform = camera.matrixWorld.clone();

    const blob = await getCanvasBlob(screenshotRenderer.domElement);

    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    this.editor.disableUpdate = false;

    this.renderer = originalRenderer;

    this.editor.scene.traverse(child => {
      if (child.isNode) {
        child.onRendererChanged();
      }
    });

    return { blob, cameraTransform };
  };

  dispose() {
    this.renderer.dispose();
    this.screenshotRenderer.dispose();
  }
}
