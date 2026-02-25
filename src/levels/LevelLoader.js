import { LevelGenerator } from './LevelGenerator.js';
import { LevelData } from './LevelData.js';

export class LevelLoader {
    constructor(game) {
        this.game = game;
        this.generator = new LevelGenerator(game);
        this.currentLevel = null;
        this.levelIndex = 0;
    }

    async loadLevel(levelName, saveData = null) {
        if (this.currentLevel) {
            this.currentLevel.unload();
        }

        let level;
        if (levelName.startsWith('procedural')) {
            level = this.generator.generate(levelName, this.levelIndex);
        } else {
            level = LevelData[levelName];
        }

        if (!level) {
            console.error('Level not found');
            return;
        }

        this.currentLevel = level;
        this.game.currentLevel = level;
        await level.load(saveData);
    }

    loadNextLevel() {
        this.levelIndex++;
        this.loadLevel(`procedural_${this.levelIndex}`);
    }
}
