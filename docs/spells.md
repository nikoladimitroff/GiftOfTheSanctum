Spells / Skills format
============
This is the current format of the spell library. Don't forget to update
it if the format is changed.

```javascript
[{
    name: "fireball",
    sprite: "fireball.png" // only required for projectiles
    castType: "projectile", // see below
    targeted: false, // if true the spell is required to target a player
    effects: [ // see below
        "damage",
        "pushback"
    ],
    effectRadius: 0, // the radius in which to hit nearby enemies / obstacles
    damageAmount: 10,
    pushbackForce: 10,
    radius: 5, // size of the projectile
    cooldown: 10, // cooldown of the spell
    movementFunction: "linear", // determines the projectile's path - "quadratic", "homing", "sin"
    acceleration: 1, // the projectile's acceleration magnitude
    speed: 1, // the projectile's start speed
    range: 50, // maximum distance the projectile may fly (or the instant cast to hit)
}...]
```

Spells make heavy-use of several predefined properties.

1. Spell cast types
  1. `projectile` - the spell flies in a certain direction following a certain
    trajectory
  2. `instant` - the spell instantaneously hits the given character / area
  
2. Effects

| Effect | Additional Properties | Description |
| ------ | --------------------- | ----------- |
| `"damage"` | `damageAmount` | deals damage / heals when the damage is negative |
| `"pushback"` | `pushbackForce` | pushes targets around it a certain distance |
| `"impassable"` | - | this object is impassable and nothing can move trough it |
| `"spawn-object"` | `spawnObject` | this spell spawns a new object |
| `"haste"` | `hasteMultiplier` | multiplies the target's movement speed by the given amount |