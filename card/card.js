// Even Here e-card viewer. A card arrives either packed in the link (after #) or, for short links,
// fetched by its code in card.html and then unpacked the same way.
// The person who receives it needs no app or account.
// Occasions, verses and gifts come from card-gifts.js, generated from the public-domain World English Bible.
const OCCASIONS = window.FW_OCCASIONS || {};

function readCard() {
  try {
    const raw = location.hash.slice(1);
    if (!raw) return null;
    let b64 = raw.trim().replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+/]/g, "");
    while (b64.length % 4) b64 += "=";
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch { return null; }
}
// Remove hidden control characters but keep line breaks. Text is always shown with textContent
// (or escaped), so symbols like "<3" stay as the sender typed them.
const clean = (s, n) => String(s ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").replace(/\n{3,}/g, "\n\n").slice(0, n).trim();
const oneLine = (s) => s.replace(/\s*\n\s*/g, " ");

const card = readCard();
if (!card) {
  // Never show made-up names. Explain kindly and keep the page useful.
  document.body.classList.add("no-card");
  const box = document.getElementById("broken");
  if (box) box.hidden = false;
}
const c = card || { o: "grief", to: "", from: "", tone: "faith" };
const occ = OCCASIONS[c.o] || OCCASIONS.grief;
// Which verse the sender picked (0-2). Old links have no index and use the first.
const vi = Number.isInteger(c.vi) && occ.verses[c.vi] ? c.vi : 0;
const verse = occ.verses[vi];
const to = oneLine(clean(c.to, 40)) || "friend";
const from = oneLine(clean(c.from, 40)) || "A friend";
const tone = c.tone === "gentle" ? "gentle" : "faith";
const msg = clean(c.msg, 400) || occ[tone].replace("{to}", to);
const showVerse = c.v === undefined ? tone === "faith" : !!c.v;

const $ = (id) => document.getElementById(id);
{
  const fl = $("fromLine"), small = document.createElement("small");
  small.textContent = "Tap the seal to open it";
  fl.replaceChildren(document.createTextNode(`${from} sent you a card`), small);
}
$("envTo").textContent = `For ${to}`;
// Some cards have more than one design (added in 1.1). Unknown values fall back to the original art.
const DESIGNS = { birthday: ["lamp", "lilies"] };
const design = (DESIGNS[occ.id] || []).includes(c.a) ? `-${c.a}` : "";
$("art").src = `assets/cards/${occ.id}${design}.jpg`;
$("title").textContent = occ.title;
// Greeting (1.1): the sender can pick "Hi Maya,", write their own, or leave it off. Older cards say "Dear".
const greeting = typeof c.gr === "string" ? oneLine(clean(c.gr, 60)) : `Dear ${to},`;
$("to").textContent = greeting;
$("to").hidden = !greeting;
$("msg").textContent = msg;
// The sender's own verse (1.1) travels only as a reference, like "PSA 23:1-3". The words are read
// from the same public-domain World English Bible files the app uses, so Scripture can't be changed.
// If the verse can't be loaded, the card simply shows no verse rather than one the sender didn't pick.
const OWN = /^([1-3]?[A-Z]{2,3}) (\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/;
const own = typeof c.cv === "string" && c.cv.match(OWN);
function showVerseText(text, ref) { $("verse").hidden = false; $("vtext").textContent = `“${text}”`; $("vref").textContent = ref; }
async function loadOwnVerse([, book, ch, a, e]) {
  const base = new URL("../bible/web/", location.href);
  const meta = await (await fetch(new URL("meta.json", base))).json();
  const info = meta.books[book];
  const from = +a, to = +(e || a), chapter = +ch;
  if (!info || chapter < 1 || chapter > info[1] || from < 1 || to < from || to - from > 5) return;
  const verses = (await (await fetch(new URL(`${book}.json`, base))).json())[chapter - 1] || [];
  if (to > verses.length) return;
  const parts = verses.slice(from - 1, to);
  const title = book === "PSA" && from === 1 ? meta.psalmTitles[String(chapter)] : "";
  if (title && parts[0].startsWith(title)) parts[0] = parts[0].slice(title.length);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return;
  const where = info[1] === 1 ? "" : `${chapter}:`;
  const name = info[0] === "Psalms" ? "Psalm" : info[0];
  showVerseText(text, `${name} ${where}${from}${to > from ? `-${to}` : ""} (WEB)`);
}
if (showVerse && own) loadOwnVerse(own).catch(() => {});
else if (showVerse) showVerseText(verse.text, verse.ref);
$("sig").textContent = `With love, ${from}`;
// Optional prayer. "fw" means Even Here's suggested words, unchanged; "own" means the sender wrote or edited it.
const prayer = clean(c.pr, 1200);
if (prayer) {
  $("prayer").hidden = false;
  $("prText").textContent = prayer;
  $("prTitle").textContent = `A prayer for you, ${to}`;
  $("prBy").textContent = c.pb === "fw" ? `Prayed by ${from}. Words written by Even Here.` : `Written and prayed by ${from}.`;
}
const gift = document.getElementById("gift");
// The sender can leave the readings off (g: 0). Older cards always had them.
if (gift) { if (c.g === 0) gift.hidden = true; else gift.querySelector("b").textContent = occ.gift; }

// Butterflies matched to the occasion: a joyful flutter for celebrations, a few slow ones for
// comfort and quieter holy days, and none on Good Friday.
const JOYFUL = ["justbecause", "thanks", "birthday", "congrats", "graduation", "marriage", "baby", "baptism", "newbeliever", "answered", "newyear", "easter", "mothersday", "fathersday", "thanksgiving", "christmas"];
const NONE = ["goodfriday"];
const WING = ["#D4AF37", "#B8D0B0", "#F7F4EA", "#E9C96A", "#8FB394"];
function butterfly(color) {
  return `<svg class="bfly" viewBox="0 0 34 30" aria-hidden="true"><g class="wl"><path d="M17 15 C10 1, 1 3, 3 11 C4 16, 11 17, 17 15 Z" fill="${color}" stroke="#0F3B2E" stroke-width="1.2"/><path d="M17 16 C11 18, 5 22, 8 27 C11 30, 16 23, 17 16 Z" fill="${color}" stroke="#0F3B2E" stroke-width="1.2"/></g><g class="wr"><path d="M17 15 C24 1, 33 3, 31 11 C30 16, 23 17, 17 15 Z" fill="${color}" stroke="#0F3B2E" stroke-width="1.2"/><path d="M17 16 C23 18, 29 22, 26 27 C23 30, 18 23, 17 16 Z" fill="${color}" stroke="#0F3B2E" stroke-width="1.2"/></g><rect x="16" y="9" width="2" height="15" rx="1" fill="#0F3B2E"/></svg>`;
}
// Sounds: real recorded sounds for each thing that moves (the wax seal, the envelope flap, the card
// sliding out, each butterfly) and a short piece of music matched to the card. The files are original,
// made for Even Here. Nothing plays until the person taps to open, and a Sound button turns it all off.
const SND = "assets/sounds/";
const MUSIC = { christmas: "music-xmas" };
const musicFor = (id) => MUSIC[id] || (JOYFUL.includes(id) ? "music-joy" : "music-gentle");
let audio = null, master = null;
const PHONE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let soundOn = true;
try { soundOn = localStorage.getItem("even-here-card-sound") !== "off"; } catch {}
function wingAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audio) {
      audio = new AC(); master = audio.createGain(); master.gain.value = soundOn ? 1 : 0;
      // A gentle limiter evens out the sounds, then phone speakers get a boost so the seal, the card and the
      // wings sound full on an iPhone instead of thin. Computers stay at normal level.
      const lim = audio.createDynamicsCompressor();
      lim.threshold.value = -24; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
      const boost = audio.createGain(); boost.gain.value = PHONE ? 1.2 : 0.8;
      master.connect(lim); lim.connect(boost); boost.connect(audio.destination);
    }
    if (audio.state === "suspended") audio.resume();
    return audio;
  } catch { return null; }
}
// Fetch the files early so they're ready the moment the card opens; decode once the tap allows audio.
const raw = {};
function prefetch(name) { if (!raw[name]) raw[name] = fetch(SND + name + ".mp3").then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null); return raw[name]; }
const bufs = {};
function buffer(ctx, name) {
  if (!bufs[name]) bufs[name] = prefetch(name).then((ab) => (ab ? new Promise((ok) => ctx.decodeAudioData(ab.slice(0), ok, () => ok(null))) : null));
  return bufs[name];
}
if (card) ["seal", "flap", "slide", musicFor(occ.id)].concat(NONE.includes(occ.id) ? [] : ["wings"]).forEach(prefetch);

