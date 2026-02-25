// Collision groups for physics (bitmask)
export const CollisionGroups = {
    PLAYER: 1 << 0,        // 1
    WALL: 1 << 1,           // 2
    ENEMY: 1 << 2,          // 4
    COLLECTIBLE: 1 << 3,    // 8
    PORTAL: 1 << 4,         // 16
    TRIGGER: 1 << 5,        // 32
    PLATFORM: 1 << 6,       // 64
    FORCE_FIELD: 1 << 7,    // 128
    ALL: 0xFFFF
};
