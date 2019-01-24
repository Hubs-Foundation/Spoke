import THREE from "../../../src/client/vendor/three";
import Project from "../../../src/client/api/Project";
import Editor from "../../../src/client/editor/Editor";

import SceneNode from "../../../src/client/editor/nodes/SceneNode";
import SceneNodeEditor from "../../../src/client/ui/properties/SceneNodeEditor";
import GroupNode from "../../../src/client/editor/nodes/GroupNode";
import GroupNodeEditor from "../../../src/client/ui/properties/GroupNodeEditor";
import ModelNode from "../../../src/client/editor/nodes/ModelNode";
import ModelNodeEditor from "../../../src/client/ui/properties/ModelNodeEditor";
import GroundPlaneNode from "../../../src/client/editor/nodes/GroundPlaneNode";
import GroundPlaneNodeEditor from "../../../src/client/ui/properties/GroundPlaneNodeEditor";
import BoxColliderNode from "../../../src/client/editor/nodes/BoxColliderNode";
import BoxColliderNodeEditor from "../../../src/client/ui/properties/BoxColliderNodeEditor";
import AmbientLightNode from "../../../src/client/editor/nodes/AmbientLightNode";
import AmbientLightNodeEditor from "../../../src/client/ui/properties/AmbientLightNodeEditor";
import DirectionalLightNode from "../../../src/client/editor/nodes/DirectionalLightNode";
import DirectionalLightNodeEditor from "../../../src/client/ui/properties/DirectionalLightNodeEditor";
import SpotLightNode from "../../../src/client/editor/nodes/SpotLightNode";
import SpotLightNodeEditor from "../../../src/client/ui/properties/SpotLightNodeEditor";
import PointLightNode from "../../../src/client/editor/nodes/PointLightNode";
import PointLightNodeEditor from "../../../src/client/ui/properties/PointLightNodeEditor";
import HemisphereLightNode from "../../../src/client/editor/nodes/HemisphereLightNode";
import HemisphereLightNodeEditor from "../../../src/client/ui/properties/HemisphereLightNodeEditor";
import SpawnPointNode from "../../../src/client/editor/nodes/SpawnPointNode";
import SpawnPointNodeEditor from "../../../src/client/ui/properties/SpawnPointNodeEditor";
import SkyboxNode from "../../../src/client/editor/nodes/SkyboxNode";
import SkyboxNodeEditor from "../../../src/client/ui/properties/SkyboxNodeEditor";
import FloorPlanNode from "../../../src/client/editor/nodes/FloorPlanNode";
import FloorPlanNodeEditor from "../../../src/client/ui/properties/FloorPlanNodeEditor";
import ImageNode from "../../../src/client/editor/nodes/ImageNode";
import ImageNodeEditor from "../../../src/client/ui/properties/ImageNodeEditor";
import VideoNode from "../../../src/client/editor/nodes/VideoNode";
import VideoNodeEditor from "../../../src/client/ui/properties/VideoNodeEditor";
import SpawnerNode from "../../../src/client/editor/nodes/SpawnerNode";
import SpawnerNodeEditor from "../../../src/client/ui/properties/SpawnerNodeEditor";

import { expect } from "chai";

