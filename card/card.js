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
const clean = (s, n) => String(s ?? "").replace(/[<>]/g, "").slice(0, n).trim();

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
const to = clean(c.to, 40) || "friend";
const from = clean(c.from, 40) || "A friend";
const tone = c.tone === "gentle" ? "gentle" : "faith";
const msg = clean(c.msg, 400) || occ[tone].replace("{to}", to);
const showVerse = c.v === undefined ? tone === "faith" : !!c.v;

const $ = (id) => document.getElementById(id);
$("fromLine").innerHTML = `${from} sent you a card<small>Tap the seal to open it</small>`;
$("envTo").textContent = `For ${to}`;
// Some cards have more than one design (added in 1.1). Unknown values fall back to the original art.
const DESIGNS = { birthday: ["lamp", "lilies"] };
const design = (DESIGNS[occ.id] || []).includes(c.a) ? `-${c.a}` : "";
$("art").src = `assets/cards/${occ.id}${design}.jpg`;
$("title").textContent = occ.title;
$("to").textContent = `Dear ${to},`;
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
// Wing sounds: soft, papery flaps made in the browser (no audio file). Each butterfly flaps at the
// same speed its wings move on screen, drifting left or right with it, and fades as it flies off.
// Plays only after the person taps to open the card, and only when butterflies appear.
let audio = null;
function wingAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audio) audio = new AC();
    if (audio.state === "suspended") audio.resume();
    return audio;
  } catch { return null; }
}
let noiseBuf = null;
function noise(ctx) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = 0.6 * last + 0.4 * (Math.random() * 2 - 1); d[i] = last; }
  return noiseBuf;
}
function wingSound(ctx, { start, dur, flap, pan, loud }) {
  const out = ctx.createGain(); out.gain.value = 0;
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (p) { p.pan.setValueAtTime(pan * 0.3, start); p.pan.linearRampToValueAtTime(pan, start + dur); p.connect(ctx.destination); out.connect(p); }
  else out.connect(ctx.destination);
  out.gain.setValueAtTime(0, start);
  out.gain.linearRampToValueAtTime(loud, start + 0.12);
  out.gain.setValueAtTime(loud, start + dur * 0.45);
  out.gain.linearRampToValueAtTime(0, start + dur);
  const half = flap / 2;
  for (let t = start; t < start + dur; t += half * (0.9 + Math.random() * 0.2)) {
    const down = Math.round((t - start) / half) % 2 === 0; // downstroke is fuller, upstroke lighter
    const src = ctx.createBufferSource(); src.buffer = noise(ctx);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
    bp.frequency.value = (down ? 900 : 1500) + Math.random() * 500; bp.Q.value = 0.9;
    const g = ctx.createGain(); const len = Math.min(0.09, half * 0.8);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(down ? 1 : 0.45, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(t, Math.random() * 0.8, len + 0.02);
  }
}

function flutter(ctx) {
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
    if (ctx) {
      const flapS = parseFloat(el.style.getPropertyValue("--flap")) * 2; // one full wingbeat
      wingSound(ctx, {
        start: ctx.currentTime + 0.05 + i * (joyful ? 0.07 : 0.26), dur: dur / 1000 * 0.8, flap: flapS,
        pan: Math.max(-1, Math.min(1, dx / 200)), loud: joyful ? 0.45 : 0.8,
      });
    }
  }
  setTimeout(() => layer.remove(), 5200);
}

const stage = $("stage");
function open() {
  if (stage.classList.contains("opened")) return;
  stage.classList.add("opened");
  const ctx = NONE.includes(occ.id) ? null : wingAudio(); // started inside the tap so phones allow it
  setTimeout(() => flutter(ctx), 350);
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
function wrap(ctx, text, x, y, max, lh) {
  const words = text.split(" "); let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > max && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t;
  }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}
