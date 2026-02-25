import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Laser {
    constructor(game, start, direction, length = 20, color = 0xff0000, damage = 10) {
        this.game = game; // store game reference
        this.start = this._toVector3(start);
        this.direction = this._toVector3(direction).normalize();
        this.length = length;
        this.color = color;
        this.damage = damage;
        this.active = true;
        this.reflections = 3;

        this.segments = [];
        this.updateGeometry();
    }

    _toVector3(obj) {
        if (obj instanceof THREE.Vector3) return obj.clone();
        if (typeof obj === 'object' && obj.x !== undefined) return new THREE.Vector3(obj.x, obj.y, obj.z);
        if (Array.isArray(obj) && obj.length >= 3) return new THREE.Vector3(obj[0], obj[1], obj[2]);
        console.warn('Laser: invalid vector input', obj);
        return new THREE.Vector3(0, 0, 0);
    }

    updateGeometry() {
        // Remove old segments
        this.segments.forEach(s => s.parent?.remove(s));
        this.segments = [];

        let currentStart = this.start.clone();
        let currentDir = this.direction.clone();
        let remainingLength = this.length;
        let reflectCount = 0;

        while (remainingLength > 0 && reflectCount <= this.reflections) {
            const from = new CANNON.Vec3(currentStart.x, currentStart.y, currentStart.z);
            const to = new CANNON.Vec3(
                currentStart.x + currentDir.x * remainingLength,
                currentStart.y + currentDir.y * remainingLength,
                currentStart.z + currentDir.z * remainingLength
            );

            // Use game.physics for raycast
            const result = this.game.physics.raycast(from, to, { collisionFilterMask: 1 }); // walls only

            let end, hitNormal;
            if (result.hasHit) {
                end = new THREE.Vector3(result.hitPointWorld.x, result.hitPointWorld.y, result.hitPointWorld.z);
                hitNormal = new THREE.Vector3(result.hitNormalWorld.x, result.hitNormalWorld.y, result.hitNormalWorld.z);
                remainingLength -= result.distance;
            } else {
                end = currentStart.clone().add(currentDir.clone().multiplyScalar(remainingLength));
                remainingLength = 0;
            }

            const mid = new THREE.Vector3().addVectors(currentStart, end).multiplyScalar(0.5);
            const length = currentStart.distanceTo(end);
            if (length > 0.01) { // avoid zero-length segments
                const geometry = new THREE.CylinderGeometry(0.1, 0.1, length, 6);
                const material = new THREE.MeshStandardMaterial({ color: this.color, emissive: this.color });
                const cylinder = new THREE.Mesh(geometry, material);
                cylinder.position.copy(mid);
                cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentDir);
                this.segments.push(cylinder);
            }

            if (result.hasHit) {
                currentDir.reflect(hitNormal).normalize();
                currentStart = end.clone().add(currentDir.clone().multiplyScalar(0.01));
                reflectCount++;
            } else {
                break;
            }
        }
    }

    checkCollision(entity) {
        if (!this.active) return false;
        const entityPos = entity.position;
        const radius = entity.radius || 0.5;
        for (let seg of this.segments) {
            const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(seg.quaternion).normalize();
            const start = seg.position.clone().sub(dir.clone().multiplyScalar(seg.geometry.parameters.height / 2));
            const end = seg.position.clone().add(dir.clone().multiplyScalar(seg.geometry.parameters.height / 2));
            const toEntity = entityPos.clone().sub(start);
            const t = dir.dot(toEntity);
            if (t < 0 || t > seg.geometry.parameters.height) continue;
            const proj = start.clone().add(dir.clone().multiplyScalar(t));
            const dist = entityPos.distanceTo(proj);
            if (dist < radius + 0.2) return true;
        }
        return false;
    }

    update(deltaTime) {}
}
