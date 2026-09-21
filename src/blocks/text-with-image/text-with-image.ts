export default function decorate(block: HTMLElement): void {
  const rows = [...block.children];
  const blockId = block.querySelector('[data-aue-prop="id"]')?.textContent?.trim();
  if (blockId) block.id = blockId;

  // row 0: eyebrow
  // row 1: title
  // row 2: description
  // row 3: desktop/tablet image (picture)
  // row 4: desktop/tablet image alt text
  // row 5: mobile image (picture)
  // row 6: mobile image alt text
  // row 7: CTA text
  // row 8: CTA link
  // row 9: CTA open in new tab
  // row 10: block ID
  const eyebrowText = rows[0]?.firstElementChild?.textContent?.trim() || '';
  const titleText = rows[1]?.firstElementChild?.textContent?.trim() || '';
  const descriptionEl = rows[2]?.firstElementChild;
  const pictureEl = rows[3]?.querySelector('picture');
  const desktopImg = pictureEl?.querySelector('img');
  const altText = rows[4]?.firstElementChild?.textContent?.trim() || desktopImg?.getAttribute('alt') || '';
  const mobilePictureEl = rows[5]?.querySelector('picture');
  const mobileImg = mobilePictureEl?.querySelector('img');
  const mobileSource = mobilePictureEl?.querySelector('source');
  const mobileSrc = mobileSource?.getAttribute('srcset') || mobileImg?.getAttribute('src');
  const mobileAltText = rows[6]?.firstElementChild?.textContent?.trim() || mobileImg?.getAttribute('alt') || '';
  const responsiveAltText = mobileAltText || altText;
  const ctaText = rows[7]?.firstElementChild?.textContent?.trim() || '';
  const ctaLinkEl = rows[8]?.querySelector('a');
  const ctaHref = ctaLinkEl?.getAttribute('href') || '';
  const openInNewTabValue = rows[9]?.firstElementChild?.textContent?.trim().toLowerCase() || '';
  const openInNewTab = openInNewTabValue === 'true';

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
