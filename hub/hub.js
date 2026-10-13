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
    if (app.color) art.style.setProperty("--tile-color", app.color);
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

    tile.append(art, title);
    grid.append(tile);
  });
})();
