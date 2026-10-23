/**
 * Entry point: builds both scenes, loads their frames in order
 * and wires up the small UI bits.
 */
(function () {
  const isPhone = window.matchMedia("(max-width: 760px) and (orientation: portrait)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const intro = createIntro({ isPhone, reducedMotion });
  const plate = createPlate({ isPhone, reducedMotion });

  // Loading: the intro first, then the plate in the background
  const loader = document.getElementById("loader");
  const percent = document.getElementById("loader-percent");
  const hideLoader = () => loader.classList.add("is-done");

  intro.frames
    .load((done, total) => {
      percent.textContent = `${Math.round((done / total) * 100)}%`;
      intro.scene.invalidate();
      if (done >= 12) hideLoader();
    })
    .then(() => plate.frames.load(() => plate.scene.invalidate()));
  setTimeout(hideLoader, 6000);

  // Top bar turns solid once the video reaches the paper
  const topbar = document.getElementById("topbar");
  const introSection = document.getElementById("intro");
  const updateTopbar = () => {
    const solid = intro.scene.target() > 0.79 || introSection.getBoundingClientRect().bottom < 80;
    topbar.classList.toggle("is-solid", solid);
  };
  window.addEventListener("scroll", updateTopbar, { passive: true });
  updateTopbar();

  // Safety net: if the device can't keep up while scrolling, render the videos at 1x
  let lastScroll = 0;
  window.addEventListener("scroll", () => { lastScroll = performance.now(); }, { passive: true });
  let previous = 0;
  let measured = 0;
  let slow = 0;
  const watch = (now) => {
    const gap = now - previous;
    previous = now;
    if (now - lastScroll < 150 && gap < 500) {
      measured++;
      if (gap > 28) slow++;
    }
    if (measured >= 60) {
      if (slow > 20) {
        intro.frames.setMaxDpr(1);
        plate.frames.setMaxDpr(1);
      }
      return;
    }
    requestAnimationFrame(watch);
  };
  if (!reducedMotion) requestAnimationFrame(watch);

  // Booking button (a real restaurant would link to WhatsApp here)
  document.getElementById("book-button").addEventListener("click", () => {
    document.getElementById("book-notice").textContent =
      "Demo website: this is where the restaurant's WhatsApp link would go.";
  });
})();
