Map format
===========
This is the current format of a map file. Don't forget to update
it if the format is changed.

Notes:

1. Currently, the map's shape is that of a regular convex polygon.

```javascript
{
    name: "My Map Name",
    sizeN: 200, // The size of each side of polygon
    sizeRadius: 100, // The radius of the polygon.
    collapseIterations: 1, // The number of times parts of the platform crumble
    collapseInterval: 30, // The interval in seconds after which the platform crumbles
    maxPlayers: 8, // The maximum number of players on the given map
    rounds: 5, // The number of rounds the game is to be played
    physics: {
        friction: 10, // The magnitude of the friction force
        speed: 10, // The default speed to move our characters with
    },
    spells: "my-spell-collection.json", // The file containing all spells
    staticObjects: "my-static-objects.json", // The file containing all static objects.
}
```