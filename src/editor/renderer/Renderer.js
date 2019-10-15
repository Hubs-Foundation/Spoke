import { Vector2, Color, MeshBasicMaterial, MeshNormalMaterial, Layers } from "three";
import { BatchManager } from "@mozillareality/three-batch-manager";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import OutlinePass from "./OutlinePass";
import { getCanvasBlob } from "../utils/thumbnails";
import makeRenderer from "./makeRenderer";
import SpokeBatchRawUniformGroup from "./SpokeBatchRawUniformGroup";

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

class UnlitRenderMode extends RenderMode {
  constructor(renderer, editor, spokeRenderer) {
    super(renderer, editor);
    this.name = "Unlit";
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
      editor.selectedTransformRoots,
      spokeRenderer
    );
    this.outlinePass.edgeColor = new Color("#006EFF");
    this.outlinePass.renderToScreen = true;
    this.effectComposer.addPass(this.outlinePass);
    this.enableShadows = false;
    this.enabledBatchedObjectLayers = new Layers();
    this.disabledBatchedObjectLayers = new Layers();
    this.disabledBatchedObjectLayers.disable(0);
    this.disabledBatchedObjectLayers.enable(2);
    this.disableBatching = false;

    this.spokeRenderer = spokeRenderer;
  }

  onSceneSet() {
    this.renderer.shadowMap.enabled = this.enableShadows;
    this.editor.scene.traverse(object => {
      if (object.setShadowsEnabled) {
        object.setShadowsEnabled(this.enableShadows);
      }

      if (this.disableBatching && object.isMesh && !object.layers.test(this.enabledBatchedObjectLayers)) {
        object.layers.enable(0);
        object.layers.enable(2);
      } else if (!this.disableBatching && object.isMesh && object.layers.test(this.disabledBatchedObjectLayers)) {
        object.layers.disable(0);
        object.layers.disable(2);
      }
    });

    for (const batch of this.spokeRenderer.batchManager.batches) {
      batch.visible = !this.disableBatching;
    }

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

class LitRenderMode extends UnlitRenderMode {
  constructor(renderer, editor, spokeRenderer) {
    super(renderer, editor, spokeRenderer);
    this.name = "Lit";
    this.enableShadows = false;
    this.disableBatching = true;
  }
}

class ShadowsRenderMode extends UnlitRenderMode {
  constructor(renderer, editor, spokeRenderer) {
    super(renderer, editor, spokeRenderer);
    this.name = "Shadows";
    this.disableBatching = true;
    this.enableShadows = true;
  }
}

class WireframeRenderMode extends UnlitRenderMode {
  constructor(renderer, editor, spokeRenderer) {
    super(renderer, editor, spokeRenderer);
    this.name = "Wireframe";
    this.enableShadows = false;
    this.disableBatching = true;
    this.renderPass.overrideMaterial = new MeshBasicMaterial({ wireframe: true });
  }
}

class NormalsRenderMode extends UnlitRenderMode {
  constructor(renderer, editor, spokeRenderer) {
    super(renderer, editor, spokeRenderer);
    this.name = "Normals";
    this.enableShadows = false;
    this.disableBatching = true;
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

    this.renderMode = new UnlitRenderMode(renderer, editor, this);
    this.shadowsRenderMode = new ShadowsRenderMode(renderer, editor, this);
    this.renderModes = [
      this.renderMode,
      new LitRenderMode(renderer, editor, this),
      this.shadowsRenderMode,
      new WireframeRenderMode(renderer, editor, this),
      new NormalsRenderMode(renderer, editor, this)
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
    this.batchManager = new BatchManager(this.editor.scene, this.renderer, {
      ubo: new SpokeBatchRawUniformGroup(512)
    });
    this.renderMode.onSceneSet();
  };

  addBatchedObject(object) {
    if (!this.batchManager) {
      return;
    }

    const renderMode = this.renderMode;

    object.traverse(child => {
      if (child.setShadowsEnabled) {
        child.setShadowsEnabled(renderMode.enableShadows);
      }

      if (child.isMesh) {
        this.batchManager.addMesh(child);
      }

      if (renderMode.disableBatching && !child.layers.test(renderMode.enabledBatchedObjectLayers)) {
        child.layers.enable(0);
        child.layers.enable(2);
      }
    });

    for (const batch of this.batchManager.batches) {
      batch.visible = !renderMode.disableBatching;
    }
  }

  removeBatchedObject(object) {
    if (!this.batchManager) {
      return;
    }

    object.traverse(child => {
      if (child.isMesh) {
        this.batchManager.removeMesh(child);
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

    if (this.renderMode !== this.shadowsRenderMode) {
      this.shadowsRenderMode.onSceneSet();
    }

    this.screenshotRenderer.render(this.editor.scene, camera);

    camera.layers.enable(1);

    camera.updateMatrixWorld();
    const cameraTransform = camera.matrixWorld.clone();

    const blob = await getCanvasBlob(screenshotRenderer.domElement);

    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    this.editor.disableUpdate = false;

    this.renderer = originalRenderer;

    this.renderMode.onSceneSet();

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
