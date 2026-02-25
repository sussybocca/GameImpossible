import * as THREE from 'three';

export class Collectible {
    constructor(game, position) {
        this.game = game;
        this.scene = game.sceneManager.scene;
        this.collected = false;

        // Visual: glowing sphere with rotating rings
        const group = new THREE.Group();
        const coreGeo = new THREE.SphereGeometry(0.4, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;
        group.add(core);

        const ringGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = 0.3;
        group.add(ring);

        const ring2 = ring.clone();
        ring2.rotation.x = Math.PI / 2;
        ring2.rotation.z = -0.3;
        group.add(ring2);

        this.mesh = group;
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        this.position = position.clone();
    }

    update(deltaTime) {
        if (this.collected) return;

        // Rotate and bob
        this.mesh.rotation.y += deltaTime;
        this.mesh.position.y = this.position.y + Math.sin(performance.now() * 0.005) * 0.1;

        // Check collision with player
        const playerPos = this.game.player.body.position;
        const dist = playerPos.distanceTo(this.position);
        if (dist < 1.2) {
            this.collect();
        }
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        this.scene.remove(this.mesh);
        this.game.assets.playSound('portal', 0.3);
        // Add to player inventory
        this.game.player.inventory.push('collectible');
    }
}
