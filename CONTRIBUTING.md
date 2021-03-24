# Contributing

This page outlines opportunities for people who want to contribute to Spoke. We welcome external contributions that align with the project's mission around enabling collaboration and communication through shared 3D spaces. You can find information about how to contribute to Hubs and the supporting projects that make up the platform in the main [Hubs Contributor Doc](https://github.com/mozilla/hubs/blob/master/CONTRIBUTING.md).

Contributors are expected to abide by the project's [Code of Conduct](./CODE_OF_CONDUCT.md) and to be respectful of the project and people working on it.

## Spoke Quick Start

- `git clone https://github.com/mozilla/Spoke.git`
- `cd Spoke`
- `yarn install`
- `yarn start`

Then open **https://localhost:9090** (note: HTTPS is required).

When running against a local self-signed cert reticulum server, you'll need to `export NODE_TLS_REJECT_UNAUTHORIZED=0` for publishing to work.

## Spoke Project Structure

```
spoke/
  src/
    api/ <- Code for interacting with Reticulum and other Hubs services
      Api.js <- The main class for interacting with Hubs services
    assets/ <- Static assets
    editor/ <- ThreeJS editor codebase
      caches/ <- In-memory caches for editor content
      commands/ <- All editor actions have a corresponding command for undo/redo functionality
      controls/ <- User input and viewport controls
      gltf/ <- Custom Spoke glTF loader/exporter and related utilities
      heightfield/ <- Raycast based heightfield generator
      helpers/ <- ThreeJS helper Object3Ds for visualizing lights and other elements
      kits/ <- Code for packaging glTF kits
      nodes/ <- Nodes represent the Object3Ds surfaced to users as Elements
        EditorNodeMixin.js <- Mixin to turn any Object3D into a Spoke Node
        SceneNode.js <- Root Node that also contains the scene serialization/deserialization logic
      objects/ <- Custom ThreeJS Object3Ds
      recast/ <- Recast Navigation (NavMesh generation library) related code
      renderer/ <- ThreeJS Renderer / shader / WebGL related code
        Renderer.js <- Spoke's WebGLRenderer wrapper
      utils/ <- Various ThreeJS / Spoke editor related utilities
    Editor.js <- The main editor class controlling the internal state, commands, serialization, export, etc.
    History.js <- Undo/Redo system class
    MeshCombinationGroup.js <- Mesh combination optimization utility class
    StaticMode.js <- Static Object3D tagging utilities, used in combination with MeshCombinationGroup
    ui/ <- React UI codebase
      assets/ <- Components/utilities related to the Assets Panel
      auth/ <- Components/utilities related to authentication
      contexts/ <- React Contexts for global app state
      dialogs/ <- Components for various Spoke dialogs
      dnd/ <- React Drag-n-Drop related utilities
      hierarchy/ <- Components/utilities related to the Scene Hierarchy Panel
      hooks/ <- Various generic React hooks for use in React Components
      inputs/ <- Components related to input fields used throughout the Spoke app
      landing/ <- Components related to the Spoke landing page
      layout/ <- Components used for laying out other React components
      navigation/ <- Common navigation components used for non-editor pages
      onboarding/ <- Components/utilities used for the Spoke editor onboarding
      projects/ <- Components/utilities used on the Spoke projects pages
      properties/ <- Components used in the Properties panel (this includes editors for each element)
      router/ <- react-router related components and utilities
      toolbar/ <- Spoke's editor toolbar related components and utilities
      viewport/ <- Components/utilities used in the Viewport panel
      whats-new/ <- Components/utilities used in the what's new page
      App.js <- The root component of the Spoke single page app, including the Routes
      EditorContainer.js <- The root component of the Spoke editor
      GlobalStyle.js <- Global css styles
      theme.js <- The styled-components theme
      utils.js <- Utility methods used in the ui
    config.js <- Main Spoke configuration file. Where new elements/asset sources are configured.
    configs.js <- Hubs Cloud related configuration
    index.html <- The HTML entry point for the Spoke single page webapp
    index.js <- Main application entry point
  test/
    fixtures/ <- Test scenes and other assets used in tests (served by webpack-dev server in test mode)
    helpers/ <- Test helpers including the Puppetteer integration testing script
    integration/ <- Integration tests ran in Ava + Puppeteer
    unit/ <- Unit tests ran in Ava
    entry.js <- Unit test entrypoint used to mock the browser context
```

## Spoke Architecture

Spoke is a Single Page Web App built primarily with React and ThreeJS. There is a split between the UI code, the Editor code, and the API wrapper code and we will cover the architecture in these three sections.

### UI

The React UI code can be found in the `/src/ui` folder. The entry point to the app ui is `App.js` which contains the React context providers and routes. Components for non-high priority pages are lazily loaded via dynamic imports. This helps keep the bundle size down for initial loads while reducing load time for the most commonly used pages.

The contexts created in `App.js` include the `ApiContext` which provides access to the `Api` class that we will outline in the Api section. There's also the Auth context which at the time of this doc's creation, only provides the `isAuthenticated` property to consumers. Finally, there's the `ThemeProvider` which provides all of the `styled-components` theme variables for the rest of the app.

Most of the pages are pretty self-explanatory in their architecture, but we will go into detail for the project page / `EditorContainer` component and it's dependencies.

