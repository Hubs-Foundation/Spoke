import AmbientLightComponent from "./AmbientLightComponent";
import DirectionalLightComponent from "./DirectionalLightComponent";
import HemisphereLightComponent from "./HemisphereLightComponent";
import PointLightComponent from "./PointLightComponent";
import SpotLightComponent from "./SpotLightComponent";
import SceneReferenceComponent from "./SceneReferenceComponent";
import GLTFModelComponent from "./GLTFModelComponent";
import MeshComponent from "./MeshComponent";
import ShadowComponent from "./ShadowComponent";
import SkyboxComponent from "./SkyboxComponent";
import StandardMaterialComponent from "./StandardMaterialComponent";
import TransformComponent from "./TransformComponent";

export * from "./utils";

export const Components = [
  AmbientLightComponent,
  DirectionalLightComponent,
  HemisphereLightComponent,
  PointLightComponent,
  SpotLightComponent,
  SceneReferenceComponent,
  GLTFModelComponent,
  MeshComponent,
  ShadowComponent,
  SkyboxComponent,
  StandardMaterialComponent,
  TransformComponent
];
