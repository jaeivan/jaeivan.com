(function () {
    var VIDEOS = window.VIDEO_GAP_VIDEOS;
    var BEST_KEY = "video-gap-best"; // { channel id: best streak }

    var pairsEl = document.getElementById("pairs");
    var buttons = pairsEl.querySelectorAll(".pair");
    var streakEl = document.getElementById("streak");
    var bestEl = document.getElementById("best");
    var resultEl = document.getElementById("result");
    var nextBtn = document.getElementById("next");
    window.VIDEO_GAP_CHANNELS.forEach(function (c, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cat";
        btn.dataset.channel = c.id;
        btn.setAttribute("aria-pressed", String(!i));
        btn.textContent = c.emoji + " " + c.label;
        document.getElementById("channels").appendChild(btn);
    });
    var channelButtons = document.querySelectorAll(".cat");
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var channel = window.VIDEO_GAP_CHANNELS[0].id;
    var pool = poolFor(channel);
    var streak = 0;
    var bests = loadBests();
    var round = null; // [{ a, b, gap }, { a, b, gap }]
    var answered = false;
    var nextAt = -Infinity; // when Next was last pressed, so a stray repeat tap or keypress can't answer
    var recent = []; // videos shown lately, so they don't repeat every round

    function poolFor(id) {
        return VIDEOS.filter(function (v) { return v.channel === id; });
    }

    // A video's place on the timeline, in months.
    function pos(v) {
        return v.year * 12 + v.month - 1;
    }

    function gapOf(a, b) {
        return Math.abs(pos(a) - pos(b));
    }

    // Ratio of the longer gap to the shorter one: smaller means harder.
    function band(s) {
        if (s < 3) return [3, Infinity];
        if (s < 6) return [1.8, 3.5];
        if (s < 10) return [1.35, 2];
        return [1.12, 1.5];
    }

    function pick(exclude) {
        var v;
        do {
            v = pool[Math.floor(Math.random() * pool.length)];
        } while (exclude.indexOf(v) !== -1);
        return v;
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
            // Upload dates are only shown to the month, so keep the gaps clearly apart.
            if (Math.abs(p[0].gap - p[1].gap) < 2) continue;

            // Show the earlier video first in each pair.
            p.forEach(function (q) {
                if (pos(q.a) > pos(q.b)) { var t = q.a; q.a = q.b; q.b = t; }
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

    function formatDate(v) {
        return MONTHS[v.month - 1] + " " + v.year;
    }

    function plural(n, unit) {
        return n.toLocaleString("en-US") + " " + unit + (n === 1 ? "" : "s");
    }

    // A gap in months: "4 years, 2 months".
    function span(n) {
        var y = Math.floor(n / 12), m = n % 12;
        if (!y) return plural(m, "month");
        return plural(y, "year") + (m ? ", " + plural(m, "month") : "");
    }

    function escapeHtml(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }

    // The video's YouTube thumbnail, with the emoji as the fallback.
    function iconHtml(v) {
        return '<span class="emoji thumb" aria-hidden="true" data-emoji="' + v.emoji + '">' +
            '<img src="https://i.ytimg.com/vi/' + v.yt + '/mqdefault.jpg" alt="" width="96" height="54"></span>';
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

    function videoHtml(v) {
        return '<span class="event">' +
            iconHtml(v) +
            '<span class="event-text">' + escapeHtml(v.label) +
            '<span class="year">' + formatDate(v) + "</span></span>" +
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
            btn.className = "pair";
            btn.disabled = false;
            btn.setAttribute("aria-label", "Pair " + (i ? "B" : "A") + ": " + q.a.label + ", and " + q.b.label);
            btn.innerHTML =
                '<span class="tag">Pair ' + (i ? "B" : "A") + "</span>" +
                videoHtml(q.a) +
                '<span class="link" aria-hidden="true"></span>' +
                videoHtml(q.b) +
                '<span class="gap"><span class="gap-bar"><span class="gap-fill" data-w="' +
                Math.max(2, (q.gap / longest) * 100) + '"></span></span>' +
                '<span class="gap-text">' + span(q.gap) + " apart</span></span>";
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

        var diff = span(Math.abs(round[0].gap - round[1].gap));
        if (right) {
            streak++;
            if (streak > best()) { bests[channel] = streak; saveBests(); }
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

    function best() {
        return bests[channel] || 0;
    }

    function updateScores() {
        streakEl.textContent = streak;
        bestEl.textContent = best();
    }

    function loadBests() {
        try {
            var b = JSON.parse(localStorage.getItem(BEST_KEY));
            return b && typeof b === "object" ? b : {};
        } catch (e) {
            return {};
        }
    }

    function saveBests() {
        try {
            localStorage.setItem(BEST_KEY, JSON.stringify(bests));
        } catch (e) {}
    }

    function newRound() {
        round = makeRound();
        render();
    }

    buttons.forEach(function (btn, i) {
        btn.addEventListener("click", function () { answer(i); });
    });

    function setChannel(id) {
        if (id === channel) return; // already playing it: keep the current round and streak
        channel = id;
        channelButtons.forEach(function (btn) {
            btn.setAttribute("aria-pressed", String(btn.dataset.channel === id));
        });
        pool = poolFor(id);
        recent = [];

        // A new channel starts a fresh streak.
        streak = 0;
        updateScores();
        newRound();
    }

    // The new round can be taller or shorter than the last one, which would shift the picker
    // below it. Keep the tapped button put under the finger by scrolling by the shift. When the
    // page is too short to scroll that far, hold some extra height until the next round.
    var mainEl = document.querySelector("main");
    channelButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var top = btn.getBoundingClientRect().top;
            setChannel(btn.dataset.channel);
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

    // The game area never shrinks between rounds (dates and gaps hide again, titles get shorter),
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

    // iPhone Safari ignores `touch-action: manipulation` for a double tap on plain content and
    // scrolls to center the tapped section. Cancel the second tap of a quick pair unless it's on
    // something tappable, so a double tap on empty space (or on Next, which hides after the
    // first tap) leaves the page where it is.
    var lastTap = 0;
    document.addEventListener("touchend", function (e) {
        var now = performance.now();
        var quick = now - lastTap < 350;
        lastTap = now;
        if (quick && e.cancelable && !e.target.closest("button:not(:disabled), a, [role='button']")) {
            e.preventDefault();
        }
    }, { passive: false });

    // Title screen (decorative): the play button bounces and blinks while hovered with a mouse; a
    // tap, click, Enter or Space toggles it on so it keeps going, and another stops it (even
    // mid-hover). Swapping the image restarts the GIF, so it's only swapped when the animation
    // really starts or stops, and a stop waits for the current loop to end: the loop ends in the
    // same pose as play-still.gif, so there's no jump.
    var PLAY_LOOP_MS = 2800; // printed by `node video-gap/_tools/play.mjs`
    var play = document.getElementById("play");
    var playImg = play.querySelector("img");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var pHover = false, pToggled = false, pPlaying = false, pStart = 0, pStopTimer;

    function updatePlay() {
        clearTimeout(pStopTimer);
        if ((pHover || pToggled) && !reduceMotion.matches) {
            if (pPlaying) return; // already playing (maybe winding down): keep going
            pPlaying = true;
            pStart = performance.now();
            playImg.src = "play.gif";
        } else if (pPlaying) {
            var untilLoopEnd = PLAY_LOOP_MS - ((performance.now() - pStart) % PLAY_LOOP_MS);
            pStopTimer = setTimeout(function () {
                pPlaying = false;
                playImg.src = "play-still.gif";
            }, untilLoopEnd);
        }
    }
    function togglePlay() {
        pToggled = !pToggled;
        if (!pToggled) pHover = false; // stop even mid-hover; hover resumes on the next mouse-over
        play.setAttribute("aria-pressed", pToggled);
        updatePlay();
    }

    play.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") (pHover = true), updatePlay();
    });
    play.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "mouse") (pHover = false), updatePlay();
    });
    play.addEventListener("pointerup", function (e) {
        if (e.button === 0) togglePlay(); // primary button / touch only
    });
    play.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        togglePlay();
    });
    new Image().src = "play.gif"; // preload so the first hover starts right away

    updateScores();
    newRound();
})();
