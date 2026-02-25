import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Portal {
    constructor(position, targetPortal, color = 0x00aaff) {
        this.position = position.clone();
        this.target = targetPortal;
        this.color = color;
        this.active = true;
        this.cooldown = 0; // per-entity cooldown to prevent infinite loops

        // Visual
        const group = new THREE.Group();
        const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 24, 64);
        const ringMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const innerRingGeo = new THREE.TorusGeometry(0.9, 0.1, 20, 48);
        const innerRingMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.rotation.z = 0.5;
        group.add(innerRing);

        this.mesh = group;
        this.mesh.position.copy(position);

        // Physics trigger as a sensor body
        const shape = new CANNON.Sphere(1.5);
        this.body = new CANNON.Body({ mass: 0, collisionFilterGroup: 2, collisionFilterMask: 1 }); // trigger
        this.body.addShape(shape);
        this.body.position.copy(position);
        this.body.type = CANNON.Body.KINEMATIC;
    }

    teleport(entity) {
        if (!this.active || !this.target) return false;
        // Check cooldown for this entity (store last teleport time)
        const now = performance.now();
        if (entity.lastPortalUse && now - entity.lastPortalUse < 500) return false; // 500ms cooldown
        entity.lastPortalUse = now;

        // Move entity to target position with offset to avoid sticking
        const offset = entity.position.clone().sub(this.position);
        const newPos = this.target.position.clone().add(offset);
        entity.position.copy(newPos);
        if (entity.body) {
            entity.body.position.copy(newPos);
            // Preserve velocity direction relative to portal orientation? For now, just copy.
        }
        // Play sound
        if (entity.game) entity.game.assets.playSound('portal', 0.7);
        return true;
    }

    update(deltaTime) {
        // Rotate rings
        if (this.mesh.children[0]) this.mesh.children[0].rotation.y += deltaTime * 0.5;
        if (this.mesh.children[1]) this.mesh.children[1].rotation.y -= deltaTime * 0.8;
    }
}
