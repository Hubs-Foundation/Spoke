import THREE from "../vendor/three";
import GridHelper from "./helpers/GridHelper";
import resizeShadowCameraFrustum from "./utils/resizeShadowCameraFrustum";
import OutlinePass from "./renderer/OutlinePass";
import { environmentMap } from "./utils/EnvironmentMap";
import { traverseMaterials } from "./utils/materials";
import { getCanvasBlob } from "./utils/thumbnails";
import InputManager from "./controls/InputManager";
import FlyControls from "./controls/FlyControls";
import SpokeControls from "./controls/SpokeControls";
import PlayModeControls from "./controls/PlayModeControls";
import { quality } from "./utils/queryparams";
import DirectionalLightNode from "./nodes/DirectionalLightNode";
import traverseVisible from "./utils/traverseVisible";

const tempVec3 = new THREE.Vector3();
import XRControls from "./controls/XRControls";

/**
 * @author mrdoob / http://mrdoob.com/
 */

export default class Viewport {
  constructor(editor, canvas) {
    this.editor = editor;
    this.canvas = canvas;
    const signals = editor.signals;

    function makeRenderer(width, height, options = {}) {
      const context = canvas.getContext("webgl2", {
        alpha: true,
        depth: true,
        stencil: true,
        antialias: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "default"
      });

      const renderer = new THREE.WebGLRenderer({
        ...options,
        antialias: true,
        preserveDrawingBuffer: true,
        context
      });

      renderer.gammaOutput = true;
      renderer.gammaFactor = 2.2;
      renderer.physicallyCorrectLights = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(width, height);
      return renderer;
    }

    this.shadowsNeedUpdate = true;
    this.renderListNeedsUpdate = true;

    this.selectedObjects = [];
    this.meshes = [];
    this.lights = [];

    const renderer = makeRenderer(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight, { canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setBuildRenderList(this.buildRenderList);
    this.renderer = renderer;

    const effectComposer = (this.effectComposer = new THREE.EffectComposer(renderer));
    const renderPass = (this.renderPass = new THREE.RenderPass(editor.scene, editor.camera));
    effectComposer.addPass(renderPass);
    const outlinePass = (this.outlinePass = new OutlinePass(
      new THREE.Vector2(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight),
      editor.scene,
      editor.camera,
      this.selectedObjects
    ));
    outlinePass.edgeColor = new THREE.Color("#006EFF");
    outlinePass.renderToScreen = true;
    effectComposer.addPass(outlinePass);

    this.screenshotRenderer = makeRenderer(1920, 1080);
    this.thumbnailRenderer = makeRenderer(512, 512, { alpha: true });

    editor.scene.background = new THREE.Color(0xaaaaaa);

    const camera = editor.camera;
    this.camera = camera;

    const grid = (this.grid = new GridHelper());
    editor.scene.add(grid);

    this.inputManager = new InputManager(canvas);
    this.flyControls = new FlyControls(camera, this.inputManager);
    this.spokeControls = new SpokeControls(camera, editor, this.inputManager, this.flyControls);
    this.playModeControls = new PlayModeControls(this.inputManager, this.spokeControls, this.flyControls);
    this.xrControls = new XRControls(editor, this, this.inputManager);
    this.spokeControls.enable();

    this.skipRender = false;

    this.clock = new THREE.Clock();

    renderer.setAnimationLoop(this.render);

    // signals
    signals.sceneSet.add(this.onSceneSet);
    signals.windowResize.add(this.onWindowResized);
    signals.propertyChanged.add(this.onPropertyChanged);
    signals.sceneGraphChanged.add(this.onSceneGraphChanged);
    signals.objectSelected.add(this.onObjectSelected);

    this.onWindowResized();
  }

  buildRenderList = (
    currentRenderList,
    currentRenderState,
    scene,
    camera,
    sortObjects,
    frustum,
    glObjects,
    projScreenMatrix
  ) => {
    if (scene !== this.editor.scene) return true;

    if (!currentRenderList) return false;

    if (this.renderListNeedsUpdate) {
      this.lights = [];
      this.meshes = [];

      traverseVisible(this.editor.scene, object => {
        if (object.isLight) {
          this.lights.push(object);
        } else if (object.isMesh || object.isLine || object.isPoints) {
          this.meshes.push(object);
        }
      });

      this.renderListNeedsUpdate = false;
    }

    const lights = this.lights;

    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];

      if (!light.layers.test(camera.layers)) continue;

      currentRenderState.pushLight(light);

      if (light.castShadow) {
        currentRenderState.pushShadow(light);
      }
    }

    const meshes = this.meshes;

    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];

      if (!mesh.layers.test(camera.layers)) continue;

