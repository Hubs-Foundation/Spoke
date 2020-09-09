import test from "ava";
import withPage from "../helpers/withPage";
import getFixtureUrl from "../helpers/getFixtureUrl";

async function waitForProjectLoaded(page) {
  await page.waitFor("#editor-container", { timeout: 10000 });

  const windowHandle = await page.evaluateHandle("window");

  return await page.evaluateHandle(async window => {
    const editor = window.editor;

    if (!editor.projectLoaded) {
      await new Promise((resolve, reject) => {
        let cleanup = null;

        const onProjectLoaded = () => {
          cleanup();
          resolve();
        };

        const onError = error => {
          cleanup();
          reject(error);
        };

        cleanup = () => {
          editor.removeListener("projectLoaded", onProjectLoaded);
          editor.removeListener("error", onError);
        };

        editor.addListener("projectLoaded", onProjectLoaded);
        editor.addListener("error", onError);
      });
    }

    return editor.scene;
  }, windowHandle);
}

async function getSerializedScene(page, sceneHandle) {
  const serializedSceneHandle = await page.evaluateHandle(scene => scene.serialize(), sceneHandle);
  return serializedSceneHandle.jsonValue();
}

test("Editor should load new scene", withPage("/projects/new"), async (t, page) => {
  const sceneHandle = await waitForProjectLoaded(page);
  const serializedScene = await getSerializedScene(page, sceneHandle);
  t.snapshot(serializedScene);
});

const v1TestSceneUrl = getFixtureUrl("V1TestScene.spoke");

test("Editor should load V1TestScene", withPage(`/projects/new?template=${v1TestSceneUrl}`), async (t, page) => {
  const sceneHandle = await waitForProjectLoaded(page);
  const serializedScene = await getSerializedScene(page, sceneHandle);

  const entities = Object.values(serializedScene.entities);
  const entityIds = Object.keys(serializedScene.entities);

  t.is(entities.length, 21);

  const rootId = serializedScene.root;
  const sceneEntity = serializedScene.entities[rootId];
  t.is(sceneEntity.name, "V1TestScene");

  const skyboxEntity = entities.find(e => e.name === "Skybox1");
  t.is(skyboxEntity.index, 0);
  const skyboxProps = skyboxEntity.components.find(c => c.name === "skybox").props;
  t.is(skyboxProps.turbidity, 9);
  t.is(skyboxProps.rayleigh, 1.2);
  t.is(skyboxProps.luminance, 0.5);
  t.is(skyboxProps.mieCoefficient, 0.006);
  t.is(skyboxProps.mieDirectionalG, 0.7);
  t.is(skyboxProps.inclination, 0.1);
  t.is(skyboxProps.azimuth, 0.2);
  t.is(skyboxProps.distance, 3000);

  const directionalLightEntity = entities.find(e => e.name === "Directional Light1");
  t.is(directionalLightEntity.index, 2);
  const directionalLightProps = directionalLightEntity.components.find(c => c.name === "directional-light").props;
  t.is(directionalLightProps.color, "#ff0000");
  t.is(directionalLightProps.intensity, 0.6);
  t.is(directionalLightProps.castShadow, true);
  t.deepEqual(directionalLightProps.shadowMapResolution, [1024, 1024]);
  t.is(directionalLightProps.shadowBias, 0.001);
  t.is(directionalLightProps.shadowRadius, 2);

  const ambientLightEntity = entities.find(e => e.name === "Ambient Light1");
  t.is(ambientLightEntity.index, 1);
  const ambientLightProps = ambientLightEntity.components.find(c => c.name === "ambient-light").props;
  t.is(ambientLightProps.color, "#ff0000");
  t.is(ambientLightProps.intensity, 0.6);

  const spawnPoint1Entity = entities.find(e => e.name === "Spawn Point");
  t.is(spawnPoint1Entity.index, 3);
  t.truthy(spawnPoint1Entity.components.find(c => c.name === "spawn-point"));
  const spawnPoint1Transform = spawnPoint1Entity.components.find(c => c.name === "transform").props;
  t.deepEqual(spawnPoint1Transform.position, { x: 0, y: 0, z: -5 });
  t.deepEqual(spawnPoint1Transform.rotation, { x: 0, y: 0, z: 0 });

  const spawnPoint2Entity = entities.find(e => e.name === "Spawn Point 1");
  t.is(spawnPoint2Entity.index, 7);
  t.truthy(spawnPoint2Entity.components.find(c => c.name === "spawn-point"));
  const spawnPoint2Transform = spawnPoint2Entity.components.find(c => c.name === "transform").props;
  t.deepEqual(spawnPoint2Transform.position, { x: 0, y: 0, z: 5 });
  t.deepEqual(spawnPoint2Transform.rotation, { x: 3.14, y: 0, z: 3.14 });

  const groundPlaneEntity = entities.find(e => e.name === "Ground Plane1");
  t.is(groundPlaneEntity.index, 4);
  const groundPlaneProps = groundPlaneEntity.components.find(c => c.name === "ground-plane").props;
  t.is(groundPlaneProps.color, "#ff0000");
  const groundPlaneShadowProps = groundPlaneEntity.components.find(c => c.name === "shadow").props;
  t.is(groundPlaneShadowProps.receive, true);
  t.truthy(groundPlaneEntity.components.find(c => c.name === "walkable"));

  const model1Entity = entities.find(e => e.name === "Model1");
  t.is(model1Entity.index, 5);
  const model1Props = model1Entity.components.find(c => c.name === "gltf-model").props;
  t.is(model1Props.src, "https://hubs.local:9090/test-assets/duck.glb");
  t.truthy(model1Entity.components.find(c => c.name === "walkable"));
  t.truthy(model1Entity.components.find(c => c.name === "collidable"));
  t.deepEqual(model1Props.attribution, null);
  const shadowProps = model1Entity.components.find(c => c.name === "shadow").props;
  t.is(shadowProps.cast, true);
  t.is(shadowProps.receive, true);
  t.falsy(model1Entity.components.find(c => c.name === "loop-animation"));

  const model2Entity = entities.find(e => e.name === "Ceiling Fan");
  t.is(model2Entity.index, 6);
  const model2Props = model2Entity.components.find(c => c.name === "gltf-model").props;
  t.is(model2Props.src, "https://hubs.local:9090/test-assets/ceiling-fan.glb");
  t.falsy(model2Entity.components.find(c => c.name === "walkable"));
  t.falsy(model2Entity.components.find(c => c.name === "collidable"));
  t.deepEqual(model2Props.attribution, {
    author: "mozillareality",
    name: "Ceiling Fan",
    url: "https://sketchfab.com/models/ec2c6087d4824211abc827f2a4c2b578"
  });
  const shadow2Props = model2Entity.components.find(c => c.name === "shadow").props;
  t.is(shadow2Props.cast, false);
  t.is(shadow2Props.receive, false);
  const loopAnimation2Props = model2Entity.components.find(c => c.name === "loop-animation").props;
  t.is(loopAnimation2Props.activeClipIndex, 0);

  const groupNode1Entity = entities.find(e => e.name === "Group");
  const groupNode1EntityIndex = entities.findIndex(e => e.name === "Group");
  const groupNode1EntityId = entityIds[groupNode1EntityIndex];
  t.truthy(groupNode1Entity.components.find(c => c.name === "group"));
  t.is(groupNode1Entity.index, 8);

  const groupNode2Entity = entities.find(e => e.name === "Group 1");
  t.is(groupNode2Entity.parent, groupNode1EntityId);
  t.truthy(groupNode2Entity.components.find(c => c.name === "group"));

  const hemisphereLightEntity = entities.find(e => e.name === "Hemisphere Light1");
  t.is(hemisphereLightEntity.index, 9);
  const hemisphereLightProps = hemisphereLightEntity.components.find(c => c.name === "hemisphere-light").props;
  t.is(hemisphereLightProps.skyColor, "#ff0000");
  t.is(hemisphereLightProps.groundColor, "#000000");
  t.is(hemisphereLightProps.intensity, 0.8);

  const spawnerEntity = entities.find(e => e.name === "Spawner1");
  t.is(spawnerEntity.index, 10);
  const spawnerProps = spawnerEntity.components.find(c => c.name === "spawner").props;
  t.is(spawnerProps.src, "https://hubs.local:9090/test-assets/camera.glb");

  const spotLightEntity = entities.find(e => e.name === "Spot Light1");
  t.is(spotLightEntity.index, 11);
  const spotLightProps = spotLightEntity.components.find(c => c.name === "spot-light").props;
  t.is(spotLightProps.color, "#00ff00");
  t.is(spotLightProps.intensity, 11);
  t.is(spotLightProps.range, 34);
  t.is(spotLightProps.outerConeAngle, 0.78);
  t.is(spotLightProps.castShadow, true);
  t.deepEqual(spotLightProps.shadowMapResolution, [1024, 1024]);
  t.is(spotLightProps.shadowBias, 0.1);
  t.is(spotLightProps.shadowRadius, 1.1);

  const pointLightEntity = entities.find(e => e.name === "Point Light1");
  t.is(pointLightEntity.index, 12);
  const pointLightProps = pointLightEntity.components.find(c => c.name === "point-light").props;
  t.is(pointLightProps.color, "#0000ff");
  t.is(pointLightProps.intensity, 13);
  t.is(pointLightProps.range, 12);
  t.is(pointLightProps.castShadow, false);
  t.deepEqual(pointLightProps.shadowMapResolution, [1024, 1024]);
  t.is(pointLightProps.shadowBias, 0.1);
  t.is(pointLightProps.shadowRadius, 1.2);

  const image1Entity = entities.find(e => e.name === "Image");
  t.is(image1Entity.index, 13);
  const image1Props = image1Entity.components.find(c => c.name === "image").props;
  t.is(image1Props.src, "https://hubs.local:9090/test-assets/spoke-logo.png");
  t.is(image1Props.projection, "flat");

  const image2Entity = entities.find(e => e.name === "Image 1");
  t.is(image2Entity.index, 16);
  const image2Props = image2Entity.components.find(c => c.name === "image").props;
  t.is(image2Props.src, "https://hubs.local:9090/test-assets/spoke-logo.png");
  t.is(image2Props.projection, "360-equirectangular");

  const video1Entity = entities.find(e => e.name === "Video");
  t.is(video1Entity.index, 14);
  const video1Props = video1Entity.components.find(c => c.name === "video").props;
  t.is(video1Props.src, "https://hubs.local:9090/test-assets/landing-video.webm");
  t.is(video1Props.projection, "flat");
  t.is(video1Props.controls, false);
  t.is(video1Props.autoPlay, true);
  t.is(video1Props.loop, true);
  t.is(video1Props.audioType, "pannernode");
  t.is(video1Props.volume, 0.75);
  t.is(video1Props.distanceModel, "inverse");
  t.is(video1Props.rolloffFactor, 10);
  t.is(video1Props.refDistance, 3);
  t.is(video1Props.maxDistance, 100);
  t.is(video1Props.coneInnerAngle, 20);
  t.is(video1Props.coneOuterAngle, 180);
  t.is(video1Props.coneOuterGain, 0.5);

  const video2Entity = entities.find(e => e.name === "Video 1");
  t.is(video2Entity.index, 15);
  const video2Props = video2Entity.components.find(c => c.name === "video").props;
  t.is(video2Props.src, "https://hubs.local:9090/test-assets/landing-video.webm");
  t.is(video2Props.projection, "360-equirectangular");
  t.is(video2Props.controls, true);
  t.is(video2Props.autoPlay, true);
  t.is(video2Props.loop, false);
  t.is(video2Props.audioType, "pannernode");
  t.is(video2Props.volume, 0.5);
  t.is(video2Props.distanceModel, "inverse");
  t.is(video2Props.rolloffFactor, 1);
  t.is(video2Props.refDistance, 1);
  t.is(video2Props.maxDistance, 10000);
  t.is(video2Props.coneInnerAngle, 360);
  t.is(video2Props.coneOuterAngle, 360);
  t.is(video2Props.coneOuterGain, 0);

  const boxColliderEntity = entities.find(e => e.name === "Box Collider1");
  t.truthy(boxColliderEntity.components.find(c => c.name === "box-collider"));
  t.is(boxColliderEntity.index, 17);

  const floorPlanEntity = entities.find(e => e.name === "Floor Plan1");
  t.truthy(floorPlanEntity.components.find(c => c.name === "floor-plan"));
  t.is(floorPlanEntity.index, 18);
});

const v3TestSceneUrl = getFixtureUrl("V3TestScene.spoke");

test("Editor should load V3TestScene", withPage(`/projects/new?template=${v3TestSceneUrl}`), async (t, page) => {
  const sceneHandle = await waitForProjectLoaded(page);
  const serializedScene = await getSerializedScene(page, sceneHandle);
  t.snapshot(serializedScene);
});

const v4TestSceneUrl = getFixtureUrl("V4TestScene.spoke");

test("Editor should load V4TestScene", withPage(`/projects/new?template=${v4TestSceneUrl}`), async (t, page) => {
  const sceneHandle = await waitForProjectLoaded(page);
  const serializedScene = await getSerializedScene(page, sceneHandle);
  t.snapshot(serializedScene);
});
