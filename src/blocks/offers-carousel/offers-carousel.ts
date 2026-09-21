const CARD_MODEL = 'offers-carousel-item';

function isEnabled(value: string): boolean {
  return ['true', 'yes', 'enabled'].includes(value.trim().toLowerCase());
}

function isBooleanFlag(element: Element): boolean {
  return /^(true|false)$/i.test(element.textContent?.trim() || '');
}

function getField(root: Element, property: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-aue-prop="${property}"]`);
}

function applyTarget(anchor: HTMLAnchorElement, openInNewTab: boolean): void {
  if (!openInNewTab) return;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
}

// in the editor every item row carries the item model; outside it we fall back to the cell shape
function isCardRow(row: HTMLElement): boolean {
  if (row.dataset.aueModel) return row.dataset.aueModel === CARD_MODEL;
  return row.children.length >= 3 || !!row.querySelector('picture, img');
}

// each CTA is authored as url + label (collapsed into one anchor) followed by an open-in-new-tab boolean
function decorateCtas(cell: HTMLElement): void {
  cell.classList.add('offers-carousel-card-ctas');

  const authored = [...cell.children] as HTMLElement[];
  const flags = authored.filter(isBooleanFlag);

  [...cell.querySelectorAll<HTMLAnchorElement>('a')].forEach((anchor, index) => {
    anchor.classList.add('offers-carousel-card-cta');
    applyTarget(anchor, isEnabled(flags[index]?.textContent?.trim() || ''));
    // lift the anchor out of its paragraph so the CTAs become adjacent flex siblings
    cell.append(anchor);
  });

  // the booleans and the paragraphs the anchors were lifted out of are authoring artefacts
  authored
    .filter((element) => !element.matches('a'))
    .forEach((element) => element.classList.add('offers-carousel-card-cta-flag'));
}

// decoration happens in place so that every instrumented cell survives for the Universal Editor
function decorateCard(row: HTMLElement): void {
  row.classList.add('offers-carousel-card');

  const [mediaCell, contentCell, ctaCell] = [...row.children] as HTMLElement[];
  if (!mediaCell || !contentCell) return;

  mediaCell.classList.add('offers-carousel-card-media');
  contentCell.classList.add('offers-carousel-card-overlay');

  const parts = [...contentCell.children] as HTMLElement[];
  const taken = new Set<HTMLElement>();
  // outside the editor there are no field markers, so fall back to the authored order
  const pick = (property: string, index: number): HTMLElement | undefined => {
    const part = getField(contentCell, property) || parts[index];
    if (!part || taken.has(part)) return undefined;
    taken.add(part);
    return part;
  };

  const eyebrow = pick('content_cardEyebrow', 0);
  const headline = pick('content_headline', 1);
  const description = pick('content_cardDescription', 2);

  eyebrow?.classList.add('offers-carousel-card-eyebrow');

  const body = document.createElement('div');
  body.className = 'offers-carousel-card-body';

  if (headline) {
    headline.classList.add('offers-carousel-card-title');
    headline.setAttribute('role', 'heading');
    headline.setAttribute('aria-level', '3');
    body.append(headline);
  }

  if (description) {
    description.classList.add('offers-carousel-card-description');
    body.append(description);
  }

  if (ctaCell) {
    decorateCtas(ctaCell);
    body.append(ctaCell);
  }

  contentCell.append(body);
  mediaCell.append(contentCell);
}

function applyStackState(cards: HTMLElement[], activeIndex: number): void {
  const total = cards.length;

  cards.forEach((card, index) => {
    const rank = (index - activeIndex + total) % total;

    card.classList.remove('is-active', 'is-next-1', 'is-next-2', 'is-hidden');

    if (rank === 0) card.classList.add('is-active');
    else if (rank === 1) card.classList.add('is-next-1');
    else if (rank === 2) card.classList.add('is-next-2');
    else card.classList.add('is-hidden');
  });
}

function wireInteraction(root: HTMLElement, cards: HTMLElement[]): void {
  let activeIndex = cards.length - 1;

  const prevBtn = root.querySelector('.offers-carousel-nav-prev');
  const nextBtn = root.querySelector('.offers-carousel-nav-next');
  const stage = root.querySelector('.offers-carousel-stage');

  const update = () => applyStackState(cards, activeIndex);

  const goNext = () => {
    activeIndex = (activeIndex + 1) % cards.length;
    update();
  };

  const goPrev = () => {
    activeIndex = (activeIndex - 1 + cards.length) % cards.length;
    update();
  };

  prevBtn?.addEventListener('click', goPrev);
  nextBtn?.addEventListener('click', goNext);

  cards.forEach((card, index) => {
    card.addEventListener('focusin', () => {
      activeIndex = index;
      update();
    });
    card.addEventListener('click', (event) => {
      if ((event.target as Element)?.closest('a')) return;
      activeIndex = index;
      update();
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });

  let startX = 0;
  stage?.addEventListener('pointerdown', (event) => {
    startX = (event as PointerEvent).clientX;
  });

  stage?.addEventListener('pointerup', (event) => {
    const delta = (event as PointerEvent).clientX - startX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext();
    else goPrev();
  });

  update();
}

export default function decorate(block: HTMLElement): void {
  if (block.querySelector(':scope > .offers-carousel-layout')) return;

  const rows = [...block.children] as HTMLElement[];
  const cardRows = rows.filter(isCardRow);
  const [idRow, eyebrowRow, titleRow] = rows.filter((row) => !cardRows.includes(row));

  const anchorId = idRow?.textContent?.trim();
  if (anchorId) block.id = anchorId.replace(/^#/, '');
  idRow?.classList.add('offers-carousel-config');

  const copy = document.createElement('div');
  copy.className = 'offers-carousel-copy';

  if (eyebrowRow) {
    eyebrowRow.classList.add('offers-carousel-eyebrow');
    copy.append(eyebrowRow);
  }

  if (titleRow) {
    titleRow.classList.add('offers-carousel-title');
    copy.append(titleRow);
  }

  const cards = document.createElement('div');
  cards.className = 'offers-carousel-cards';

  cardRows.forEach((row) => {
    decorateCard(row);
    cards.append(row);
  });

  const stage = document.createElement('div');
  stage.className = 'offers-carousel-stage';
  stage.append(cards);

  const layout = document.createElement('div');
  layout.className = 'offers-carousel-layout';
  layout.append(copy, stage);
  block.append(layout);

  if (cardRows.length) wireInteraction(layout, cardRows);
}
