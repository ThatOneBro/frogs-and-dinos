import "./style.css";
import { PriorityQueue } from "./util/pqueue";

const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;
const LOOP_INTERVAL = 500;
const DOUBLE_CLICK_TIMEOUT = 600;

let paused = false;
let highlighted: TileState | null = null;
let selected: TileState | null = null;
let doubleClickValid = false;

const tiles = [] as HTMLDivElement[][];
const tileStates = [] as TileState[][];
const occupied = new Set<TileState>();
// const attacking = new Set<TileState>();

type QueueEvent = {
  ticksRequired: number;
  ticksLeft: number;
  callback: () => void;
};

const eventQueue = new PriorityQueue((a: QueueEvent, b: QueueEvent) => a.ticksLeft - b.ticksLeft);

enum Faction {
  UNALIGNED = "FACTION_UNALIGNED",
  FROG = "FACTION_FROG",
  DINO = "FACTION_DINO",
}

enum BattleStatus {
  UNOCCUPIED = "STATUS_UNOCCUPIED",
  IDLE = "STATUS_IDLE",
}

type TileState = {
  position: [x: number, y: number];
  ele: HTMLDivElement;
  owner: Faction;
  status: BattleStatus;
  attacking: TileState | null;
  counter: number;
  troopCount: number;
  troopMorale: number;
};

type TileUpdate = Partial<Omit<TileState, "ele">>;
type TileUpdateKey = keyof TileUpdate;
type TileUpdateVal<K extends TileUpdateKey> = TileState[K];

const appDiv = document.querySelector<HTMLDivElement>("#app")!;
if (!appDiv) {
  throw new Error("Cannot find `#app` in document!");
}

appDiv.innerHTML = `
  <div>
    <h1>Frogs and Dinos</h1>
    <div class="game-map" id="map"></div>
  </div>
`;

const mapDiv = document.querySelector<HTMLDivElement>("#map");
if (!mapDiv) {
  throw new Error("Cannot find `#map` in document!");
}

const tileEles = [] as HTMLDivElement[];
for (let i = 0; i < MAP_WIDTH; i++) {
  const tileRow = [] as HTMLDivElement[];
  const tileStateRow = [] as TileState[];
  for (let j = 0; j < MAP_HEIGHT; j++) {
    const tile = document.createElement("div");
    tile.className = "game-map-tile";
    tile.id = `tile_${i}-${j}`;

    const tileState = {
      position: [i, j],
      ele: tile,
      owner: Faction.UNALIGNED,
      status: BattleStatus.UNOCCUPIED,
      attacking: null,
      counter: 0,
      troopCount: 0,
      troopMorale: 100,
    } as TileState;

    tile.addEventListener("click", () => onTileClick(tileState));

    tileEles.push(tile);
    tileRow.push(tile);
    tileStateRow.push(tileState);
  }
  tiles.push(tileRow);
  tileStates.push(tileStateRow);
}
mapDiv.append(...tileEles);

function maybeSelectTile(tile: TileState) {
  if (tile.troopCount > 0) {
    if (tile !== selected) {
      if (selected) {
        selected.ele.classList.remove("SELECTED");
      }
      tile.ele.classList.add("SELECTED");
      selected = tile;
    }
  }
}

function onTileClick(tile: TileState) {
  if (tile !== highlighted) {
    // Check if there is selected, if so, remove selected modifier from ele
    if (highlighted) {
      highlighted.ele.classList.remove("HIGHLIGHTED");
      doubleClickValid = false;
    }
    tile.ele.classList.add("HIGHLIGHTED");
    highlighted = tile;
  } else if (doubleClickValid) {
    onTileDoubleClick(tile);
  }

  setTimeout(() => {
    doubleClickValid = false;
  }, DOUBLE_CLICK_TIMEOUT);
  doubleClickValid = true;
}

