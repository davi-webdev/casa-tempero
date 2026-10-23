/**
 * FrameSequence
 * Loads a video that was exported as a sequence of WebP frames (optionally
 * packed side by side in sprite sheets) and draws any frame onto a canvas,
 * cropped like `object-fit: cover`.
 *
 * Blending: a second canvas sits on top holding the next frame, and its CSS
 * opacity follows the fractional scroll position. Canvases are only redrawn
 * when the whole frame number changes; the cross-fade in between is done by
 * the GPU compositor, so it costs almost nothing, even on phones.
 */
class FrameSequence {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.path = options.path;
    this.total = options.total;
    this.perFile = options.perFile || 1;
    this.frameWidth = options.frameWidth;
    this.frameHeight = options.frameHeight;
    this.maxDpr = options.maxDpr || 2;
    this.files = new Array(Math.ceil(this.total / this.perFile));
    this.lastFrame = -1;
    this.lastMix = -1;
    this.nextReady = false;

    if (options.blend) {
      this.overlay = document.createElement("canvas");
      this.overlay.setAttribute("aria-hidden", "true");
      this.overlayCtx = this.overlay.getContext("2d");
      canvas.after(this.overlay);
    }

    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  setMaxDpr(value) {
    this.maxDpr = value;
    this.resize();
  }

  fileUrl(index) {
    return this.path + String(index + 1).padStart(3, "0") + ".webp";
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (this.overlay) {
      this.overlay.style.cssText =
        `position:absolute;left:${this.canvas.offsetLeft}px;top:${this.canvas.offsetTop}px;` +
        `width:${rect.width}px;height:${rect.height}px;pointer-events:none;opacity:${Math.max(this.lastMix, 0)}`;
    }
    if (width === this.canvas.width && height === this.canvas.height) return;
    for (const c of [this.canvas, this.overlay]) {
      if (!c) continue;
      c.width = width;
      c.height = height;
    }
    this.lastFrame = -1;
  }

  source(frame) {
    if (frame < 0 || frame >= this.total) return null;
    const img = this.files[Math.floor(frame / this.perFile)];
    if (!img || !img.ready) return null;
    return { img, x: (frame % this.perFile) * this.frameWidth };
  }

  nearestSource(frame) {
    for (let d = 0; d < this.total; d++) {
      const found = this.source(frame - d) || this.source(frame + d);
      if (found) return found;
    }
    return null;
  }

  paint(ctx, src) {
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const scale = Math.max(cw / this.frameWidth, ch / this.frameHeight);
    const w = this.frameWidth * scale;
    const h = this.frameHeight * scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src.img, src.x, 0, this.frameWidth, this.frameHeight, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  draw(position) {
    if (!this.overlay) position = Math.round(position);
    const frame = Math.floor(position);

    if (frame !== this.lastFrame) {
      const base = this.nearestSource(frame);
      if (!base) return;
      this.paint(this.ctx, base);
      if (this.overlay) {
        const next = this.source(frame + 1);
        this.nextReady = Boolean(next);
        if (next) this.paint(this.overlayCtx, next);
      }
      this.lastFrame = frame;
    }

    if (this.overlay) {
      const mix = this.nextReady ? position - frame : 0;
      if (Math.abs(mix - this.lastMix) > 0.01) {
        this.overlay.style.opacity = mix.toFixed(3);
        this.lastMix = mix;
      }
    }
  }

  loadOrder() {
    const order = [];
    const seen = new Set();
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < this.files.length; i += step) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    return order;
  }

  load(onProgress) {
    const order = this.loadOrder();
    const warm = document.createElement("canvas").getContext("2d");
    let done = 0;
    return new Promise((resolve) => {
      const finish = () => {
        done++;
        this.lastFrame = -1;
        if (onProgress) onProgress(done, order.length);
        if (done === order.length) resolve();
      };
      order.forEach((index) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          const ready = () => { img.ready = true; warm.drawImage(img, 0, 0, 1, 1); finish(); };
          if (img.decode) img.decode().then(ready, ready); else ready();
        };
        img.onerror = finish;
        img.src = this.fileUrl(index);
        this.files[index] = img;
      });
    });
  }
}

window.FrameSequence = FrameSequence;
