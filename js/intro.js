/**
 * Intro scene: walking into the restaurant.
 * The scene's timeline runs from 0 to 10 along the section's scroll:
 *   0 → 9.3   the video plays (door, table, menu opening)
 *   7.6 → 8.4 the "Menu" title fades in over the paper
 *   9.0 → 9.8 the screen settles on the exact paper colour of the site
 */
function createIntro({ isPhone, reducedMotion }) {
  const section = document.getElementById("intro");
  const canvas = document.getElementById("intro-canvas");
  const lines = [...section.querySelectorAll(".line")];
  const labels = [...section.querySelectorAll(".label")];
  const hint = document.getElementById("scroll-hint");
  const vignette = document.getElementById("vignette");
  const bar = document.getElementById("intro-progress");
  const paperFill = section.querySelector(".paper-fill");
  const paperTitle = section.querySelector(".paper-title");

  const frames = new FrameSequence(canvas, isPhone
    ? { path: "assets/intro/mobile/", total: 181, perFile: 4, frameWidth: 405, frameHeight: 720, maxDpr: 2, blend: true }
    : { path: "assets/intro/desktop/", total: 362, perFile: 2, frameWidth: 1280, frameHeight: 720, maxDpr: 2, blend: true });

  const VIDEO_END = 9.3;

  const LINES = [
    { in: -1, out: 0.8 },
    { in: 1.3, out: 2.2 },
    { in: 2.7, out: 3.7 },
    { in: 4.2, out: 5.0 },
    { in: 5.5, out: 6.4 },
  ];

  const LABELS = {
    kitchen: { from: 1.0, to: 2.3, path: [[36, 35, 28], [60, 34, 27], [84, 28, 26], [100, 25, 30]] },
    table: { from: 2.0, to: 3.1, path: [[60, 50, 51], [84, 47, 62], [108, 47, 75], [120, 47, 80]] },
  };

  let stageWidth = 0;
  let stageHeight = 0;
  const measure = () => {
    stageWidth = canvas.clientWidth;
    stageHeight = canvas.clientHeight;
  };
  window.addEventListener("resize", measure);
  measure();

  function pointAt(path, frame) {
    if (frame <= path[0][0]) return [path[0][1], path[0][2]];
    for (let i = 1; i < path.length; i++) {
      const [f0, x0, y0] = path[i - 1];
      const [f1, x1, y1] = path[i];
      if (frame <= f1) {
        const k = (frame - f0) / (f1 - f0);
        return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
      }
    }
    const last = path[path.length - 1];
    return [last[1], last[2]];
  }

  function placeLabel(el, spec, t, frame) {
    const visible = Motion.between(t, spec.from, 0.3) * (1 - Motion.between(t, spec.to - 0.3, 0.3));
    el.style.opacity = visible.toFixed(3);
    if (visible <= 0) return;
    const [px, py] = pointAt(spec.path, frame);
    const scale = Math.max(stageWidth / 1280, stageHeight / 720);
    const drawnWidth = 1280 * scale;
    const drawnHeight = 720 * scale;
    const x = (stageWidth - drawnWidth) / 2 + (px / 100) * drawnWidth;
    const y = (stageHeight - drawnHeight) / 2 + (py / 100) * drawnHeight;
    el.style.transform = `translate(${x.toFixed(1)}px, ${(y - 12).toFixed(1)}px)`;
  }

  function render(progress) {
    const t = progress * 10;
    const frame = Motion.clamp(t / VIDEO_END) * (frames.total - 1);

    frames.draw(frame);

    lines.forEach((line, i) => {
      const timing = LINES[i];
      const enter = timing.in < 0 ? 1 : Motion.between(t, timing.in, 0.6);
      const leave = Motion.between(t, timing.out, 0.5);
      line.style.opacity = (enter * (1 - leave)).toFixed(3);
      line.style.transform = `translateY(${((1 - enter) * 40 - leave * 30).toFixed(1)}px)`;
    });

    if (!isPhone) labels.forEach((el) => placeLabel(el, LABELS[el.dataset.label], t, frame));

    hint.style.opacity = (1 - Motion.clamp(t / 0.4)).toFixed(3);
    vignette.style.opacity = (1 - Motion.between(t, 6.6, 1)).toFixed(3);

    const title = Motion.between(t, 7.6, 0.8);
    paperTitle.style.opacity = title.toFixed(3);
    paperTitle.style.transform = `translateY(${((1 - title) * 24).toFixed(1)}px)`;
    paperFill.style.opacity = Motion.between(t, 9.0, 0.8).toFixed(3);

    bar.style.transform = `scaleX(${progress.toFixed(4)})`;
  }

  const scene = new ScrollScene(section, render, reducedMotion ? { fixed: 0 } : {});
  return { frames, scene };
}

window.createIntro = createIntro;
