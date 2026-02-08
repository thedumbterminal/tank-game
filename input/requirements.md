# Requirements

* 2 player game, one play can be a bot.
* You win the game by destroying the other tank.
* Game will be a side on, fixed screen 2D view.
* The terrain will be randomly generated to include trenches and hills.

## Tech
* Game will use the node.js version defined in the .nvmrc file.
* Game will be written in typescript.
* Game will use OO principles.
* Version number in package.json will be increased on each time new features are added to the game.
* Please generate a CHANGELOG.md file using a common changelog format described here: https://common-changelog.org

## Player tanks

### Movement
* Tanks can move backwards and forwards.
* Tanks use fuel when they move.
* When all fuel is used the tank can no longer move.
* Fuel gauge is displayed to show remaining fuel.

### Firing
* Tanks can fire bullets using arc reticle
* Ensure that the arch reticle is black to be visible against the background.
* The arch reticle is only shown close to the player tank, to add an element of skill.
* Tank bullets will explode and cause a small crater in the terrain.

### Types
* The player can pick a tank before starting the match
* There are 3 types of tank that can be used

M48 GAU-AVENGER
Fires 10 bullets at once per attack at a high volicity
5 damage per bullet

The bullets fire one after another.

AMBRAMS
35 damage per bullet
1 bullet fired per attack

MAUS
Can only fire once 2 turns
50 damage per bullet
Bullet causes a larger crater in the terrain

## Deployment
* The game will be hosted on github pages at the following base URL path: /tank-game
* The local dev server will serve the game from the base URL path: /
