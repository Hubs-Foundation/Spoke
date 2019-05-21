import THREE from "../../vendor/three";

const CYLINDER_TEXTURE =
  "data:image/png;base64,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";

const MISS_OPACITY = 0.1;
const HIT_OPACITY = 0.3;
const MISS_COLOR = 0xff0000;
const HIT_COLOR = 0x00ff00;
const FORWARD = new THREE.Vector3(0, 0, -1);
const LANDING_NORMAL = new THREE.Vector3(0, 1, 0);
const MAX_LANDING_ANGLE = 45;
const DRAW_TIME_MS = 400;
const q = new THREE.Quaternion();
const vecHelper = new THREE.Vector3();

function easeIn(t) {
  return t * t;
}

function easeOutIn(t) {
  if (t < 0.5) return 0.5 * ((t = t * 2 - 1) * t * t + 1);
  return 0.5 * (t = t * 2 - 1) * t * t + 0.5;
}

class TeleporterCurvedRay extends THREE.Object3D {
  constructor(numPoints = 20, width = 0.025) {
    super();

    this.geometry = new THREE.BufferGeometry();
    this.vertices = new Float32Array(numPoints * 3 * 2);
    this.uvs = new Float32Array(numPoints * 2 * 2);
    this.width = width;

    this.geometry.addAttribute("position", new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));

    this.material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.drawMode = THREE.TriangleStripDrawMode;

    this.mesh.frustumCulled = false;
    this.mesh.vertices = this.vertices;

    this.direction = new THREE.Vector3();
    this.numPoints = numPoints;

    this.up = new THREE.Vector3(0, 1, 0);
    this.posA = new THREE.Vector3();
    this.posB = new THREE.Vector3();

    this.add(this.mesh);
  }

  setDirection(direction) {
    this.direction
      .copy(direction)
      .cross(this.up)
      .normalize()
      .multiplyScalar(this.width / 2);
  }

  setWidth(width) {
    this.width = width;
  }

  setPoint(i, point) {
    this.posA.copy(point).add(this.direction);
    this.posB.copy(point).sub(this.direction);

    let idx = 2 * 3 * i;
    this.vertices[idx++] = this.posA.x;
    this.vertices[idx++] = this.posA.y;
    this.vertices[idx++] = this.posA.z;

    this.vertices[idx++] = this.posB.x;
    this.vertices[idx++] = this.posB.y;
    this.vertices[idx++] = this.posB.z;

    this.geometry.attributes.position.needsUpdate = true;
  }
}

class TeleporterRing extends THREE.Object3D {
  constructor(radius = 0.25, outerRadius = 0.6, height = 0.3, color = "#99ff99") {
    super();

    this.torus = new THREE.Mesh(
      new THREE.TorusBufferGeometry(radius, 0.01, 16, 18),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false })
    );
    this.torus.rotation.set(Math.PI / 2, 0, 0);
    this.add(this.torus);

    const cylinderImage = new Image();
    cylinderImage.src = CYLINDER_TEXTURE;
    this.cylinder = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius, radius, height),
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        depthTest: false,
        map: new THREE.Texture(cylinderImage),
        transparent: true
      })
    );
    this.add(this.cylinder);

    this.outerTorus = new THREE.Mesh(
      new THREE.TorusBufferGeometry(outerRadius, 0.01, 16, 18),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false, opacity: HIT_OPACITY })
    );
    this.outerTorus.rotation.set(Math.PI / 2, 0, 0);
    this.add(this.outerTorus);
  }
}

function parabolicCurve(p0, v0, t, out) {
  out.x = p0.x + v0.x * t;
  out.y = p0.y + v0.y * t - 4.9 * t * t;
  out.z = p0.z + v0.z * t;
  return out;
}

function isValidNormalsAngle(collisionNormal, referenceNormal, landingMaxAngle) {
  const angleNormals = referenceNormal.angleTo(collisionNormal);
  return THREE.Math.RAD2DEG * angleNormals <= landingMaxAngle;
}

const checkLineIntersection = (function() {
  const direction = new THREE.Vector3();
  return function checkLineIntersection(start, end, meshes, raycaster, referenceNormal, landingMaxAngle, hitPoint) {
    direction.copy(end).sub(start);
    const distance = direction.length();
    raycaster.far = distance;
    raycaster.set(start, direction.normalize());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (
      intersects.length > 0 &&
      intersects[0].face &&
      isValidNormalsAngle(intersects[0].face.normal, referenceNormal, landingMaxAngle)
    ) {
      hitPoint.copy(intersects[0].point);
      return true;
    }
    return false;
  };
})();

