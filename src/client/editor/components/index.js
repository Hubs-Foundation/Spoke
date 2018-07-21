import AmbientLightComponent from "./AmbientLightComponent";
import DirectionalLightComponent from "./DirectionalLightComponent";
import PointLightComponent from "./PointLightComponent";
import ShadowComponent from "./ShadowComponent";
import SceneReferenceComponent from "./SceneReferenceComponent";
import StandardMaterialComponent from "./StandardMaterialComponent";
import SkyboxComponent from "./SkyboxComponent";

export * from "./utils";

export const Components = [
  DirectionalLightComponent,
  PointLightComponent,
  AmbientLightComponent,
  StandardMaterialComponent,
  ShadowComponent,
  SceneReferenceComponent,
  SkyboxComponent
];
