const colors = [
  // Reds & Pinks
  ["Red", "#C0392B"],
  ["Brick", "#CD6155"],
  ["Coral", "#FF6F61"],
  ["Pink", "#E91E63"],

  // Oranges & Browns
  ["Orange", "#E67E22"],
  ["Orange 2", "#FF9800"],
  ["Orange 3", "#FF6F00"],
  ["Amber", "#F5B041"],
  ["Ochre", "#B9770E"],
  ["Brown", "#8E5A3C"],
  ["Dark Brown", "#6E3B28"],
  ["Caramel", "#A97142"],

  // Yellows
  ["Yellow", "#F4D03F"],
  ["Light Yellow", "#F7DC6F"],
  ["Gold", "#F4B400"],

  // Greens
  ["Lime", "#BFD833"],
  ["Green", "#4CAF50"],
  ["Bright Green", "#52BE80"],
  ["Forest", "#1E8449"],
  ["Mint", "#7FFFD4"],

  // Blues
  ["Sky Blue", "#5DADE2"],
  ["Light Blue", "#87CEEB"],
  ["Blue", "#3498DB"],
  ["Royal Blue", "#2166D1"],

  // Purples
  ["Lavender", "#D7BDE2"],
  ["Purple", "#8E44AD"],
  ["Magenta", "#D252B9"],

  // Neutrals
  ["Peach", "#F5CBA7"],
  ["Beige", "#F5CBA7"],
  ["Cream", "#F9E79F"],
  ["Ivory", "#F8F4E3"],
  ["Tan", "#E8D49A"],
  ["Sand", "#D2B48C"],
  ["Taupe", "#6E6259"],
  ["Gray", "#6E6E6E"],
  ["Cool Gray", "#C0C0C0"],
  ["Light Gray", "#BFC9CA"],
  ["Silver", "#D6DBDF"],
  ["Charcoal", "#4D4D5C"],
  ["Black", "#000000"],
];

const groups = {
  Warm: [
    "Red",
    "Orange",
    "Orange 2",
    "Orange 3",
    "Coral",
    "Brick",
    "Peach",
    "Yellow",
    "Light Yellow",
    "Amber",
    "Gold",
    "Ochre",
    "Brown",
    "Dark Brown",
    "Caramel",
    "Lime",
    "Pink",
  ],

  Cool: [
    "Sky Blue",
    "Light Blue",
    "Blue",
    "Royal Blue",
    "Purple",
    "Lavender",
    "Magenta",
    "Green",
    "Forest",
    "Bright Green",
    "Mint",
  ],

  Neutral: [
    "Gray",
    "Cool Gray",
    "Light Gray",
    "Silver",
    "Black",
    "Ivory",
    "Cream",
    "Taupe",
    "Beige",
    "Tan",
    "Sand",
    "Charcoal",
  ],
};

function indicesFromGroup(group) {
  return colors
    .map((c, i) => (group.includes(c[0]) ? i : null))
    .filter((i) => i !== null);
}

const grid = document.getElementById("grid");
const chosenGrid = document.getElementById("chosenGrid");
const mode = document.getElementById("mode");
let locked = new Set();
let selected = new Set();

function pool() {
  switch (mode.value) {
    case "Warm":
      return indicesFromGroup(groups.Warm);

    case "Cool":
      return indicesFromGroup(groups.Cool);

    case "Neutral":
      return indicesFromGroup(groups.Neutral);

    default:
      return colors.map((_, i) => i);
  }
}

function render() {
  grid.innerHTML = "";
  chosenGrid.innerHTML = "";

  selected.forEach((i) => {
    const card = document.createElement("div");
    card.className = "card";

    const d = document.createElement("div");
    d.className = "marker";
    d.style.background = colors[i][1];

    if (locked.has(i)) d.classList.add("locked");

    const l = document.createElement("label");
    l.textContent = colors[i][0];

    card.append(d, l);
    chosenGrid.append(card);
  });

  colors.forEach((c, i) => {
    const card = document.createElement("div");
    card.className = "card";
    const d = document.createElement("div");
    d.className = "marker";
    d.style.background = c[1];
    if (selected.size && !selected.has(i)) d.classList.add("dim");
    if (selected.has(i)) d.classList.add("selected");
    if (locked.has(i)) d.classList.add("locked");
    d.tabIndex = 0;
    d.setAttribute("role", "button");
    d.setAttribute("aria-label", c[0]);
    d.setAttribute("aria-pressed", locked.has(i));
    d.onclick = () => toggleLock(i);
    d.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleLock(i);
      }
    };
    const l = document.createElement("label");
    l.textContent = c[0];
    card.append(d, l);
    grid.append(card);
  });
}

function toggleLock(i) {
  if (locked.has(i)) {
    locked.delete(i);
    selected.delete(i);
  } else if (locked.size < 4) {
    // If all 4 slots are filled, drop the newest unlocked pick to make room.
    if (!selected.has(i) && selected.size >= 4) {
      const unlocked = [...selected].filter((s) => !locked.has(s));
      selected.delete(unlocked[unlocked.length - 1]);
    }
    locked.add(i);
    selected.add(i);
  }
  render();
  // render() rebuilds the grid, so restore keyboard focus to the same marker.
  grid.querySelectorAll(".marker")[i].focus();
}

function pick() {
  selected = new Set([...locked]);
  let p = pool().filter((i) => !selected.has(i));
  while (selected.size < 4 && p.length) {
    let r = Math.floor(Math.random() * p.length);
    selected.add(p.splice(r, 1)[0]);
  }
  render();
}

document.getElementById("pickBtn").onclick = pick;
document.getElementById("resetBtn").onclick = () => {
  locked.clear();
  selected.clear();
  render();
};
render();
