import ReactDOM from "react-dom";
import React from "react";
import EditorContainer from "./ui/EditorContainer";
import Editor from "./editor/Editor";
import Project from "./editor/Project";
import qsTruthy from "./utils/qs-truthy.js";
import "./global.scss";

import SceneNode from "./editor/nodes/SceneNode";
import SceneNodeEditor from "./ui/node-editors/SceneNodeEditor";
import GroupNode from "./editor/nodes/GroupNode";
import GroupNodeEditor from "./ui/node-editors/GroupNodeEditor";
import ModelNode from "./editor/nodes/ModelNode";
import ModelNodeEditor from "./ui/node-editors/ModelNodeEditor";
import GroundPlaneNode from "./editor/nodes/GroundPlaneNode";
import GroundPlaneNodeEditor from "./ui/node-editors/GroundPlaneNodeEditor";
import BoxColliderNode from "./editor/nodes/BoxColliderNode";
import BoxColliderNodeEditor from "./ui/node-editors/BoxColliderNodeEditor";
import AmbientLightNode from "./editor/nodes/AmbientLightNode";
import AmbientLightNodeEditor from "./ui/node-editors/AmbientLightNodeEditor";
import DirectionalLightNode from "./editor/nodes/DirectionalLightNode";
import DirectionalLightNodeEditor from "./ui/node-editors/DirectionalLightNodeEditor";
import SpotLightNode from "./editor/nodes/SpotLightNode";
import SpotLightNodeEditor from "./ui/node-editors/SpotLightNodeEditor";
import PointLightNode from "./editor/nodes/PointLightNode";
import PointLightNodeEditor from "./ui/node-editors/PointLightNodeEditor";
import HemisphereLightNode from "./editor/nodes/HemisphereLightNode";
import HemisphereLightNodeEditor from "./ui/node-editors/HemisphereLightNodeEditor";
import SpawnPointNode from "./editor/nodes/SpawnPointNode";
import SpawnPointNodeEditor from "./ui/node-editors/SpawnPointNodeEditor";
import SkyboxNode from "./editor/nodes/SkyboxNode";
import SkyboxNodeEditor from "./ui/node-editors/SkyboxNodeEditor";

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

  await editor.init();

  const uiMode = qsTruthy("advanced") ? "advanced" : "basic";

  ReactDOM.render(<EditorContainer uiMode={uiMode} editor={editor} />, rootEl);
})();
