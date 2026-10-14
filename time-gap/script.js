(function () {
    var EVENTS = window.TIME_GAP_EVENTS;
    var BEST_KEY = "time-gap-best";

    var pairsEl = document.getElementById("pairs");
    var buttons = pairsEl.querySelectorAll(".pair");
    var streakEl = document.getElementById("streak");
    var bestEl = document.getElementById("best");
    var resultEl = document.getElementById("result");
    var nextBtn = document.getElementById("next");
    var noteEl = document.getElementById("note");
    var CATS = {};
    window.TIME_GAP_CATEGORIES.forEach(function (c) {
        CATS[c.id] = c;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cat" + (c.special ? " cat-special" : "");
        btn.dataset.cat = c.id;
        btn.setAttribute("aria-pressed", "false");
        btn.textContent = c.emoji + " " + c.label;
        document.getElementById(c.special ? "special" : "cats").appendChild(btn);
    });
    var catButtons = document.querySelectorAll(".cat");
    var realCount = window.TIME_GAP_CATEGORIES.filter(function (c) { return !c.special; }).length;

    // Random means every regular event; special categories are only played on their own.
    var REAL = EVENTS.filter(function (e) { return !CATS[e.cat].special; });
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var streak = 0;
    var best = loadBest();
    var round = null; // [{ a, b, gap }, { a, b, gap }]
    var answered = false;
    var nextAt = -Infinity; // when Next was last pressed, so a stray repeat tap or keypress can't answer
    var recent = []; // events shown lately, so they don't repeat every round
    var cats = []; // chosen categories; empty means Random (every real-world category)
    var pool = REAL;

    function monthly(e) {
        return CATS[e.cat].dates === "month";
    }

    // An event's place on the timeline: in months for month-dated categories, else years.
    // Real years have no year 0, so 1 BC is followed directly by AD 1; the fictional
    // calendars (and BC-free month dates) count straight through.
    function pos(e) {
        if (monthly(e)) return e.year * 12 + e.month - 1;
        return e.year < 0 && !CATS[e.cat].dates ? e.year + 1 : e.year;
    }

    function gapOf(a, b) {
        return Math.abs(pos(a) - pos(b));
    }

    // How far off an "approx" date might be (in the same units as pos), so a round never hinges on it.
    function fuzz(e) {
        if (!e.approx) return 0;
        if (e.fuzz !== undefined) return e.fuzz;
        if (monthly(e)) return 2;
        return e.year < 0 ? 100 : 25;
    }

    // Ratio of the longer gap to the shorter one: smaller means harder.
    function band(s) {
        if (s < 3) return [3, Infinity];
        if (s < 6) return [1.8, 3.5];
        if (s < 10) return [1.35, 2];
        return [1.12, 1.5];
    }

    function pick(exclude) {
        var e;
        do {
            e = pool[Math.floor(Math.random() * pool.length)];
        } while (exclude.indexOf(e) !== -1);
        return e;
    }

    function makeRound() {
        var range = band(streak);
        var fallback = null;
        for (var tries = 0; tries < 4000; tries++) {
            var used = tries < 3000 ? recent.slice() : [];
            var four = [];
            for (var k = 0; k < 4; k++) four.push(pick(used.concat(four)));

            var p = [
                { a: four[0], b: four[1], gap: gapOf(four[0], four[1]) },
                { a: four[2], b: four[3], gap: gapOf(four[2], four[3]) },
            ];
            if (!p[0].gap || !p[1].gap) continue;

            var diff = Math.abs(p[0].gap - p[1].gap);
            var slack = four.reduce(function (sum, e) { return sum + fuzz(e); }, 0);
            if (diff < Math.max(2, slack)) continue;

            // Show the earlier event first in each pair.
            p.forEach(function (q) {
                if (q.a.year > q.b.year) { var t = q.a; q.a = q.b; q.b = t; }
            });

            var ratio = Math.max(p[0].gap, p[1].gap) / Math.min(p[0].gap, p[1].gap);
            if (ratio >= range[0] && ratio <= range[1]) return remember(p, four);
            if (!fallback) fallback = { p: p, four: four };
        }
        return remember(fallback.p, fallback.four);
    }

    function remember(p, four) {
        // Small pools can't skip as many, or there'd be nothing left to pick from.
        var keep = Math.min(16, pool.length - 8);
        recent = keep > 0 ? recent.concat(four).slice(-keep) : [];
        return p;
    }

    function formatYear(e) {
        var dates = CATS[e.cat].dates;
        var y;
        if (dates === "imperial") {
            // 40999 → 999.M41; rough dates only give the millennium
            var m = "M" + (Math.floor(e.year / 1000) + 1);
            y = e.approx ? m : String(e.year % 1000).padStart(3, "0") + "." + m;
        } else if (dates === "month") {
            y = MONTHS[e.month - 1] + " " + e.year;
        } else if (dates === "yavin") {
            y = e.year > 0 ? e.year.toLocaleString("en-US") + " ABY" : (-e.year).toLocaleString("en-US") + " BBY";
        } else if (dates === "age") {
            y = "Age " + e.year;
        } else {
            y = e.year < 0 ? -e.year + " BC" : e.year < 1000 ? "AD " + e.year : String(e.year);
        }
        return (e.approx ? "c. " : "") + y;
    }

    function plural(n, unit) {
        return n.toLocaleString("en-US") + " " + unit + (n === 1 ? "" : "s");
    }

    // A gap in years, or in months for month-dated categories: "4 years, 2 months".
    function span(n, inMonths) {
        if (!inMonths) return plural(n, "year");
        var y = Math.floor(n / 12), m = n % 12;
        if (!y) return plural(m, "month");
        return plural(y, "year") + (m ? ", " + plural(m, "month") : "");
    }

    function formatGap(q) {
        var about = q.a.approx || q.b.approx ? "about " : "";
        return about + span(q.gap, monthly(q.a)) + " apart";
    }

    // Video events show their YouTube thumbnail; the emoji rides along as the fallback.
    function iconHtml(e) {
        if (!e.yt) return '<span class="emoji" aria-hidden="true">' + e.emoji + "</span>";
        return '<span class="emoji thumb" aria-hidden="true" data-emoji="' + e.emoji + '">' +
            '<img src="https://i.ytimg.com/vi/' + e.yt + '/mqdefault.jpg" alt="" width="96" height="54"></span>';
    }

    // YouTube answers a missing video with a 120×90 grey placeholder instead of an error.
    function watchThumbs(root) {
        root.querySelectorAll(".thumb img").forEach(function (img) {
            function fallback() {
                var box = img.parentNode;
                if (!box) return;
                box.classList.remove("thumb");
                box.textContent = box.dataset.emoji;
            }
            function check() {
                if (img.naturalWidth <= 120) fallback();
            }
            img.addEventListener("error", fallback);
            if (img.complete) check(); else img.addEventListener("load", check);
        });
    }

    function eventHtml(e) {
        return '<span class="event">' +
            iconHtml(e) +
            '<span class="event-text">' + e.label +
            '<span class="year">' + formatYear(e) + "</span></span>" +
            "</span>";
    }

    function render() {
        answered = false;
        pairsEl.classList.remove("revealed");
        resultEl.textContent = "";
        resultEl.className = "result";
        nextBtn.hidden = true;

        var longest = Math.max(round[0].gap, round[1].gap);
        buttons.forEach(function (btn, i) {
            var q = round[i];
            // Thumbnails are wider than emoji, so a pair with any uses wide icon boxes.
            btn.className = "pair" + (q.a.yt || q.b.yt ? " has-thumbs" : "");
            btn.disabled = false;
            btn.setAttribute("aria-label", "Pair " + (i ? "B" : "A") + ": " + q.a.label + ", and " + q.b.label);
            btn.innerHTML =
                '<span class="tag">Pair ' + (i ? "B" : "A") + "</span>" +
                eventHtml(q.a) +
                '<span class="link" aria-hidden="true"></span>' +
                eventHtml(q.b) +
                '<span class="gap"><span class="gap-bar"><span class="gap-fill" data-w="' +
                Math.max(2, (q.gap / longest) * 100) + '"></span></span>' +
                '<span class="gap-text">' + formatGap(q) + "</span></span>";
            watchThumbs(btn);
        });
    }

    function answer(i) {
        // Focus lands on Pair A after Next, so a double press of Enter or a double tap on Next
        // would otherwise answer the new round before it's even been read.
        if (answered || performance.now() - nextAt < 300) return;
        answered = true;

        var closer = round[0].gap < round[1].gap ? 0 : 1;
        var right = i === closer;

        pairsEl.classList.add("revealed");
        buttons.forEach(function (btn, j) {
            btn.disabled = true;
            btn.removeAttribute("aria-label");
            btn.classList.add(j === closer ? "is-closer" : "is-farther");
            if (j === i) btn.classList.add("is-picked");
            var fill = btn.querySelector(".gap-fill");
            // Next frame, so the bar animates from 0.
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { fill.style.width = fill.dataset.w + "%"; });
            });
        });

        var diff = span(Math.abs(round[0].gap - round[1].gap), monthly(round[0].a));
        if (right) {
            streak++;
            if (streak > best) { best = streak; saveBest(best); }
            resultEl.textContent = "Correct! Pair " + (closer ? "B" : "A") + " is " + diff + " closer.";
            resultEl.classList.add("is-right");
            nextBtn.textContent = "Next";
        } else {
            resultEl.textContent = "Not quite. Pair " + (closer ? "B" : "A") + " is " + diff +
                " closer." +
                (streak ? " Your streak was " + streak + "." : "");
            resultEl.classList.add("is-wrong");
            streak = 0;
            nextBtn.textContent = "Play again";
        }
        updateScores();
        nextBtn.hidden = false;
        // The page never scrolls by itself: on phones the game fills the screen with Next at the
        // bottom (styles.css), so it's already in view.
        nextBtn.focus({ preventScroll: true });
    }

    function updateScores() {
        streakEl.textContent = streak;
        bestEl.textContent = best;
    }

    function loadBest() {
        try {
            return parseInt(localStorage.getItem(BEST_KEY), 10) || 0;
        } catch (e) {
            return 0;
        }
    }

    function saveBest(n) {
        try {
            localStorage.setItem(BEST_KEY, String(n));
        } catch (e) {}
    }

    function newRound() {
        round = makeRound();
        render();
    }

    buttons.forEach(function (btn, i) {
        btn.addEventListener("click", function () { answer(i); });
    });

    function setCategory(cat) {
        if (cat === "random") {
            if (!cats.length) return; // already Random: keep the current round and streak
            cats = [];
        } else if (cats.indexOf(cat) !== -1) {
            cats = cats.filter(function (c) { return c !== cat; });
        } else if (CATS[cat].special) {
            cats = [cat]; // special categories are played on their own
        } else {
            cats = cats.filter(function (c) { return !CATS[c].special; }).concat(cat);
        }
        // Every real-world category picked is the same as Random.
        if (cats.length === realCount) cats = [];

        catButtons.forEach(function (btn) {
            var c = btn.dataset.cat;
            btn.setAttribute("aria-pressed", String(c === "random" ? !cats.length : cats.indexOf(c) !== -1));
        });
        pool = cats.length ? EVENTS.filter(function (e) { return cats.indexOf(e.cat) !== -1; }) : REAL;
        var special = cats.length === 1 && CATS[cats[0]].special ? CATS[cats[0]] : null;
        noteEl.hidden = !(special && special.note);
        noteEl.textContent = special && special.note ? special.note : "";
        recent = [];

        // A new set of events starts a fresh streak.
        streak = 0;
        updateScores();
        newRound();
    }

    // The new round can be taller or shorter than the last one, which would shift the picker
    // below it. Keep the tapped button put under the finger by scrolling by the shift. When the
    // page is too short to scroll that far, hold some extra height until the next round.
    var mainEl = document.querySelector("main");
    catButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var top = btn.getBoundingClientRect().top;
            setCategory(btn.dataset.cat);
            var shift = btn.getBoundingClientRect().top - top;
            // Grew: make room below so the page can scroll down far enough.
            var short = window.scrollY + window.innerHeight + shift - document.documentElement.scrollHeight;
            if (shift > 0 && short > 0) mainEl.style.minHeight = mainEl.offsetHeight + short + "px";
            window.scrollBy(0, shift);
            // Shrank near the top: keep the game area tall instead.
            var left = top - btn.getBoundingClientRect().top;
            if (left > 0.5) pairsEl.style.minHeight = pairsEl.offsetHeight + left + "px";
        });
    });

    // The game area never shrinks between rounds (years and gaps hide again, labels get shorter),
    // so Next stays put and the picker can't slide up under a finger still tapping where Next was.
    // Heights held for one width are wrong for another (a rotated phone puts the pairs side by side).
    var heldWidth = window.innerWidth;
    window.addEventListener("resize", function () {
        if (window.innerWidth === heldWidth) return; // phones resize on scroll as the toolbar hides
        heldWidth = window.innerWidth;
        pairsEl.style.minHeight = mainEl.style.minHeight = "";
    });

    nextBtn.addEventListener("click", function () {
        nextAt = performance.now();
        mainEl.style.minHeight = "";
        pairsEl.style.minHeight = pairsEl.offsetHeight + "px";
        newRound();
        buttons[0].focus({ preventScroll: true });
    });

    // Title hourglass (decorative): runs its sand out and flips while hovered with a mouse; a tap,
    // click, Enter or Space toggles it on so it keeps going, and another stops it (even mid-hover).
    // Swapping the image restarts the GIF, so it's only swapped when the animation really starts
    // or stops, and a stop waits for the current loop to end: the loop ends with the flip back to
    // the same pose as hourglass-still.gif, so there's no jump.
    var HOURGLASS_LOOP_MS = 4720; // printed by `node time-gap/_tools/hourglass.mjs`
    var hourglass = document.getElementById("hourglass");
    var hourglassImg = hourglass.querySelector("img");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var hgHover = false, hgToggled = false, hgPlaying = false, hgStart = 0, hgStopTimer;

    function updateHourglass() {
        clearTimeout(hgStopTimer);
        if ((hgHover || hgToggled) && !reduceMotion.matches) {
            if (hgPlaying) return; // already playing (maybe winding down): keep going
            hgPlaying = true;
            hgStart = performance.now();
            hourglassImg.src = "hourglass.gif";
        } else if (hgPlaying) {
            var untilLoopEnd = HOURGLASS_LOOP_MS - ((performance.now() - hgStart) % HOURGLASS_LOOP_MS);
            hgStopTimer = setTimeout(function () {
                hgPlaying = false;
                hourglassImg.src = "hourglass-still.gif";
            }, untilLoopEnd);
        }
    }
    function toggleHourglass() {
        hgToggled = !hgToggled;
        if (!hgToggled) hgHover = false; // stop even mid-hover; hover resumes on the next mouse-over
        hourglass.setAttribute("aria-pressed", hgToggled);
        updateHourglass();
    }

    hourglass.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") (hgHover = true), updateHourglass();
    });
    hourglass.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "mouse") (hgHover = false), updateHourglass();
    });
    hourglass.addEventListener("pointerup", function (e) {
        if (e.button === 0) toggleHourglass(); // primary button / touch only
    });
    hourglass.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        toggleHourglass();
    });
    new Image().src = "hourglass.gif"; // preload so the first hover starts right away

    updateScores();
    newRound();
})();
