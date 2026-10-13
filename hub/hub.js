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
      img.src = href + (app.thumbnailStill || app.thumbnail);
      img.alt = "";
      art.append(img);
      if (app.thumbnailStill) animateOnHover(tile, img, href + app.thumbnailStill, href + app.thumbnail);
    } else {
      art.textContent = app.emoji || "✨";
    }

    const title = document.createElement("h2");
    title.textContent = app.title;

    tile.append(art, title);
    grid.append(tile);
  });

  // Shows the still image until the tile is hovered (or focused from the keyboard), then the
  // animation. Swapping restarts a GIF, so leaving waits a moment before going still: a quick
  // hover off and back on keeps the animation running instead of restarting it.
  function animateOnHover(tile, img, still, animated) {
    let playing = false;
    let stopTimer;
    new Image().src = animated; // preload so the first hover starts right away

    const play = () => {
      clearTimeout(stopTimer);
      if (playing) return;
      playing = true;
      img.src = animated;
    };
    const stop = () => {
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        playing = false;
        img.src = still;
      }, 300);
    };

    tile.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && play());
    tile.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && stop());
    tile.addEventListener("focus", () => tile.matches(":focus-visible") && play());
    tile.addEventListener("blur", stop);
  }
})();
