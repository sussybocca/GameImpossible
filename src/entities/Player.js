import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TimeDilation } from '../mechanics/TimeDilation.js';
import { GravityManipulator } from '../mechanics/GravityManipulator.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.scene = game.sceneManager.scene;
        this.physics = game.physics;
        this.input = game.input;
        this.assets = game.assets;

        this.mesh = null;
        this.body = null;
        this.camera = game.sceneManager.camera;

        // Movement parameters
        this.walkSpeed = 5;
        this.runSpeed = 8;
        this.jumpForce = 6;
        this.radius = 0.5;
        this.height = 2;
        this.airControl = 0.3;
        this.gravity = 9.82;

        // Wall running
        this.canWallrun = true;
        this.wallrunCooldown = 0;
        this.wallrunDuration = 2;
        this.wallrunTimer = 0;
        this.wallNormal = new THREE.Vector3();

        // Abilities
        this.timeControl = new TimeDilation(this);
        this.gravityManip = new GravityManipulator(this);
        this.customGravity = null;

        // State
        this.health = 100;
        this.inventory = [];
        this.nearInteractable = null;
        this.interactDistance = 3;

        // Sound
        this.footstepTimer = 0;
        this.footstepInterval = 0.4;
    }

    init() {
        this.mesh = this.assets.models.player.clone();
        this.scene.add(this.mesh);

        // Physics body (capsule approximated by cylinder)
        const shape = new CANNON.Cylinder(this.radius, this.radius, this.height, 8);
        this.body = new CANNON.Body({ mass: 70, material: this.physics.playerMaterial });
        this.body.addShape(shape);
        this.body.position.set(0, 2, 0);
        this.body.linearDamping = 0.8;
        this.body.fixedRotation = true;
        this.physics.addBody(this.body);

        // Camera offset
        this.cameraOffset = new THREE.Vector3(0, 1.6, 0);

        // Input bindings
        this.input.registerAction('Space', () => this.jump());
        this.input.registerAction('KeyE', () => this.interact());
        this.input.registerAction('KeyQ', () => this.toggleGravityManip());
        this.input.registerAction('KeyF', () => this.timeControl.activate(true));
        this.input.registerAction('ShiftLeft', () => this.startSprint(), true);
        this.input.registerAction('ShiftLeft', () => this.stopSprint(), false);
        this.input.registerAction('KeyC', () => this.toggleCrouch());
    }

    update(deltaTime) {
        // Handle movement
        const move = new THREE.Vector3();
        if (this.input.isKeyPressed('KeyW')) move.z -= 1;
        if (this.input.isKeyPressed('KeyS')) move.z += 1;
        if (this.input.isKeyPressed('KeyA')) move.x -= 1;
        if (this.input.isKeyPressed('KeyD')) move.x += 1;

        // Sprint
        const speed = this.input.isKeyPressed('ShiftLeft') ? this.runSpeed : this.walkSpeed;

        if (move.lengthSq() > 0) {
            move.normalize();
            // Camera-relative movement
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();
            right.y = 0;
            right.normalize();

            const moveWorld = new THREE.Vector3()
                .addScaledVector(right, move.x)
                .addScaledVector(forward, move.z);
            moveWorld.normalize();

            // Apply velocity
            const vel = this.body.velocity;
            const targetVelX = moveWorld.x * speed;
            const targetVelZ = moveWorld.z * speed;
            vel.x = targetVelX;
            vel.z = targetVelZ;
        } else {
            // Dampen
            this.body.velocity.x *= 0.9;
            this.body.velocity.z *= 0.9;
        }

        // Mouse look
        const mouseDelta = this.input.getMouseDelta();
        if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
            // Yaw (rotate body)
            this.body.quaternion.y += mouseDelta.x * 0.002;
            // Pitch (camera)
            this.camera.rotation.x -= mouseDelta.y * 0.002;
            this.camera.rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, this.camera.rotation.x));
        }

        // Sync mesh
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Camera follow
        this.camera.position.copy(this.body.position).add(this.cameraOffset);

        // Wall running check
        this.checkWallRun();

        // Footsteps
        if (move.lengthSq() > 0 && this.isOnGround()) {
            this.footstepTimer -= deltaTime;
            if (this.footstepTimer <= 0) {
                this.assets.playSound('step', 0.3);
                this.footstepTimer = this.footstepInterval;
            }
        } else {
            this.footstepTimer = 0;
        }

        // Apply custom gravity or manipulator
        if (this.gravityManip.active) {
            this.gravityManip.update(deltaTime);
        } else if (this.game.currentLevel?.gravityFields) {
            this.game.currentLevel.gravityFields.forEach(f => f.applyToBody(this.body));
        }

        // Time control update
        this.timeControl.update(deltaTime);

        // Wallrun cooldown
        if (this.wallrunCooldown > 0) this.wallrunCooldown -= deltaTime;
    }

    isOnGround() {
        const from = this.body.position;
        const to = new CANNON.Vec3(from.x, from.y - this.height/2 - 0.2, from.z);
        const result = this.physics.raycast(from, to, { collisionFilterMask: 1 });
        return result.hasHit;
    }

    jump() {
        if (this.isOnGround()) {
            this.body.velocity.y = this.jumpForce;
        } else if (this.canWallrun && this.wallrunTimer > 0) {
            // Wall jump
            const jumpDir = this.wallNormal.clone().add(new THREE.Vector3(0, 1, 0)).normalize();
            this.body.velocity.set(jumpDir.x * 5, 5, jumpDir.z * 5);
            this.wallrunTimer = 0;
            this.canWallrun = false;
            this.wallrunCooldown = 2;
        }
    }

    checkWallRun() {
        if (!this.canWallrun || this.wallrunCooldown > 0 || this.isOnGround()) return;

        // Raycast left and right for walls
        const pos = this.body.position;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.body.quaternion);
        const left = right.clone().negate();

        const checkDir = (dir) => {
            const from = new CANNON.Vec3(pos.x, pos.y, pos.z);
            const to = new CANNON.Vec3(pos.x + dir.x * 1.2, pos.y, pos.z + dir.z * 1.2);
            const result = this.physics.raycast(from, to, { collisionFilterMask: 1 });
            if (result.hasHit && result.distance < 1.2) {
                this.wallNormal.set(result.hitNormalWorld.x, result.hitNormalWorld.y, result.hitNormalWorld.z);
                this.wallrunTimer = this.wallrunDuration;
                return true;
            }
            return false;
        };

        if (checkDir(right) || checkDir(left)) {
            // Cancel gravity while wallrunning
            this.body.velocity.y = 0; // or a slight downward force?
        } else {
            this.wallrunTimer = 0;
        }
    }

    interact() {
        if (this.nearInteractable) {
            this.nearInteractable.onInteract(this);
        }
    }

    toggleGravityManip() {
        if (this.gravityManip.active) {
            this.gravityManip.deactivate();
        } else {
            // Set direction based on camera look
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            this.gravityManip.activate(dir);
        }
    }

    startSprint() {
        // Could play sound or animate
    }

    stopSprint() {}

    toggleCrouch() {
        // Not implemented
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.game.gameOver();
        }
    }
}