function isAdjacentTile(currentTile: TileState, comparedTile: TileState): boolean {
  const [x1, y1] = currentTile.position;
  const [x2, y2] = comparedTile.position;
  if (Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1) {
    return true;
  }
  return false;
}

function maybeAttack() {
  if (
    selected &&
    highlighted &&
    highlighted !== selected &&
    isAdjacentTile(selected, highlighted)
  ) {
    if (highlighted.owner === selected.owner) {
      updateTile(highlighted, { troopCount: highlighted.troopCount + selected.troopCount });
      updateTile(selected, { troopCount: 0 });
      maybeSelectTile(highlighted);
    } else if (highlighted.owner === Faction.UNALIGNED || highlighted.troopCount === 0) {
      updateTile(highlighted, { owner: selected.owner, troopCount: selected.troopCount });
      updateTile(selected, { troopCount: 0 });
      maybeSelectTile(highlighted);
    } else {
      // Attack
      updateTile(selected, { attacking: highlighted });
    }
  }
}

function maybeSplit() {
  if (
    selected &&
    highlighted &&
    highlighted !== selected &&
    isAdjacentTile(selected, highlighted)
  ) {
    const halfRoundedUp = Math.ceil(selected.troopCount / 2);
    if (selected.owner === highlighted.owner || highlighted.owner === Faction.UNALIGNED) {
      updateTile(highlighted, {
        owner: selected.owner,
        troopCount: highlighted.troopCount + halfRoundedUp,
      });
      updateTile(selected, { troopCount: selected.troopCount - halfRoundedUp });
      maybeSelectTile(highlighted);
    }
  }
}

function onTileDoubleClick(tile: TileState) {
  maybeSelectTile(tile);
}

// TODO: beforeTileUpdate, afterTileUpdate
function updateTile(tile: TileState, update: TileUpdate) {
  const updates = [update] as TileUpdate[];
  const ele = tile.ele;
  const classList = ele.classList;
  while (updates.length) {
    const currentUpdate = updates.shift()!;
    console.log("currentUpdate", currentUpdate);
    for (const entry of Object.entries(currentUpdate)) {
      const key = entry[0] as TileUpdateKey;
      switch (key) {
        case "owner": {
          const val = entry[1] as TileUpdateVal<typeof key>;
          // Remove previous owner
          classList.remove(Faction.FROG, Faction.DINO);
          const prevOwner = tile.owner;
          tile.owner = val;
          // Add owner class
          if (val === Faction.UNALIGNED) {
            occupied.delete(tile);
          } else {
            classList.add(tile.owner);
            if (prevOwner === Faction.UNALIGNED) {
              updates.push({ status: BattleStatus.IDLE });
            }
            occupied.add(tile);
          }
          break;
        }
        case "status": {
          const val = entry[1] as TileUpdateVal<typeof key>;
          classList.remove(BattleStatus.IDLE);
          tile.status = val;
          // Add status class
          if (val !== BattleStatus.UNOCCUPIED) {
            classList.add(tile.status);
          }
          break;
        }
        case "attacking": {
          const val = entry[1] as TileUpdateVal<typeof key>;
          tile.attacking = val;
          // Add or remove attacking class
          if (tile.attacking) {
            classList.add("ATTACKING");
          } else {
            classList.remove("ATTACKING");
          }
          break;
        }
        case "troopCount": {
          const prevTroopCount = tile.troopCount;
          const val = entry[1] as TileUpdateVal<typeof key>;
          tile.troopCount = val;
          ele.innerHTML = `${tile.troopCount}`;
          if (val === 0) {
            occupied.delete(tile);
            updates.push({ status: BattleStatus.UNOCCUPIED });
            classList.remove("OCCUPIED");
            ele.innerHTML = "";
          } else {
            classList.add(tile.owner);
            if (prevTroopCount === 0) {
              updates.push({ status: BattleStatus.IDLE });
              classList.add("OCCUPIED");
            }
            occupied.add(tile);
          }
          break;
        }
        case "counter":
          tile.counter = update.counter as TileState["counter"];
          break;
        default:
          throw new Error("Invalid key!");
      }
    }
  }
}

