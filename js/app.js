(function () {
  "use strict";

  var audioCtx = null;
  var toastTimer = null;

  var TOASTS = {
    board: "carve check — edges biting, powder smiling",
    coach: "whistle tweet! lesson mode unlocked",
    freestyle: "ollie pop + rail clack. park energy",
    theater: "spotlight warm. Adelaide enters stage left",
    calc: "beep-beep-FIVE. AP Calc flex",
    aps: "five APs humming. brain fans on",
    bake: "oven ding. frosting swirl incoming",
    unh: "Wildcat purr. probably going to UNH"
  };

  function ensureAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function tone(ctx, freq, type, start, dur, gainPeak, freqEnd) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), start + dur);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak || 0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function noiseBurst(ctx, start, dur, peak, bandFreq) {
    var frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = bandFreq || 1200;
    filter.Q.value = 0.8;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak || 0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  var SOUNDS = {
    board: function (ctx, t) {
      // edge carve whoosh + soft powder hiss
      tone(ctx, 720, "sawtooth", t, 0.4, 0.055, 140);
      noiseBurst(ctx, t, 0.42, 0.16, 750);
      tone(ctx, 320, "sine", t + 0.18, 0.22, 0.06, 90);
      noiseBurst(ctx, t + 0.25, 0.12, 0.08, 2200);
    },
    coach: function (ctx, t) {
      // coach whistle tweet + chirp
      tone(ctx, 1680, "sine", t, 0.09, 0.14);
      tone(ctx, 2100, "sine", t + 0.07, 0.12, 0.12);
      tone(ctx, 1680, "triangle", t + 0.2, 0.1, 0.1);
      tone(ctx, 2400, "sine", t + 0.32, 0.08, 0.07, 2800);
    },
    freestyle: function (ctx, t) {
      // ollie pop + metal rail clack
      noiseBurst(ctx, t, 0.05, 0.22, 400);
      tone(ctx, 90, "triangle", t, 0.08, 0.14);
      tone(ctx, 1400, "square", t + 0.1, 0.05, 0.09);
      noiseBurst(ctx, t + 0.16, 0.04, 0.18, 3200);
      tone(ctx, 880, "triangle", t + 0.22, 0.12, 0.08, 440);
      tone(ctx, 660, "sine", t + 0.34, 0.15, 0.06);
    },
    theater: function (ctx, t) {
      // curtain swish + warm spotlight chord
      noiseBurst(ctx, t, 0.18, 0.1, 600);
      tone(ctx, 392, "sine", t + 0.08, 0.28, 0.11);
      tone(ctx, 493.88, "triangle", t + 0.14, 0.3, 0.1);
      tone(ctx, 587.33, "sine", t + 0.2, 0.35, 0.09);
      tone(ctx, 784, "sine", t + 0.28, 0.4, 0.07);
    },
    calc: function (ctx, t) {
      // calculator beeps landing on triumphant 5 vibes
      tone(ctx, 880, "square", t, 0.07, 0.08);
      tone(ctx, 988, "square", t + 0.09, 0.07, 0.08);
      tone(ctx, 1175, "square", t + 0.18, 0.07, 0.08);
      tone(ctx, 1319, "square", t + 0.28, 0.18, 0.12);
      tone(ctx, 659, "sine", t + 0.3, 0.25, 0.07);
    },
    aps: function (ctx, t) {
      // five bright study pings (one per AP)
      for (var i = 0; i < 5; i++) {
        tone(ctx, 523.25 + i * 55, "triangle", t + i * 0.07, 0.1, 0.09);
      }
      tone(ctx, 1046.5, "sine", t + 0.4, 0.22, 0.08);
    },
    bake: function (ctx, t) {
      // oven ding + soft frosting swirl
      tone(ctx, 830, "sine", t, 0.14, 0.12);
      tone(ctx, 1245, "sine", t + 0.12, 0.2, 0.1);
      tone(ctx, 415, "triangle", t + 0.28, 0.25, 0.08, 280);
      noiseBurst(ctx, t + 0.35, 0.1, 0.06, 1800);
    },
    unh: function (ctx, t) {
      // soft wildcat-ish purr + hopeful rising third
      tone(ctx, 110, "sawtooth", t, 0.28, 0.08, 80);
      noiseBurst(ctx, t + 0.05, 0.2, 0.07, 300);
      tone(ctx, 349.23, "sine", t + 0.22, 0.22, 0.1);
      tone(ctx, 440, "triangle", t + 0.34, 0.25, 0.1);
      tone(ctx, 523.25, "sine", t + 0.46, 0.3, 0.09);
    }
  };

  function playSound(name) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var fn = SOUNDS[name];
    if (!fn) return;
    try {
      fn(ctx, ctx.currentTime + 0.01);
    } catch (e) {
      /* ignore audio glitches on weird mobile states */
    }
  }

  function showToast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 1600);
  }

  function wiggle(card) {
    card.classList.remove("wiggle");
    void card.offsetWidth;
    card.classList.add("wiggle");
    window.setTimeout(function () {
      card.classList.remove("wiggle");
    }, 600);
  }

  function onActivate(card) {
    var name = card.getAttribute("data-sound");
    if (!name) return;
    playSound(name);
    wiggle(card);
    showToast(TOASTS[name] || "boop");
  }

  function init() {
    var cards = document.querySelectorAll(".icon-card[data-sound]");
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        onActivate(card);
      });
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onActivate(card);
        }
      });
    });
    var unlock = function () {
      ensureAudio();
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("click", unlock);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