The EditorContainer is the root component for the Spoke editor. The EditorContainer component itself is a fairly large class-based component that hasn't yet been migrated to React Hooks. It is responsible for fetching the files needed to load or create a project referenced by the current url. It also has a number of other project related event handlers. Aside from handling the app state for projects, it also creates and manages an instance of the `Editor` class, which is the entry point to all of the ThreeJS editor logic. In the component's render function you can see all of the high level components which create the basic structure of the editor and provide the editor-related React contexts.

The editor UI is then split up into a number of panels and a few other high level components like the Toolbar, Dialogs, and Onboarding.

#### ViewportPanelContainer

This component represents the 3D viewport in the editor. It has to interface with the `Renderer` and `SpokeControls` classes. It also has to handle drag and drop events for various asset types.

#### HierarchyPanelContainer

This component represents the 3D scene graph that is editable to the user. The items in the hierarchy represent user-editable Elements and not the whole ThreeJS scene graph. There is a lot of logic in this component relating to drag and drop events and keyboard shortcuts. It also uses [react-window](https://github.com/bvaughn/react-window) to virtualize component rendering.

#### PropertiesPanelContainer

This component handles rendering the properties for the currently selected element(s). Note that there is currently support for editing multiple selected nodes of the same type, but not different types of nodes. Node editors are rendered for the currently selected node type and these are registered in `config.js`.

#### AssetsPanel

The AssetsPanel renders all registered asset sources and their assets. It has drag and drop and infinite scrolling behaviors for the asset grid. It also uses the asset sources to render a search/filter toolbar for each source.

#### Toolbar

The Toolbar contains a number of input components that interface with the Spoke controls and EditorContainer. It also renders the dropdown menu.

## Elements

Elements are 3D objects that are surfaced in the Spoke asset panel and visible in the scene hierarchy panel. Their properties can also be edited in the properties panel. They are higher-level instances of ThreeJS Object3Ds.

The terms "node" and "element" can pretty much be used interchangeably in Spoke. "Element" is the term we like to surface to creators and in the code we often use "node".

Creating an element requires three pieces:
- Node Class: A ThreeJS Object3D that uses the Object3DMixin to add serialization, deserialization, export, lifecycle methods and property getters/setters.
- Node Property Editor: A React component that shows up in the Spoke property panel when the element is selected. It contains all the editable properties of a given node.
- Node Registration: All nodes are registered in `config.js`. When registering a node you need to provide the Node Property Editor and the Node Class.

### Node Class

A Node class is just a ThreeJS Object3D that uses the Object3DMixin.

Here's an example of our simplest Node, the `GroupNode`:

```js
import { Group } from "three";
import EditorNodeMixin from "./EditorNodeMixin";

export default class GroupNode extends EditorNodeMixin(Group) {
  static componentName = "group";

  static nodeName = "Group";

  serialize() {
    return super.serialize({
      group: {}
    });
  }
}
```

In this example the `EditorNodeMixin` mixes in a number of properties into the `Group` class. We then extend that class and set some required static properties:

`componentName`: This is the key used in serialization/deserialization of Spoke files.

`nodeName`: This is the name of the element used in the Spoke UI.

In the `serialize` method we write out the `group` component so that it is properly saved to the Spoke project. The group component has no additional data so it can be an empty object. The default implementation (Called via `super.serialize`), adds the `transform`, `visible`, and `editor-settings` components for us.

The `EditorNodeMixin` class contains a number of other methods and lifecycle methods that are documented in that file.

### Node Property Editor

In Spoke, node editors define the component shown in the property panel for the currently selected object. The `GroupNodeEditor` implementation is a very simple example of this. It renders a basic `NodeEditor` with just the component name and description. By default, the parent of the `NodeEditor` (`PropertiesPanelContainer`) will render the name field, visibility checkbox, the node enabled/disabled checkbox, and transform fields. Some of these can be enabled/disabled in the node class. For example the transform fields can be disabled by setting `disableTransform` to `true`.

The `iconComponent` and `description` static fields are used in the assets panel, hierarchy panel, and more. The `iconComponent` property should be a React component, preferably from the `styled-icons` library to keep things simple and the bundle small. You could use any custom component class there though. The description field should tell the user what the component does and act as in-editor documentation.

```js
import React from "react";
import NodeEditor from "./NodeEditor";
import { Cubes } from "styled-icons/fa-solid/Cubes";

function GroupNodeEditor(props) {
  return <NodeEditor {...props} description={GroupNodeEditor.description} />;
}

GroupNodeEditor.iconComponent = Cubes;

GroupNodeEditor.description =
  "A group of multiple objects that can be moved or duplicated together.\nDrag and drop objects into the Group in the Hierarchy.";
```

Of course this is a simple node property editor without any additional fields. We'll get to a more advanced example in a later section.

### Node Registration

For this Group Node to show up in Spoke, you need to register it with the `Editor` class.

In `src/config.js`:

```js
import GroupNode from "./editor/nodes/GroupNode";
import GroupNodeEditor from "./ui/properties/GroupNodeEditor";

export function createEditor(api, settings) {
  const editor = new Editor(api, settings);

  editor.registerNode(GroupNode, GroupNodeEditor);

  // ...

  return editor;
}
```

These are all of the required parts of a new element in Spoke.

## Creating Custom Elements