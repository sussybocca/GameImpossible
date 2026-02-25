export const Constants = {
    GRAVITY: 9.82,
    PLAYER_SPEED: 5,
    PLAYER_RUN_SPEED: 8,
    PLAYER_JUMP_FORCE: 6,
    PLAYER_HEIGHT: 2,
    PLAYER_RADIUS: 0.5,
    ENEMY_DETECTION_RANGE: 15,
    ENEMY_ATTACK_RANGE: 2.5,
    MAX_LEVEL_SIZE: 100,
    SAVE_INTERVAL: 60000, // ms
    COLLISION_GROUPS: {
        PLAYER: 1,
        WALL: 2,
        ENEMY: 4,
        COLLECTIBLE: 8,
        PORTAL: 16,
        TRIGGER: 32
    }
};