export default class Teleporter extends THREE.Object3D {
  constructor(raycaster) {
    super();
    this.isTeleporting = false;
    this.rayCurve = new TeleporterCurvedRay();
    this.rayCurve.visible = false;
    this.add(this.rayCurve);

    this.hitEntity = new TeleporterRing();
    this.hitEntity.visible = false;
    this.add(this.hitEntity);

    this.p0 = new THREE.Vector3();
    this.v0 = new THREE.Vector3();
    this.parabola = Array.from(new Array(this.rayCurve.numPoints), () => new THREE.Vector3());
    this.hit = false;
    this.hitPoint = new THREE.Vector3();
    this.meshes = [];
    this.raycaster = raycaster;
    this.rigWorldPosition = new THREE.Vector3();
    this.newRigWorldPosition = new THREE.Vector3();
    this.teleportOriginWorldPosition = new THREE.Vector3();

    this.teleportEventDetail = {
      oldPosition: this.rigWorldPosition,
      newPosition: this.newRigWorldPosition,
      hitPoint: this.hitPoint
    };
    this.prevHitHeight = 0;
    this.direction = new THREE.Vector3();

    this.helper = new THREE.ArrowHelper(this.direction, this.position, 100, 0xffff00);
    this.add(this.helper);
  }

  start() {
    this.isTeleporting = true;
    this.timeTeleporting = 0;
    this.hit = false;
    this.rayCurve.visible = true;
    this.rayCurve.updateMatrixWorld();
    this.rayCurve.material.opacity = MISS_OPACITY;
    this.rayCurve.material.color.set(MISS_COLOR);
    this.rayCurve.material.needsUpdate = true;
  }

  update(dt, meshes) {
    this.timeTeleporting += dt;
    this.updateMatrixWorld();
    this.matrixWorld.decompose(this.p0, q, vecHelper);
    this.direction
      .copy(FORWARD)
      .applyQuaternion(q)
      .normalize();
    this.rayCurve.setDirection(this.direction);
    this.v0.copy(this.direction).multiplyScalar(12);

    let collidedIndex = this.rayCurve.numPoints - 1;

    this.hit = false;
    this.parabola[0].copy(this.p0);
    const timeSegment = 1 / (this.rayCurve.numPoints - 1);
    for (let i = 1; i < this.rayCurve.numPoints; i++) {
      const t = i * timeSegment;
      parabolicCurve(this.p0, this.v0, t, vecHelper);
      this.parabola[i].copy(vecHelper);

      if (
        checkLineIntersection(
          this.parabola[i - 1],
          this.parabola[i],
          meshes,
          this.raycaster,
          LANDING_NORMAL,
          MAX_LANDING_ANGLE,
          this.hitPoint
        )
      ) {
        this.hit = true;
        collidedIndex = i;
        break;
      }
    }

    const percentToDraw = this.timeTeleporting > DRAW_TIME_MS ? 1 : this.timeTeleporting / DRAW_TIME_MS;
    const percentRaycasted = collidedIndex / (this.rayCurve.numPoints - 1);
    const segmentT = (percentToDraw * percentRaycasted) / (this.rayCurve.numPoints - 1);

    console.log(this.hit, this.percentToDraw, this.percentRaycasted);

    for (let i = 0; i < this.rayCurve.numPoints; i++) {
      const t = i * segmentT;
      parabolicCurve(this.p0, this.v0, t, vecHelper);
      this.rayCurve.setPoint(i, vecHelper);
    }

    const color = this.hit ? HIT_COLOR : MISS_COLOR;
    const opacity = this.hit && this.timeTeleporting >= DRAW_TIME_MS ? HIT_OPACITY : MISS_OPACITY;
    this.rayCurve.material.color.set(color);
    this.rayCurve.material.opacity = opacity;
    this.rayCurve.material.needsUpdate = true;

    this.hitEntity.visible = this.hit;

    if (this.hit) {
      this.hitEntity.position.copy(this.hitPoint);
      const hitEntityOpacity = HIT_OPACITY * easeOutIn(percentToDraw);
      const dRadii = 0.6 - 0.25;
      const outerScale = (0.6 - easeIn(percentToDraw) * dRadii) / 0.6;
      this.hitEntity.outerTorus.scale.set(outerScale, outerScale, 1);
      this.hitEntity.torus.material.opacity = hitEntityOpacity;
      this.hitEntity.torus.material.needsUpdate = true;
      this.hitEntity.cylinder.material.opacity = hitEntityOpacity;
      this.hitEntity.cylinder.material.needsUpdate = true;
    }
  }

  end() {
    this.isTeleporting = false;
    this.rayCurve.visible = false;
    this.hitEntity.visible = false;
  }
}
