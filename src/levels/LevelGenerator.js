import * as THREE from 'three';
import { MazeWall } from '../entities/MazeWall.js';
import { Collectible } from '../entities/Collectible.js';
import { Enemy } from '../entities/Enemy.js';
import { Portal } from '../mechanics/Portal.js';
import { GravityField } from '../mechanics/GravityField.js';
import { MovingPlatform } from '../mechanics/MovingPlatform.js';
import { Laser } from '../mechanics/Laser.js';
import { ForceField } from '../mechanics/ForceField.js';

export class LevelGenerator {
    constructor(game) {
        this.game = game;
        this.scene = game.sceneManager.scene;
        this.physics = game.physics;
        this.assets = game.assets;
    }

    generate(name, seed) {
        // Use seed for deterministic generation
        const rand = this.seededRandom(seed);

        const level = {
            name,
            walls: [],
            collectibles: [],
            enemies: [],
            portals: [],
            gravityFields: [],
            movingPlatforms: [],
            lasers: [],
            forceFields: [],
            mechanics: [],
            objectives: [],
            objectivesCompleted: false,
            load: async (saveData) => this.load(level, saveData),
            unload: () => this.unload(level),
            update: (deltaTime) => this.update(level, deltaTime)
        };

        return level;
    }

    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    load(level, saveData) {
        // Generate maze using recursive backtracking
        const size = 20; // 20x20 grid
        const cellSize = 4;
        const maze = this.generateMaze(size, size);

        // Create walls
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: this.assets.textures.wallDiffuse,
            normalMap: this.assets.textures.wallNormal,
            roughnessMap: this.assets.textures.wallRoughness,
            roughness: 0.8,
            metalness: 0.1
        });

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (maze[y][x] === 1) { // wall
                    const pos = new THREE.Vector3(
                        (x - size/2) * cellSize + cellSize/2,
                        2,
                        (y - size/2) * cellSize + cellSize/2
                    );
                    const wall = new MazeWall(this.game, pos, new THREE.Vector3(cellSize, 4, cellSize), wallMaterial);
                    level.walls.push(wall);
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
        level.walls.push(floor);

        // Add collectibles in empty cells
        for (let i = 0; i < 10; i++) {
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
            level.collectibles.push(collectible);
        }

        // Add enemies
        for (let i = 0; i < 3; i++) {
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
            level.enemies.push(enemy);
        }

        // Add a portal pair
        const portalPos1 = new THREE.Vector3(-10, 2, -10);
        const portalPos2 = new THREE.Vector3(10, 2, 10);
        const portal1 = new Portal(portalPos1, null, 0x00aaff);
        const portal2 = new Portal(portalPos2, portal1, 0xffaa00);
        portal1.target = portal2;
        level.portals.push(portal1, portal2);
        this.scene.add(portal1.mesh);
        this.scene.add(portal2.mesh);
        this.physics.addBody(portal1.body);
        this.physics.addBody(portal2.body);
        level.mechanics.push(portal1, portal2);

       // Moving platform
const platform = new MovingPlatform(
    this.game,
    new THREE.Vector3(-5, 2, 0),
    new THREE.Vector3(5, 2, 0),
    1.5, 2
);
        level.movingPlatforms.push(platform);
        this.scene.add(platform.mesh);
        this.physics.addBody(platform.body);
        level.mechanics.push(platform);

        /// Laser
const laser = new Laser(
    this.game,
    new THREE.Vector3(0, 3, -15),
    new THREE.Vector3(0, 0, 1),
    20, 0xff0000, 15
);
        laser.segments.forEach(s => this.scene.add(s));
        level.lasers.push(laser);
        level.mechanics.push(laser);

        // Add a gravity field
        const gravityField = new GravityField(new THREE.Vector3(0, 5, 0), 8, new THREE.Vector3(1, 0.5, 0), 8);
        level.gravityFields.push(gravityField);
        this.scene.add(gravityField.mesh);
        level.mechanics.push(gravityField);

        // Add a force field
        const forceField = new ForceField(new THREE.Vector3(0, 3, 0), 5, 15, new THREE.Vector3(0, 1, 0));
        level.forceFields.push(forceField);
        this.scene.add(forceField.mesh);
        level.mechanics.push(forceField);
    }

    unload(level) {
        level.walls.forEach(w => {
            this.scene.remove(w.mesh);
            this.physics.removeBody(w.body);
        });
        level.collectibles.forEach(c => this.scene.remove(c.mesh));
        level.enemies.forEach(e => {
            this.scene.remove(e.mesh);
            this.physics.removeBody(e.body);
        });
        level.portals.forEach(p => {
            this.scene.remove(p.mesh);
            this.physics.removeBody(p.body);
        });
        level.movingPlatforms.forEach(p => {
            this.scene.remove(p.mesh);
            this.physics.removeBody(p.body);
        });
        level.lasers.forEach(l => l.segments.forEach(s => this.scene.remove(s)));
        level.gravityFields.forEach(g => this.scene.remove(g.mesh));
        level.forceFields.forEach(f => this.scene.remove(f.mesh));
    }

    update(level, deltaTime) {
        // Update collectibles (check if collected)
        level.collectibles = level.collectibles.filter(c => !c.collected);
        level.collectibles.forEach(c => c.update(deltaTime));

        // Check lasers
        level.lasers.forEach(l => {
            if (l.checkCollision(this.game.player)) {
                this.game.player.takeDamage(l.damage);
            }
        });

        // Check portals for teleport
        level.portals.forEach(p => {
            const dist = this.game.player.body.position.distanceTo(p.body.position);
            if (dist < 1.8) {
                p.teleport(this.game.player);
            }
        });

        // Check if all collectibles collected -> complete objective
        if (level.collectibles.length === 0 && !level.objectivesCompleted) {
            level.objectivesCompleted = true;
            // Could spawn exit portal etc.
        }
    }

    generateMaze(width, height) {
        // Initialize grid with walls (1)
        const maze = Array(height).fill().map(() => Array(width).fill(1));

        // Recursive backtracking
        const stack = [];
        const start = { x: 1, y: 1 };
        maze[start.y][start.x] = 0;
        stack.push(start);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];

            // Check two cells away in each direction
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
                // Remove wall between
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
