import THREE from "../../vendor/three";

/**
 * Adapted from THREE.OutlinePass
 * Original author spidersharma / http://eduperiment.com/
 */

class DepthMaskMaterial extends THREE.ShaderMaterial {
  constructor(camera) {
    const cameraType = camera.isPerspectiveCamera ? "perspective" : "orthographic";
    super({
      defines: {
        DEPTH_TO_VIEW_Z: `${cameraType}DepthToViewZ`
      },
      uniforms: {
        depthTexture: { value: null },
        cameraNearFar: { value: new THREE.Vector2(0.5, 0.5) },
        textureMatrix: { value: new THREE.Matrix4() }
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

class EdgeDetectionMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        maskTexture: { value: null },
        texSize: { value: new THREE.Vector2(0.5, 0.5) }
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

class OverlayMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        edgeTexture: { value: null },
        edgeColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
        texSize: { value: new THREE.Vector2(0.0, 0.0) }
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

export default class OutlinePass extends THREE.Pass {
  constructor(resolution, scene, camera, selectedObjects) {
    super();
    this.renderScene = scene;
    this.renderCamera = camera;
    this.selectedObjects = selectedObjects;
    this.selectedRenderables = [];
    this.nonSelectedRenderables = [];
    this.edgeColor = new THREE.Color(1, 1, 1);
    this.resolution = new THREE.Vector2(resolution.x, resolution.y);

    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

    this.maskBufferMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.maskBufferMaterial.side = THREE.DoubleSide;
    this.renderTargetMaskBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetMaskBuffer.texture.name = "OutlinePass.mask";
    this.renderTargetMaskBuffer.texture.generateMipmaps = false;

    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.depthMaterial.side = THREE.DoubleSide;
    this.depthMaterial.depthPacking = THREE.RGBADepthPacking;
    this.depthMaterial.blending = THREE.NoBlending;

    this.depthMaskMaterial = new DepthMaskMaterial(this.renderCamera);
    this.depthMaskMaterial.side = THREE.DoubleSide;

    this.renderTargetDepthBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetDepthBuffer.texture.name = "OutlinePass.depth";
    this.renderTargetDepthBuffer.texture.generateMipmaps = false;

    this.edgeDetectionMaterial = new EdgeDetectionMaterial();
    this.renderTargetEdgeBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetEdgeBuffer.texture.name = "OutlinePass.edge";
    this.renderTargetEdgeBuffer.texture.generateMipmaps = false;

    this.overlayMaterial = new OverlayMaterial();

    if (THREE.CopyShader === undefined) console.error("THREE.OutlinePass relies on THREE.CopyShader");
    const copyShader = THREE.CopyShader;
    this.copyUniforms = THREE.UniformsUtils.clone(copyShader.uniforms);
    this.copyUniforms["opacity"].value = 1.0;
    this.copyMaterial = new THREE.ShaderMaterial({
      uniforms: this.copyUniforms,
      vertexShader: copyShader.vertexShader,
      fragmentShader: copyShader.fragmentShader,
      blending: THREE.NoBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });

    this.enabled = true;
    this.needsSwap = false;

    this.oldClearColor = new THREE.Color();
    this.oldClearAlpha = 1;

    this.outlineCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.outlineScene = new THREE.Scene();

    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.quad.frustumCulled = false; // Avoid getting clipped
    this.outlineScene.add(this.quad);

    this.textureMatrix = new THREE.Matrix4();
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
          if ((child.isMesh || child.isLine || child.isSprite) && !child.isHelper) {
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
      renderer.render(this.renderScene, this.renderCamera, this.renderTargetDepthBuffer, true);

      // Restore selected mesh visibility.
      for (const mesh of this.selectedRenderables) {
        mesh.visible = mesh.userData.prevVisible;
        delete mesh.userData.prevVisible;
      }

      // Update Texture Matrix for Depth compare
      this.textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
      this.textureMatrix.multiply(this.renderCamera.projectionMatrix);
      this.textureMatrix.multiply(this.renderCamera.matrixWorldInverse);

      // Make non selected objects invisible, and draw only the selected objects, by comparing the depth buffer of non selected objects
      this.renderScene.traverse(object => {
        if ((object.isMesh || object.isLine || object.isSprite) && this.selectedRenderables.indexOf(object) === -1) {
          this.nonSelectedRenderables.push(object);

          // Make non selected meshes invisible
          object.userData.prevVisible = object.visible;
          object.visible = false;
        }
      });

      this.renderScene.overrideMaterial = this.depthMaskMaterial;
      this.depthMaskMaterial.uniforms["cameraNearFar"].value = new THREE.Vector2(
        this.renderCamera.near,
        this.renderCamera.far
      );
      this.depthMaskMaterial.uniforms["depthTexture"].value = this.renderTargetDepthBuffer.texture;
      this.depthMaskMaterial.uniforms["textureMatrix"].value = this.textureMatrix;
      renderer.render(this.renderScene, this.renderCamera, this.renderTargetMaskBuffer, true);
      this.renderScene.overrideMaterial = null;

      // Restore non-selected mesh visibility
      for (const mesh of this.nonSelectedRenderables) {
        mesh.visible = mesh.userData.prevVisible;
        delete mesh.userData.prevVisible;
      }

      this.selectedRenderables = [];
      this.nonSelectedRenderables = [];

      this.renderScene.background = currentBackground;

      // Apply Edge Detection Pass
      this.quad.material = this.edgeDetectionMaterial;
      this.edgeDetectionMaterial.uniforms["maskTexture"].value = this.renderTargetMaskBuffer.texture;
      this.edgeDetectionMaterial.uniforms["texSize"].value = new THREE.Vector2(
        this.renderTargetMaskBuffer.width,
        this.renderTargetMaskBuffer.height
      );
      renderer.render(this.outlineScene, this.outlineCamera, this.renderTargetEdgeBuffer, true);

      // Blend it additively over the input texture
      this.quad.material = this.overlayMaterial;
      this.overlayMaterial.uniforms["edgeTexture"].value = this.renderTargetEdgeBuffer.texture;
      this.overlayMaterial.uniforms["edgeColor"].value = this.edgeColor;
      this.overlayMaterial.uniforms["texSize"].value = new THREE.Vector2(
        this.renderTargetEdgeBuffer.width,
        this.renderTargetEdgeBuffer.height
      );

      if (maskActive) renderer.context.enable(renderer.context.STENCIL_TEST);

      renderer.render(this.outlineScene, this.outlineCamera, readBuffer, false);

      renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
      renderer.autoClear = oldAutoClear;
    }

    // Copy the result of the outline pass to the frame buffer
    if (this.renderToScreen) {
      this.quad.material = this.copyMaterial;
      this.copyUniforms["tDiffuse"].value = readBuffer.texture;
      renderer.render(this.outlineScene, this.outlineCamera);
    }
  }
}
