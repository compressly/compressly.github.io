// Simple scroll-based fade-in for elements that use the fadeUp animation
document.addEventListener("DOMContentLoaded", () => {
  // animate progress bars in mock
  document.querySelectorAll(".progress i").forEach((el, idx) => {
    setTimeout(() => {
      el.style.width =
        el.getAttribute("data-width") || el.style.width || el.style.width;
      // if width unspecified, animate to existing inline width
      if (!el.style.width || el.style.width === "0%") {
        // fallback sample widths
        const sample = [45, 78, 12];
        el.style.width = sample[idx % sample.length] + "%";
      }
    }, 300 + idx * 120);
  });

  // simple click feedback for download button
  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
      // allow the link to open (don't preventDefault) but show a pressed animation
      downloadBtn.classList.add("pressed");
      setTimeout(() => downloadBtn.classList.remove("pressed"), 300);
    });
  }

  // subtle stagger for cards and mock window: assign CSS vars for delays
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.style.setProperty("--delay", `${120 * i}ms`);
  });
  const mock = document.querySelector(".mock-window");
  if (mock) mock.style.setProperty("--mock-delay", "120ms");

  // stagger hero elements
  const heroSeq = [
    document.querySelector(".title"),
    document.querySelector(".tag"),
    document.querySelector(".cta-row"),
    document.querySelector(".bullets"),
  ];
  heroSeq.forEach((el, i) => {
    if (el) el.style.setProperty("--delay", `${i * 80}ms`);
  });

  // hero visual and mock body
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual) heroVisual.style.setProperty("--mock-delay", "160ms");
  const mockBody = document.querySelector(".mock-body");
  if (mockBody) mockBody.style.setProperty("--mock-delay", "180ms");

  // section titles and steps
  document
    .querySelectorAll(".section-title")
    .forEach((el, i) => el.style.setProperty("--delay", `${120 * i}ms`));
  document
    .querySelectorAll(".how .step")
    .forEach((el, i) => el.style.setProperty("--delay", `${100 * i}ms`));

  // trigger animations after delays are set
  // Use rAF then a tiny timeout to ensure styles have applied before starting animations
  requestAnimationFrame(() => {
    setTimeout(() => document.body.classList.add("play-animate"), 30);
  });

  // Some browsers may not start very long/slow CSS animations for elements offscreen
  // or when the page was backgrounded. Force-restart the blob animations so they
  // reliably animate on load by briefly clearing and restoring the animation.
  const blobs = document.querySelectorAll(".bg-blobs .blob");
  if (blobs.length) {
    blobs.forEach((b) => {
      const computed = getComputedStyle(b).animation || b.style.animation;
      if (computed && computed !== "none") {
        // briefly disable then restore to force the animation to begin
        b.style.animation = "none";
        // small timeout so browser treats this as a change
        setTimeout(() => {
          b.style.animation = computed;
        }, 50);
      }
    });
  }

  // Ripple effect for interactive elements (.btn and .card)
  function createRipple(e) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = Math.max(rect.width, rect.height) * 1.2;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = r + "px";
    span.style.left = x - r / 2 + "px";
    span.style.top = y - r / 2 + "px";
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 600);
  }

  document.querySelectorAll(".btn, .card").forEach((el) => {
    el.addEventListener("click", (e) => {
      createRipple(e);
    });
    // add subtle hover glow using class (for keyboard focus too)
    el.addEventListener("mouseenter", () => el.classList.add("hovering"));
    el.addEventListener("mouseleave", () => el.classList.remove("hovering"));
    el.addEventListener("focus", () => el.classList.add("hovering"));
    el.addEventListener("blur", () => el.classList.remove("hovering"));
  });
});
