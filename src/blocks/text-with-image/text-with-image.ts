export default function decorate(block: HTMLElement): void {
  const rows = [...block.children];
  const blockId = block.querySelector('[data-aue-prop="id"]')?.textContent?.trim();
  if (blockId) block.id = blockId;

  // Optional fields may be omitted from the authored markup, so locate image and CTA rows by their content.
  const eyebrowText = rows[0]?.firstElementChild?.textContent?.trim() || '';
  const titleText = rows[1]?.firstElementChild?.textContent?.trim() || '';
  const descriptionEl = rows[2]?.firstElementChild;
  const pictureRows = rows.filter((row) => row.querySelector('picture'));
  const pictureEl = pictureRows[0]?.querySelector('picture');
  const desktopImg = pictureEl?.querySelector('img');
  const altText = desktopImg?.getAttribute('alt') || '';
  const mobileAssetRow = pictureRows[1];
  const mobilePictureEl = mobileAssetRow?.querySelector('picture');
  const mobileImg = mobilePictureEl?.querySelector('img');
  const mobileSource = mobilePictureEl?.querySelector('source');
  const mobileAsset = mobileAssetRow?.querySelector('img, a[href]');
  const mobileSrc =
    mobileSource?.getAttribute('srcset') ||
    mobileImg?.getAttribute('src') ||
    mobileAsset?.getAttribute('src') ||
    mobileAsset?.getAttribute('href') ||
    mobileAssetRow?.textContent?.trim();
  const mobileAltText = mobileImg?.getAttribute('alt') || '';
  const responsiveAltText = mobileAltText || altText;
  const ctaGroup = rows.find((row) => row.querySelector('a'))?.firstElementChild;
  const ctaLinkEl = ctaGroup?.querySelector('a');
  const ctaHref = ctaLinkEl?.getAttribute('href') || '';
  const ctaTextEl = [...(ctaGroup?.children || [])].find((element) => !element.querySelector('a'));
  const ctaText = ctaTextEl?.textContent?.trim() || '';
  const openInNewTab = [...(ctaGroup?.children || [])].some(
    (element) => element.textContent?.trim().toLowerCase() === 'true',
  );

  if (pictureEl) {
    const responsiveImageQuery = window.matchMedia('(max-width: 767px)');
    const updateAltText = () => {
      if (desktopImg) {
        desktopImg.alt = responsiveImageQuery.matches ? responsiveAltText : altText;
      }
    };
    updateAltText();

    if (mobilePictureEl) {
      if (mobileSrc) {
        const source = document.createElement('source');
        source.media = '(max-width: 767px)';
        source.srcset = mobileSrc;
        pictureEl.prepend(source);
      }
      responsiveImageQuery.addEventListener('change', updateAltText);
    }
  }

  const textCol = document.createElement('div');
  textCol.className = 'text-col';

  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = eyebrowText;
    textCol.append(eyebrow);
  }

  if (titleText) {
    const h3 = document.createElement('h3');
    h3.textContent = titleText;
    textCol.append(h3);
  }

  const desc = document.createElement('div');
  desc.className = 'description';

  if (descriptionEl) {
    desc.append(...descriptionEl.childNodes);
  }

  textCol.append(desc);

  if (ctaHref && ctaText) {
    const cta = document.createElement('a');
    cta.className = 'cta-link';
    cta.href = ctaHref;
    cta.textContent = ctaText;
    if (openInNewTab) cta.target = '_blank';
    textCol.append(cta);
  }

  const imageCol = document.createElement('div');
  imageCol.className = 'image-col';
  if (mobileSrc) imageCol.classList.add('has-mobile-image');
  if (pictureEl) imageCol.append(pictureEl);
  mobilePictureEl?.remove();

  block.innerHTML = '';
  block.append(textCol, imageCol);
}
