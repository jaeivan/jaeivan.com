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

  // Header logo (works like Pokopia Doku's title Ditto): waves and spins while hovered with a
  // mouse; a tap, click, Enter or Space toggles it on so it keeps going, and another stops it
  // (even mid-hover). Swapping the image restarts the GIF, so it's only swapped when the
  // animation really starts or stops, and a stop waits for the current loop to end: the loop
  // ends on the same pose as logo-still.gif, so there's no jump.
  const LOGO_LOOP_MS = 2600; // printed by `node _tools/logo.mjs`
  const logo = document.getElementById("hub-logo");
  const logoImg = logo.querySelector("img");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let logoHover = false, logoToggled = false, logoPlaying = false, logoStart = 0, logoStopTimer;

  function updateLogo() {
    clearTimeout(logoStopTimer);
    if ((logoHover || logoToggled) && !reduceMotion.matches) {
      if (logoPlaying) return; // already playing (maybe winding down): keep going
      logoPlaying = true;
      logoStart = performance.now();
      logoImg.src = "hub/logo.gif";
    } else if (logoPlaying) {
      const untilLoopEnd = LOGO_LOOP_MS - ((performance.now() - logoStart) % LOGO_LOOP_MS);
      logoStopTimer = setTimeout(() => {
        logoPlaying = false;
        logoImg.src = "hub/logo-still.gif";
      }, untilLoopEnd);
    }
  }
  function toggleLogo() {
    logoToggled = !logoToggled;
    if (!logoToggled) logoHover = false; // stop even mid-hover; hover resumes on the next mouse-over
    logo.setAttribute("aria-pressed", logoToggled);
    updateLogo();
  }

  logo.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") (logoHover = true), updateLogo();
  });
  logo.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") (logoHover = false), updateLogo();
  });
  logo.addEventListener("pointerup", (e) => {
    if (e.button === 0) toggleLogo(); // primary button / touch only
  });
  logo.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    toggleLogo();
  });
  new Image().src = "hub/logo.gif"; // preload so the first hover starts right away

  // `added` is "YYYY-MM-DD"; apps count as new for 30 days.
  function isNew(added) {
    const age = Date.now() - Date.parse(added + "T00:00:00");
    return age >= 0 && age < 30 * 24 * 60 * 60 * 1000;
  }
})();
