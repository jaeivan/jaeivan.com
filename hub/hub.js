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
    if (isNew(app.added)) {
      const badge = document.createElement("span");
      badge.className = "tile-new";
      badge.textContent = "New";
      art.append(badge);
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

  // Keep the footer's copyright year current (the HTML holds a no-JS fallback).
  const year = document.querySelector(".hub-footer-year");
  if (year) year.textContent = new Date().getFullYear();

  // `added` is "YYYY-MM-DD"; apps count as new for 30 days.
  function isNew(added) {
    const age = Date.now() - Date.parse(added + "T00:00:00");
    return age >= 0 && age < 30 * 24 * 60 * 60 * 1000;
  }

  // Easter egg: the Konami code (↑↑↓↓←→←→BA) makes the tiles dance for a few seconds.
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let progress = 0;
  let partyTimer;
  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
    if (progress < KONAMI.length) return;
    progress = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearTimeout(partyTimer);
    document.body.classList.add("hub-party");
    partyTimer = setTimeout(() => document.body.classList.remove("hub-party"), 4000);
  });
})();
