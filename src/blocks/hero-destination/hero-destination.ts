// src/blocks/hero-destination/hero-destination.ts
// Rows (authored): 0=autoplay, 1=autoplayInterval, 2=loop (config), 3..n=items (image, imageAlt, heading)
import { CarouselController } from './lib/carousel-controller';
import { buildDotNav, buildSlide } from './lib/dom-builder';
import { parseCarouselConfig, parseItems } from './lib/parse';

export default function decorate(block: HTMLElement): void {
  const rows = [...block.children] as HTMLElement[];
  const configRows = rows.filter((row) => row.children.length <= 1);
  const itemRows = rows.filter((row) => row.children.length > 1);

  const { autoplay, loop, intervalSeconds } = parseCarouselConfig(configRows);
  const items = parseItems(itemRows);
  if (items.length === 0) return;

  block.innerHTML = '';

  const overlay = document.createElement('div');
  overlay.className = 'hero-destination-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const track = document.createElement('ul');
  track.className = 'hero-destination-track';
  items.forEach((item, index) => track.append(buildSlide(item, index)));

  block.append(overlay, track);

  const slides = [...track.children] as HTMLElement[];
  const dotCount = items.length > 1 ? items.length : 0;
  const { nav, dots } = buildDotNav(dotCount);

  const carousel = new CarouselController({ slides, dots, intervalSeconds, autoplay, loop });
  dots.forEach((dot, index) => dot.addEventListener('click', () => carousel.goTo(index)));
  if (dotCount > 0) block.append(nav);

  carousel.init();
}
