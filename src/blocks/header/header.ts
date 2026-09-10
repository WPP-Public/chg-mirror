import { getMetadata } from '@/app/aem.js';
import { loadFragment } from '@/blocks/fragment/fragment.js';
import { moveInstrumentation, SUPPORTED_SITES, LANG_MAP, VALID_LANG_PRIMARIES } from '@/app/scripts.js';

if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
  document.documentElement.classList.add('no-touch');
}

interface NavLanguage {
  label: string;
  shortLabel: string;
  href: string;
  source: Element;
}

interface NavLink {
  label: string;
  href: string;
  note: string;
  source: Element;
}

interface NavRegion {
  label: string;
  links: NavLink[];
  source: Element;
}

interface NavPromo {
  picture: Element | null;
  ctaLabel: string;
  ctaHref: string;
}

interface NavCategory {
  label: string;
  href: string;
  regions: NavRegion[];
  promo: NavPromo | null;
  source: Element;
}

function getFragmentBasePath(): string {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const siteIdx = segments.findIndex((s) => SUPPORTED_SITES.includes(s));
  const site = siteIdx !== -1 ? segments[siteIdx] : 'global';

  const afterSite = siteIdx !== -1 ? segments.slice(siteIdx + 1) : segments;
  const rawLang = afterSite[0]?.toLowerCase() ?? '';
  const isLang = rawLang && (LANG_MAP[rawLang] || VALID_LANG_PRIMARIES.has(rawLang.split('-')[0] ?? ''));
  const lang = isLang ? rawLang : '';

  const parts = [site, lang].filter(Boolean);
  return parts.length ? `/${parts.join('/')}` : '';
}

function readLanguages(navRoot: Element): NavLanguage[] {
  return [...navRoot.querySelectorAll(':scope > .nav-languages > .nav-language')].map((item) => {
    const anchor = item.querySelector('a');
    const label = anchor?.textContent?.trim() ?? '';
    return {
      label,
      shortLabel: anchor?.dataset.shortLabel || label.slice(0, 2).toUpperCase(),
      href: anchor?.getAttribute('href') ?? '#',
      source: item,
    };
  });
}

function readLinks(regionRoot: Element): NavLink[] {
  return [...regionRoot.querySelectorAll(':scope > .nav-links > .nav-link')].map((item) => {
    const anchor = item.querySelector('a');
    const note = anchor?.querySelector('.nav-link-note');
    return {
      label: anchor?.childNodes[0]?.textContent?.trim() ?? anchor?.textContent?.trim() ?? '',
      href: anchor?.getAttribute('href') ?? '#',
      note: note?.textContent?.trim() ?? '',
      source: item,
    };
  });
}

function readRegions(categoryRoot: Element): NavRegion[] {
  return [...categoryRoot.querySelectorAll(':scope > .nav-regions > .nav-region')].map((item) => ({
    label: item.querySelector(':scope > .nav-region-label')?.textContent?.trim() ?? '',
    links: readLinks(item),
    source: item,
  }));
}

function readPromo(categoryRoot: Element): NavPromo | null {
  const promoRoot = categoryRoot.querySelector(':scope > .nav-category-promo');
  if (!promoRoot) return null;
  const picture = categoryRoot.querySelector(':scope > .nav-category-promo picture');
  const cta = promoRoot.querySelector<HTMLAnchorElement>('.nav-category-promo-cta');
  return {
    picture,
    ctaLabel: cta?.textContent?.trim() ?? '',
    ctaHref: cta?.getAttribute('href') ?? '',
  };
}

function readCategories(navRoot: Element): NavCategory[] {
  return [...navRoot.querySelectorAll(':scope > .nav-categories > .nav-category')].map((item) => ({
    label: item.querySelector(':scope > .nav-category-label')?.textContent?.trim() ?? '',
    href: (item as HTMLElement).dataset.link ?? '',
    regions: readRegions(item),
    promo: readPromo(item),
    source: item,
  }));
}

function getActiveLang(languages: NavLanguage[]): NavLanguage {
  const currentPath = window.location.pathname;
  const fallback: NavLanguage = {
    label: 'English',
    shortLabel: 'EN',
    href: `${getFragmentBasePath()}/`,
    source: document.createElement('li'),
  };
  return (
    languages.find((lang) => currentPath === lang.href || currentPath.startsWith(`${lang.href}/`)) ??
    languages[0] ??
    fallback
  );
}

function closeLangDropdown(trigger: HTMLElement, dropdown: HTMLElement): void {
  trigger.setAttribute('aria-expanded', 'false');
  dropdown.classList.remove('is-open');
}

function buildLangZone(languages: NavLanguage[], activeLabel: string): HTMLDivElement {
  const trigger = document.createElement('button');
  trigger.className = 'header-lang-trigger';
  trigger.type = 'button';
  trigger.dataset.testid = 'header-lang-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.textContent = activeLabel;

  const dropdown = document.createElement('ul');
  dropdown.className = 'header-lang-dropdown';
  dropdown.setAttribute('role', 'listbox');

  languages.forEach((lang) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'option');
    item.setAttribute('tabindex', '0');
    if (lang.shortLabel === activeLabel) item.setAttribute('aria-selected', 'true');
    moveInstrumentation(lang.source, item);

    const anchor = document.createElement('a');
    anchor.href = lang.href;
    anchor.textContent = lang.shortLabel;
    item.append(anchor);

    item.addEventListener('click', () => {
      trigger.textContent = lang.shortLabel;
      dropdown.querySelectorAll('li').forEach((li) => li.removeAttribute('aria-selected'));
      item.setAttribute('aria-selected', 'true');
      closeLangDropdown(trigger, dropdown);
    });

    dropdown.append(item);
  });

  const zone = document.createElement('div');
  zone.className = 'header-lang';
  zone.append(trigger, dropdown);

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (trigger.getAttribute('aria-expanded') === 'true') closeLangDropdown(trigger, dropdown);
    else {
      dropdown.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLangDropdown(trigger, dropdown);
  });
  document.addEventListener('click', (event) => {
    if (!zone.contains(event.target as Node)) closeLangDropdown(trigger, dropdown);
  });

  return zone;
}

function buildLogo(pictureSrc: string, pictureAlt: string, href: string): HTMLAnchorElement {
  const logo = document.createElement('a');
  logo.className = 'header-logo';
  logo.href = href;
  logo.setAttribute('aria-label', 'Capella Hotels - Home');

  if (pictureSrc) {
    const img = document.createElement('img');
    img.src = pictureSrc;
    img.alt = pictureAlt || 'Capella';
    logo.append(img);
    return logo;
  }

  const mark = document.createElement('span');
  mark.className = 'header-logo-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = '*';

  const word = document.createElement('span');
  word.className = 'header-logo-word';
  word.textContent = 'CAPELLA';

  logo.append(mark, word);
  return logo;
}

function buildCtaZone(label: string, href: string): HTMLAnchorElement | null {
  if (!label || !href) return null;
  const cta = document.createElement('a');
  cta.className = 'header-cta';
  cta.dataset.testid = 'header-cta';
  cta.href = href;
  cta.textContent = label;
  return cta;
}

function buildMenuToggle(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'header-menu-toggle';
  button.type = 'button';
  button.dataset.testid = 'header-menu-toggle';
  button.setAttribute('aria-label', 'Open navigation menu');
  button.setAttribute('aria-expanded', 'false');

  const icon = document.createElement('span');
  icon.className = 'header-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  return button;
}

function buildLinkGrid(links: NavLink[]): HTMLUListElement {
  const grid = document.createElement('ul');
  grid.className = 'header-menu-link-grid';
  links.forEach((link) => {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.textContent = link.note ? `${link.label} ${link.note}` : link.label;
    moveInstrumentation(link.source, anchor);
    li.append(anchor);
    grid.append(li);
  });
  return grid;
}

function buildCategoryContent(category: NavCategory): HTMLDivElement {
  const content = document.createElement('div');
  content.className = 'header-menu-category-content';
  content.hidden = true;

  category.regions.forEach((region) => {
    const regionEl = document.createElement('div');
    regionEl.className = 'header-menu-region';
    if (region.label) {
      const heading = document.createElement('p');
      heading.className = 'header-menu-region-label';
      heading.textContent = region.label;
      regionEl.append(heading);
    }
    regionEl.append(buildLinkGrid(region.links));
    content.append(regionEl);
  });

  return content;
}

function setActiveCategory(
  categories: { category: NavCategory; li: HTMLLIElement; content: HTMLDivElement; trigger: HTMLElement }[],
  promo: { imageContainer: HTMLDivElement; cta: HTMLAnchorElement; root: HTMLDivElement },
  index: number,
): void {
  categories.forEach(({ li, content, trigger }, i) => {
    const isActive = i === index;
    li.dataset.active = String(isActive);
    content.hidden = !isActive;
    if (trigger.tagName === 'BUTTON') trigger.setAttribute('aria-expanded', String(isActive));
  });

  const active = categories[index]?.category.promo;
  promo.root.hidden = !active;
  if (active) {
    promo.imageContainer.replaceChildren();
    if (active.picture) {
      const picture = active.picture.cloneNode(true) as Element;
      const img = picture.querySelector('img');
      if (img) {
        if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
        // restore the src that nav.ts deferred to data-src, now that this category is actually shown
        const dataSrc = img.dataset.src;
        if (dataSrc) {
          img.src = dataSrc;
          delete img.dataset.src;
        }
      }
      promo.imageContainer.append(picture);
    }
    promo.cta.href = active.ctaHref;
    promo.cta.textContent = active.ctaLabel;
    promo.cta.hidden = !(active.ctaHref && active.ctaLabel);
  }
}

function buildMenuPromo(): { root: HTMLDivElement; imageContainer: HTMLDivElement; cta: HTMLAnchorElement } {
  const root = document.createElement('div');
  root.className = 'header-menu-promo';
  root.hidden = true;

  const imageContainer = document.createElement('div');
  imageContainer.className = 'header-menu-promo-image';

  const cta = document.createElement('a');
  cta.className = 'header-menu-promo-cta';
  cta.dataset.testid = 'header-menu-promo-cta';

  root.append(imageContainer, cta);
  return { root, imageContainer, cta };
}

function buildMenuCategories(
  categories: NavCategory[],
  promo: { root: HTMLDivElement; imageContainer: HTMLDivElement; cta: HTMLAnchorElement },
): { list: HTMLUListElement; activateInitial: () => void } {
  const list = document.createElement('ul');
  list.className = 'header-menu-categories';

  const entries: { category: NavCategory; li: HTMLLIElement; content: HTMLDivElement; trigger: HTMLElement }[] = [];

  categories.forEach((category) => {
    const li = document.createElement('li');
    li.className = 'header-menu-category';
    moveInstrumentation(category.source, li);

    let trigger: HTMLElement;
    let content: HTMLDivElement;

    if (category.regions.length) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'header-menu-category-trigger';
      button.dataset.testid = 'header-menu-category-trigger';
      button.textContent = category.label;
      trigger = button;
      content = buildCategoryContent(category);
      li.append(trigger, content);
    } else {
      const anchor = document.createElement('a');
      anchor.className = 'header-menu-category-trigger';
      anchor.dataset.testid = 'header-menu-category-trigger';
      anchor.href = category.href || '#';
      anchor.textContent = category.label;
      trigger = anchor;
      content = document.createElement('div');
      content.hidden = true;
      li.append(trigger);
    }

    entries.push({ category, li, content, trigger });
    list.append(li);
  });

  entries.forEach(({ trigger }, index) => {
    if (trigger.tagName !== 'BUTTON') return;
    trigger.addEventListener('click', () => setActiveCategory(entries, promo, index));
  });

  const firstExpandable = entries.findIndex((entry) => entry.category.regions.length);
  // Deferred until the menu is first opened, so the promo <picture> isn't inserted (and its
  // image requested) on every page load while the panel is still closed.
  const activateInitial = () => {
    if (firstExpandable !== -1) setActiveCategory(entries, promo, firstExpandable);
  };

  return { list, activateInitial };
}

