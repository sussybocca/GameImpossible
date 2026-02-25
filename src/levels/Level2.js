import { MazeWall } from '../entities/MazeWall.js';
import { Collectible } from '../entities/Collectible.js';
import { Enemy } from '../entities/Enemy.js';
import { Portal } from '../mechanics/Portal.js';
import { GravityField } from '../mechanics/GravityField.js';
import { MovingPlatform } from '../mechanics/MovingPlatform.js';
import { Laser } from '../mechanics/Laser.js';
import * as THREE from 'three';

export class Level2 {
    constructor(game) {
        this.game = game;
        this.scene = game.sceneManager.scene;
        this.physics = game.physics;
        this.assets = game.assets;

        this.walls = [];
        this.collectibles = [];
        this.enemies = [];
        this.portals = [];
        this.gravityFields = [];
        this.movingPlatforms = [];
        this.lasers = [];
        this.mechanics = [];
        this.objectivesCompleted = false;
        this.name = 'level2';
    }

    async load(saveData = null) {
        // Wall material
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: this.assets.textures.wallDiffuse,
            normalMap: this.assets.textures.wallNormal,
            roughnessMap: this.assets.textures.wallRoughness,
            roughness: 0.8,
            metalness: 0.1
        });

        // Create a more complex maze layout (manual for level2)
        // Outer walls
        const wallSize = 2;
        for (let x = -15; x <= 15; x += wallSize) {
            for (let z = -15; z <= 15; z += wallSize) {
                if (Math.abs(x) === 15 || Math.abs(z) === 15) {
                    const wall = new MazeWall(this.game, new THREE.Vector3(x, 2, z), new THREE.Vector3(wallSize, 4, wallSize), wallMaterial);
                    this.walls.push(wall);
                }
            }
        }

        // Inner maze walls
        const innerPositions = [
            [-5, -5], [5, -5], [-5, 5], [5, 5],
            [-10, 0], [10, 0], [0, -10], [0, 10],
            [-2, -2], [2, -2], [-2, 2], [2, 2]
        ];
        innerPositions.forEach(([x, z]) => {
            const wall = new MazeWall(this.game, new THREE.Vector3(x, 2, z), new THREE.Vector3(wallSize, 4, wallSize), wallMaterial);
            this.walls.push(wall);
        });

        // Floor
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: this.assets.textures.floorDiffuse,
            normalMap: this.assets.textures.floorNormal,
            roughness: 0.6
        });
        const floor = new MazeWall(this.game, new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(32, 0.2, 32), floorMaterial);
        this.walls.push(floor);

        // Collectibles
        for (let i = 0; i < 8; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                1.5,
                (Math.random() - 0.5) * 20
            );
            const collectible = new Collectible(this.game, pos);
            this.collectibles.push(collectible);
        }

        // Enemies
        const enemyPositions = [[-8, -8], [8, 8], [-8, 8], [8, -8]];
        enemyPositions.forEach(([x, z]) => {
            const enemy = new Enemy(this.game, new THREE.Vector3(x, 1, z), 'grunt');
            this.enemies.push(enemy);
        });

        // Portals (linked pair)
        const portal1 = new Portal(new THREE.Vector3(-10, 2, -10), null, 0x00aaff);
        const portal2 = new Portal(new THREE.Vector3(10, 2, 10), portal1, 0xffaa00);
        portal1.target = portal2;
        this.portals.push(portal1, portal2);
        this.scene.add(portal1.mesh);
        this.scene.add(portal2.mesh);
        this.physics.addBody(portal1.body);
        this.physics.addBody(portal2.body);
        this.mechanics.push(portal1, portal2);

        // Moving platforms
        const platform1 = new MovingPlatform(
            new THREE.Vector3(-5, 2, -5),
            new THREE.Vector3(5, 2, -5),
            2, 1
        );
        const platform2 = new MovingPlatform(
            new THREE.Vector3(0, 2, 0),
            new THREE.Vector3(0, 6, 0),
            1.5, 2
        );
        this.movingPlatforms.push(platform1, platform2);
        this.scene.add(platform1.mesh);
        this.scene.add(platform2.mesh);
        this.physics.addBody(platform1.body);
        this.physics.addBody(platform2.body);
        this.mechanics.push(platform1, platform2);

        // Lasers
        const laser1 = new Laser(new THREE.Vector3(0, 3, -14), new THREE.Vector3(0, 0, 1), 20, 0xff0000, 15);
        laser1.segments.forEach(s => this.scene.add(s));
        this.lasers.push(laser1);
        this.mechanics.push(laser1);

        // Gravity field
        const gravityField = new GravityField(new THREE.Vector3(0, 5, 0), 6, new THREE.Vector3(0, 1, 0), 5);
        this.gravityFields.push(gravityField);
        this.scene.add(gravityField.mesh);
        this.mechanics.push(gravityField);
    }

    unload() {
        [...this.walls, ...this.collectibles, ...this.enemies, ...this.portals, ...this.movingPlatforms, ...this.gravityFields].forEach(e => {
            if (e.mesh) this.scene.remove(e.mesh);
            if (e.body) this.physics.removeBody(e.body);
        });
        this.lasers.forEach(l => l.segments.forEach(s => this.scene.remove(s)));
    }

    update(deltaTime) {
        this.collectibles = this.collectibles.filter(c => !c.collected);
        this.collectibles.forEach(c => c.update(deltaTime));

        this.lasers.forEach(l => {
            if (l.checkCollision(this.game.player)) {
                this.game.player.takeDamage(l.damage);
            }
        });

        this.portals.forEach(p => {
            const dist = this.game.player.body.position.distanceTo(p.body.position);
            if (dist < 2) {
                p.teleport(this.game.player);
            }
        });

        if (this.collectibles.length === 0 && !this.objectivesCompleted) {
            this.objectivesCompleted = true;
            // Could spawn exit portal
        }
    }
}
