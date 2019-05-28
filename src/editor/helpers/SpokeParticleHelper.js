import THREE from "../../vendor/three";
import { addIsHelperFlag } from "./utils";

export default class SpokeParticletHelper extends THREE.Object3D {
  constructor(particleSystem) {
    super();

    this.particleSystem = particleSystem;

    const positions = [] || "";
    const sizes = [] || "";
    const geometry = new THREE.BufferGeometry();

    const radius = 500;
    for (let i = 0; i < 1000; i++) {
      positions.push((Math.random() * 2 - 1) * radius);
      positions.push((Math.random() * 2 - 1) * radius);
      positions.push((Math.random() * 2 - 1) * radius);
      sizes.push(20);
      console.log("postions " + positions[i]);
    }

    geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.addAttribute("size", new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));

    this.particleSystem = new THREE.Points(geometry);

    geometry.attributes.size.needsUpdate = true;

    this.add(this.particleSystem);
    this.update();
    //this.update(this.particleSystem, this.sizes);
    addIsHelperFlag(this);
  }

  // animate(){

  //   requestAnimationFrame(animate);

  // }

  update() {
    // const time = Date.now() * 0.005;
    // p.rotation.z = 0.01 * time;
    // for (let i = 0; i < 1000; i++) {
    //   s[i] = 10 * (1 + Math.sin(0.1 * i + time));
    //   console.log("sizes " + i + " " + s[i] + " , time: " + time);
    // }
    //this.geometry.attributes.size.needsUpdate = true;
  }

  dispose() {}
}