function buildMenuPanel(
  categories: NavCategory[],
  languages: NavLanguage[],
  activeLangLabel: string,
  ctaLabel: string,
  ctaHref: string,
  logo: HTMLAnchorElement,
): { panel: HTMLDivElement; closeButton: HTMLButtonElement; activateInitial: () => void } {
  const panel = document.createElement('div');
  panel.className = 'header-menu-panel';
  panel.setAttribute('aria-hidden', 'true');

  const top = document.createElement('div');
  top.className = 'header-menu-top';

  const closeButton = document.createElement('button');
  closeButton.className = 'header-menu-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close navigation menu');
  closeButton.innerHTML = '<span aria-hidden="true">x</span><span>CLOSE</span>';

  const panelLogo = logo.cloneNode(true) as HTMLAnchorElement;
  const tools = document.createElement('div');
  tools.className = 'header-menu-tools';
  const topCta = buildCtaZone(ctaLabel, ctaHref);
  tools.append(buildLangZone(languages, activeLangLabel));
  if (topCta) tools.append(topCta);

  top.append(closeButton, panelLogo, tools);

  const body = document.createElement('div');
  body.className = 'header-menu-body';

  const promo = buildMenuPromo();
  const { list: categoryList, activateInitial } = buildMenuCategories(categories, promo);
  body.append(categoryList, promo.root);

  const bottomLang = document.createElement('div');
  bottomLang.className = 'header-menu-bottom-lang';
  bottomLang.append(buildLangZone(languages, activeLangLabel));
  body.append(bottomLang);

  panel.append(top, body);
  return { panel, closeButton, activateInitial };
}

export default async function decorate(block: HTMLElement): Promise<void> {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location.href).pathname : null;
  const hide = () => {
    const headerElement = (block.closest('header') ?? block.closest('.header-wrapper') ?? block) as HTMLElement;
    headerElement.style.display = 'none';
  };

  let fragment = navPath ? await loadFragment(navPath) : null;
  if (!fragment) fragment = await loadFragment(`${getFragmentBasePath()}/nav`);
  if (!fragment) fragment = await loadFragment('/nav');
  if (!fragment) {
    hide();
    return;
  }

  const navRoot = fragment.querySelector('.nav-content');
  if (!navRoot) {
    console.warn('[header] Nav structure invalid. Check /nav document.');
    hide();
    return;
  }

  const languages = readLanguages(navRoot);
  const categories = readCategories(navRoot);
  if (!languages.length || !categories.length) {
    console.warn('[header] Nav structure invalid. Check /nav document.');
    hide();
    return;
  }

  const logoPicture = navRoot.querySelector('.nav-logo img');
  const ctaAnchor = navRoot.querySelector<HTMLAnchorElement>(':scope > .nav-cta');
  const activeLang = getActiveLang(languages);

  const logo = buildLogo(
    logoPicture?.getAttribute('src') ?? '',
    logoPicture?.getAttribute('alt') ?? '',
    activeLang.href,
  );
  const menuToggle = buildMenuToggle();
  const langZone = buildLangZone(languages, activeLang.shortLabel);
  const cta = buildCtaZone(ctaAnchor?.textContent?.trim() ?? '', ctaAnchor?.getAttribute('href') ?? '');
  const { panel, closeButton, activateInitial } = buildMenuPanel(
    categories,
    languages,
    activeLang.shortLabel,
    ctaAnchor?.textContent?.trim() ?? '',
    ctaAnchor?.getAttribute('href') ?? '',
    logo,
  );

  const closeMenu = () => {
    const hadFocusInPanel = panel.contains(document.activeElement);
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (hadFocusInPanel) menuToggle.focus();
  };

  let menuActivated = false;
  const openMenu = () => {
    if (!menuActivated) {
      menuActivated = true;
      activateInitial();
    }
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  };

  menuToggle.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) closeMenu();
    else openMenu();
  });
  closeButton.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const tools = document.createElement('div');
  tools.className = 'header-tools';
  tools.append(langZone);
  if (cta) tools.append(cta);

  const inner = document.createElement('div');
  inner.className = 'header-inner';
  inner.append(menuToggle, logo, tools);

  block.dataset.testid = 'header';
  block.replaceChildren(inner, panel);

  const heroBannerSection = document.querySelector('main > div:has(.hero-banner)');
  if (heroBannerSection) {
    const headerElement = block.closest('header');
    if (headerElement) heroBannerSection.after(headerElement);
  }
}
