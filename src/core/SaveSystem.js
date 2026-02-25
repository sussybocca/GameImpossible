export class SaveSystem {
    constructor(game) {
        this.game = game;
        this.saveKey = 'gameImpossibleSave';
    }

    init() {
        // Auto-save every 60 seconds
        setInterval(() => this.save(), 60000);
    }

    save() {
        const saveData = {
            player: {
                position: this.game.player.body.position,
                health: this.game.player.health,
                inventory: this.game.player.inventory,
                abilities: {
                    timeControl: this.game.player.timeControl.scale,
                    gravity: this.game.player.customGravity
                }
            },
            level: {
                name: this.game.currentLevel.name,
                objectives: this.game.currentLevel.objectives,
                collectibles: this.game.currentLevel.collectibles.filter(c => !c.collected).map(c => c.position)
            },
            timestamp: Date.now()
        };
        localStorage.setItem(this.saveKey, JSON.stringify(saveData));
        console.log('Game saved');
    }

    load() {
        const data = localStorage.getItem(this.saveKey);
        if (!data) return;
        try {
            const saveData = JSON.parse(data);
            // Restore player
            const p = this.game.player;
            p.body.position.copy(saveData.player.position);
            p.health = saveData.player.health;
            p.inventory = saveData.player.inventory;
            // Restore level (need to reload)
            this.game.levelLoader.loadLevel(saveData.level.name, saveData.level);
            console.log('Game loaded');
        } catch (e) {
            console.error('Failed to load save', e);
        }
    }
}
