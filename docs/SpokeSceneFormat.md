# Spoke Scene Format

The Spoke scene format is a 3D authoring format designed for composing scenes out of existing assets. It is serialized as JSON for portability and ease of use on the web. The Spoke scene format's inheritance model takes inspiration from Godot. All geometry, animation, and other binary data is stored in glTF assets. Spoke scenes can `extend` glTF assets and apply modifications to them. They can also combine multiple glTF assets to create larger scenes. The format is also designed to reduce the number of conflicts when making edits to glTF assets.

## Features
- Scene Inheritance
- Adding Nodes
- Scene Reference Nodes
- Removing Nodes
- Modifying Node Properties
  - Renaming Nodes
  - Static Mode
- Reordering / Re-parenting Nodes
- Updating Components
- Removing Components

## TypeScript Definition
```typescript
type SpokeScene = BaseScene | ExtendedScene | ModelScene ;

interface BaseScene {
  type: "base";
  root: string; // Root node UUID
  nodes: NodeModification[];
}

interface ExtendedScene {
  type: "extended";
  extends: string; // Relative path to a .spoke scene
  nodes: NodeModification[];
}

interface ModelScene {
  type: "model";
  extends: string; // Relative path to a glTF 2.0 file (.gltf or .glb)
  nodeIds: NodeIdMapping[];
  nodes: NodeModification[];
}

interface NodeIdMapping {
  path: (string | number)[];
  id: string;
}

type NodeModification = AddNodeModification | RemoveNodeModification | ModifyNodeModification;

interface AddNodeModification {
  id: string;
  action: "add";
  parent?: string; // When parent is not specified it must be the root node.
  index?: number; // Parent must be specified when index is defined.
  name: string;
  staticMode?: "static" | "dynamic" // Defaults to "inherits" if undefined
  components?: ComponentModification[];
}

interface ReferenceNodeModification {
  id: string;
  action: "reference";
  src: string; // Relative path to a .spoke file
  sceneReferenceIds: { [id: string]: string }; // Map from original UUID to new UUID
  parent: string; // A scene reference node cannot be the root node of a scene. It must have a parent defined.
  index?: number; // Parent must be specified when index is defined.
  name: string;
  staticMode?: "static" | "dynamic" // Defaults to "inherits" if undefined
  components?: ComponentModification[];
}

interface SceneReferenceIdMapping {
  from: string;
  to: string;
}

interface RemoveNodeModification {
  id: string;
  action: "remove";
}

interface ModifyNodeModification {
  id: string;
  action: "modify";
  parent?: string;
  index?: number; // Parent must be specified when index is defined.
  name?: string;
  staticMode?: "static" | "dynamic" | "inherits";
  components?: ComponentModification[];
}

type ComponentModification = UpdateComponentModification | RemoveComponentModification;

interface UpdateComponentModification {
  action: "update";
  type: string;
  props?: {}; // Optional, uses default props if undefined.
}

interface RemoveComponentModification {
  action: "remove";
  type: string;
}
```


## Scene Inheritance
`.spoke` scenes can inherit from `.spoke`, `.gltf`, and `.glb` files. When specified, the `extends` property defines a file to load first. If the files is a glTF file, the loaded nodes must be mapped to UUIDs. glTF nodes will be mapped to UUIDs using paths comprised of node names (when available) and node indices. This path to UUID mapping is stored in an array under the `nodeIds` property. After all nodes have UUIDs, the modifications stored in the `nodes` array will be applied in the order specified to the loaded scene. The extended scene cannot be changed once set. If the base scene contains nodes that are not defined in the `nodeIds` map they will be assigned UUIDs. When saving a scene that inherits from a glTF file you should always serialize any undefined `nodeIds` in the `extended-model` scene. If a node in the `nodeIds` map no longer exists when loading the scene, temporary nodes will be created using the path specified in the `nodeIds` map. If the path contains a name we will first try to resolve the node using that name.

`model.gltf`
```json
{
  "scene": 0,
  "scenes": [
    { "nodes": [0] }
  ],
  "nodes": [
    { "children": [1] },
    { "children": [2] },
    { "name": "Node3", "children": [3, 4] },
    { "name": "Node4" },
    { "name": "Node5" }
  ]
}
```

`base-scene.spoke`
```json
{
  "type": "extended-model",
  "extends": "model.gltf",
  "nodeIds": [
    {
      "path": [0],
      "id": "bf6454bd-899e-4a33-aebc-9bed44450dc4"
    },
    {
      "path": [0, 0],
      "id": "281d331e-175c-43a2-9c4d-ecb1f74635cf"
    },
    {
      "path": [0, 0, 1],
      "id": "da2f2e66-7aef-4684-86a2-11bf82337131"
    },
    {
      "path": [0, 0, 1, "Node3"],
      "id": "29610234-c247-45a2-a888-e774e29192d7"
    },
    {
      "path": [0, 0, 1, "Node3", "Node4"],
      "id": "29610234-c247-45a2-a888-e774e29192d7"
    },
    {
      "path": [0, 0, 1, "Node3", "Node5"],
      "id": "6d884d4e-9a73-4d00-8bea-fdcb7525f803"
    }
  ],
  "nodes": [
    {
      "id": "bf6454bd-899e-4a33-aebc-9bed44450dc4",
      "action": "modify",
      "components": [
        {
          "action": "add",
          "type": "HUBS_ambientLight",
          "props": {
            "intensity": 1.1
          }
        }
      ]
    },
    {
      "id": "da2f2e66-7aef-4684-86a2-11bf82337131",
      "action": "modify",
      "name": "Node0"
    },
    {
      "id": "da2f2e66-7aef-4684-86a2-11bf82337131",
      "action": "modify",
      "name": "Node1"
    }
  ]
}
```

