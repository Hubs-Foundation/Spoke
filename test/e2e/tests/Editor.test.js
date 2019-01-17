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

import assert from "assert";

describe("Editor", () => {
  describe("#openScene()", () => {
    it("should open a v1 Spoke scene", async () => {
      const project = new Project();
      const editor = new Editor(project);

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

      const scene = await editor.openScene("./api/files/V1TestScene.spoke");

      assert(scene.name === "V1 Test Scene");
    });
  });
});
