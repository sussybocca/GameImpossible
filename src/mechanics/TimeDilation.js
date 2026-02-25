export class TimeDilation {
    constructor(player) {
        this.player = player;
        this.scale = 1.0;
        this.active = false;
        this.duration = 3.0;
        this.cooldown = 8.0;
        this.remaining = 0;
        this.cooldownRemaining = 0;
    }

    activate(slow = true) {
        if (this.cooldownRemaining > 0) return false;
        this.scale = slow ? 0.2 : 1.8;
        this.remaining = this.duration;
        this.active = true;
        this.cooldownRemaining = this.cooldown;
        return true;
    }

    update(deltaTime) {
        if (this.remaining > 0) {
            this.remaining -= deltaTime;
            if (this.remaining <= 0) {
                this.scale = 1.0;
                this.active = false;
            }
        }
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining -= deltaTime;
        }
    }
}
