Common info
========
## Conventions
1. Adhere to [Google's naming convention][google-convention]
(except for filenames!, see next bullet)
2. Use snake_case for all filenames. (i.e. *my_fireball_image.png*)
2. Try to limit your lines to 80 characters.
3. Use 4 spaces (not tabs) for indentation. Never commit trailing spaces.
4. All game-specific code must be inside the `sanctum` namespace.
5. Prefer code that runs inside the main game loop as opposed to
async callbacks.
6. Prefer composition over inheritance.
6. Prefer **not** to include 3rd party libraries if you have the chance.
7. Each and every git commit must begin with one of the following tags and and
short explanation of the work done:
    - [Feature]
    - [Enhancement]
    - [Bugfix]
    - [Content]
    - [Docs]

## Architectural notes
The game is heavily data-driven so try to stick with that.
Prefer dumb data objects and smart managers over smart data objects
and dumb (if any) managers.

[google-convention]: https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml