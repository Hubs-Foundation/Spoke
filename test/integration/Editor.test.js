import test from "ava";
import withPage from "../helpers/withPage";
import getFixtureUrl from "../helpers/getFixtureUrl";

async function waitForSceneLoaded(page) {
  await page.waitFor("#editor-container", { timeout: 10000 });

  const windowHandle = await page.evaluateHandle("window");

  return await page.evaluateHandle(async window => {
    const editor = window.editor;

    if (!editor.sceneLoaded) {
      await new Promise(resolve => editor.signals.sceneSet.add(resolve));
    }

    return editor.scene;
  }, windowHandle);
}

async function getSerializedScene(page, sceneHandle) {
  const serializedSceneHandle = await page.evaluateHandle(scene => scene.serialize(), sceneHandle);
  return serializedSceneHandle.jsonValue();
}

test("Editor should load new scene", withPage("/projects/new"), async (t, page) => {
  const sceneHandle = await waitForSceneLoaded(page);
  const serializedScene = await getSerializedScene(page, sceneHandle);
  t.snapshot(serializedScene);
});

const v1TestSceneUrl = getFixtureUrl("V1TestScene.spoke");

test("Editor should load V1TestScene", withPage(`/projects/new?template=${v1TestSceneUrl}`), async (t, page) => {
  const sceneHandle = await waitForSceneLoaded(page);
  const serializedScene = await getSerializedScene(page, sceneHandle);
  t.snapshot(serializedScene);
});
