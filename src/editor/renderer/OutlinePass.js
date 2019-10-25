import {
  ShaderMaterial,
  Vector2,
  Matrix4,
  Vector3,
  Color,
  LinearFilter,
  RGBAFormat,
  MeshBasicMaterial,
  DoubleSide,
  WebGLRenderTarget,
  MeshDepthMaterial,
  RGBADepthPacking,
  NoBlending,
  UniformsUtils,
  OrthographicCamera,
  Scene,
  Mesh,
  PlaneBufferGeometry,
  Layers
} from "three";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import { Pass } from "three/examples/jsm/postprocessing/EffectComposer";

/**
 * Adapted from THREE.OutlinePass
 * Original author spidersharma / http://eduperiment.com/
 */

class DepthMaskMaterial extends ShaderMaterial {
  constructor(camera) {
    const cameraType = camera.isPerspectiveCamera ? "perspective" : "orthographic";
    super({
      defines: {
        DEPTH_TO_VIEW_Z: `${cameraType}DepthToViewZ`
      },
      uniforms: {
        depthTexture: { value: null },
        cameraNearFar: { value: new Vector2(0.5, 0.5) },
        textureMatrix: { value: new Matrix4() }
      },

      vertexShader: `
        varying vec4 projTexCoord;
        varying vec4 vPosition;
        uniform mat4 textureMatrix;
  
        void main() {
  
          vPosition = modelViewMatrix * vec4( position, 1.0 );
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
          projTexCoord = textureMatrix * worldPosition;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
        }
      `,

      fragmentShader: `
        #include <packing>
        varying vec4 vPosition;
        varying vec4 projTexCoord;
        uniform sampler2D depthTexture;
        uniform vec2 cameraNearFar;
  
        void main() {
  
          float depth = unpackRGBAToDepth(texture2DProj( depthTexture, projTexCoord ));
          float viewZ = - DEPTH_TO_VIEW_Z( depth, cameraNearFar.x, cameraNearFar.y );
          float depthTest = (-vPosition.z > viewZ) ? 1.0 : 0.0;
          gl_FragColor = vec4(0.0, 1.0 - depthTest, 1.0, 1.0);
  
        }
      `
    });
  }
}

class EdgeDetectionMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        maskTexture: { value: null },
        texSize: { value: new Vector2(0.5, 0.5) }
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,

      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D maskTexture;
        uniform vec2 texSize;

        void main() {
          vec2 invSize = 1.0 / texSize;
          vec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize, invSize);
          vec4 c1 = texture2D( maskTexture, vUv + uvOffset.xy);
          vec4 c2 = texture2D( maskTexture, vUv - uvOffset.xy);
          vec4 c3 = texture2D( maskTexture, vUv + uvOffset.yw);
          vec4 c4 = texture2D( maskTexture, vUv - uvOffset.yw);
          float diff1 = (c1.r - c2.r)*0.5;
          float diff2 = (c3.r - c4.r)*0.5;
          float d = length( vec2(diff1, diff2) ) * 0.5;
          float depth = (c1.g + c2.g + c3.g + c4.g) * 0.25;
          gl_FragColor = vec4(depth * d, 0.0, 0.0, d);
        }
      `
    });
  }
}

class OverlayMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        edgeTexture: { value: null },
        edgeColor: { value: new Vector3(1.0, 1.0, 1.0) },
        texSize: { value: new Vector2(0.0, 0.0) }
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,

      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D edgeTexture;
        uniform vec3 edgeColor;
        uniform vec2 texSize;

        void main() {
          vec2 invSize = 1.0 / texSize;
          vec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize, invSize);
          vec4 c1 = texture2D( edgeTexture, vUv + uvOffset.xy);
          vec4 c2 = texture2D( edgeTexture, vUv - uvOffset.xy);
          vec4 c3 = texture2D( edgeTexture, vUv + uvOffset.yw);
          vec4 c4 = texture2D( edgeTexture, vUv - uvOffset.yw);
          float visibilityFactor =  c1.r + c2.r + c3.r + c4.r;
          gl_FragColor = vec4(edgeColor, visibilityFactor);
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
  }
}

export default class OutlinePass extends Pass {
  constructor(resolution, scene, camera, selectedObjects, spokeRenderer) {
    super();
    this.renderScene = scene;
    this.renderCamera = camera;
    this.selectedObjects = selectedObjects;
    this.spokeRenderer = spokeRenderer;
    this.selectedRenderables = [];
    this.nonSelectedRenderables = [];
    this.edgeColor = new Color(1, 1, 1);
    this.resolution = new Vector2(resolution.x, resolution.y);

    const pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat };

    this.maskBufferMaterial = new MeshBasicMaterial({ color: 0xffffff });
    this.maskBufferMaterial.side = DoubleSide;
    this.renderTargetMaskBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetMaskBuffer.texture.name = "OutlinePass.mask";
    this.renderTargetMaskBuffer.texture.generateMipmaps = false;

    this.depthMaterial = new MeshDepthMaterial();
    this.depthMaterial.side = DoubleSide;
    this.depthMaterial.depthPacking = RGBADepthPacking;
    this.depthMaterial.blending = NoBlending;

    this.depthMaskMaterial = new DepthMaskMaterial(this.renderCamera);
    this.depthMaskMaterial.side = DoubleSide;

    this.renderTargetDepthBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetDepthBuffer.texture.name = "OutlinePass.depth";
    this.renderTargetDepthBuffer.texture.generateMipmaps = false;

    this.edgeDetectionMaterial = new EdgeDetectionMaterial();
    this.renderTargetEdgeBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetEdgeBuffer.texture.name = "OutlinePass.edge";
    this.renderTargetEdgeBuffer.texture.generateMipmaps = false;

    this.overlayMaterial = new OverlayMaterial();

    this.copyUniforms = UniformsUtils.clone(CopyShader.uniforms);
    this.copyUniforms["opacity"].value = 1.0;
    this.copyMaterial = new ShaderMaterial({
      uniforms: this.copyUniforms,
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });

    this.enabled = true;
    this.needsSwap = false;

    this.oldClearColor = new Color();
    this.oldClearAlpha = 1;

    this.outlineCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.outlineScene = new Scene();

    this.quad = new Mesh(new PlaneBufferGeometry(2, 2), null);
    this.quad.frustumCulled = false; // Avoid getting clipped
    this.outlineScene.add(this.quad);

    this.textureMatrix = new Matrix4();
    this.renderableLayers = new Layers();
  }

  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    if (this.selectedObjects.length > 0) {
      this.oldClearColor.copy(renderer.getClearColor());
      this.oldClearAlpha = renderer.getClearAlpha();
      const oldAutoClear = renderer.autoClear;

      renderer.autoClear = false;

      if (maskActive) renderer.context.disable(renderer.context.STENCIL_TEST);

      renderer.setClearColor(0xffffff, 1);

      for (const selectedObject of this.selectedObjects) {
        selectedObject.traverse(child => {
          // Don't include helper objects in the outline.
          if (
            (child.isMesh || child.isLine || child.isSprite || child.isPoints) &&
            !child.isHelper &&
            !child.disableOutline
          ) {
            this.selectedRenderables.push(child);

            // Make selected meshes invisible
            child.userData.prevVisible = child.visible;
            child.visible = false;
          }
        });
      }

      const currentBackground = this.renderScene.background;
      this.renderScene.background = null;

      // Draw Non Selected objects in the depth buffer
      this.renderScene.overrideMaterial = this.depthMaterial;
      renderer.setRenderTarget(this.renderTargetDepthBuffer);
      renderer.clear();

      if (this.spokeRenderer.batchManager) {
        this.spokeRenderer.batchManager.update();
      }

      renderer.render(this.renderScene, this.renderCamera);

      // Restore selected mesh visibility.
      for (const mesh of this.selectedRenderables) {
        mesh.visible = mesh.userData.prevVisible;

        if (!mesh.layers.test(this.renderableLayers)) {
          mesh.layers.enable(0);
          mesh.userData.prevDisableRenderLayer = true;
        }

        delete mesh.userData.prevVisible;
      }

      // Update Texture Matrix for Depth compare
      this.textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
      this.textureMatrix.multiply(this.renderCamera.projectionMatrix);
      this.textureMatrix.multiply(this.renderCamera.matrixWorldInverse);

      // Make non selected objects invisible, and draw only the selected objects, by comparing the depth buffer of non selected objects
      this.renderScene.traverse(object => {
        if (
          (object.isMesh || object.isLine || object.isSprite || object.isPoints) &&
          this.selectedRenderables.indexOf(object) === -1
        ) {
          this.nonSelectedRenderables.push(object);

          // Make non selected meshes invisible
          object.userData.prevVisible = object.visible;
          object.visible = false;
        }
      });

      this.renderScene.overrideMaterial = this.depthMaskMaterial;
      this.depthMaskMaterial.uniforms["cameraNearFar"].value = new Vector2(
        this.renderCamera.near,
        this.renderCamera.far
      );
      this.depthMaskMaterial.uniforms["depthTexture"].value = this.renderTargetDepthBuffer.texture;
      this.depthMaskMaterial.uniforms["textureMatrix"].value = this.textureMatrix;
      renderer.setRenderTarget(this.renderTargetMaskBuffer);
      renderer.clear();

      if (this.spokeRenderer.batchManager) {
        this.spokeRenderer.batchManager.update();
      }

      renderer.render(this.renderScene, this.renderCamera);
      this.renderScene.overrideMaterial = null;

      // Restore non-selected mesh visibility
      for (const mesh of this.nonSelectedRenderables) {
        mesh.visible = mesh.userData.prevVisible;
        delete mesh.userData.prevVisible;
      }

      for (const mesh of this.selectedRenderables) {
        if (mesh.userData.prevDisableRenderLayer) {
          mesh.layers.disable(0);
          delete mesh.userData.prevDisableRenderLayer;
        }
      }

      this.selectedRenderables = [];
      this.nonSelectedRenderables = [];

      this.renderScene.background = currentBackground;

      // Apply Edge Detection Pass
      this.quad.material = this.edgeDetectionMaterial;
      this.edgeDetectionMaterial.uniforms["maskTexture"].value = this.renderTargetMaskBuffer.texture;
      this.edgeDetectionMaterial.uniforms["texSize"].value = new Vector2(
        this.renderTargetMaskBuffer.width,
        this.renderTargetMaskBuffer.height
      );
      renderer.setRenderTarget(this.renderTargetEdgeBuffer);
      renderer.clear();
      renderer.render(this.outlineScene, this.outlineCamera);

      // Blend it additively over the input texture
      this.quad.material = this.overlayMaterial;
      this.overlayMaterial.uniforms["edgeTexture"].value = this.renderTargetEdgeBuffer.texture;
      this.overlayMaterial.uniforms["edgeColor"].value = this.edgeColor;
      this.overlayMaterial.uniforms["texSize"].value = new Vector2(
        this.renderTargetEdgeBuffer.width,
        this.renderTargetEdgeBuffer.height
      );

      if (maskActive) renderer.context.enable(renderer.context.STENCIL_TEST);

      renderer.setRenderTarget(readBuffer);
      renderer.render(this.outlineScene, this.outlineCamera);

      renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
      renderer.autoClear = oldAutoClear;
    }

    // Copy the result of the outline pass to the frame buffer
    if (this.renderToScreen) {
      this.quad.material = this.copyMaterial;
      this.copyUniforms["tDiffuse"].value = readBuffer.texture;
      renderer.setRenderTarget(null);
      renderer.render(this.outlineScene, this.outlineCamera);
    }
  }
}
