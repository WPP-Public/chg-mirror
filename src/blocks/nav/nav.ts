import { moveInstrumentation } from '@/app/scripts.js';

function directMatch(el: Element, attr: string, value: string): Element | null {
  if (el.getAttribute(attr) === value) return el;
  return el.querySelector(`:scope > p[${attr}="${value}"]`);
}

function fieldOf(scope: Element, name: string): Element | null {
  for (const child of scope.children) {
    const match = directMatch(child, 'data-aue-prop', name);
    if (match) return match;
  }
  return null;
}

function textOf(scope: Element, name: string): string {
  return fieldOf(scope, name)?.textContent?.trim() ?? '';
}

function linkOf(scope: Element, name: string): string {
  const field = fieldOf(scope, name);
  return field?.querySelector('a')?.getAttribute('href') ?? field?.textContent?.trim() ?? '';
}

function pictureOf(scope: Element, name: string): Element | null {
  return fieldOf(scope, name)?.querySelector('picture');
}

function itemsOf(scope: Element, model: string): Element[] {
  return [...scope.children]
    .map((child) => directMatch(child, 'data-aue-model', model))
    .filter((el): el is Element => !!el);
}

function buildLink(item: Element): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'nav-link';
  moveInstrumentation(item, li);

  const anchor = document.createElement('a');
  anchor.href = linkOf(item, 'link') || '#';
  anchor.append(document.createTextNode(textOf(item, 'label')));

  const note = textOf(item, 'note');
  if (note) {
    const noteEl = document.createElement('span');
    noteEl.className = 'nav-link-note';
    noteEl.textContent = note;
    anchor.append(document.createTextNode(' '), noteEl);
  }

  li.append(anchor);
  return li;
}

function buildRegion(item: Element): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'nav-region';
  moveInstrumentation(item, li);

  const label = textOf(item, 'label');
  if (label) {
    const heading = document.createElement('p');
    heading.className = 'nav-region-label';
    heading.textContent = label;
    li.append(heading);
  }

  const links = document.createElement('ul');
  links.className = 'nav-links';
  itemsOf(item, 'nav-link').forEach((linkItem) => links.append(buildLink(linkItem)));
  li.append(links);
  return li;
}

function buildCategoryPromo(item: Element): HTMLDivElement | null {
  const picture = pictureOf(item, 'promoImage');
  const ctaHref = linkOf(item, 'promoCtaLink');
  const ctaLabel = textOf(item, 'promoCtaName');
  if (!picture && !(ctaHref && ctaLabel)) return null;

  const promo = document.createElement('div');
  promo.className = 'nav-category-promo';
  if (picture) promo.append(picture.cloneNode(true));
  if (ctaHref && ctaLabel) {
    const cta = document.createElement('a');
    cta.className = 'nav-category-promo-cta';
    cta.href = ctaHref;
    cta.textContent = ctaLabel;
    promo.append(cta);
  }
  return promo;
}

function buildCategory(item: Element): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'nav-category';
  moveInstrumentation(item, li);

  const label = document.createElement('span');
  label.className = 'nav-category-label';
  label.textContent = textOf(item, 'label');
  li.append(label);

  const directLink = linkOf(item, 'link');
  if (directLink) li.dataset.link = directLink;

  const regionItems = itemsOf(item, 'nav-region');
  if (regionItems.length) {
    const regions = document.createElement('ul');
    regions.className = 'nav-regions';
    regionItems.forEach((regionItem) => regions.append(buildRegion(regionItem)));
    li.append(regions);
  }

  const promo = buildCategoryPromo(item);
  if (promo) li.append(promo);

  return li;
}

function buildLanguage(item: Element): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'nav-language';
  moveInstrumentation(item, li);

  const anchor = document.createElement('a');
  anchor.href = linkOf(item, 'link') || '#';
  anchor.textContent = textOf(item, 'label');
  const shortLabel = textOf(item, 'shortLabel');
  if (shortLabel) anchor.dataset.shortLabel = shortLabel;
  li.append(anchor);
  return li;
}

export default function decorate(block: HTMLElement): void {
  const logoPicture = pictureOf(block, 'logoImage');
  const ctaHref = linkOf(block, 'ctaLink');
  const ctaLabel = textOf(block, 'ctaName');

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-content';

  if (logoPicture) {
    const logo = document.createElement('div');
    logo.className = 'nav-logo';
    logo.append(logoPicture.cloneNode(true));
    wrapper.append(logo);
  }

  if (ctaHref && ctaLabel) {
    const cta = document.createElement('a');
    cta.className = 'nav-cta';
    cta.href = ctaHref;
    cta.textContent = ctaLabel;
    wrapper.append(cta);
  }

  const languages = document.createElement('ul');
  languages.className = 'nav-languages';
  itemsOf(block, 'nav-language').forEach((item) => languages.append(buildLanguage(item)));
  wrapper.append(languages);

  const categories = document.createElement('ul');
  categories.className = 'nav-categories';
  itemsOf(block, 'nav-category').forEach((item) => categories.append(buildCategory(item)));
  wrapper.append(categories);

  moveInstrumentation(block, wrapper);
  block.replaceChildren(wrapper);
}
