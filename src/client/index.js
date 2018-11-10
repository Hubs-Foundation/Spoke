import ReactDOM from "react-dom";
import React from "react";

import App from "./ui/App";
import Editor from "./editor/Editor";
import Project from "./api/Project";

import SceneNode from "./editor/nodes/SceneNode";
import SceneNodeEditor from "./ui/properties/SceneNodeEditor";
import GroupNode from "./editor/nodes/GroupNode";
import GroupNodeEditor from "./ui/properties/GroupNodeEditor";
import ModelNode from "./editor/nodes/ModelNode";
import ModelNodeEditor from "./ui/properties/ModelNodeEditor";
import GroundPlaneNode from "./editor/nodes/GroundPlaneNode";
import GroundPlaneNodeEditor from "./ui/properties/GroundPlaneNodeEditor";
import BoxColliderNode from "./editor/nodes/BoxColliderNode";
import BoxColliderNodeEditor from "./ui/properties/BoxColliderNodeEditor";
import AmbientLightNode from "./editor/nodes/AmbientLightNode";
import AmbientLightNodeEditor from "./ui/properties/AmbientLightNodeEditor";
import DirectionalLightNode from "./editor/nodes/DirectionalLightNode";
import DirectionalLightNodeEditor from "./ui/properties/DirectionalLightNodeEditor";
import SpotLightNode from "./editor/nodes/SpotLightNode";
import SpotLightNodeEditor from "./ui/properties/SpotLightNodeEditor";
import PointLightNode from "./editor/nodes/PointLightNode";
import PointLightNodeEditor from "./ui/properties/PointLightNodeEditor";
import HemisphereLightNode from "./editor/nodes/HemisphereLightNode";
import HemisphereLightNodeEditor from "./ui/properties/HemisphereLightNodeEditor";
import SpawnPointNode from "./editor/nodes/SpawnPointNode";
import SpawnPointNodeEditor from "./ui/properties/SpawnPointNodeEditor";
import SkyboxNode from "./editor/nodes/SkyboxNode";
import SkyboxNodeEditor from "./ui/properties/SkyboxNodeEditor";
import FloorPlanNode from "./editor/nodes/FloorPlanNode";
import FloorPlanNodeEditor from "./ui/properties/FloorPlanNodeEditor";
import MediaNode from "./editor/nodes/MediaNode";
import MediaNodeEditor from "./ui/properties/MediaNodeEditor";

(async () => {
  // eslint-disable-next-line no-undef
  console.log(`Spoke v${SPOKE_VERSION}`);

  const rootEl = document.createElement("div");
  rootEl.id = "app";
  document.body.appendChild(rootEl);

  const project = new Project();
  const editor = new Editor(project);
  window.editor = editor;

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
  editor.registerNode(MediaNode, MediaNodeEditor);

  await editor.init();

  ReactDOM.render(<App editor={editor} />, rootEl);
})().catch(e => console.error(e));
