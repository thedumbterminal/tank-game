# Requirements

* 2 player game, one play can be a bot
* You win the game by destroying the other tank
* Game will be a side on, fixed screen 2D view.
* The terrain will be randomly generated to include trenches and hills

## Tech
* Game will be written in typescript
* Game will use OO principles
* Version number in package.json will be increased on each time new features are added to the game.
* Please generate a CHANGELOG.md file using a common changelog format described here: https://common-changelog.org

## Player tanks
* Tanks can move backwards and forwards
* Tanks can fire bullets using arc reticle
* The player can pick a tank before starting the match
* There are 3 types of tank that can be used
* Ensure that the arch reticle is black to be visible against the background.
* The arch reticle is only shown close to the player tank, to add an element of skill.
* Tank bullets will explode and cause a small crater in the terrain.

M48 GAU-AVENGER
Fires 10 bullets at once per attack at a high volicity
5 damage per bullit

The bullets fire one after another.

AMBRAMS
35 damage per bullit
1 bullet fired per attack

MAUS
Can only fire once 2 turns
50 damage per bullit

## Deployment
* The game will be hosted on github pages at the following base URL path: /tank-game
* The local dev server will serve the game from the base URL path: /
