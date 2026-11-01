// Even Here e-card viewer. Everything a card says lives in the link itself (after #),
// so nothing is stored on a server and the person who receives it needs no app or account.
// Occasions, verses and gifts come from card-gifts.js, generated from the public-domain KJV.
const OCCASIONS = window.FW_OCCASIONS || {};

function readCard() {
  try {
    const raw = location.hash.slice(1);
    if (!raw) return null;
    const json = decodeURIComponent(escape(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))));
    return JSON.parse(json);
  } catch { return null; }
}
const clean = (s, n) => String(s ?? "").replace(/[<>]/g, "").slice(0, n).trim();

const c = readCard() || { o: "grief", to: "Mom", from: "Grace", tone: "faith" };
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
$("art").src = `assets/cards/${occ.id}.jpg`;
$("title").textContent = occ.title;
$("to").textContent = `Dear ${to},`;
$("msg").textContent = msg;
if (showVerse) { $("verse").hidden = false; $("vtext").textContent = `“${verse.text}”`; $("vref").textContent = verse.ref; }
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
if (gift) gift.querySelector("b").textContent = occ.gift;

const stage = $("stage");
function open() {
  if (stage.classList.contains("opened")) return;
  stage.classList.add("opened");
  setTimeout(() => { stage.classList.add("revealed"); window.scrollTo({ top: 0, behavior: "smooth" }); }, 1500);
}
$("open").addEventListener("click", open);
$("openBtn").addEventListener("click", open);
if (new URLSearchParams(location.search).has("open")) { stage.classList.add("opened", "revealed"); }

// The gift: seven short readings. All days are open; nothing is tracked or sent anywhere.
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
