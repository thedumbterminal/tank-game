# Requirements

* 2 player game, one player can be a bot.
* You win the game by destroying the other tank.
* Game will be a side on, fixed screen 2D view.
* The terrain will be randomly generated to include trenches and hills.
* Each time the player defeats the enemy tank, they are moved on to the next level.

## Tech
* Game will use the latest stable node.js version and set in the .nvmrc file.
* Game will be written in typescript.
* Game will use OO principles.
* Version number in package.json will be increased on each time new features are added to the game.
* Please generate a CHANGELOG.md file using a common changelog format described here: https://common-changelog.org
* Create unit tests to ensure that all requirements work correctly.
* Create regression tests for all bugs found.
* Compatible with a phone's touchscreen and desktop.

## Levels
* Are numbered.
* The enemy tanks get harder each level.
* The player can continue a previous game at the last level they successfully completed, or they can start a new game.
* There is a leaderboard of which player got to the higest level.

## Leaderboard

* Once a player has died they can enter their name.
* The attained level is recorded.
* The date is also recored.
* The leaderboard is server side so all players can see the same leaderboard.

## Player tanks

### Movement
* Tanks can move backwards and forwards.
* Tanks use fuel when they move.
* When all fuel is used the tank can no longer move.
* Fuel gauge is displayed to show remaining fuel.
* Tank images are realistic.
* Once a tank has fired it can no longer move for the remainer of its turn.

### Firing
* Tanks can fire bullets using arc reticle
* Ensure that the arch reticle is black to be visible against the background.
* The arch reticle is only shown close to the player tank, to add an element of skill.
* Tank bullets will explode and cause a small crater in the terrain.
* If a tank is reloading, the fire button will also end the turn.

### Types
* The player can pick a tank before starting the match.
* The tanks are displayed with the image, name and capabilities only for the player to pick from.
* Each tank's capabilities are shown in a table format.
* There are 3 types of tank that can be used.

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

### CPU Player
* Its tank should move each turn.

## Deployment
* The game will be hosted on github pages at the following base URL path: /tank-game
* The local dev server will serve the game from the base URL path: /
* The local dev server will allow connections on the local network and not block any hostname.

