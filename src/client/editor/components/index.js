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
import SpawnPointComponent from "./SpawnPointComponent";
import MediaLoaderComponent from "./MediaLoaderComponent";
import SuperSpawnerComponent from "./SuperSpawnerComponent";

export * from "./utils";

export const Components = [
  AmbientLightComponent,
  DirectionalLightComponent,
  HemisphereLightComponent,
  PointLightComponent,
  SpotLightComponent,
  SceneReferenceComponent,
  GLTFModelComponent,
  MediaLoaderComponent,
  MeshComponent,
  ShadowComponent,
  SkyboxComponent,
  SuperSpawnerComponent,
  SpawnPointComponent,
  StandardMaterialComponent,
  TransformComponent
];
