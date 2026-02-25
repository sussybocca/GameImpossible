import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class MovingPlatform {
    constructor(start, end, speed = 2, waitTime = 1) {
        this.start = start.clone();
        this.end = end.clone();
        this.speed = speed;
        this.waitTime = waitTime;
        this.direction = 1;
        this.progress = 0;
        this.waitTimer = 0;
        this.active = true;

        // Visual
        const geometry = new THREE.BoxGeometry(3, 0.3, 3);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0x222222 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.updatePosition();

        // Physics body (kinematic)
        const shape = new CANNON.Box(new CANNON.Vec3(1.5, 0.15, 1.5));
        this.body = new CANNON.Body({ mass: 0, material: window.game.physics.platformMaterial });
        this.body.addShape(shape);
        this.body.position.copy(this.mesh.position);
        this.body.type = CANNON.Body.KINEMATIC;
    }

    updatePosition() {
        const pos = new THREE.Vector3().lerpVectors(this.start, this.end, this.progress);
        this.mesh.position.copy(pos);
        this.body.position.copy(pos);
    }

    update(deltaTime) {
        if (!this.active) return;

        if (this.waitTimer > 0) {
            this.waitTimer -= deltaTime;
            return;
        }

        this.progress += this.direction * this.speed * deltaTime / this.start.distanceTo(this.end);
        if (this.progress >= 1) {
            this.progress = 1;
            this.direction = -1;
            this.waitTimer = this.waitTime;
        } else if (this.progress <= 0) {
            this.progress = 0;
            this.direction = 1;
            this.waitTimer = this.waitTime;
        }

        this.updatePosition();
    }
}