## Adding Nodes

Nodes may be added to a scene using the parent UUID and an optional index. The `action` property must be set to `"add"` and `"parent"` must be defined unless it is the root node. If the parent node does not exist in the extended scene a warning message will be displayed and after loading finishes. Nodes with missing parents can optionally be removed from the scene 

`adding-nodes.spoke`
```json
{
  "type": "extended",
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "9d8856a0-7556-437a-8ace-1f6acb434a59",
      "action": "add",
      "parent": "bf6454bd-899e-4a33-aebc-9bed44450dc4",
      "index": 1,
      "name": "NewNode"
    }
  ]
}
```

## Scene Reference Nodes

Scene reference nodes are a special type of node that can be added to a scene. A scene reference node loads the scene referenced by it's `src` property. After the referenced scene has finished loading, each node's UUID is replaced a new UUID specified in the `sceneReferenceIds` map or if one does not exist in the map a new UUID is generated. The scene reference node must load and be added to the scene before the scene loader can continue loading the next node in the nodes array. This is because later nodes could depend on the referenced scene's nodes.

`scene-with-reference.spoke`
```json
{
  "type": "base",
  "root": "7f7f77c4-9ac5-4e78-98f0-24421cb79b19",
  "nodes": [
    {
      "id": "7f7f77c4-9ac5-4e78-98f0-24421cb79b19",
      "action": "add",
      "name": "RootNode"
    },
    {
      "id": "5b67cc4f-757e-4ba1-aa40-59f8f1b2f953",
      "action": "reference",
      "parent": "7f7f77c4-9ac5-4e78-98f0-24421cb79b19",
      "index": 0,
      "name": "ReferenceNode",
      "src": "base-scene.spoke",
      "sceneReferenceIds": {
        "281d331e-175c-43a2-9c4d-ecb1f74635cf": "6971f32d-028b-4703-834d-cc8fb61dd872",
        "da2f2e66-7aef-4684-86a2-11bf82337131": "4c840c28-aff8-47f8-a466-d796f2b9e8e1",
        "29610234-c247-45a2-a888-e774e29192d7": "c9d85144-a5d0-49d3-8066-3f2e69f698e8",
        "29610234-c247-45a2-a888-e774e29192d7": "7807a908-6b5c-41b3-b94b-47f36427f343"
      }
    }
  ]
}
```

## Removing Nodes

Nodes may be removed from a scene using the `"remove"` action. If the target node does not exist a warning message will be displayed after loading finishes. Nodes without a target can optionally be removed from the scene.

`removing-nodes.spoke`
```json
{
  "type": "extended",
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "9d8856a0-7556-437a-8ace-1f6acb434a59",
      "action": "remove"
    }
  ]
}
```

## Modifying Nodes
Most node data is stored in the components. However there are a few special properties stored on the node itself:

### Renaming Nodes
To rename a node simply specify a value for the `name` property. Whitespace and the following characters are prohibited: `\/[].:`. The THREE.GLTFLoader will replace whitespace with underscores and remove the prohibited characters when loading glTF scenes. A `.spoke` scene that uses these characters in a node name is invalid.

`renaming-nodes.spoke`
```json
{
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "da2f2e66-7aef-4684-86a2-11bf82337131",
      "action": "modify",
      "name": "Node1-Renamed"
    }
  ]
}
```

### Static Mode
The static mode of a node determines what optimizations may applied to the node when exporting. When a node is marked `static` it may be combined with other nodes with similar properties, their light maps may be baked etc. Nodes marked as `dynamic` will not be combined and nodes that are marked with `inherits` will inherit the computed static mode of their parent. By default nodes are marked as `inherits`.

`set-static-mode.spoke`
```json
{
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "da2f2e66-7aef-4684-86a2-11bf82337131",
      "action": "modify",
      "staticMode": "static"
    }
  ]
}
```

## Reordering / Re-parenting Nodes
A node can be moved from one position in the scene graph to another by setting it's `parent` and `index` properties.

`moving-nodes.spoke`
```json
{
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "6d884d4e-9a73-4d00-8bea-fdcb7525f803",
      "action": "modify",
      "parent": "da2f2e66-7aef-4684-86a2-11bf82337131",
      "index": 0
    }
  ]
}
```

## Update Components
Components can be set by specifying the `"update"` action, the `"type"` of component, and the component `"props"`. If the component does not already exist on the node it will be added. If `"props"` are not specified the default props will be used. If a component of that type already exists it will overwrite the existing component props.

`updating-components.spoke`
```json
{
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "da2f2e66-7aef-4684-86a2-11bf82337131",
      "action": "modify",
      "components": [
        {
          "action": "update",
          "type": "HUBS_interactableSpawner",
          "props": {
            "asset": "#duck"
          }
        }
      ]
    }
  ]
}
```

## Removing Components
Components can be removed by specifying the `"remove"` action and the `"type"` of component.

`removing-components.spoke`
```json
{
  "extends": "base-scene.spoke",
  "nodes": [
    {
      "id": "bf6454bd-899e-4a33-aebc-9bed44450dc4",
      "action": "modify",
      "components": [
        {
          "action": "remove",
          "type": "HUBS_ambientLight"
        }
      ]
    }
  ]
}
```
