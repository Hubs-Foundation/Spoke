/**
 * belivvr custom
 * 화면공유(칠판) 컴포넌트 추가.
 * 해당 부분에 정의된 대로 실제 scene 에 생성이 된다.
 */
import * as THREE from "three";
import { Object3D, Color } from "three";

export default class SharedScreen extends Object3D {
    constructor(color, opacity) {
        super();

        const geometry = new THREE.PlaneBufferGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color, opacity, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);

        this.add(this.mesh);
    }

    get color() {
        return this.mesh.material.color;
    }

    set color(value) {
        this.mesh.material.color = new Color(value);
    }

    get opacity() {
        return this.mesh.material.opacity;
    }

    set opacity(value) {
        this.mesh.material.opacity = value;
    }

    copy(source, recursive = true) {
        if (recursive) {
            this.remove(this.mesh);
        }

        super.copy(source, recursive);

        if (recursive) {
            const _meshIndex = source.children.indexOf(source.mesh);

            if (_meshIndex !== -1) {
                this.mesh = this.children[_meshIndex];
            }
        }

        this.color = source.color;
        this.opacity = source.opacity;
        return this;
    }
}