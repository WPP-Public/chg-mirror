// src/blocks/hero-destination/lib/carousel-controller.ts
// Drives active slide/dot state and autoplay timing; agnostic of how slides/dots were built.

export interface CarouselControllerOptions {
  slides: HTMLElement[];
  dots: HTMLButtonElement[];
  intervalSeconds: number;
  autoplay: boolean;
  loop: boolean;
}

export class CarouselController {
  private readonly slides: HTMLElement[];
  private readonly dots: HTMLButtonElement[];
  private readonly intervalMs: number;
  private readonly loop: boolean;
  private readonly canAutoplay: boolean;
  private activeIndex = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor({ slides, dots, intervalSeconds, autoplay, loop }: CarouselControllerOptions) {
    this.slides = slides;
    this.dots = dots;
    this.intervalMs = intervalSeconds * 1000;
    this.loop = loop;
    this.canAutoplay = autoplay && slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Activates the first slide and starts autoplay (if eligible); wires tab-visibility handling. */
  init(): void {
    this.setActive(0);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.start();
  }

  /** Manual navigation (e.g. dot click): jump to a slide and restart the autoplay countdown. */
  goTo(index: number): void {
    this.setActive(index);
    this.start();
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private setActive(index: number): void {
    this.slides[this.activeIndex]?.classList.remove('is-active');
    this.slides[this.activeIndex]?.setAttribute('aria-hidden', 'true');
    this.dots[this.activeIndex]?.classList.remove('is-active');
    this.dots[this.activeIndex]?.removeAttribute('aria-selected');

    this.activeIndex = index;

    this.slides[this.activeIndex]?.classList.add('is-active');
    this.slides[this.activeIndex]?.setAttribute('aria-hidden', 'false');
    this.dots[this.activeIndex]?.classList.add('is-active');
    this.dots[this.activeIndex]?.setAttribute('aria-selected', 'true');
  }

  private start(): void {
    if (!this.canAutoplay) return;
    this.stop();
    this.timerId = setInterval(() => this.tick(), this.intervalMs);
  }

  /** Advances to the next slide; when loop is disabled, stops autoplay after the last slide. */
  private tick(): void {
    const isLastSlide = this.activeIndex === this.slides.length - 1;
    if (isLastSlide && !this.loop) {
      this.stop();
      return;
    }
    this.setActive((this.activeIndex + 1) % this.slides.length);
  }

  private stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