$("keep").addEventListener("click", async () => {
  const btn = $("keep"); btn.disabled = true; btn.textContent = "Making your keepsake…";
  try {
    await document.fonts.ready;
    const W = 1080, H = 2600, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    x.fillStyle = "#FFFDF7"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#F4EEDC"; x.fillRect(0, 0, W, 640);
    const img = $("art");
    if (img.complete && img.naturalWidth) { const s = Math.min(1000 / img.naturalWidth, 600 / img.naturalHeight); const w = img.naturalWidth * s, h = img.naturalHeight * s; x.drawImage(img, (W - w) / 2, 20 + (600 - h) / 2, w, h); }
    x.textAlign = "center"; x.fillStyle = "#0F3B2E"; x.font = "700 64px 'Playfair Display', Georgia, serif";
    let y = wrap(x, occ.title, W / 2, 740, 920, 76);
    x.fillStyle = "#8a6a12"; x.font = "600 34px Inter, sans-serif"; x.fillText(`Dear ${to},`, W / 2, y + 10); y += 70;
    x.fillStyle = "#14231d"; x.font = "400 36px Inter, sans-serif"; y = wrap(x, msg, W / 2, y, 900, 52);
    if (showVerse) { x.fillStyle = "#0F3B2E"; x.font = "italic 500 32px 'Playfair Display', Georgia, serif"; y = wrap(x, `“${verse.text}”`, W / 2, y + 30, 880, 46); x.fillStyle = "#4f6f55"; x.font = "700 26px Inter, sans-serif"; x.fillText(verse.ref, W / 2, y + 6); y += 50; }
    if (prayer) { x.fillStyle = "#8a6a12"; x.font = "700 24px Inter, sans-serif"; x.fillText("A PRAYER FOR YOU", W / 2, y + 30); x.fillStyle = "#14231d"; x.font = "400 30px Inter, sans-serif"; const lines = prayer.split("\n").join(" "); y = wrap(x, lines, W / 2, y + 76, 880, 42) + 10; }
    x.fillStyle = "#0F3B2E"; x.font = "italic 600 44px 'Playfair Display', Georgia, serif"; x.fillText(`With love, ${from}`, W / 2, y + 60);
    const FH = Math.max(1350, y + 170);
    x.fillStyle = "#4d5c55"; x.font = "500 22px Inter, sans-serif"; x.fillText("Sent with Even Here", W / 2, FH - 40);
    const out = document.createElement("canvas"); out.width = W; out.height = FH; out.getContext("2d").drawImage(cv, 0, 0);
    const blob = await new Promise((r) => out.toBlob(r, "image/png"));
    const file = new File([blob], `card-from-${from.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: occ.title }); }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    btn.textContent = "Saved";
  } catch { btn.textContent = "Save this card"; }
  finally { btn.disabled = false; setTimeout(() => { btn.textContent = "Save this card"; }, 2500); }
});

// Amen back (1.1): the person who opens a short-link card can send ONE reply from a fixed list.
// Nothing typed, no account. Opening the card is never reported; only a tapped reply is saved.
(function amenBack() {
  const box = document.getElementById("amen");
  const sb = window.FW_SB;
  const code = (new URLSearchParams(location.search).get("c") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  // "See it the way they will" in the app adds ?preview=1 to a card link that has no code,
  // so the sender sees the reply buttons grayed out instead of nothing.
  const preview = code.length !== 10 && new URLSearchParams(location.search).has("preview");
  if (!box || !card || (!preview && (!sb || code.length !== 10))) return;
  const HEART = `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="#C8463F"/></svg>`;
  const HEARTS = `<span class="hearts">${HEART}${HEART}</span>`;
  const WORDS = { amen: "Amen", praying: "I'm praying for you too", thanks: "Thank you, I appreciate it", thinking: "Thank you for thinking of me" };
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const name = esc(from);
  const store = `even-here-replied-${code}`;
  const rpc = (fn, body) => fetch(`${sb.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: sb.key, Authorization: `Bearer ${sb.key}` },
    body: JSON.stringify(body),
  }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

  function showDone(reply) {
    const said = reply === "hearts" ? HEARTS : `“${esc(WORDS[reply] || "")}”`;
    box.innerHTML = `<div class="done"><div class="check"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#0F3B2E" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h2>Sent to ${name}</h2><p class="said">${said}</p><p class="sub" style="margin:8px 0 0">${name} will see it in Even Here. Each card gets one reply.</p></div>`;
    box.hidden = false;
  }
  function showAsk(isPreview = false) {
    // Gentle cards are for anyone, including people who may not believe, so they skip "Amen" and "praying".
    const faith = tone === "faith";
    const head = isPreview
      ? `<h2>${esc(to)} can send you a reply</h2><p class="sub">This is your preview. Only ${esc(to)} can tap these, from the card you send.</p>`
      : `<h2>Send ${name} a reply?</h2><p class="sub">One tap, if you'd like. You don't have to.</p>`;
    box.innerHTML = `${head}
      <div class="opts">
        <div class="row">${faith ? `<button type="button" class="primary" data-r="amen">Amen</button>` : ""}<button type="button" class="heart${faith ? "" : " solo"}" data-r="hearts" aria-label="Send two red hearts"${faith ? "" : ' style="width:100%"'}>${HEARTS}</button></div>
        ${faith ? `<button type="button" data-r="praying">I'm praying for you too</button>` : ""}
        <button type="button" data-r="thanks">Thank you, I appreciate it</button>
        <button type="button" data-r="thinking">Thank you for thinking of me</button>
      </div>
      ${isPreview ? "" : `<p class="fine">${name} will only see the reply you tap. Opening this card is never reported to anyone.</p>`}`;
    box.hidden = false;
    if (isPreview) { box.classList.add("preview"); box.querySelectorAll("button").forEach((b) => { b.disabled = true; b.setAttribute("aria-disabled", "true"); }); return; }
    box.querySelectorAll("button[data-r]").forEach((b) => b.addEventListener("click", () => send(b.dataset.r)));
  }
  function send(reply) {
    box.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    box.querySelector(".err")?.remove();
    rpc("reply_to_card", { p_id: code, p_reply: reply }).then((res) => {
      if (res === "sent") {
        try { localStorage.setItem(store, reply); } catch {}
        showDone(reply);
        // Lets the sender's phone know, if they turned on reply notifications. Sends at most once.
        fetch(`${sb.url}/functions/v1/card-reply-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: sb.key, Authorization: `Bearer ${sb.key}` },
          body: JSON.stringify({ code }),
          keepalive: true,
        }).catch(() => {});
      }
      else if (res === "already") { box.innerHTML = `<h2>A reply was already sent</h2><p class="sub" style="margin-bottom:0">Each card gets one reply.</p>`; }
      else box.hidden = true;
    }).catch(() => {
      box.querySelectorAll("button").forEach((b) => { b.disabled = false; });
      box.insertAdjacentHTML("beforeend", `<p class="err">Couldn't send just now. Check your connection and try again.</p>`);
    });
  }
  if (preview) { showAsk(true); return; }
  let mine = null;
  try { mine = localStorage.getItem(store); } catch {}
  rpc("card_reply_state", { p_id: code }).then((state) => {
    if (state === "open") showAsk();
    else if (state === "replied" && mine) showDone(mine);
  }).catch(() => {});
})();
