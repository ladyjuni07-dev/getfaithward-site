// Even Here landing page. No trackers. The waitlist posts an email to an insert-only table.
const SUPABASE_URL = "https://pmjhctxeoudnytplumam.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtamhjdHhlb3Vkbnl0cGx1bWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NjA4NDcsImV4cCI6MjEwOTAzNjg0N30.4C0kBhcfG7Mq6h-3CwZCPQQlOwBxUENsENnAdKdUWBk"; // public anon key; the table only allows inserts
document.documentElement.classList.remove("no-js");

const nav = document.querySelector(".nav");
const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Reveal on scroll
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); });

// Gentle hero parallax
const bg = document.querySelector("[data-parallax]");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (bg && !still) addEventListener("scroll", () => { const y = Math.min(scrollY, 900); bg.style.transform = `scale(1.06) translateY(${y * 0.18}px)`; }, { passive: true });

// Try it: real World English Bible text (public domain everywhere, including the UK)
const SITS = [
  { label: "Anxious", ref: "Philippians 4:6", text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.", then: "Then: a 3-minute Peace Mode, a devotional and a prayer for anxiety." },
  { label: "Grieving", ref: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", then: "Then: verses for loss, a reflection, and a 7-day walk through grief." },
  { label: "Hurt by church", ref: "Ezekiel 34:16", text: "I will seek that which was lost, and will bring back that which was driven away, and will bind up that which was broken…", then: "Then: Healing from Church Hurt, at your own pace." },
  { label: "Tempted", ref: "1 Corinthians 10:13", text: "No temptation has taken you except what is common to man. God is faithful, who will not allow you to be tempted above what you are able…", then: "Then: Temptation SOS, one step at a time." },
  { label: "Lonely", ref: "Matthew 28:20", text: "Behold, I am with you always, even to the end of the age.", then: "Then: a devotional for loneliness and a prayer you can pray today." },
  { label: "Worn out", ref: "Matthew 11:28", text: "Come to me, all you who labor and are heavily burdened, and I will give you rest.", then: "Then: rest, without guilt. Sabbath counts as walking with God." },
  { label: "Far from God", ref: "James 4:8", text: "Draw near to God, and he will draw near to you.", then: "Then: one small step toward Him is enough." },
];
const chipBox = document.querySelector(".chips");
const verse = document.querySelector(".verse");
function showSit(i, animate) {
  const s = SITS[i];
  chipBox.querySelectorAll(".chip").forEach((c, j) => c.setAttribute("aria-pressed", String(i === j)));
  const set = () => {
    verse.querySelector(".for").textContent = `When you're ${s.label.toLowerCase()}`;
    verse.querySelector("blockquote").textContent = `“${s.text}”`;
    verse.querySelector("cite").textContent = `${s.ref} (WEB)`;
    verse.querySelector(".then").textContent = s.then;
    verse.classList.remove("swap");
  };
  if (animate && !still) { verse.classList.add("swap"); setTimeout(set, 260); } else set();
}
if (chipBox) {
  SITS.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = s.label;
    b.addEventListener("click", () => showSit(i, true));
    chipBox.appendChild(b);
  });
  showSit(0, false);
}

// Feature tour: swap the sticky phone as each step comes into view
const shot = document.getElementById("tour-shot");
const steps = [...document.querySelectorAll(".tour .step")];
const tio = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    steps.forEach((s) => s.classList.toggle("on", s === e.target));
    const src = e.target.dataset.shot;
    if (shot && !shot.src.endsWith(src)) { shot.style.opacity = "0"; setTimeout(() => { shot.src = src; shot.style.opacity = "1"; }, 200); }
  });
}, { rootMargin: "-45% 0px -45% 0px" });
steps.forEach((s) => tio.observe(s));
if (steps[0]) steps[0].classList.add("on");

// Selah poses (same lines as the app)
const POSES = [
  { pose: "hello", mood: "Peaceful", line: "I'm so glad. Let's carry that peace into today." },
  { pose: "joy", mood: "Thankful", line: "Let's write it down so you can remember it later." },
  { pose: "rest", mood: "Tired", line: "You don't have to do much today. Jesus offers rest." },
  { pose: "comfort", mood: "Hurt by church", line: "What people did is not who God is. There's a gentle place for this." },
  { pose: "read", mood: "Far from God", line: "He hasn't moved. One small step toward Him is enough." },
];
const poseBox = document.querySelector(".poses");
const say = document.querySelector(".selah .say");
if (poseBox) {
  POSES.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "pose";
    b.innerHTML = `<img src="assets/lamb-${p.pose}.png" alt="" width="512" height="512" /><span>${p.mood}</span>`;
    b.addEventListener("click", () => pick(i));
    poseBox.appendChild(b);
  });
  const pick = (i) => { poseBox.querySelectorAll(".pose").forEach((b, j) => b.setAttribute("aria-pressed", String(i === j))); say.textContent = `Selah: “${POSES[i].line}”`; };
  pick(0);
}

// Waitlist
document.querySelectorAll("form[data-waitlist]").forEach((f) => {
  f.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const input = f.querySelector("input[type=email]");
    const msg = f.querySelector(".msg");
    const btn = f.querySelector("button");
    const email = input.value.trim();
    msg.className = "msg";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Please enter a valid email address."; msg.classList.add("err"); input.focus(); return; }
    btn.disabled = true; btn.textContent = "Joining…";
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ email, source: f.dataset.waitlist }),
      });
      if (r.ok || r.status === 409) {
        msg.textContent = r.status === 409 ? "You're already on the list. We'll be in touch." : "You're on the list. We'll email you when Even Here launches.";
        msg.classList.add("ok"); input.value = "";
      } else throw new Error(String(r.status));
    } catch {
      msg.textContent = "Something went wrong. Please try again in a moment.";
      msg.classList.add("err");
    } finally {
      btn.disabled = false; btn.textContent = "Join the waitlist";
    }
  });
});

// Videos: big play button, then normal controls; one plays at a time
document.querySelectorAll('.vids .vframe').forEach(f => {
  const v = f.querySelector('video'), b = f.querySelector('.vplay');
  b.addEventListener('click', () => { v.controls = true; f.classList.add('playing'); v.play(); });
  v.addEventListener('play', () => { f.classList.add('playing'); v.controls = true;
    document.querySelectorAll('.vids video').forEach(o => { if (o !== v) o.pause(); }); });
});