function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomTile(): TileState {
  const x = randomIntFromInterval(0, MAP_WIDTH - 1);
  const y = randomIntFromInterval(0, MAP_HEIGHT - 1);
  if (!(tileStates[x] && tileStates[x][y])) {
    throw new Error("Tile out of bounds!");
  }
  return tileStates[x][y];
}

function runSystems() {
  // System for increasing troopCount on occupied territory
  for (const tile of occupied) {
    if (tile.status === BattleStatus.IDLE) {
      updateTile(tile, { counter: tile.counter + 1 });
      if (tile.counter === 4) {
        updateTile(tile, { counter: 0, troopCount: tile.troopCount + 1 });
      }
    }
  }
  // Battle system

  // Rebellion system
}

function loop() {
  if (paused) return;
  runSystems();
  for (const tile of occupied) {
    console.log(tile);
  }
  setTimeout(loop, LOOP_INTERVAL);
}

function attachKeybindings() {
  document.addEventListener("keypress", (event: KeyboardEvent) => {
    switch (event.key) {
      case "a":
        maybeAttack();
        break;
      case "s":
        if (highlighted) {
          maybeSelectTile(highlighted);
        }
        break;
      case "d":
        if (selected) {
          selected.ele.classList.remove("SELECTED");
          selected = null;
        }
        if (highlighted) {
          highlighted.ele.classList.remove("HIGHLIGHTED");
          highlighted = null;
        }
        break;
      case "x":
        maybeSplit();
        break;
      default:
    }
  });
}

function startGame() {
  // Seed with first squares
  const firstFrog = getRandomTile();
  updateTile(firstFrog, { owner: Faction.FROG, troopCount: 10 });
  let firstDino: TileState;
  do {
    firstDino = getRandomTile();
  } while (firstDino.owner !== Faction.UNALIGNED);
  updateTile(firstDino, { owner: Faction.DINO, troopCount: 10 });

  loop();
}

startGame();
attachKeybindings();

// TODO: Current, current:
// Add morale bar
// Add auto-retreat
// Add bonus after surrounding
// Add attacks
// Add movement arrows
// Add delay to movement
// Fix graphics at this point
// Add Day 1 ... Day 2 (global timer... should we refactor to use counter as future timestamp)
// Refactor to have an action queue?

// D to deselect
// A to attack
// S to split
// Space bar for volley / counter volley

// Current objective:
// Add movement of stacks
// Add battle system
// Add splitting of stacks
// Add population modifier

// PEPE vs YEE passives:
// PEPE: quickly capture, +1 to espionage and spying, +1 to cleansing, -10 to conversions (Fascism)
// YEE: quickly influence culture in captured areas, , -5 to quality

// Cleansing - Sparks rebellions, reduces pops, reduces cooperation until fully cleansed
// Cleansing also affects AE, prompts UN to intervene

// YEE - can cleanse diplomatically, cultural drift

// Actions
// Actions update state after N ticks
// Actions can be canceled before N ticks

// Tiles not in homeostasis must be kept in an array
// Rules are applied to tile on each tick
// Each rule has a corresponding resolution system applied to the tile violating the rule

// Rules:                                             Resolutions:
// 1. Each tile can only have one faction on it ->    1. At the start of the

// Game loop
// Set tiles as active when
// Systems

// Each person must choose a specialization...?
// Can delegate control to leaders when afk / auto-delegate when disconnected

// Potential exploits:
// moving troopCount back and forth to get max ticks on both stacks

// Multiplayer story:
// Pockets seeded randomly
// Players attempt to unite a territory...
// Players of the same faction can create states together if they hold territory for long enough
// Supply lines through enemy territory are very ineffective
