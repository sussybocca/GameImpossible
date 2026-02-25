import * as THREE from 'three';
import { ShaderManager } from './ShaderManager.js';

export class WaterEffect {
    constructor(scene) {
        this.scene = scene;
        this.shaderManager = new ShaderManager();
        this.mesh = null;
    }

    init() {
        this.shaderManager.init();
        const waterShader = this.shaderManager.getShader('water');
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.ShaderMaterial({
            vertexShader: waterShader.vertex,
            fragmentShader: waterShader.fragment,
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x2266aa) }
            },
            transparent: true,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.1;
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.mesh) {
            this.mesh.material.uniforms.time.value += deltaTime;
        }
    }
}
