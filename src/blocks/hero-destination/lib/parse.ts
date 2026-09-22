// src/blocks/hero-destination/lib/parse.ts
// Rows (authored): config rows have a single cell (0=autoplay, 1=autoplayInterval, 2=loop);
// item rows have one cell per item field (0=image, 1=imageAlt, 2=heading).
import type { HeroDestinationItem } from './types';

const DEFAULT_INTERVAL_SECONDS = 3;

export interface CarouselConfig {
  autoplay: boolean;
  loop: boolean;
  intervalSeconds: number;
}

function cellText(cell?: Element | null): string {
  return cell?.textContent?.trim() ?? '';
}

function parseBoolean(cell: Element | null | undefined, fallback: boolean): boolean {
  const text = cellText(cell).toLowerCase();
  if (text === 'true' || text === 'yes') return true;
  if (text === 'false' || text === 'no') return false;
  return fallback;
}

export function parseCarouselConfig(configRows: HTMLElement[]): CarouselConfig {
  const autoplay = parseBoolean(configRows[0]?.children[0], true);
  const rawInterval = Number.parseFloat(cellText(configRows[1]?.children[0]));
  const intervalSeconds = Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : DEFAULT_INTERVAL_SECONDS;
  const loop = parseBoolean(configRows[2]?.children[0], true);
  return { autoplay, loop, intervalSeconds };
}

export function parseItems(itemRows: HTMLElement[]): HeroDestinationItem[] {
  return itemRows
    .map((row): HeroDestinationItem | null => {
      const cells = [...row.children] as HTMLElement[];
      const picture = cells[0]?.querySelector('picture');
      const heading = cellText(cells[2]);
      if (!picture || !heading) return null;
      return {
        picture,
        imageAlt: cellText(cells[1]),
        heading,
        sourceRow: row,
      };
    })
    .filter((item): item is HeroDestinationItem => item !== null);
}
