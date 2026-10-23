/**
 * Motion helpers and ScrollScene.
 * A ScrollScene measures how far the user has scrolled through a tall
 * section (0 to 1), eases toward that value every animation frame and calls
 * render(progress) only when something actually changed.
 */
const Motion = {
  clamp: (v) => (v < 0 ? 0 : v > 1 ? 1 : v),
  smooth: (v) => v * v * (3 - 2 * v),
  between: (t, start, length) => Motion.smooth(Motion.clamp((t - start) / length)),
};

class ScrollScene {
  constructor(section, render, options = {}) {
    this.section = section;
    this.render = render;
    this.ease = options.ease || 0.12;
    this.fixed = options.fixed;
    this.current = this.target();
    this.applied = -1;
    ScrollScene.all.push(this);
    ScrollScene.start();
  }

  target() {
    if (this.fixed !== undefined) return this.fixed;
    const rect = this.section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    return scrollable > 0 ? Motion.clamp(-rect.top / scrollable) : 0;
  }

  isNearViewport() {
    const rect = this.section.getBoundingClientRect();
    return rect.bottom > -window.innerHeight && rect.top < window.innerHeight * 2;
  }

  invalidate() { this.applied = -1; }

  tick() {
    const target = this.target();
    this.current += (target - this.current) * this.ease;
    if (Math.abs(target - this.current) < 0.00005) this.current = target;
    if (this.current === this.applied || !this.isNearViewport()) return;
    this.render(this.current);
    this.applied = this.current;
  }

  static start() {
    if (ScrollScene.running) return;
    ScrollScene.running = true;
    const loop = () => {
      ScrollScene.all.forEach((scene) => scene.tick());
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

ScrollScene.all = [];
ScrollScene.running = false;

window.Motion = Motion;
window.ScrollScene = ScrollScene;