// Play a sound `at` seconds after the tap. If it isn't loaded in time, sound effects are skipped
// (so they never play out of step with what's on screen) but music still starts.
function play(ctx, t0, name, { at = 0, gain = 1, rate = 1, pan = 0, panTo = null, dur = null, lateOk = false } = {}) {
  buffer(ctx, name).then((buf) => {
    if (!buf) return;
    let start = t0 + at;
    if (start < ctx.currentTime) { if (!lateOk && ctx.currentTime - start > 0.15) return; start = ctx.currentTime + 0.02; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = gain;
    let node = g;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.setValueAtTime(pan, start);
      if (panTo !== null) p.pan.linearRampToValueAtTime(panTo, start + (dur || buf.duration / rate));
      g.connect(p); node = p;
    }
    node.connect(master);
    src.connect(g);
    if (dur) { g.gain.setValueAtTime(gain, start + dur * 0.6); g.gain.linearRampToValueAtTime(0, start + dur); }
    src.start(start, 0, dur ? dur * rate + 0.05 : undefined);
  });
}
function soundButton() {
  if (document.getElementById("soundBtn")) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "soundBtn"; btn.className = "sound-btn";
  const label = () => { btn.textContent = soundOn ? "Sound on" : "Sound off"; btn.setAttribute("aria-pressed", String(soundOn)); };
  label();
  btn.addEventListener("click", () => {
    soundOn = !soundOn; label();
    try { localStorage.setItem("even-here-card-sound", soundOn ? "on" : "off"); } catch {}
    if (master && audio) master.gain.setTargetAtTime(soundOn ? 1 : 0, audio.currentTime, 0.05);
  });
  document.body.appendChild(btn);
}
// Pause sound if they switch away, and pick up again when they come back.
document.addEventListener("visibilitychange", () => { if (!audio) return; if (document.hidden) audio.suspend(); else audio.resume(); });

