import React, { Component } from "react";
import PropTypes from "prop-types";
window.THREE = require("three");
require("three/examples/js/loaders/GLTFLoader");

export default class ViewportPanelContainer extends Component {
  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();

    this.renderer = null;
    this.editorScene = null;
    this.editorCamera = null;
    this.scene = null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.gltfURI !== this.props.gltfURI) {
      this.gltfLoader.load(this.props.gltfURI, this.onGLTFLoad, undefined, this.onGLTFLoadError);
    }
  }

  componentDidMount() {
    this.initializeThreeScene();
    this.renderThreeScene();

    window.addEventListener("resize", this.onResize);
  }

  onResize = () => {
    const canvas = this.canvasRef.current;

    this.editorCamera.aspect = canvas.offsetWidth / canvas.offsetHeight;
    this.editorCamera.updateProjectionMatrix();

    this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    this.renderThreeScene();
  };

  initializeThreeScene() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.current
    });

    this.editorScene = new THREE.Scene();
    this.editorScene.name = "Editor Scene";
    this.editorScene = this.editorScene;
    window.editorScene = this.editorScene;

    this.editorCamera = new THREE.PerspectiveCamera();
    this.editorCamera.name = "Editor Camera";
    this.editorScene.add(this.editorCamera);

    this.scene = new THREE.Scene();

    this.gltfLoader = new THREE.GLTFLoader();
  }

  onGLTFLoad = ({ scene }) => {
    this.editorScene.add(scene);
    this.scene = scene;
  };

  onGLTFLoadError = error => {
    console.log(error);
  };

  renderThreeScene() {
    this.renderer.render(this.editorScene, this.editorCamera);
  }

  render() {
    return <canvas ref={this.canvasRef} />;
  }
}

ViewportPanelContainer.propTypes = {
  gltfURI: PropTypes.string
};
