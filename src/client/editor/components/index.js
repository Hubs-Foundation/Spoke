import AmbientLightComponent from "./AmbientLightComponent";
import DirectionalLightComponent from "./DirectionalLightComponent";
import PointLightComponent from "./PointLightComponent";
import ShadowComponent from "./ShadowComponent";
import SceneReferenceComponent from "./SceneReferenceComponent";
import StandardMaterialComponent from "./StandardMaterialComponent";
import { registerGLTFComponent } from "../ComponentRegistry";

export * from "./utils";

export function registerGLTFComponents() {
  [
    DirectionalLightComponent,
    PointLightComponent,
    AmbientLightComponent,
    StandardMaterialComponent,
    ShadowComponent,
    SceneReferenceComponent
  ].forEach(registerGLTFComponent);
}