function flutter(ctx, t0) {
  if (NONE.includes(occ.id)) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const joyful = JOYFUL.includes(occ.id);
  const count = joyful ? 12 : 4;
  const env = document.querySelector(".envelope").getBoundingClientRect();
  const layer = document.createElement("div"); layer.className = "flutter-layer"; document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement("div");
    wrap.innerHTML = butterfly(WING[i % WING.length]);
    const el = wrap.firstChild; layer.appendChild(el);
    const scale = joyful ? 0.75 + Math.random() * 0.6 : 0.9 + Math.random() * 0.3;
    el.style.setProperty("--flap", `${joyful ? 0.18 + Math.random() * 0.12 : 0.38 + Math.random() * 0.12}s`);
    const x0 = env.left + env.width * (0.3 + Math.random() * 0.4), y0 = env.top + env.height * 0.35;
    const dx = (Math.random() - 0.5) * (joyful ? 360 : 220), dy = -(joyful ? 320 + Math.random() * 320 : 260 + Math.random() * 160);
    const tilt = (Math.random() - 0.5) * 40, dur = joyful ? 2200 + Math.random() * 900 : 3200 + Math.random() * 600;
    const sway = (Math.random() - 0.5) * 80;
    el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(${scale * 0.4}) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${x0 + dx * 0.3 + sway}px, ${y0 + dy * 0.3}px) scale(${scale}) rotate(${tilt}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${x0 + dx * 0.7 - sway}px, ${y0 + dy * 0.7}px) scale(${scale}) rotate(${-tilt / 2}deg)`, opacity: 1, offset: 0.7 },
      { transform: `translate(${x0 + dx}px, ${y0 + dy}px) scale(${scale * 0.9}) rotate(${tilt / 2}deg)`, opacity: 0 },
    ], { duration: dur, delay: i * (joyful ? 70 : 260), easing: "ease-out", fill: "both" });
    // Each butterfly gets its own real wing sound, panned the way it flies. Joyful cards have quicker
    // wings; at most six play at once so a flurry stays clear instead of turning into noise.
    if (ctx && i < (joyful ? 6 : count)) {
      play(ctx, t0, "wings", {
        at: (350 + i * (joyful ? 70 : 260)) / 1000, dur: dur / 1000 * 0.85,
        rate: joyful ? 1.2 + Math.random() * 0.25 : 0.92 + Math.random() * 0.12,
        gain: joyful ? 0.7 : 1, pan: Math.max(-1, Math.min(1, dx / 400)), panTo: Math.max(-1, Math.min(1, dx / 180)),
      });
    }
  }
  setTimeout(() => layer.remove(), 5200);
}

const stage = $("stage");
function open() {
  if (stage.classList.contains("opened")) return;
  stage.classList.add("opened");
  const ctx = card ? wingAudio() : null; // started inside the tap so phones allow it
  const t0 = ctx ? ctx.currentTime : 0;
  if (ctx) {
    soundButton();
    play(ctx, t0, "seal", { at: 0, gain: 1 });
    play(ctx, t0, "flap", { at: 0.12, gain: 0.8 });
    play(ctx, t0, "slide", { at: 0.5, gain: 0.95 });
    play(ctx, t0, musicFor(occ.id), { at: 1.1, gain: 0.6, lateOk: true });
  }
  setTimeout(() => flutter(ctx, t0), 350);
  setTimeout(() => { stage.classList.add("revealed"); window.scrollTo({ top: 0, behavior: "smooth" }); }, 1500);
}
$("open").addEventListener("click", open);
$("openBtn").addEventListener("click", open);
if (new URLSearchParams(location.search).has("open")) { stage.classList.add("opened", "revealed"); }

// Optional readings: seven short ones. All days are open; nothing is tracked or sent anywhere.
const days = (window.FW_GIFTS || {})[c.o] || (window.FW_GIFTS || {}).grief || [];
let day = 0;
function showDay(n) {
  day = Math.max(0, Math.min(days.length - 1, n));
  const d = days[day];
  $("rDay").textContent = `Day ${day + 1} of ${days.length}`;
  $("rText").textContent = `“${d.text}”`;
  $("rRef").textContent = d.ref;
  $("rThought").textContent = d.thought;
  $("rPrev").disabled = day === 0;
  $("rNext").textContent = day === days.length - 1 ? "Back to day 1" : "Next day";
}
$("giftStart").addEventListener("click", () => {
  if (!days.length) return;
  $("giftStart").hidden = true; $("giftNote").hidden = true; $("reader").hidden = false; showDay(0);
});
$("rClose").addEventListener("click", () => {
  $("reader").hidden = true; $("giftStart").hidden = false; $("giftNote").hidden = false;
  $("giftStart").textContent = "Open the readings again";
});
$("rPrev").addEventListener("click", () => showDay(day - 1));
$("rNext").addEventListener("click", () => showDay(day === days.length - 1 ? 0 : day + 1));

// Keepsake: draw the card onto a picture the person can save or share.
// Breaks text into lines that fit. Keeps the sender's line breaks, and splits a very long word
// (like a name with no spaces) across lines instead of letting it run off the edge.
function wrap(ctx, text, x, y, max, lh) {
  const fits = (t) => ctx.measureText(t).width <= max;
  for (const para of String(text).split("\n")) {
    let line = "";
    for (let w of para.split(/ +/)) {
      while (!fits(w)) {
        // Find the longest start of the word that fits on the rest of this line (or a new line).
        const room = line ? line + " " : "";
        let n = 0;
        for (const ch of Array.from(w)) { if (!fits(room + Array.from(w).slice(0, n + 1).join(""))) break; n++; }
        if (n === 0) { if (line) { ctx.fillText(line, x, y); y += lh; line = ""; continue; } n = 1; }
        const chars = Array.from(w);
        ctx.fillText(room + chars.slice(0, n).join(""), x, y); y += lh; line = ""; w = chars.slice(n).join("");
      }
      const t = line ? line + " " + w : w;
      if (!fits(t) && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; } else if (!para) y += lh * 0.6;
  }
  return y;
}
$("keep").addEventListener("click", async () => {
  const btn = $("keep"); btn.disabled = true; btn.textContent = "Making your keepsake…";
  try {
    await document.fonts.ready;
    // Draw on a tall canvas, then crop to the real height, so long cards are never cut off.
    // 1080 x 6000 stays well under iPhone Safari's canvas size limit.
    const W = 1080, H = 6000, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    x.fillStyle = "#FFFDF7"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#F4EEDC"; x.fillRect(0, 0, W, 640);
    const img = $("art");
    if (img.complete && img.naturalWidth) { const s = Math.min(1000 / img.naturalWidth, 600 / img.naturalHeight); const w = img.naturalWidth * s, h = img.naturalHeight * s; x.drawImage(img, (W - w) / 2, 20 + (600 - h) / 2, w, h); }
    x.textAlign = "center"; x.fillStyle = "#0F3B2E"; x.font = "700 64px 'Playfair Display', Georgia, serif";
    let y = wrap(x, occ.title, W / 2, 740, 920, 76);
    x.fillStyle = "#8a6a12"; x.font = "600 34px Inter, sans-serif"; if (greeting) { y = wrap(x, greeting, W / 2, y + 10, 920, 46) + 24; } else y += 20;
    x.fillStyle = "#14231d"; x.font = "400 36px Inter, sans-serif"; y = wrap(x, msg, W / 2, y, 900, 52);
    if (showVerse) { const vt = $("vtext").textContent || `“${verse.text}”`, vr = $("vref").textContent || verse.ref; x.fillStyle = "#0F3B2E"; x.font = "italic 500 32px 'Playfair Display', Georgia, serif"; y = wrap(x, vt, W / 2, y + 30, 880, 46); x.fillStyle = "#4f6f55"; x.font = "700 26px Inter, sans-serif"; y = wrap(x, vr, W / 2, y + 6, 880, 34) + 16; }
    if (prayer) { x.fillStyle = "#8a6a12"; x.font = "700 24px Inter, sans-serif"; x.fillText("A PRAYER FOR YOU", W / 2, y + 30); x.fillStyle = "#14231d"; x.font = "400 30px Inter, sans-serif"; y = wrap(x, prayer, W / 2, y + 76, 880, 42) + 10; }
    x.fillStyle = "#0F3B2E"; x.font = "italic 600 44px 'Playfair Display', Georgia, serif"; y = wrap(x, `With love, ${from}`, W / 2, y + 60, 920, 56) - 116;
    const FH = Math.min(H, Math.max(1350, y + 170));
    x.fillStyle = "#4d5c55"; x.font = "500 22px Inter, sans-serif"; x.fillText("Sent with Even Here", W / 2, FH - 40);
    const out = document.createElement("canvas"); out.width = W; out.height = FH; out.getContext("2d").drawImage(cv, 0, 0);
    const blob = await new Promise((r) => out.toBlob(r, "image/png"));
    const file = new File([blob], `card-from-${from.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "a-friend"}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: occ.title }); }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    btn.textContent = "Saved";
  } catch { btn.textContent = "Save this card"; }
  finally { btn.disabled = false; setTimeout(() => { btn.textContent = "Save this card"; }, 2500); }
});

