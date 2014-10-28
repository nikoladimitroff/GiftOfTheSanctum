Sprite format
===========
This is the current format of a sprite file. Don't forget to update
it if the format is changed.

All image assets used in the game should adhere to the following:

1. PNG format, transparent background (unless the asset is background itself)
2. Each row of an animated sprite must be a separate animation.
3. Both the horizontal and vertical distance between any two neighbouring 
frames of an animated sprite must be the same.

```javascript
{
    src: "gandalf.png",
    framesPerRow: [ // The number of frames each row contains
        3,
        5,
        7
    ],
}
```