import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class ForceField {
    constructor(position, radius, strength = 10, pushDirection = new THREE.Vector3(1,0,0)) {
        this.position = position.clone();
        this.radius = radius;
        this.strength = strength;
        this.pushDirection = pushDirection.clone().normalize();
        this.active = true;

        // Visual: semi-transparent sphere with wireframe
        const geometry = new THREE.SphereGeometry(radius, 32, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
    }

    applyToBody(body) {
        if (!this.active) return;
        const bodyPos = body.position;
        const dir = new CANNON.Vec3(this.pushDirection.x, this.pushDirection.y, this.pushDirection.z);
        const distSq = bodyPos.distanceTo(new CANNON.Vec3(this.position.x, this.position.y, this.position.z));
        if (distSq < this.radius * this.radius) {
            const force = dir.scale(this.strength * body.mass);
            body.applyForce(force, bodyPos);
        }
    }

    update(deltaTime) {}
}
