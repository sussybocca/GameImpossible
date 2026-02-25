import * as CANNON from 'cannon-es';
import { CollisionGroups } from '../physics/CollisionGroups.js';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.restitution = 0.2;
        this.world.defaultContactMaterial.friction = 0.5;
        this.world.allowSleep = true;

        this.groups = CollisionGroups;

        // Materials
        this.playerMaterial = new CANNON.Material('playerMaterial');
        this.wallMaterial = new CANNON.Material('wallMaterial');
        this.enemyMaterial = new CANNON.Material('enemyMaterial');
        this.platformMaterial = new CANNON.Material('platformMaterial');

        // Contact materials
        const playerWall = new CANNON.ContactMaterial(this.playerMaterial, this.wallMaterial, {
            friction: 0.3,
            restitution: 0.1,
            contactEquationStiffness: 1e6
        });
        const playerEnemy = new CANNON.ContactMaterial(this.playerMaterial, this.enemyMaterial, {
            friction: 0.5,
            restitution: 0.3,
            contactEquationStiffness: 1e7
        });
        const playerPlatform = new CANNON.ContactMaterial(this.playerMaterial, this.platformMaterial, {
            friction: 0.8,
            restitution: 0.1
        });
        this.world.addContactMaterial(playerWall);
        this.world.addContactMaterial(playerEnemy);
        this.world.addContactMaterial(playerPlatform);
    }

    init() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0, material: this.wallMaterial });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.y = 0;
        this.world.addBody(groundBody);
    }

    step(deltaTime) {
        this.world.step(1 / 60, deltaTime, 3);
    }

    addBody(body) {
        this.world.addBody(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
    }

    raycast(from, to, options = {}) {
        const result = new CANNON.RaycastResult();
        // Use raycastClosest instead of raycast
        this.world.raycastClosest(from, to, options, result);
        return result;
    }

    raycastAll(from, to, options = {}) {
        const results = [];
        this.world.raycastAll(from, to, options, (result) => results.push(result));
        return results;
    }
}
