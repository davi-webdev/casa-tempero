/**
 * Plate scene: the Prato Feito is built ingredient by ingredient.
 * The video plays during the first 85% of the section; each step in the
 * side panel lights up at the frame where that ingredient lands on the plate.
 */
function createPlate({ isPhone, reducedMotion }) {
  const section = document.getElementById("plate");
  const canvas = document.getElementById("plate-canvas");
  const steps = [...section.querySelectorAll(".step")];
  const total = document.getElementById("plate-total");
  const bar = document.getElementById("plate-progress");

  const frames = new FrameSequence(canvas, isPhone
    ? { path: "assets/plate/mobile/", total: 96, perFile: 4, frameWidth: 960, frameHeight: 540, maxDpr: 2, blend: true }
    : { path: "assets/plate/desktop/", total: 192, perFile: 2, frameWidth: 1280, frameHeight: 720, maxDpr: 2, blend: true });
  const fps = frames.total / 8;

  const STEP_SECONDS = [1.83, 3.17, 4.5, 5.83];
  const STEP_FRAMES = STEP_SECONDS.map((s) => s * fps);
  const DONE_FRAME = 7 * fps;
  const VIDEO_SHARE = 0.85;

  function render(progress) {
    const frame = Motion.clamp(progress / VIDEO_SHARE) * (frames.total - 1);
    frames.draw(frame);

    steps.forEach((step, i) => {
      const reached = frame >= STEP_FRAMES[i];
      const passed = frame >= (STEP_FRAMES[i + 1] ?? DONE_FRAME);
      step.classList.toggle("is-active", reached && !passed);
      step.classList.toggle("is-done", passed);
    });

    total.classList.toggle("is-visible", frame >= DONE_FRAME);
    bar.style.transform = `scaleX(${progress.toFixed(4)})`;
  }

  const scene = new ScrollScene(section, render, reducedMotion ? { fixed: 1 } : {});
  return { frames, scene };
}

window.createPlate = createPlate;
