import "./style.css";

const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;

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

enum Faction {
  UNALIGNED = "FACTION_UNALIGNED",
  FROG = "FACTION_FROG",
  DINO = "FACTION_DINO",
}

enum BattleStatus {
  UNOCCUPIED = "STATUS_UNOCCUPIED",
  IDLE = "STATUS_IDLE",
}

enum AttackDirection {
  NONE = "ATK_NONE",
  UP = "ATK_UP",
  LEFT = "ATK_LEFT",
  RIGHT = "ATK_RIGHT",
  DOWN = "ATK_DOWN",
}

type TileState = {
  ele: HTMLDivElement;
  owner: Faction;
  status: BattleStatus;
  attacking: boolean;
  attackDirection: AttackDirection;
};

type TileUpdate = Partial<Omit<TileState, "ele">>;
type TileUpdateKey = keyof TileUpdate;

const tiles = [] as HTMLDivElement[][];
const tileStates = [] as TileState[][];

function updateTile(tile: TileState, update: TileUpdate) {
  const updates = [update] as TileUpdate[];
  const classList = tile.ele.classList;
  while (updates.length) {
    const currentUpdate = updates.shift()!;
    for (const [key, val] of Object.entries(currentUpdate)) {
      switch (key as TileUpdateKey) {
        case "owner":
          // Remove previous owner
          classList.remove(Faction.FROG, Faction.DINO);
          const prevOwner = tile.owner;
          tile.owner = val as TileState["owner"];
          // Add owner class
          if (val !== Faction.UNALIGNED) {
            classList.add(tile.owner);
            if (prevOwner === Faction.UNALIGNED && update.status === undefined) {
              updates.push({ status: BattleStatus.IDLE });
            }
          }
          break;
        case "status":
          classList.remove(BattleStatus.IDLE);
          tile.status = val as TileState["status"];
          // Add status class
          if (val !== BattleStatus.UNOCCUPIED) {
            classList.add(tile.status);
          }
          break;
        case "attackDirection":
          classList.remove(
            AttackDirection.UP,
            AttackDirection.DOWN,
            AttackDirection.LEFT,
            AttackDirection.RIGHT
          );
          tile.attackDirection = val as TileState["attackDirection"];
          // Add attack direction class
          if (val !== AttackDirection.NONE) {
            classList.add(tile.attackDirection);
          }
          break;
        case "attacking":
          tile.attacking = val as TileState["attacking"];
          // Add or remove attacking class
          if (tile.attacking) {
            classList.add("attacking");
          } else {
            classList.remove("attacking");
            updates.push({ attackDirection: AttackDirection.NONE });
          }
          break;
        default:
          throw new Error("Invalid key!");
      }
    }
  }
}

const tileEles = [] as HTMLDivElement[];
for (let i = 0; i < MAP_WIDTH; i++) {
  const tileRow = [] as HTMLDivElement[];
  const tileStateRow = [] as TileState[];
  for (let j = 0; j < MAP_HEIGHT; j++) {
    const tile = document.createElement("div");
    tile.className = "game-map-tile";
    tile.id = `tile_${i}-${j}`;
    tileEles.push(tile);
    tileRow.push(tile);
    tileStateRow.push({
      ele: tile,
      owner: Faction.UNALIGNED,
      status: BattleStatus.UNOCCUPIED,
      attacking: false,
      attackDirection: AttackDirection.NONE,
    });
  }
  tiles.push(tileRow);
  tileStates.push(tileStateRow);
}
mapDiv.append(...tileEles);

function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getRandomTile(): TileState {
  const i = randomIntFromInterval(0, MAP_WIDTH - 1);
  const j = randomIntFromInterval(0, MAP_HEIGHT - 1);
  if (!(tileStates[i] && tileStates[i][j])) {
    throw new Error("Tile out of bounds!");
  }
  return tileStates[i][j];
}

let paused = false;
const systems = [] as (() => void)[];

const LOOP_INTERVAL = 100;

function loop() {
  if (paused) return;

  for (const system of systems) {
    system();
  }

  setTimeout(loop, LOOP_INTERVAL);
}

function startGame() {
  // Seed with first squares
  const firstFrog = getRandomTile();
  updateTile(firstFrog, { owner: Faction.FROG });
  let firstDino: TileState;
  do {
    firstDino = getRandomTile();
  } while (firstDino.owner !== Faction.UNALIGNED);
  updateTile(firstDino, { owner: Faction.DINO });

  loop();
}

startGame();

for (let i = 0; i < MAP_WIDTH; i++) {
  for (let j = 0; j < MAP_HEIGHT; j++) {
    console.log(tileStates[i][j]);
  }
}

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
