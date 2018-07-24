import AmbientLightComponent from "./AmbientLightComponent";
import DirectionalLightComponent from "./DirectionalLightComponent";
import PointLightComponent from "./PointLightComponent";
import SceneReferenceComponent from "./SceneReferenceComponent";
import MeshComponent from "./MeshComponent";
import SkyboxComponent from "./SkyboxComponent";
import StandardMaterialComponent from "./StandardMaterialComponent";
import TransformComponent from "./TransformComponent";

export * from "./utils";

export const Components = [
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SceneReferenceComponent,
  MeshComponent,
  SkyboxComponent,
  StandardMaterialComponent,
  TransformComponent
];
