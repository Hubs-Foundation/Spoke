import AmbientLightComponent from "./AmbientLightComponent";
import DirectionalLightComponent from "./DirectionalLightComponent";
import PointLightComponent from "./PointLightComponent";
import ShadowComponent from "./ShadowComponent";
import SceneReferenceComponent from "./SceneReferenceComponent";
import StandardMaterialComponent from "./StandardMaterialComponent";

export * from "./utils";

export const Components = [
  DirectionalLightComponent,
  PointLightComponent,
  AmbientLightComponent,
  StandardMaterialComponent,
  ShadowComponent,
  SceneReferenceComponent
];