      if (!mesh.frustumCulled || frustum.intersectsObject(mesh)) {
        if (sortObjects) {
          tempVec3.setFromMatrixPosition(mesh.matrixWorld).applyMatrix4(projScreenMatrix);
        }

        const geometry = glObjects.update(mesh);
        const material = mesh.material;

        if (Array.isArray(material)) {
          const groups = geometry.groups;

          for (let j = 0, l = groups.length; j < l; j++) {
            const group = groups[i];
            const groupMaterial = material[group.materialIndex];

            if (groupMaterial && groupMaterial.visible) {
              currentRenderList.push(mesh, geometry, groupMaterial, 0, tempVec3.z, group);
            }
          }
        } else if (material.visible) {
          currentRenderList.push(mesh, geometry, material, 0, tempVec3.z, null);
        }
      }
    }

    return false;
  };

  onSceneGraphChanged = () => {
    this.shadowsNeedUpdate = true;
    this.renderListNeedsUpdate = true;
    this.editor.scene.updateMatrixWorld(true);
  };

  onPropertyChanged = (propertyName, node) => {
    if (
      ((propertyName === "position" || propertyName === "rotation" || propertyName === "scale") &&
        (node.castShadow || node.receiveShadow)) ||
      propertyName === "castShadow" ||
      propertyName === "receiveShadow"
    ) {
      this.shadowsNeedUpdate = true;
      this.editor.scene.updateMatrixWorld(true);
    }

    if (propertyName === "visible") {
      this.renderListNeedsUpdate = true;
    }
  };

  onObjectSelected = () => {
    this.renderListNeedsUpdate = true;
  };

  render = () => {
    if (this.skipRender) return;

    const renderer = this.renderer;
    const editor = this.editor;
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.inputManager.update(delta, time);
    this.flyControls.update(delta);
    this.spokeControls.update(delta);
    this.xrControls.update(delta);

    if (this.shadowsNeedUpdate) {
      const directionalLightNodes = editor.nodesByType[DirectionalLightNode.nodeName];

      for (let i = 0; i < directionalLightNodes.length; i++) {
        resizeShadowCameraFrustum(directionalLightNodes[i], editor.scene);
      }
    }

    const nodes = editor.nodes;

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].onUpdate(delta, time);
    }

    if (editor.selected) {
      this.selectedObjects[0] = editor.selected;
    } else if (this.selectedObjects.length === 1) {
      this.selectedObjects.pop();
    }

    renderer.shadowMap.needsUpdate = this.shadowsNeedUpdate;

    if (quality === "high") {
      this.effectComposer.render(delta);
    } else {
      // EffectComposer introduces extra overhead with the CopyPass
      // Use the normal renderer in non-high quality mode for now.
      renderer.render(this.editor.scene, this.camera);
    }

    this.inputManager.reset();
    this.shadowsNeedUpdate = false;
  };

  onSceneSet = () => {
    this.screenshotRenderer.dispose();
    this.renderPass.scene = this.editor.scene;
    this.renderPass.camera = this.editor.camera;
    this.outlinePass.renderScene = this.editor.scene;
    this.outlinePass.renderCamera = this.editor.camera;
    this.spokeControls.center.set(0, 0, 0);
    this.editor.scene.add(this.grid);
    this.spokeControls.onSceneSet(this.editor.scene);
    this.editor.scene.background = new THREE.Color(0xaaaaaa);
    this.editor.scene.autoUpdate = false;

    requestAnimationFrame(() => {
      this.shadowsNeedUpdate = true;
    });
  };

  onWindowResized = () => {
    const camera = this.camera;
    const canvas = this.canvas;

    camera.aspect = canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight;
    camera.updateProjectionMatrix();

    this.renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
    this.effectComposer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
  };

  takeScreenshot = async (width = 1920, height = 1080) => {
    const { screenshotRenderer, camera } = this;

    const originalRenderer = this.renderer;
    this.renderer = screenshotRenderer;

    this.skipRender = true;
    const prevAspect = camera.aspect;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.layers.disable(3);

    screenshotRenderer.setSize(width, height, true);

    screenshotRenderer.render(this.editor.scene, camera);

    this.editor.scene.traverse(child => {
      if (child.isNode) {
        child.onRendererChanged();
      }
    });

    screenshotRenderer.render(this.editor.scene, camera);

    camera.layers.enable(3);

    camera.updateMatrixWorld();
    const cameraTransform = camera.matrixWorld.clone();

    const blob = await getCanvasBlob(screenshotRenderer.domElement);

    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    this.skipRender = false;

    this.renderer = originalRenderer;

    this.editor.scene.traverse(child => {
      if (child.isNode) {
        child.onRendererChanged();
      }
    });

    return { blob, cameraTransform };
  };

  generateThumbnail = async (object, width = 256, height = 256) => {
    const scene = new THREE.Scene();
    scene.add(object);

    const light1 = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI);
    light2.position.set(0.5, 0, 0.866);
    scene.add(light2);

    const camera = new THREE.PerspectiveCamera();
    scene.add(camera);

    traverseMaterials(object, material => {
      if (material.isMeshStandardMaterial || material.isGLTFSpecularGlossinessMaterial) {
        material.envMap = environmentMap;
        material.needsUpdate = true;
      }
    });

    object.updateMatrixWorld();

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    object.position.x += object.position.x - center.x;
    object.position.y += object.position.y - center.y;
    object.position.z += object.position.z - center.z;

    camera.near = size / 100;
    camera.far = size * 100;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    camera.position.copy(center);
    camera.position.x += size;
    camera.position.y += size / 2;
    camera.position.z += size;
    camera.lookAt(center);

    camera.layers.disable(3);

    this.thumbnailRenderer.setSize(width, height, true);
    this.thumbnailRenderer.render(scene, camera);

    const blob = await getCanvasBlob(this.thumbnailRenderer.domElement);

    return blob;
  };

  dispose() {
    const signals = this.editor.signals;
    signals.sceneSet.remove(this.onSceneSet);
    signals.windowResize.remove(this.onWindowResized);
  }
}
