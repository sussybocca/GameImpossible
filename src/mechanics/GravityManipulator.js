import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class GravityManipulator {
    constructor(player) {
        this.player = player;
        this.active = false;
        this.direction = new THREE.Vector3(0, -1, 0);
        this.strength = 9.82;
        this.energy = 100;
        this.maxEnergy = 100;
        this.drainRate = 20; // per second
    }

    activate(direction) {
        if (this.energy <= 0) return false;
        this.direction.copy(direction).normalize();
        this.active = true;
        return true;
    }

    deactivate() {
        this.active = false;
    }

    update(deltaTime) {
        if (this.active) {
            this.energy -= this.drainRate * deltaTime;
            if (this.energy <= 0) {
                this.energy = 0;
                this.active = false;
            }
            // Apply force to player body
            const force = new CANNON.Vec3(
                this.direction.x * this.strength * this.player.body.mass,
                this.direction.y * this.strength * this.player.body.mass,
                this.direction.z * this.strength * this.player.body.mass
            );
            this.player.body.applyForce(force, this.player.body.position);
        } else {
            this.energy = Math.min(this.energy + 10 * deltaTime, this.maxEnergy);
        }
    }
}
