# Spoke Developer Documentation

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
    - [UI](#ui)
      - [ViewportPanelContainer](#ViewportPanelContainer)
      - [HierarchyPanelContainer](#HierarchyPanelContainer)
      - [PropertiesPanelContainer](#PropertiesPanelContainer)
      - [AssetsPanel](#AssetsPanel)
      - [Toolbar](#Toolbar)
    - [Elements](#Elements)
      - [Node Class](#node-class)
      - [Node Property Editor](#node-property-editor)
      - [Node Registration](#node-registration)
    - [Asset Sources](#asset-sources)
      - [Image/Video/Model Media Sources](#ImageVideoModel-Media-Sources)
      - [Kit Source](#kit-source)
      - [Asset Manifest Source](#asset-manifest-source)
- Guides
  - [Creating Custom Elements](./creating-custom-elements.md)
  - [Creating Kits](./creating-kits.md)

## Getting Started

- `git clone https://github.com/mozilla/Spoke.git`
- `cd Spoke`
- `yarn install`
- `yarn start`

Then open **https://localhost:9090** (note: HTTPS is required).

When running against a local self-signed cert reticulum server, you'll need to `export NODE_TLS_REJECT_UNAUTHORIZED=0` for publishing to work.

## Project Structure

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

## Architecture

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

### Elements

Elements are 3D objects that are surfaced in the Spoke asset panel and visible in the scene hierarchy panel. Their properties can also be edited in the properties panel. They are higher-level instances of ThreeJS Object3Ds.

The terms "node" and "element" can pretty much be used interchangeably in Spoke. "Element" is the term we like to surface to creators and in the code we often use "node".

Creating an element requires three pieces:
- Node Class: A ThreeJS Object3D that uses the Object3DMixin to add serialization, deserialization, export, lifecycle methods and property getters/setters.
- Node Property Editor: A React component that shows up in the Spoke property panel when the element is selected. It contains all the editable properties of a given node.
- Node Registration: All nodes are registered in `config.js`. When registering a node you need to provide the Node Property Editor and the Node Class.

#### Node Class

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

#### Node Property Editor

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

Of course this is a simple node property editor without any additional fields. You can see a more advanced example in the [Creating Custom Elements Guide](./custom-elements.md).

#### Node Registration

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

### Asset Sources

Another extensible part of Spoke is the assets panel. Spoke comes with a number of asset source for elements, models, kits, and more. You can add your own sources with just a little code.

Asset sources can be found in `/src/ui/assets/sources`. All sources should extend the `BaseAssetSource` class. You can also extend one of the higher level classes.

- ImageMediaSource
- VideoMediaSource
- ModelMediaSource
- KitSource
- AssetManifestSource

Each asset source must define a name, icon, asset panel component, and search function. These higher level classes have some good defaults for these various asset types.

#### Image/Video/Model Media Sources

These sources are relatively similar with the main difference being the `assetPanelComponent` being used.

Media sources are intended to be used with an external API, in our case all of these requests are made through Reticulum's media search API.

The sources can be relatively simple like the `BingImagesSource`:

```js
import ImageMediaSource from "../ImageMediaSource";

export default class BingImagesSource extends ImageMediaSource {
  constructor(api) {
    super(api);
    this.id = "bing_images";
    this.name = "Bing Images";
    this.searchLegalCopy = "Search by Bing";
    this.privacyPolicyUrl = "https://privacy.microsoft.com/en-us/privacystatement";
  }
}
```

Or a bit more complex like the TenorSource which implements a custom search function:

```js
import VideoMediaSource from "../VideoMediaSource";
import { ItemTypes } from "../../dnd";
import VideoNode from "../../../editor/nodes/VideoNode";

export default class TenorSource extends VideoMediaSource {
  constructor(api) {
    super(api);
    this.id = "tenor";
    this.name = "Tenor GIFs";
    this.searchPlaceholder = "Search GIFs...";
    this.searchLegalCopy = "Search by Tenor";
    this.privacyPolicyUrl = "https://tenor.com/legal-privacy";
  }

  async search(params, cursor, abortSignal) {
    const { results, suggestions, nextCursor } = await this.api.searchMedia(
      this.id,
      {
        query: params.query,
        filter: params.tags && params.tags.length > 0 && params.tags[0].value
      },
      cursor,
      abortSignal
    );

    return {
      results: results.map(result => ({
        id: result.id,
        videoUrl: result && result.images && result.images.preview && result.images.preview.url,
        label: result.name,
        type: ItemTypes.Video,
        url: result.url,
        nodeClass: VideoNode,
        initialProps: {
          name: result.name,
          src: result.url
        }
      })),
      suggestions,
      nextCursor,
      hasMore: !!nextCursor
    };
  }
}
```

You can also add tags, categories, and more as search options. The `SketchfabSource` is a good example to follow for these settings.

#### Kit Source

Spoke comes with a few kits including the Architecture Kit and Rock Kit. These kits are packaged as a single glTF file where all of the pieces have a specific `kit-piece` glTF component.

Defining a kit source is as simple as extending the `KitSource`, giving it a name, id and glTF model source.

To create this glTF asset, you'll want to follow our kit packaging guide.

```js
import KitSource from "../KitSource";
import { TransformPivot } from "../../../editor/controls/SpokeControls";

export default class ArchitectureKitSource extends KitSource {
  constructor(api) {
    super(
      api,
      "https://assets-prod.reticulum.io/kits/architecture/ArchKit-64274f78e194a993850e208cbaa2fe7c5a35a955.gltf"
    );
    this.id = "architecture-kit";
    this.name = "Architecture Kit";
    this.transformPivot = TransformPivot.Selection;
    // Images take a while to load so we set a debounce timeout
    this.searchDebounceTimeout = 500;
  }
}
```

#### Asset Manifest Source

The asset manifest source fetches an externally hosted asset manifest and lists all of the assets referenced in it. It's a good option if you have a collection of images, videos, sounds, or models and you want to include them as an asset source in spoke.

To create an asset manifest source, extend the `AssetManifestSource` class and pass the name and asset manifest url to the constructor.

An asset manifest is defined with the following structure:

```jsonc
{
  // Currently unused, but you should set this to the same value as you pass to the AssetManifestSource constructor.
  "name": "Hubs Sound Pack",
  // Placeholder trext to show in the asset source's search bar.
  "searchPlaceholder": "Search sounds...",
  // The assets to show in the assets panel
  "assets": [
    {
      // Must be a unique id
      "id": "Meeting_Room_no_Music",
      // The text to show in the ui for the asset item
      "label": "Meeting Room no Music",
      // Used for filtering assets by type, what icon to show, the component to use, etc.
      // "Audio", "Image", "Video" or "Model" are currently supported.
      "type": "Audio",
      // The relative path to the asset
      "url": "Meeting_Room/Meeting_Room_no_Music.mp3",
      // Tags are used to filter assets. They should be defined in the "tags" section in the manifest. The values in this array should match the values in the "tags" section.
      "tags": [
        "Full_Mix",
        "Meeting_Room"
      ]
    }
    // ...
  ],
  // Tags are used to filter assets. The tags hierarchy is shown on the left side of the assets panel.
  "tags": [
    {
      // The text shown in the UI
      "label": "Full Mix",
      // The value used above in the "assets" section.
      "value": "Full_Mix"
    },
    {
      "label": "Meeting Room",
      "value": "Meeting_Room",
      // Tags can have children that can be expanded/collapsed.
      "children": [
        {
          "label": "Components",
          // Note that the value is a path to the tag. This is mostly to avoid collisions between values. All tag values must be unique.
          "value": "Meeting_Room/Components"
        }
      ]
    }
    // ...
  ]
}
```

Here is an example of the `AssetManifestSource` in use with our Hubs Sound Pack.

```js
import AssetManifestSource from "../AssetManifestSource";

export default class HubsSoundPackSource extends AssetManifestSource {
  constructor(editor) {
    super(editor, "Hubs Sound Pack", "https://assets-prod.reticulum.io/hubs-sound-pack/asset-manifest.json");
  }
}

```

Our [Hubs Sound Pack repository](https://github.com/MozillaReality/hubs-sound-pack) is a great example and starting point for creating your own asset manifest source.

Note that the repository contains a [script for generating an asset manifest](https://github.com/MozillaReality/hubs-sound-pack/blob/master/scripts/manifest-generator.js) from the repository's folder structure. It's fairly specific for this project, but you could easily adopt it for your own project.