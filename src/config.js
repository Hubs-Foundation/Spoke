import Editor from "./editor/Editor";

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
import WayPointNode from "./editor/nodes/WayPointNode";
import WayPointNodeEditor from "./ui/properties/WayPointNodeEditor";
import SkyboxNode from "./editor/nodes/SkyboxNode";
import SkyboxNodeEditor from "./ui/properties/SkyboxNodeEditor";
import FloorPlanNode from "./editor/nodes/FloorPlanNode";
import FloorPlanNodeEditor from "./ui/properties/FloorPlanNodeEditor";
import ImageNode from "./editor/nodes/ImageNode";
import ImageNodeEditor from "./ui/properties/ImageNodeEditor";
import VideoNode from "./editor/nodes/VideoNode";
import VideoNodeEditor from "./ui/properties/VideoNodeEditor";
import SpawnerNode from "./editor/nodes/SpawnerNode";
import SpawnerNodeEditor from "./ui/properties/SpawnerNodeEditor";
import TriggerVolumeNode from "./editor/nodes/TriggerVolumeNode";
import TriggerVolumeNodeEditor from "./ui/properties/TriggerVolumeNodeEditor";
import LinkNode from "./editor/nodes/LinkNode";
import LinkNodeEditor from "./ui/properties/LinkNodeEditor";
import ParticleEmitterNode from "./editor/nodes/ParticleEmitterNode";
import ParticleEmitterNodeEditor from "./ui/properties/ParticleEmitterNodeEditor";
import KitPieceNode from "./editor/nodes/KitPieceNode";
import KitPieceNodeEditor from "./ui/properties/KitPieceNodeEditor";
import SimpleWaterNode from "./editor/nodes/SimpleWaterNode";
import SimpleWaterNodeEditor from "./ui/properties/SimpleWaterNodeEditor";
import AudioNode from "./editor/nodes/AudioNode";
import AudioNodeEditor from "./ui/properties/AudioNodeEditor";
import ScenePreviewCameraNode from "./editor/nodes/ScenePreviewCameraNode";
import ScenePreviewCameraNodeEditor from "./ui/properties/ScenePreviewCameraNodeEditor";
import AudioZoneNode from "./editor/nodes/AudioZoneNode";
import AudioZoneNodeEditor from "./ui/properties/AudioZoneNodeEditor";
import MirrorNode from "./editor/nodes/MirrorNode";
import MirrorNodeEditor from "./ui/properties/MirrorNodeEditor";

import MediaFrameNode from "./editor/nodes/MediaFrameNode";
import MediaFrameNodeEditor from "./ui/properties/MediaFrameNodeEditor";

import SketchfabSource from "./ui/assets/sources/SketchfabSource";
import BingImagesSource from "./ui/assets/sources/BingImagesSource";
import BingVideosSource from "./ui/assets/sources/BingVideosSource";
import TenorSource from "./ui/assets/sources/TenorSource";
import ElementsSource from "./ui/assets/sources/ElementsSource";
import MyAssetsSource from "./ui/assets/sources/MyAssetsSource";
import ArchitectureKitSource from "./ui/assets/sources/ArchitectureKitSource";
import RockKitSource from "./ui/assets/sources/RockKitSource";
import HubsSoundPackSource from "./ui/assets/sources/HubsSoundPackSource";

import TroikaTextNode from "./editor/nodes/TroikaTextNode";
import TroikaTextNodeEditor from "./ui/properties/TroikaTextNodeEditor";

export function createEditor(api, settings) {
  const editor = new Editor(api, settings);

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
  editor.registerNode(WayPointNode, WayPointNodeEditor);
  editor.registerNode(SkyboxNode, SkyboxNodeEditor);
  editor.registerNode(FloorPlanNode, FloorPlanNodeEditor);
  editor.registerNode(ImageNode, ImageNodeEditor);
  editor.registerNode(VideoNode, VideoNodeEditor);
  editor.registerNode(AudioNode, AudioNodeEditor);
  editor.registerNode(SpawnerNode, SpawnerNodeEditor);
  editor.registerNode(TriggerVolumeNode, TriggerVolumeNodeEditor);
  editor.registerNode(LinkNode, LinkNodeEditor);
  editor.registerNode(ParticleEmitterNode, ParticleEmitterNodeEditor);
  editor.registerNode(KitPieceNode, KitPieceNodeEditor);
  editor.registerNode(SimpleWaterNode, SimpleWaterNodeEditor);
  editor.registerNode(ScenePreviewCameraNode, ScenePreviewCameraNodeEditor);
  editor.registerNode(MediaFrameNode, MediaFrameNodeEditor);
  editor.registerNode(AudioZoneNode, AudioZoneNodeEditor);
  editor.registerNode(TroikaTextNode, TroikaTextNodeEditor);
  editor.registerNode(MirrorNode, MirrorNodeEditor);


  editor.registerSource(new ElementsSource(editor));
  editor.registerSource(new MyAssetsSource(editor));
  editor.registerSource(new ArchitectureKitSource(api));
  editor.registerSource(new RockKitSource(api));
  editor.registerSource(new SketchfabSource(api));
  editor.registerSource(new BingImagesSource(api));
  editor.registerSource(new BingVideosSource(api));
  editor.registerSource(new HubsSoundPackSource(editor));
  editor.registerSource(new TenorSource(api));

  return editor;
}
