import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class GravityField {
    constructor(position, radius, direction = new THREE.Vector3(0, -1, 0), strength = 9.82) {
        this.position = position.clone();
        this.radius = radius;
        this.direction = direction.clone().normalize();
        this.strength = strength;
        this.active = true;

        // Visual representation
        const geometry = new THREE.SphereGeometry(radius, 32, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffaa,
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
        const dir = new CANNON.Vec3(this.direction.x, this.direction.y, this.direction.z);
        const distSq = bodyPos.distanceTo(new CANNON.Vec3(this.position.x, this.position.y, this.position.z));
        if (distSq < this.radius * this.radius) {
            const force = dir.scale(this.strength * body.mass);
            body.applyForce(force, bodyPos);
        }
    }

    update(deltaTime) {
        // Optional: animate the field
    }
}
