export class UIManager {
    constructor() {
        this.fpsElement = document.getElementById('fps');
        this.posElement = document.getElementById('pos');
        this.interactionElement = document.getElementById('interaction');
        this.timerElement = document.getElementById('timer');
        this.gravityElement = document.getElementById('gravity');
        this.timeElement = document.getElementById('time');
        this.wallrunElement = document.getElementById('wallrun');

        this.frames = 0;
        this.lastTime = performance.now();
        this.startTime = performance.now();
    }

    init() {
        setInterval(() => this.updateFPS(), 500);
        document.getElementById('save').addEventListener('click', () => this.onSave());
        document.getElementById('load').addEventListener('click', () => this.onLoad());
        document.getElementById('resume').addEventListener('click', () => this.onResume());
    }

    update(player, physics) {
        if (player?.body) {
            const pos = player.body.position;
            this.posElement.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        }

        const elapsed = (performance.now() - this.startTime) / 1000;
        const mins = Math.floor(elapsed / 60);
        const secs = Math.floor(elapsed % 60);
        this.timerElement.textContent = `Time: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (player) {
            const gravityDir = player.customGravity?.direction || 'NORMAL';
            this.gravityElement.textContent = `Gravity: ${gravityDir}`;
            const timeScale = player.timeControl?.scale || 1.0;
            this.timeElement.textContent = `Time: ${timeScale.toFixed(1)}x`;
            this.wallrunElement.textContent = `Wallrun: ${player.canWallrun ? 'READY' : 'COOLDOWN'}`;
        }

        this.interactionElement.style.opacity = player?.nearInteractable ? 1 : 0;
    }

    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastTime;
        const fps = Math.round((this.frames * 1000) / delta);
        this.fpsElement.textContent = fps;
        this.frames = 0;
        this.lastTime = now;
    }

    countFrame() {
        this.frames++;
    }

    onSave() {
        window.game.saveSystem.save();
    }

    onLoad() {
        window.game.saveSystem.load();
    }

    onResume() {
        window.game.togglePause();
    }
}
