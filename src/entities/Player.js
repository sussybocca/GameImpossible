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
        
        // Smoothing
        this.acceleration = 15;
        this.deceleration = 20;
        this.velocity = new THREE.Vector3();

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

        const shape = new CANNON.Cylinder(this.radius, this.radius, this.height, 8);
        this.body = new CANNON.Body({ mass: 70, material: this.physics.playerMaterial });
        this.body.addShape(shape);
        this.body.position.set(0, 2, 0);
        this.body.linearDamping = 0.9; // High damping for smooth stops
        this.body.fixedRotation = true;
        this.physics.addBody(this.body);

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
        // Get input direction
        const move = new THREE.Vector3();
        if (this.input.isKeyPressed('KeyW')) move.z -= 1;
        if (this.input.isKeyPressed('KeyS')) move.z += 1;
        if (this.input.isKeyPressed('KeyA')) move.x -= 1;
        if (this.input.isKeyPressed('KeyD')) move.x += 1;

        const isMoving = move.lengthSq() > 0;
        const targetSpeed = this.input.isKeyPressed('ShiftLeft') ? this.runSpeed : this.walkSpeed;

        // Camera-relative direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        right.y = 0;
        right.normalize();

        let targetVel = new THREE.Vector3();
        if (isMoving) {
            move.normalize();
            targetVel = new THREE.Vector3()
                .addScaledVector(right, move.x)
                .addScaledVector(forward, move.z)
                .normalize()
                .multiplyScalar(targetSpeed);
        }

        // Smooth acceleration / deceleration
        const currentVel = this.body.velocity;
        const currentHoriz = new THREE.Vector3(currentVel.x, 0, currentVel.z);
        const targetHoriz = targetVel.clone().setY(0);

        if (isMoving) {
            // Accelerate towards target
            const newHoriz = currentHoriz.lerp(targetHoriz, this.acceleration * deltaTime);
            currentVel.x = newHoriz.x;
            currentVel.z = newHoriz.z;
        } else {
            // Decelerate
            const newHoriz = currentHoriz.lerp(new THREE.Vector3(0,0,0), this.deceleration * deltaTime);
            currentVel.x = newHoriz.x;
            currentVel.z = newHoriz.z;
        }

        // Mouse look
        const mouseDelta = this.input.getMouseDelta();
        if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
            this.body.quaternion.y += mouseDelta.x * 0.002;
            this.camera.rotation.x -= mouseDelta.y * 0.002;
            this.camera.rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, this.camera.rotation.x));
        }

        // Sync mesh
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Camera follow
        this.camera.position.copy(this.body.position).add(this.cameraOffset);

        // Wall running
        this.checkWallRun();

        // Footsteps
        if (isMoving && this.isOnGround()) {
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

        this.timeControl.update(deltaTime);

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
            const jumpDir = this.wallNormal.clone().add(new THREE.Vector3(0, 1, 0)).normalize();
            this.body.velocity.set(jumpDir.x * 5, 5, jumpDir.z * 5);
            this.wallrunTimer = 0;
            this.canWallrun = false;
            this.wallrunCooldown = 2;
        }
    }

    checkWallRun() {
        if (!this.canWallrun || this.wallrunCooldown > 0 || this.isOnGround()) return;

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
            this.body.velocity.y = 0;
        } else {
            this.wallrunTimer = 0;
        }
    }

    interact() {
        if (this.nearInteractable) this.nearInteractable.onInteract(this);
    }

    toggleGravityManip() {
        if (this.gravityManip.active) {
            this.gravityManip.deactivate();
        } else {
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            this.gravityManip.activate(dir);
        }
    }

    startSprint() {}
    stopSprint() {}
    toggleCrouch() {}

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) this.game.gameOver();
    }
}
