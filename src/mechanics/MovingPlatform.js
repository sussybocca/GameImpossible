import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class MovingPlatform {
    constructor(game, start, end, speed = 2, waitTime = 1) {
        this.game = game;

        // Safely convert start and end to THREE.Vector3
        this.start = this._toVector3(start);
        this.end = this._toVector3(end);

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

        // Physics body (kinematic)
        const shape = new CANNON.Box(new CANNON.Vec3(1.5, 0.15, 1.5));
        // Ensure physics material exists, fallback to default if not
        const physMaterial = game.physics?.platformMaterial || game.physics?.world?.defaultMaterial;
        this.body = new CANNON.Body({ mass: 0, material: physMaterial });
        this.body.addShape(shape);
        this.body.type = CANNON.Body.KINEMATIC;

        this.updatePosition();
    }

    // Helper to convert any input to THREE.Vector3
    _toVector3(obj) {
        if (obj instanceof THREE.Vector3) {
            return obj.clone();
        }
        if (typeof obj === 'object' && obj.x !== undefined && obj.y !== undefined && obj.z !== undefined) {
            return new THREE.Vector3(obj.x, obj.y, obj.z);
        }
        if (Array.isArray(obj) && obj.length >= 3) {
            return new THREE.Vector3(obj[0], obj[1], obj[2]);
        }
        console.warn('MovingPlatform: Invalid start/end, using zero vector', obj);
        return new THREE.Vector3(0, 0, 0);
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

        const distance = this.start.distanceTo(this.end);
        if (distance === 0) return; // Prevent division by zero

        this.progress += this.direction * this.speed * deltaTime / distance;
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
