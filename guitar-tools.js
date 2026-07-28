(() => {
  const STRINGS = [
    { id: "E2", note: "E", number: 6, label: "Low E", frequency: 82.41 },
    { id: "A2", note: "A", number: 5, label: "A string", frequency: 110.0 },
    { id: "D3", note: "D", number: 4, label: "D string", frequency: 146.83 },
    { id: "G3", note: "G", number: 3, label: "G string", frequency: 196.0 },
    { id: "B3", note: "B", number: 2, label: "B string", frequency: 246.94 },
    { id: "E4", note: "E", number: 1, label: "High E", frequency: 329.63 }
  ];

  const CHORDS = [
    {
      id: "C", name: "C major", family: "major", pattern: "x32010",
      fingers: [{ string: 5, fret: 3, finger: 3 }, { string: 4, fret: 2, finger: 2 }, { string: 2, fret: 1, finger: 1 }],
      copy: "Curve your fingers and let every open string ring clearly.",
      tip: "Keep the third finger close to the third fret and avoid touching the open G string."
    },
    {
      id: "G", name: "G major", family: "major", pattern: "320003",
      fingers: [{ string: 6, fret: 3, finger: 2 }, { string: 5, fret: 2, finger: 1 }, { string: 1, fret: 3, finger: 3 }],
      copy: "Build a wide, relaxed shape and listen for all six strings.",
      tip: "Let your wrist drop slightly so the fingers clear the open middle strings."
    },
    {
      id: "D", name: "D major", family: "major", pattern: "xx0232",
      fingers: [{ string: 3, fret: 2, finger: 1 }, { string: 2, fret: 3, finger: 3 }, { string: 1, fret: 2, finger: 2 }],
      copy: "Make a compact triangle and strum from the D string.",
      tip: "Mute the two thickest strings and keep the first string clear under finger three."
    },
    {
      id: "A", name: "A major", family: "major", pattern: "x02220",
      fingers: [{ string: 4, fret: 2, finger: 1 }, { string: 3, fret: 2, finger: 2 }, { string: 2, fret: 2, finger: 3 }],
      copy: "Place three fingertips close together behind the second fret.",
      tip: "Use the very tips of your fingers so the open high E string can ring."
    },
    {
      id: "E", name: "E major", family: "major", pattern: "022100",
      fingers: [{ string: 5, fret: 2, finger: 2 }, { string: 4, fret: 2, finger: 3 }, { string: 3, fret: 1, finger: 1 }],
      copy: "Keep the first finger light and allow all six strings to ring.",
      tip: "Place fingers two and three close to the second fret to reduce buzzing."
    },
    {
      id: "Am", name: "A minor", family: "minor", pattern: "x02210",
      fingers: [{ string: 4, fret: 2, finger: 2 }, { string: 3, fret: 2, finger: 3 }, { string: 2, fret: 1, finger: 1 }],
      copy: "Use the E-major shape one string lower for a warm minor sound.",
      tip: "Start your strum on the open A string and mute the low E."
    },
    {
      id: "Em", name: "E minor", family: "minor", pattern: "022000",
      fingers: [{ string: 5, fret: 2, finger: 2 }, { string: 4, fret: 2, finger: 3 }],
      copy: "A powerful beginner chord using only two fingers.",
      tip: "Relax both fretting fingers and check that every open string rings."
    },
    {
      id: "Dm", name: "D minor", family: "minor", pattern: "xx0231",
      fingers: [{ string: 3, fret: 2, finger: 2 }, { string: 2, fret: 3, finger: 3 }, { string: 1, fret: 1, finger: 1 }],
      copy: "Form a small triangle and strum from the open D string.",
      tip: "Keep finger one close to the first fret and avoid the two low strings."
    }
  ];

  let selectedChordId = "C";
  let selectedFilter = "all";
  let selectedStringId = "";
  let audioContext = null;
  let microphoneStream = null;
  let analyser = null;
  let sourceNode = null;
  let analysisFrame = 0;
  let lastAnalysisAt = 0;
  let frequencyHistory = [];

  const byId = (id) => document.getElementById(id);

  function stringX(stringNumber) {
    return 28 + ((6 - stringNumber) * 34);
  }

  function chordDiagram(chord, featured = false) {
    const top = 50;
    const fretGap = 34;
    const markerByString = new Map(chord.fingers.map((finger) => [finger.string, finger]));
    const markers = chord.pattern.split("").map((marker, index) => {
      const stringNumber = 6 - index;
      const x = stringX(stringNumber);
      if (marker === "x") return `<text x="${x}" y="28" class="chord-open-marker chord-muted">X</text>`;
      if (marker === "0") return `<circle cx="${x}" cy="22" r="8" class="chord-open-circle" />`;
      return "";
    }).join("");
    const strings = Array.from({ length: 6 }, (_, index) => {
      const x = 28 + (index * 34);
      return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + (fretGap * 5)}" />`;
    }).join("");
    const frets = Array.from({ length: 6 }, (_, index) => {
      const y = top + (index * fretGap);
      return `<line x1="28" y1="${y}" x2="198" y2="${y}" class="${index === 0 ? "chord-nut" : ""}" />`;
    }).join("");
    const fingers = [...markerByString.values()].map((finger) => {
      const x = stringX(finger.string);
      const y = top + ((finger.fret - 0.5) * fretGap);
      return `<g class="chord-finger"><circle cx="${x}" cy="${y}" r="14" /><text x="${x}" y="${y + 1}">${finger.finger}</text></g>`;
    }).join("");
    return `
      <svg class="chord-diagram ${featured ? "is-featured" : ""}" viewBox="0 0 226 242" role="img" aria-label="${chord.name} chord diagram, fingering ${chord.pattern}">
        <g class="chord-grid-lines">${strings}${frets}</g>
        ${markers}${fingers}
        <text x="113" y="235" class="chord-diagram-name">${chord.id}</text>
      </svg>
    `;
  }

  function renderFeaturedChord() {
    const chord = CHORDS.find((item) => item.id === selectedChordId) || CHORDS[0];
    byId("chord-practice-heading").textContent = chord.name;
    byId("chord-practice-copy").textContent = chord.copy;
    byId("featured-chord").innerHTML = chordDiagram(chord, true);
    byId("chord-tip").innerHTML = `<span>Teacher tip</span><p>${chord.tip}</p>`;
  }

  function renderChordLibrary() {
    const visible = CHORDS.filter((chord) => selectedFilter === "all" || chord.family === selectedFilter);
    byId("chord-library-grid").innerHTML = visible.map((chord) => `
      <button class="chord-card ${chord.id === selectedChordId ? "is-selected" : ""}" type="button" data-chord-id="${chord.id}" aria-pressed="${chord.id === selectedChordId}">
        ${chordDiagram(chord)}
        <span><strong>${chord.name}</strong><small>${chord.pattern.toUpperCase()}</small></span>
      </button>
    `).join("");
  }

  function selectChord(chordId) {
    selectedChordId = chordId;
    renderFeaturedChord();
    renderChordLibrary();
    byId("chord-practice-heading")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function rmsLevel(buffer) {
    let sum = 0;
    for (let index = 0; index < buffer.length; index += 1) sum += buffer[index] * buffer[index];
    return Math.sqrt(sum / buffer.length);
  }

  function detectPitch(buffer, sampleRate) {
    if (rmsLevel(buffer) < 0.012) return null;
    const minimumLag = Math.floor(sampleRate / 400);
    const maximumLag = Math.min(Math.floor(sampleRate / 70), buffer.length - 2);
    let bestLag = 0;
    let bestCorrelation = 0;
    const correlations = new Float32Array(maximumLag + 2);

    for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
      let product = 0;
      let energyA = 0;
      let energyB = 0;
      const length = buffer.length - lag;
      for (let index = 0; index < length; index += 1) {
        const first = buffer[index];
        const second = buffer[index + lag];
        product += first * second;
        energyA += first * first;
        energyB += second * second;
      }
      const correlation = product / Math.sqrt((energyA * energyB) || 1);
      correlations[lag] = correlation;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    if (!bestLag || bestCorrelation < 0.62) return null;
    const previousCorrelation = correlations[bestLag - 1] || bestCorrelation;
    const nextCorrelation = correlations[bestLag + 1] || bestCorrelation;
    const denominator = (2 * bestCorrelation) - previousCorrelation - nextCorrelation;
    const adjustment = Math.abs(denominator) > 0.0001
      ? 0.5 * (nextCorrelation - previousCorrelation) / denominator
      : 0;
    return sampleRate / (bestLag + Math.max(-0.5, Math.min(0.5, adjustment)));
  }

  function centsFrom(frequency, targetFrequency) {
    return 1200 * Math.log2(frequency / targetFrequency);
  }

  function matchTarget(frequency) {
    const choices = selectedStringId
      ? STRINGS.filter((string) => string.id === selectedStringId)
      : STRINGS;
    let best = null;
    choices.forEach((string) => {
      const octaveRange = selectedStringId ? [-2, -1, 0, 1, 2] : [0];
      octaveRange.forEach((octave) => {
        const comparisonFrequency = string.frequency * (2 ** octave);
        const cents = centsFrom(frequency, comparisonFrequency);
        if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { string, cents };
      });
    });
    return best;
  }

  function setTunerReading(match, frequency) {
    const display = byId("tuner-display");
    const cents = Math.round(match.cents);
    const absoluteCents = Math.abs(cents);
    const state = absoluteCents <= 5 ? "in-tune" : cents < 0 ? "flat" : "sharp";
    const direction = cents < 0 ? "flat" : "sharp";
    const guidance = state === "in-tune"
      ? `${match.string.label} is in tune.`
      : `${match.string.label} is ${absoluteCents} cents ${direction}. ${direction === "flat" ? "Tighten" : "Loosen"} the tuning peg slightly.`;
    display.dataset.state = state;
    byId("tuner-note").textContent = match.string.note;
    byId("tuner-string-name").textContent = `${match.string.label} · string ${match.string.number}`;
    byId("tuner-frequency").textContent = `${frequency.toFixed(1)} Hz · target ${match.string.frequency.toFixed(1)} Hz`;
    byId("tuner-status").textContent = guidance;
    byId("tuner-needle").style.setProperty("--tuner-cents", String(Math.max(-50, Math.min(50, cents))));
    document.querySelectorAll("[data-tuner-string]").forEach((button) => {
      button.classList.toggle("is-detected", button.dataset.tunerString === match.string.id);
    });
  }

  function setWaitingForPitch() {
    byId("tuner-display").dataset.state = "listening";
    byId("tuner-note").textContent = "--";
    byId("tuner-string-name").textContent = selectedStringId
      ? `Pluck the ${STRINGS.find((string) => string.id === selectedStringId)?.label || "selected string"}`
      : "Listening for one open string";
    byId("tuner-frequency").textContent = "Play a clear note and let it ring";
    byId("tuner-needle").style.setProperty("--tuner-cents", "0");
  }

  function analyse(timestamp) {
    if (!analyser || !audioContext) return;
    analysisFrame = requestAnimationFrame(analyse);
    if (timestamp - lastAnalysisAt < 90) return;
    lastAnalysisAt = timestamp;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const frequency = detectPitch(buffer, audioContext.sampleRate);
    if (!frequency) {
      frequencyHistory = [];
      setWaitingForPitch();
      return;
    }
    frequencyHistory.push(frequency);
    if (frequencyHistory.length > 5) frequencyHistory.shift();
    const smoothed = [...frequencyHistory].sort((a, b) => a - b)[Math.floor(frequencyHistory.length / 2)];
    const match = matchTarget(smoothed);
    if (match) setTunerReading(match, smoothed);
  }

  async function startTuner() {
    if (microphoneStream) return;
    if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
      byId("tuner-status").textContent = "This browser does not support microphone tuning. Open the app in current Chrome, Safari or Edge.";
      byId("tuner-display").dataset.state = "error";
      return;
    }
    const startButton = byId("start-guitar-tuner");
    startButton.disabled = true;
    startButton.textContent = "Opening microphone...";
    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      await audioContext.resume();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      sourceNode = audioContext.createMediaStreamSource(microphoneStream);
      sourceNode.connect(analyser);
      byId("tuner-live-pill").textContent = "Listening";
      byId("tuner-live-pill").classList.add("is-live");
      byId("start-guitar-tuner").hidden = true;
      byId("stop-guitar-tuner").hidden = false;
      setWaitingForPitch();
      analysisFrame = requestAnimationFrame(analyse);
    } catch (error) {
      microphoneStream = null;
      byId("tuner-display").dataset.state = "error";
      byId("tuner-status").textContent = error?.name === "NotAllowedError"
        ? "Microphone access was blocked. Allow microphone access in the browser address-bar settings and try again."
        : "The microphone could not be opened. Close other recording apps and try again.";
    } finally {
      startButton.disabled = false;
      startButton.textContent = "Start tuning";
    }
  }

  async function stopTuner() {
    cancelAnimationFrame(analysisFrame);
    analysisFrame = 0;
    sourceNode?.disconnect();
    microphoneStream?.getTracks().forEach((track) => track.stop());
    if (audioContext && audioContext.state !== "closed") await audioContext.close().catch(() => {});
    sourceNode = null;
    analyser = null;
    microphoneStream = null;
    audioContext = null;
    frequencyHistory = [];
    byId("tuner-live-pill").textContent = "Mic off";
    byId("tuner-live-pill").classList.remove("is-live");
    byId("start-guitar-tuner").hidden = false;
    byId("stop-guitar-tuner").hidden = true;
    byId("tuner-display").dataset.state = "idle";
    byId("tuner-note").textContent = "--";
    byId("tuner-string-name").textContent = "Play one open string";
    byId("tuner-frequency").textContent = "Waiting for microphone";
    byId("tuner-status").textContent = "Tap start, allow microphone access, then pluck one string at a time.";
    byId("tuner-needle").style.setProperty("--tuner-cents", "0");
    document.querySelectorAll("[data-tuner-string]").forEach((button) => button.classList.remove("is-detected"));
  }

  function bind() {
    if (!byId("view-guitar-lab")) return;
    renderFeaturedChord();
    renderChordLibrary();
    byId("start-guitar-tuner").addEventListener("click", startTuner);
    byId("stop-guitar-tuner").addEventListener("click", stopTuner);
    byId("chord-library-grid").addEventListener("click", (event) => {
      const card = event.target.closest("[data-chord-id]");
      if (card) selectChord(card.dataset.chordId);
    });
    document.querySelectorAll("[data-chord-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedFilter = button.dataset.chordFilter;
        document.querySelectorAll("[data-chord-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
        renderChordLibrary();
      });
    });
    document.querySelectorAll("[data-tuner-string]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedStringId = selectedStringId === button.dataset.tunerString ? "" : button.dataset.tunerString;
        document.querySelectorAll("[data-tuner-string]").forEach((item) => item.classList.toggle("is-selected", item.dataset.tunerString === selectedStringId));
        byId("tuner-status").textContent = selectedStringId
          ? `Manual string selected. Pluck the ${STRINGS.find((string) => string.id === selectedStringId)?.label}. Tap it again for automatic detection.`
          : "Automatic string detection is on. Pluck one open string at a time.";
      });
    });

    const view = byId("view-guitar-lab");
    new MutationObserver(() => {
      if (!view.classList.contains("is-active") && microphoneStream) stopTuner();
    }).observe(view, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pagehide", stopTuner);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