// Card replies (1.1): the person who opens a short-link card can send ONE reply, a short choice or a few
// words they write (up to 300 characters). No account. Opening the card is never reported; only a sent
// reply is saved, and only the sender's app can read it. Replies are never sent to AI.
(function cardReply() {
  const box = document.getElementById("amen");
  const sb = window.FW_SB;
  const code = (new URLSearchParams(location.search).get("c") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  // "See it the way they will" in the app adds ?preview=1 to a card link that has no code,
  // so the sender sees the reply buttons grayed out instead of nothing.
  const preview = code.length !== 10 && new URLSearchParams(location.search).has("preview");
  if (!box || !card || (!preview && (!sb || code.length !== 10))) return;
  const HEART = `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="#C8463F"/></svg>`;
  const HEARTS = `<span class="hearts">${HEART}${HEART}</span>`;
  const PEN = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const WORDS = { amen: "Amen", praying: "I'm praying for you too", thanks: "Thank you", appreciate: "I appreciate you", thinking: "Thank you for thinking of me" };
  const MAX = 300;
  // Same crisis words the app listens for. If they show up, 988 comes first.
  const CRISIS = [/\bsuicid/, /\bkill(ing)? my ?self\b/, /\bend my life\b/, /\btake my (own )?life\b/, /\bwant(ed)? to die\b/, /\bwish i (was|were) dead\b/,
    /\bdon'?t want to (live|be alive|be here)( anymore)?\b/, /\bno reason to live\b/, /\bbetter off (dead|without me)\b/, /\bself[- ]?harm/, /\bcut(ting)? my ?self\b/,
    /\bhurt(ing)? my ?self\b/, /\bdon'?t want to wake up\b/];
  const crisis = (t) => { const n = " " + String(t).toLowerCase().replace(/[\u2019']/g, "'").replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ") + " "; return CRISIS.some((r) => r.test(n)); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const name = esc(from);
  const store = `even-here-replied-${code}`;
  const rpc = (fn, body) => fetch(`${sb.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: sb.key, Authorization: `Bearer ${sb.key}` },
    body: JSON.stringify(body),
  }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

  function showDone(reply, note) {
    const said = reply === "hearts" ? HEARTS : reply === "note" ? `“${esc(note || "")}”` : `“${esc(WORDS[reply] || "")}”`;
    box.innerHTML = `<div class="done"><div class="check"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#0F3B2E" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h2>Sent to ${name}</h2><p class="said${reply === "note" ? " note" : ""}">${said}</p><p class="sub" style="margin:8px 0 0">${name} will see it in Even Here. Each card gets one reply.</p></div>`;
    box.hidden = false;
  }
  function showAsk(isPreview = false) {
    // Gentle cards are for anyone, including people who may not believe, so they skip "praying".
    const faith = tone === "faith";
    const head = isPreview
      ? `<h2>${esc(to)} can send you a reply</h2><p class="sub">This is your preview. Only ${esc(to)} can tap these or write back, from the card you send.</p>`
      : `<h2>Send ${name} a reply?</h2><p class="sub">Tap one, or write your own. You don't have to.</p>`;
    box.innerHTML = `${head}
      <div class="opts">
        <div class="row"><button type="button" class="primary" data-r="thanks">Thank you</button><button type="button" class="heart" data-r="hearts" aria-label="Send two red hearts">${HEARTS}</button></div>
        <button type="button" data-r="appreciate">I appreciate you</button>
        ${faith ? `<button type="button" data-r="praying">I'm praying for you too</button>` : ""}
        <button type="button" class="write" data-w>${PEN}<span>Write your own reply</span></button>
      </div>
      <div class="compose" hidden>
        <label for="reply-note" class="lbl">Your reply to ${name}</label>
        <textarea id="reply-note" rows="4" maxlength="${MAX}" placeholder="Say it in your own words"></textarea>
        <div class="count" aria-live="polite"><span>0</span> / ${MAX}</div>
        <div class="help" hidden role="alert">
          <strong>You matter, and you don't have to carry this alone.</strong>
          If you're thinking about ending your life or hurting yourself, call or text <a href="tel:988">988</a> now to talk with someone (US, free, any time). If you're in danger, call <a href="tel:911">911</a>.
          <span class="trusted">You can also reach out to a pastor, family member or friend you trust. Ask them to stay with you and help you call for help, or to make the call for you.
          <a class="trusted-btn" href="sms:&body=${encodeURIComponent("I'm not okay right now. Can you call me or come be with me, and help me reach someone who can help?")}">Text someone now</a></span>
        </div>
        <div class="row"><button type="button" data-cancel>Back</button><button type="button" class="primary" data-send disabled>Send reply</button></div>
      </div>
      ${isPreview ? "" : `<p class="fine">${name} will only see the reply you send. Opening this card is never reported to anyone.</p>`}`;
    box.hidden = false;
    if (isPreview) { box.classList.add("preview"); box.querySelectorAll("button").forEach((b) => { b.disabled = true; b.setAttribute("aria-disabled", "true"); }); return; }
    const opts = box.querySelector(".opts"), compose = box.querySelector(".compose"), ta = box.querySelector("textarea");
    const count = box.querySelector(".count span"), help = box.querySelector(".help"), sendBtn = box.querySelector("[data-send]");
    box.querySelectorAll("button[data-r]").forEach((b) => b.addEventListener("click", () => send(b.dataset.r)));
    box.querySelector("[data-w]").addEventListener("click", () => { opts.hidden = true; compose.hidden = false; ta.focus(); });
    box.querySelector("[data-cancel]").addEventListener("click", () => { compose.hidden = true; opts.hidden = false; box.querySelector(".err")?.remove(); });
    ta.addEventListener("input", () => {
      count.textContent = String(ta.value.length);
      sendBtn.disabled = !ta.value.trim();
      help.hidden = !crisis(ta.value);
    });
    sendBtn.addEventListener("click", () => send("note", ta.value.trim().slice(0, MAX)));
  }
  function send(reply, note) {
    box.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    box.querySelector(".err")?.remove();
    rpc("reply_to_card_v2", { p_id: code, p_reply: reply, p_note: reply === "note" ? note : null }).then((res) => {
      if (res === "sent") {
        try { localStorage.setItem(store, reply === "note" ? `note:${note}` : reply); } catch {}
        showDone(reply, note);
      }
      else if (res === "already") { box.innerHTML = `<h2>A reply was already sent</h2><p class="sub" style="margin-bottom:0">Each card gets one reply.</p>`; }
      else box.hidden = true;
    }).catch(() => {
      box.querySelectorAll("button").forEach((b) => { b.disabled = false; });
      const sendBtn = box.querySelector("[data-send]"), ta = box.querySelector("textarea");
      if (sendBtn && ta) sendBtn.disabled = !ta.value.trim();
      box.insertAdjacentHTML("beforeend", `<p class="err">Couldn't send just now. Check your connection and try again.</p>`);
    });
  }
  if (preview) { showAsk(true); return; }
  let mine = null;
  try { mine = localStorage.getItem(store); } catch {}
  rpc("card_reply_state", { p_id: code }).then((state) => {
    if (state === "open") showAsk();
    else if (state === "replied" && mine) { if (mine.startsWith("note:")) showDone("note", mine.slice(5)); else showDone(mine); }
  }).catch(() => {});
})();
