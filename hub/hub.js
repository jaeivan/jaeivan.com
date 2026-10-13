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
    const badges = [];
    if (withinWeek(app.created)) badges.push("New");
    if (withinWeek(app.updated)) badges.push("Updated");
    if (badges.length) {
      const wrap = document.createElement("span");
      wrap.className = "tile-badges";
      badges.forEach((label) => {
        const el = document.createElement("span");
        el.className = `tile-badge tile-badge-${label.toLowerCase()}`;
        el.textContent = label;
        wrap.append(el);
      });
      art.append(wrap);
    }

    const title = document.createElement("h2");
    title.textContent = app.title;

    const dates = document.createElement("p");
    dates.className = "tile-dates";
    [["Created", app.created], ["Updated", app.updated]].forEach(([label, date]) => {
      if (!date) return;
      const span = document.createElement("span");
      const time = document.createElement("time");
      time.dateTime = date;
      time.textContent = relativeDate(date);
      time.title = formatDate(date);
      span.append(`${label} `, time);
      dates.append(span);
    });

    tile.append(art, title);
    if (dates.childElementCount) tile.append(dates);
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

  // Dates in apps.js are "YYYY-MM-DD", read as local midnight.
  function parseDate(date) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function withinWeek(date) {
    if (!date) return false;
    const age = Date.now() - parseDate(date);
    return age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
  }
  function formatDate(date) {
    return parseDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  // "today", "yesterday", "3 days ago", "2 weeks ago", "1 month ago"; from 2 months on, the date.
  function relativeDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((today - parseDate(date)) / (24 * 60 * 60 * 1000)); // round: DST days aren't 24h
    const ago = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
    if (days < 0 || days >= 60) return formatDate(date);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return ago(days, "day");
    if (days < 30) return ago(Math.floor(days / 7), "week");
    return ago(1, "month");
  }
})();
