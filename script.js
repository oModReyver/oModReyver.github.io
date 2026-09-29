/* =========================================================
   REI — Composer & Producer
   script.js

   Contents:
   1. Mark the page as "JavaScript is running"
   2. Custom audio players
   3. Scroll reveal animation
   4. Placeholder footer links
   5. Footer year
========================================================= */


/* =========================
   1. JAVASCRIPT ENABLED
   Adds a "js" class to <html>. The CSS uses it so that things
   like the reveal animation only happen when this file works.
========================= */

document.documentElement.classList.add("js");


/* =========================
   2. CUSTOM AUDIO PLAYERS
   Every <div class="player"> in index.html holds a normal <audio>
   element. This code hides the browser's default controls and
   builds a nicer play/pause button, progress bar, and timer.
========================= */

// Keeps a list of every audio element so only one plays at a time
const allAudioElements = [];

// Turns seconds (like 75) into a time string (like "1:15")
function formatTime(totalSeconds) {
    if (!isFinite(totalSeconds) || totalSeconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return minutes + ":" + String(seconds).padStart(2, "0");
}

// Builds one custom player
function setupPlayer(player) {
    const audio = player.querySelector("audio");
    const source = player.querySelector("source");
    const title = player.dataset.title || "track";

    // Stop here if the HTML is missing an audio element
    if (!audio) {
        return;
    }

    // Hide the browser's default controls (we are replacing them)
    audio.removeAttribute("controls");
    allAudioElements.push(audio);

    // The card this player sits inside (used for the "playing" highlight)
    const card = player.closest(".track, .commission-card");

    // Build the player's HTML
    const ui = document.createElement("div");
    ui.className = "player-ui";
    ui.innerHTML =
        '<button class="player-button" type="button" aria-label="Play ' + title + '">' +
            '<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>' +
            '<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>' +
        '</button>' +
        '<input class="player-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek in ' + title + '">' +
        '<span class="player-time">' +
            '<span class="time-current">0:00</span> / <span class="time-duration">--:--</span>' +
        '</span>';
    player.appendChild(ui);

    // Find the pieces we just created
    const button = ui.querySelector(".player-button");
    const seek = ui.querySelector(".player-seek");
    const currentTime = ui.querySelector(".time-current");
    const duration = ui.querySelector(".time-duration");

    // ---- Play / pause button ----
    button.addEventListener("click", function () {
        if (audio.paused) {
            // play() can fail (for example if the file is missing), so we catch errors
            audio.play().catch(function () {
                duration.textContent = "Unavailable";
            });
        } else {
            audio.pause();
        }
    });

    // ---- When this track starts, pause every other track ----
    audio.addEventListener("play", function () {
        allAudioElements.forEach(function (otherAudio) {
            if (otherAudio !== audio && !otherAudio.paused) {
                otherAudio.pause();
            }
        });

        document.body.classList.add("is-music-playing");
        player.classList.add("is-playing");
        if (card) {
            card.classList.add("is-playing");
        }
        button.setAttribute("aria-label", "Pause " + title);
    });

    // ---- When it pauses or ends, go back to the "paused" look ----
    function showPausedState() {
        // Stop the big hero disc only when nothing is playing anymore
        const somethingPlaying = allAudioElements.some(function (a) { return !a.paused; });
        if (!somethingPlaying) {
            document.body.classList.remove("is-music-playing");
        }

        player.classList.remove("is-playing");
        if (card) {
            card.classList.remove("is-playing");
        }
        button.setAttribute("aria-label", "Play " + title);
    }

    audio.addEventListener("pause", showPausedState);
    audio.addEventListener("ended", function () {
        audio.currentTime = 0;
        showPausedState();
        updateProgress();
    });

    // ---- Progress bar and current time ----
    function updateProgress() {
        const total = audio.duration;
        const fraction = isFinite(total) && total > 0 ? audio.currentTime / total : 0;

        seek.value = fraction * 1000;
        seek.style.setProperty("--progress", (fraction * 100) + "%");
        currentTime.textContent = formatTime(audio.currentTime);
        seek.setAttribute(
            "aria-valuetext",
            formatTime(audio.currentTime) + " of " + formatTime(total)
        );
    }

    audio.addEventListener("timeupdate", updateProgress);

    // ---- Total length (shown once the browser knows it) ----
    function showDuration() {
        if (isFinite(audio.duration)) {
            duration.textContent = formatTime(audio.duration);
            updateProgress();
        }
    }

    audio.addEventListener("loadedmetadata", showDuration);
    audio.addEventListener("durationchange", showDuration);

    // If the metadata loaded before this code ran, show it right away
    if (audio.readyState >= 1) {
        showDuration();
    }

    // ---- Dragging the progress bar to skip around ----
    seek.addEventListener("input", function () {
        if (isFinite(audio.duration)) {
            audio.currentTime = (seek.value / 1000) * audio.duration;
            updateProgress();
        }
    });

    // ---- If the audio file cannot be loaded, say so ----
    // (errors happen on the <source> tag and do not bubble up to <audio>)
    if (source) {
        source.addEventListener("error", function () {
            duration.textContent = "Unavailable";
            button.disabled = true;
            seek.disabled = true;
        });
    }
}

// Set up every player on the page
document.querySelectorAll(".player").forEach(setupPlayer);


/* =========================
   3. SCROLL REVEAL ANIMATION
   Elements with class "reveal" fade in once when scrolled into view.
========================= */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {

    const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target); // only animate once
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(function (element) {
        revealObserver.observe(element);
    });

} else {
    // Very old browsers: just show everything
    revealElements.forEach(function (element) {
        element.classList.add("is-visible");
    });
}


/* =========================
   4. PLACEHOLDER FOOTER LINKS
   Links marked class="is-placeholder" have no real URL yet,
   so clicking them should do nothing (instead of jumping to the top).
========================= */

document.querySelectorAll("a.is-placeholder").forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
    });
});


/* =========================
   5. FOOTER YEAR
   Keeps the © year up to date automatically.
========================= */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
