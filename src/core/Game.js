import { Engine } from './Engine.js';
import { SceneManager } from './SceneManager.js';
import { PhysicsWorld } from './PhysicsWorld.js';
import { InputHandler } from './InputHandler.js';
import { AssetGenerator } from './AssetGenerator.js';
import { UIManager } from './UIManager.js';
import { SaveSystem } from './SaveSystem.js';
import { LevelLoader } from '../levels/LevelLoader.js';
import { Player } from '../entities/Player.js';

export class Game {
    constructor() {
        this.engine = new Engine();
        this.sceneManager = new SceneManager();
        this.physics = new PhysicsWorld();
        this.input = new InputHandler();
        this.assets = new AssetGenerator();
        this.ui = new UIManager();
        this.saveSystem = new SaveSystem(this);
        this.levelLoader = new LevelLoader(this);
        
        this.player = null;
        this.currentLevel = null;
        this.isRunning = false;
        this.isPaused = false;
        this.difficulty = 'normal';
    }

    async start() {
        // Initialize core systems
        await this.assets.init();
        this.sceneManager.init(this.assets);
        this.physics.init();
        this.input.init();
        this.ui.init();
        this.saveSystem.init();

        // Create player
        this.player = new Player(this);
        this.player.init();

        // Load first level (procedurally generated)
        await this.levelLoader.loadLevel('procedural_1');

        // Start engine loop
        this.isRunning = true;
        this.engine.start(this.update.bind(this));

        // Setup pause/resume
        this.input.registerAction('Escape', () => this.togglePause());
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        // Apply time dilation from player ability
        const timeScale = this.player?.timeControl?.scale || 1.0;
        this.physics.step(deltaTime * timeScale);

        // Update entities
        this.player.update(deltaTime);
        this.currentLevel?.update(deltaTime);

        // Update mechanics
        this.currentLevel?.mechanics?.forEach(m => m.update(deltaTime));

        // Update AI
        this.currentLevel?.enemies?.forEach(e => e.update(deltaTime));

        // Update graphics (post-processing, particles)
        this.sceneManager.update(deltaTime);
        
        // Update UI
        this.ui.update(this.player, this.physics);

        // Check game state
        this.checkGameState();

        // Count frame for FPS
        this.ui.countFrame();
    }

    checkGameState() {
        if (this.currentLevel?.objectivesCompleted) {
            this.levelLoader.loadNextLevel();
        }
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('menu').style.display = this.isPaused ? 'flex' : 'none';
        if (!this.isPaused) {
            // Resume
        }
    }

    gameOver() {
        this.isRunning = false;
        alert('Game Over! Press F5 to restart.');
    }
}
