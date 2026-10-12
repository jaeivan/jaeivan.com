(function () {
  const grid = document.getElementById("apps");
  const apps = window.HUB_APPS || [];

  apps.forEach((app) => {
    const href = `${app.slug}/`;

    const tile = document.createElement("a");
    tile.className = "tile";
    tile.href = href;

    const art = document.createElement("div");
    art.className = "tile-art";
    art.style.background = app.color || "#eef2ff";
    if (app.thumbnail) {
      const img = document.createElement("img");
      img.src = href + app.thumbnail;
      img.alt = "";
      art.append(img);
    } else {
      art.textContent = app.emoji || "✨";
    }

    const title = document.createElement("h2");
    title.textContent = app.title;

    const desc = document.createElement("p");
    desc.textContent = app.description || "";

    tile.append(art, title, desc);
    grid.append(tile);
  });
})();
