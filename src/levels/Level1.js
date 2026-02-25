import { MazeWall } from '../entities/MazeWall.js';
import { Collectible } from '../entities/Collectible.js';
import { Enemy } from '../entities/Enemy.js';
import { Portal } from '../mechanics/Portal.js';
import { GravityField } from '../mechanics/GravityField.js';
import { MovingPlatform } from '../mechanics/MovingPlatform.js';
import { Laser } from '../mechanics/Laser.js';
import * as THREE from 'three';

export class Level1 {
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
        this.name = 'level1';
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

        // Generate a simple maze grid (20x20)
        const size = 20;
        const cellSize = 3;
        const maze = this.generateMaze(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (maze[y][x] === 1) {
                    const pos = new THREE.Vector3(
                        (x - size/2) * cellSize + cellSize/2,
                        2,
                        (y - size/2) * cellSize + cellSize/2
                    );
                    const wall = new MazeWall(this.game, pos, new THREE.Vector3(cellSize, 4, cellSize), wallMaterial);
                    this.walls.push(wall);
                }
            }
        }

        // Floor
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: this.assets.textures.floorDiffuse,
            normalMap: this.assets.textures.floorNormal,
            roughness: 0.6
        });
        const floor = new MazeWall(this.game, new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(size * cellSize, 0.2, size * cellSize), floorMaterial);
        this.walls.push(floor);

        // Collectibles
        for (let i = 0; i < 5; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
            } while (maze[y][x] !== 0);
            const pos = new THREE.Vector3(
                (x - size/2) * cellSize + cellSize/2,
                1.5,
                (y - size/2) * cellSize + cellSize/2
            );
            const collectible = new Collectible(this.game, pos);
            this.collectibles.push(collectible);
        }

        // Enemies
        for (let i = 0; i < 2; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
            } while (maze[y][x] !== 0);
            const pos = new THREE.Vector3(
                (x - size/2) * cellSize + cellSize/2,
                1,
                (y - size/2) * cellSize + cellSize/2
            );
            const enemy = new Enemy(this.game, pos, 'grunt');
            this.enemies.push(enemy);
        }

        // Portal pair
        const portal1 = new Portal(new THREE.Vector3(-10, 2, -10), null, 0x00aaff);
        const portal2 = new Portal(new THREE.Vector3(10, 2, 10), portal1, 0xffaa00);
        portal1.target = portal2;
        this.portals.push(portal1, portal2);
        this.scene.add(portal1.mesh);
        this.scene.add(portal2.mesh);
        this.physics.addBody(portal1.body);
        this.physics.addBody(portal2.body);
        this.mechanics.push(portal1, portal2);

        // Moving platform
        const platform = new MovingPlatform(
            new THREE.Vector3(-5, 2, 0),
            new THREE.Vector3(5, 2, 0),
            1.5, 2
        );
        this.movingPlatforms.push(platform);
        this.scene.add(platform.mesh);
        this.physics.addBody(platform.body);
        this.mechanics.push(platform);

        // Laser
        const laser = new Laser(new THREE.Vector3(0, 3, -15), new THREE.Vector3(0, 0, 1), 20, 0xff0000, 15);
        laser.segments.forEach(s => this.scene.add(s));
        this.lasers.push(laser);
        this.mechanics.push(laser);

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
            console.log('Level 1 completed!');
        }
    }

    generateMaze(width, height) {
        const maze = Array(height).fill().map(() => Array(width).fill(1));
        const stack = [];
        const start = { x: 1, y: 1 };
        maze[start.y][start.x] = 0;
        stack.push(start);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];

            const dirs = [
                { dx: 2, dy: 0 },
                { dx: -2, dy: 0 },
                { dx: 0, dy: 2 },
                { dx: 0, dy: -2 }
            ];

            for (let d of dirs) {
                const nx = current.x + d.dx;
                const ny = current.y + d.dy;
                if (nx > 0 && nx < width-1 && ny > 0 && ny < height-1 && maze[ny][nx] === 1) {
                    neighbors.push({ x: nx, y: ny, dir: d });
                }
            }

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[current.y + next.dir.dy/2][current.x + next.dir.dx/2] = 0;
                maze[next.y][next.x] = 0;
                stack.push({ x: next.x, y: next.y });
            } else {
                stack.pop();
            }
        }
        return maze;
    }
}
