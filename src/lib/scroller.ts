/** How long after the last interaction before auto-motion may resume. */
const IDLE_AFTER_MS = 4000;

/** Where a mouse drag should come to rest, given where it started and how far it moved. */
export type Settle = (
  startScroll: number,
  dragX: number,
) => { to: number; duration: number };

/**
 * Drives a horizontally scrolling, snap-aligned strip: eased programmatic
 * slides, mouse drag-to-scroll, and idle tracking so auto-motion can hold off
 * while the strip is hovered, dragged or wheeled.
 */
export class Scroller {
  private readonly el: HTMLElement;
  private readonly settle: Settle;
  private frame = 0;
  private hovered = false;
  private touchedAt = 0;
  private endDrag: (() => void) | null = null;

  constructor(el: HTMLElement, settle: Settle) {
    this.el = el;
    this.settle = settle;
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("wheel", this.onWheel, { passive: true });
    el.addEventListener("mouseenter", this.onEnter);
    el.addEventListener("mouseleave", this.onLeave);
  }

  destroy(): void {
    const { el } = this;
    this.stop();
    this.endDrag?.();
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("wheel", this.onWheel);
    el.removeEventListener("mouseenter", this.onEnter);
    el.removeEventListener("mouseleave", this.onLeave);
  }

  get idle(): boolean {
    return !this.hovered && Date.now() - this.touchedAt > IDLE_AFTER_MS;
  }

  /** Record an interaction, optionally backdated so auto-motion resumes sooner. */
  touch(msAgo = 0): void {
    this.touchedAt = Date.now() - msAgo;
  }

  /** Suspend snapping so scrollLeft can be driven frame by frame. */
  freeScroll(): void {
    this.el.style.scrollSnapType = "none";
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.el.style.scrollSnapType = "";
  }

  slideTo(to: number, duration: number): void {
    const { el } = this;
    cancelAnimationFrame(this.frame);
    this.freeScroll();
    const from = el.scrollLeft;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      el.scrollLeft = from + (to - from) * eased;
      if (t < 1) this.frame = requestAnimationFrame(step);
      else el.style.scrollSnapType = "";
    };
    this.frame = requestAnimationFrame(step);
  }

  private onEnter = () => {
    this.hovered = true;
  };

  private onLeave = () => {
    this.hovered = false;
    this.touch(2500);
  };

  private onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      this.touch();
      this.stop();
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    this.touch();
    this.stop();
    // Touch and pen scroll natively; only the mouse needs drag-to-scroll.
    if (e.pointerType !== "mouse" || e.button !== 0) return;

    const { el } = this;
    const startX = e.clientX;
    const startScroll = el.scrollLeft;
    this.freeScroll();
    el.style.cursor = "grabbing";

    const move = (ev: PointerEvent) => {
      el.scrollLeft = startScroll - (ev.clientX - startX);
      this.touch();
    };
    const up = (ev: PointerEvent) => {
      this.endDrag?.();
      const { to, duration } = this.settle(startScroll, ev.clientX - startX);
      this.slideTo(to, duration);
      this.touch();
    };
    this.endDrag = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.style.cursor = "";
      this.endDrag = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
}