describe("Editor", () => {
  describe("#openScene()", () => {
    describe("v1", () => {
      let scene;

      before(async function() {
        this.timeout(30000);

        const project = new Project();
        const editor = new Editor(project);
        // Don't save the scene when regenerating the floorplan so that the .spoke file is not overwritten.
        editor.saveOnGenerateFloorPlan = false;

        editor.registerNode(SceneNode, SceneNodeEditor);
        editor.registerNode(GroupNode, GroupNodeEditor);
        editor.registerNode(ModelNode, ModelNodeEditor);
        editor.registerNode(GroundPlaneNode, GroundPlaneNodeEditor);
        editor.registerNode(BoxColliderNode, BoxColliderNodeEditor);
        editor.registerNode(AmbientLightNode, AmbientLightNodeEditor);
        editor.registerNode(DirectionalLightNode, DirectionalLightNodeEditor);
        editor.registerNode(HemisphereLightNode, HemisphereLightNodeEditor);
        editor.registerNode(SpotLightNode, SpotLightNodeEditor);
        editor.registerNode(PointLightNode, PointLightNodeEditor);
        editor.registerNode(SpawnPointNode, SpawnPointNodeEditor);
        editor.registerNode(SkyboxNode, SkyboxNodeEditor);
        editor.registerNode(FloorPlanNode, FloorPlanNodeEditor);
        editor.registerNode(ImageNode, ImageNodeEditor);
        editor.registerNode(VideoNode, VideoNodeEditor);
        editor.registerNode(SpawnerNode, SpawnerNodeEditor);

        await editor.init();

        const viewport = document.createElement("div");
        const canvas = document.createElement("canvas");
        viewport.appendChild(canvas);

        editor.initializeViewport(canvas);

        scene = await editor.openScene("./api/files/V1TestScene.spoke");
      });

      it("should load the SceneNode", async function() {
        expect(scene.name).to.equal("V1TestScene");
      });

      it("should load the SkyboxNode", () => {
        const skyboxNodes = scene.getNodesByType(SkyboxNode);
        expect(skyboxNodes.length, "skyboxNodes.length").to.equal(1);
        const skybox = skyboxNodes[0];
        expect(skybox.name, "skybox.name").to.equal("Skybox1");
        expect(scene.children.indexOf(skybox), "skybox index").to.equal(0);
        expect(skybox.turbidity, "skybox.turbidity").to.equal(9);
        expect(skybox.rayleigh, "skybox.rayleigh").to.equal(1.2);
        expect(skybox.luminance, "skybox.luminance").to.equal(0.5);
        expect(skybox.mieCoefficient, "skybox.mieCoefficient").to.equal(0.006);
        expect(skybox.mieDirectionalG, "skybox.mieDirectionalG").to.equal(0.7);
        expect(skybox.inclination, "skybox.inclination").to.equal(0.1);
        expect(skybox.azimuth, "skybox.azimuth").to.equal(0.2);
        expect(skybox.distance, "skybox.distance").to.equal(3000);
      });

      it("should load the DirectionalLightNode", () => {
        const directionalLightNodes = scene.getNodesByType(DirectionalLightNode);
        expect(directionalLightNodes.length, "directionalLightNodes.length").to.equal(1);
        const directionalLight = directionalLightNodes[0];
        expect(directionalLight.name, "directionalLight.name").to.equal("Directional Light1");
        expect(scene.children.indexOf(directionalLight), "directionalLight index").to.equal(2);
        expect(directionalLight.color.equals(new THREE.Color("#ff0000")), "directionalLight.color").to.be.true;
        expect(directionalLight.intensity, "directionalLight.intensity").to.equal(0.6);
        expect(directionalLight.castShadow, "directionalLight.castShadow").to.equal(true);
        expect(
          directionalLight.shadowMapResolution.equals(new THREE.Vector2(1024, 1024)),
          "directionalLight.shadowMapResolution"
        ).to.be.true;
        expect(directionalLight.shadowBias, "directionalLight.shadowBias").to.equal(0.001);
        expect(directionalLight.shadowRadius, "directionalLight.shadowRadius").to.equal(2);
      });

      it("should load the AmbientLightNode", () => {
        const ambientLightNodes = scene.getNodesByType(AmbientLightNode);
        expect(ambientLightNodes.length, "ambientLightNodes.length").to.equal(1);
        const ambientLight = ambientLightNodes[0];
        expect(ambientLight.name, "ambientLight.name").to.equal("Ambient Light1");
        expect(scene.children.indexOf(ambientLight), "ambientLight index").to.equal(1);
        expect(ambientLight.color.equals(new THREE.Color("#ff0000")), "ambientLight.color").to.be.true;
        expect(ambientLight.intensity, "ambientLight.intensity").to.equal(0.6);
      });

      it("should load the SpawnPointNodes", () => {
        const spawnPointNodes = scene.getNodesByType(SpawnPointNode);
        expect(spawnPointNodes.length, "spawnPointNodes.length").to.equal(2);
        const spawnPoint1 = spawnPointNodes[0];
        expect(spawnPoint1.name, "spawnPoint1.name").to.equal("Spawn Point");
        expect(scene.children.indexOf(spawnPoint1), "spawnPoint1 index").to.equal(3);
        expect(spawnPoint1.position.equals(new THREE.Vector3(0, 0, -5)), "spawnPoint1.position").to.be.true;
        expect(spawnPoint1.rotation.equals(new THREE.Euler(0, 0, 0)), "spawnPoint1.rotation").to.be.true;
        const spawnPoint2 = spawnPointNodes[1];
        expect(spawnPoint2.name, "spawnPoint2.name").to.equal("Spawn Point 1");
        expect(scene.children.indexOf(spawnPoint2), "spawnPoint2 index").to.equal(7);
        expect(spawnPoint2.position.equals(new THREE.Vector3(0, 0, 5)), "spawnPoint2.position").to.be.true;
        expect(spawnPoint2.rotation.equals(new THREE.Euler(3.14, 0, 3.14)), "spawnPoint2.rotation").to.be.true;
      });

      it("should load the GroundPlaneNode", () => {
        const groundPlaneNodes = scene.getNodesByType(GroundPlaneNode);
        expect(groundPlaneNodes.length, "groundPlaneNodes.length").to.equal(1);
        const groundPlane = groundPlaneNodes[0];
        expect(groundPlane.name, "groundPlane.name").to.equal("Ground Plane1");
        expect(scene.children.indexOf(groundPlane), "groundPlane index").to.equal(4);
        expect(groundPlane.color.equals(new THREE.Color("#ff0000")), "groundPlane.color").to.be.true;
        expect(groundPlane.receiveShadow, "groundPlane.receiveShadow").to.equal(true);
      });

      it("should load the ModelNodes", () => {
        const modelNodes = scene.getNodesByType(ModelNode);
        expect(modelNodes.length, "modelNodes.length").to.equal(2);
        const model1 = modelNodes[0];
        expect(model1.name, "model1.name").to.equal("Model1");
        expect(scene.children.indexOf(model1), "model1 index").to.equal(5);
        expect(model1.src, "model1.src").to.equal(
          "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf"
        );
        expect(model1.includeInFloorPlan, "model1.includeInFloorPlan").to.equal(true);
        expect(model1.castShadow, "model1.castShadow").to.equal(true);
        expect(model1.receiveShadow, "model1.receiveShadow").to.equal(true);
        expect(model1.animations.length, "model1.animations.length").to.equal(0);
        const model2 = modelNodes[1];
        expect(model2.name, "model2.name").to.equal("Ceiling Fan");
        expect(scene.children.indexOf(model2), "model2 index").to.equal(6);
        expect(model2.src, "model2.src").to.equal("https://sketchfab.com/models/ec2c6087d4824211abc827f2a4c2b578");
        expect(model2.includeInFloorPlan, "model2.includeInFloorPlan").to.equal(false);
        expect(model2.castShadow, "model2.castShadow").to.equal(false);
        expect(model2.receiveShadow, "model2.receiveShadow").to.equal(false);
        expect(model2.animations.length, "model2.animations.length").to.equal(1);
        expect(model2.activeClipName, "model2 activeClipName").to.equal("Take 001");
        expect(model2.attribution.name, "model2.attribution.name").to.equal("Ceiling Fan");
        expect(model2.attribution.author, "model2.attribution.author").to.equal("mozillareality");
        expect(model2.attribution.url, "model2.attribution.url").to.equal(
          "https://sketchfab.com/models/ec2c6087d4824211abc827f2a4c2b578"
        );
      });

      it("should load the GroupNode", () => {
        const groupNodes = scene.getNodesByType(GroupNode);
        expect(groupNodes.length, "groupNodes.length").to.equal(2);
        const group1 = groupNodes[0];
        expect(group1.name, "group1.name").to.equal("Group");
        expect(scene.children.indexOf(group1), "group1 index").to.equal(8);
        const group2 = groupNodes[1];
        expect(group2.name, "group2.name").to.equal("Group 1");
        expect(group2.parent, "group2.parent").to.equal(group1);
      });

      it("should load the HemisphereLightNode", () => {
        const hemisphereLightNodes = scene.getNodesByType(HemisphereLightNode);
        expect(hemisphereLightNodes.length, "hemisphereLightNodes.length").to.equal(1);
        const hemisphereLight = hemisphereLightNodes[0];
        expect(hemisphereLight.name, "hemisphereLight.name").to.equal("Hemisphere Light1");
        expect(scene.children.indexOf(hemisphereLight), "hemisphereLight index").to.equal(9);
        expect(hemisphereLight.skyColor.equals(new THREE.Color("#ff0000")), "hemisphereLight.skyColor").to.be.true;
        expect(hemisphereLight.groundColor.equals(new THREE.Color("#000000")), "hemisphereLight.groundColor").to.be
          .true;
        expect(hemisphereLight.intensity, "hemisphereLight.intensity").to.equal(0.8);
      });

      it("should load the SpawnerNode", () => {
        const spawnerNodes = scene.getNodesByType(SpawnerNode);
        expect(spawnerNodes.length, "spawnerNodes.length").to.equal(1);
        const spawner = spawnerNodes[0];
        expect(spawner.name, "spawner.name").to.equal("Spawner1");
        expect(scene.children.indexOf(spawner), "spawner index").to.equal(10);
        expect(spawner.src, "spawner.src").to.equal("https://sketchfab.com/models/2a09a3dc75364c8c84b25d2cc235cb9b");
      });

      it("should load the SpotLightNode", () => {
        const spotLightNodes = scene.getNodesByType(SpotLightNode);
        expect(spotLightNodes.length, "spawnerNodes.length").to.equal(1);
        const spotLight = spotLightNodes[0];
        expect(spotLight.name, "spotLight.name").to.equal("Spot Light1");
        expect(scene.children.indexOf(spotLight), "spotLight index").to.equal(11);
        expect(spotLight.color.equals(new THREE.Color("#00ff00")), "spotLight.color").to.be.true;
        expect(spotLight.intensity, "spotLight.intensity").to.equal(11);
        expect(spotLight.range, "spotLight.range").to.equal(34);
        // TODO: fix innerConeAngle expect(spotLight.innerConeAngle, "spotLight.innerConeAngle").to.equal(0.1688315636318826);
        expect(spotLight.outerConeAngle, "spotLight.outerConeAngle").to.equal(0.78);
        expect(spotLight.castShadow, "spotLight.castShadow").to.equal(true);
        expect(spotLight.shadowMapResolution.equals(new THREE.Vector2(1024, 1024)), "spotLight.shadowMapResolution").to
          .be.true;
        expect(spotLight.shadowBias, "spotLight.shadowBias").to.equal(0.1);
        expect(spotLight.shadowRadius, "spotLight.shadowRadius").to.equal(1.1);
      });

      it("should load the PointLightNode", () => {
        const pointLightNodes = scene.getNodesByType(PointLightNode);
        expect(pointLightNodes.length, "pointLightNodes.length").to.equal(1);
        const pointLight = pointLightNodes[0];
        expect(pointLight.name, "pointLight.name").to.equal("Point Light1");
        expect(scene.children.indexOf(pointLight), "pointLight index").to.equal(12);
        expect(pointLight.color.equals(new THREE.Color("#0000ff")), "pointLight.color").to.be.true;
        expect(pointLight.intensity, "pointLight.intensity").to.equal(13);
        expect(pointLight.range, "pointLight.range").to.equal(12);
        expect(pointLight.castShadow, "pointLight.castShadow").to.equal(false);
        expect(pointLight.shadowMapResolution.equals(new THREE.Vector2(1024, 1024)), "pointLight.shadowMapResolution")
          .to.be.true;
        expect(pointLight.shadowBias, "pointLight.shadowBias").to.equal(0.1);
        expect(pointLight.shadowRadius, "pointLight.shadowRadius").to.equal(1.2);
      });

      it("should load the ImageNodes", () => {
        const imageNodes = scene.getNodesByType(ImageNode);
        expect(imageNodes.length, "imageNodes.length").to.equal(2);
        const image1 = imageNodes[0];
        expect(image1.name, "image1.name").to.equal("Image");
        expect(scene.children.indexOf(image1), "image1 index").to.equal(13);
        expect(image1.src, "image1.src").to.equal(
          "https://assets-prod.reticulum.io/assets/images/hub-preview-light-no-shadow-5ebb166e8580d819b445892173ec0286.png"
        );
        expect(image1.projection, "image1.projection").to.equal("flat");
        const image2 = imageNodes[1];
        expect(image2.name, "image2.name").to.equal("Image 1");
        expect(scene.children.indexOf(image2), "image2 index").to.equal(16);
        expect(image2.src, "image2.src").to.equal(
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/SonyCenter_360panorama.jpg/2880px-SonyCenter_360panorama.jpg"
        );
        expect(image2.projection, "image2.projection").to.equal("360-equirectangular");
      });

      it("should load the VideoNodes", () => {
        const videoNodes = scene.getNodesByType(VideoNode);
        expect(videoNodes.length, "videoNodes.length").to.equal(2);
        const video1 = videoNodes[0];
        expect(video1.name, "video1.name").to.equal("Video");
        expect(scene.children.indexOf(video1), "video1 index").to.equal(14);
        expect(video1.src, "video1.src").to.equal("https://www.youtube.com/watch?v=WmQKZJPhV7s");
        expect(video1.projection, "video1.projection").to.equal("flat");
        expect(video1.controls, "video1.controls").to.equal(false);
        expect(video1.autoPlay, "video1.autoPlay").to.equal(true);
        expect(video1.loop, "video1.loop").to.equal(true);
        expect(video1.audioType, "video1.audioType").to.equal("pannernode");
        expect(video1.volume, "video1.volume").to.equal(0.75);
        expect(video1.distanceModel, "video1.distanceModel").to.equal("inverse");
        expect(video1.rolloffFactor, "video1.rolloffFactor").to.equal(10);
        expect(video1.refDistance, "video1.refDistance").to.equal(3);
        expect(video1.maxDistance, "video1.maxDistance").to.equal(100);
        expect(video1.coneInnerAngle, "video1.coneInnerAngle").to.equal(20);
        expect(video1.coneOuterAngle, "video1.coneOuterAngle").to.equal(180);
        expect(video1.coneOuterGain, "video1.coneOuterGain").to.equal(0.5);
        const video2 = videoNodes[1];
        expect(video2.name, "video2.name").to.equal("Video 1");
        expect(scene.children.indexOf(video2), "video2 index").to.equal(15);
        expect(video2.src, "video2.src").to.equal("https://www.youtube.com/watch?v=H6SsB3JYqQg");
        expect(video2.projection, "video2.projection").to.equal("360-equirectangular");
        expect(video2.controls, "video2.controls").to.equal(true);
        expect(video2.autoPlay, "video2.autoPlay").to.equal(true);
        expect(video2.loop, "video2.loop").to.equal(false);
        expect(video2.audioType, "video2.audioType").to.equal("pannernode");
        expect(video2.volume, "video2.volume").to.equal(0.5);
        expect(video2.distanceModel, "video2.distanceModel").to.equal("inverse");
        expect(video2.rolloffFactor, "video2.rolloffFactor").to.equal(1);
        expect(video2.refDistance, "video2.refDistance").to.equal(1);
        expect(video2.maxDistance, "video2.maxDistance").to.equal(10000);
        expect(video2.coneInnerAngle, "video2.coneInnerAngle").to.equal(360);
        expect(video2.coneOuterAngle, "video2.coneOuterAngle").to.equal(360);
        expect(video2.coneOuterGain, "video2.coneOuterGain").to.equal(0);
      });

      it("should load the BoxColliderNode", () => {
        const boxColliderNodes = scene.getNodesByType(BoxColliderNode);
        expect(boxColliderNodes.length, "boxColliderNodes.length").to.equal(1);
        const boxCollider = boxColliderNodes[0];
        expect(boxCollider.name, "boxCollider.name").to.equal("Box Collider1");
        expect(scene.children.indexOf(boxCollider), "boxCollider index").to.equal(17);
      });

      it("should load the FloorPlanNode", () => {
        const floorPlanNodes = scene.getNodesByType(FloorPlanNode);
        expect(floorPlanNodes.length, "floorPlanNodes.length").to.equal(1);
        const floorPlan = floorPlanNodes[0];
        expect(floorPlan.name, "floorPlan.name").to.equal("Floor Plan1");
        expect(scene.children.indexOf(floorPlan), "floorPlan index").to.equal(18);
      });
    });
  });
});
