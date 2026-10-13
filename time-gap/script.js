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

    function eventHtml(e) {
        return '<span class="event">' +
            '<span class="emoji" aria-hidden="true">' + e.emoji + "</span>" +
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
            btn.className = "pair";
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
        });
    }

    function answer(i) {
        if (answered) return;
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
        nextBtn.focus();
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

    catButtons.forEach(function (btn) {
        btn.addEventListener("click", function () { setCategory(btn.dataset.cat); });
    });

    nextBtn.addEventListener("click", function () {
        newRound();
        buttons[0].focus();
    });

    updateScores();
    newRound();
})();
