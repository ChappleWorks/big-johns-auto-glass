const work = [
  { id: 'mobile-pair', category: 'Windshields', title: 'Windshield fitting in the driveway',
    note: 'The same vehicle with its windshield opening exposed and with the replacement glass being fitted. The photos were taken from slightly different angles.',
    image: 'assets/work/windshield-fitting.webp', before: 'assets/work/windshield-opening.webp',
    alt: 'Two technicians fitting glass on a white vehicle in a driveway' },
  { id: 'gmc-video', category: 'Windshields', title: 'Windshield work on a GMC',
    note: 'A short, silent clip from the Big John’s shop media archive.',
    image: 'assets/work/gmc-install.webp', video: 'assets/work/gmc-install.mp4',
    alt: 'A technician working on a white GMC windshield' },
  { id: 'custom-shop', category: 'Custom Work', title: 'Classic car glass preparation',
    note: 'A look inside the workshop during glass preparation on a custom project.',
    image: 'assets/custom.webp', alt: 'Technician preparing the glass opening on a white classic car' },
];
const reviews = [
  ['I got a lot of education from these folks.', 'April 2026'],
  ['They went above and beyond in an emergency situation.', 'June 2025'],
  ['They were fast, courteous and friendly.', 'May 2024'],
];
const select = selector => document.querySelector(selector);
const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};
function photo(src, alt) {
  const image = make('img');
  image.src = src;
  image.alt = alt;
  return image;
}
function setupWorkPage() {
  const stage = select('#work-stage');
  const thumbs = select('#work-thumbs');
  const dialog = select('#work-lightbox');
  const filterButtons = [...document.querySelectorAll('[data-category]')];
  let category = 'all';
  let active = location.hash.slice(1);
  let visible = [];
  let opener;

  function photoButton(src, alt, label) {
    const button = make('button', 'work-photo-button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.append(photo(src, alt));
    button.addEventListener('click', () => {
      opener = button;
      const image = dialog.querySelector('img');
      image.src = src;
      image.alt = alt;
      dialog.showModal();
    });
    return button;
  }
  function render() {
    visible = work.filter(job => (category === 'all' || category === job.category));
    const job = visible.find(item => item.id === active) ?? visible[0];
    active = job?.id;
    stage.replaceChildren();
    thumbs.replaceChildren();
    select('#work-category').textContent = job?.category ?? '';
    select('#work-title').textContent = job?.title ?? 'No gallery media in this category yet.';
    select('#work-note').textContent = job?.note ?? 'Browse all work to see the photos and videos currently available.';
    select('#work-arrows').hidden = visible.length < 2;
    select('#work-count').textContent = job ? (visible.indexOf(job) + 1) + ' / ' + visible.length : '';
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.category === category));
    if (!job) return;
    if (job.before) {
      const openingAlt = 'White vehicle with its windshield removed';
      const comparison = make('div', 'work-compare');
      const opening = photoButton(job.before, openingAlt, 'Enlarge opening photo');
      const fitted = photoButton(job.image, job.alt, 'Enlarge fitting photo');
      comparison.append(opening, fitted);
      const controls = make('div', 'work-compare-controls');
      const slider = make('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 100;
      slider.value = 50;
      slider.setAttribute('aria-label', 'Compare empty windshield opening with glass being fitted');
      function reveal() {
        const split = 100 - Number(slider.value);
        fitted.style.clipPath = 'inset(0 0 0 ' + split + '%)';
        comparison.style.setProperty('--split', split + '%');
      }
      slider.addEventListener('input', reveal);
      controls.append(make('span', '', 'Opening'), slider, make('span', '', 'Fitting'));
      stage.append(comparison, controls);
      reveal();
    } else if (job.video) {
      const video = make('video');
      video.src = job.video;
      video.poster = job.image;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-label', job.title);
      stage.append(video);
    } else {
      stage.append(photoButton(job.image, job.alt, 'Enlarge ' + job.title));
    }
    for (const item of visible) {
      const thumb = make('button', 'work-thumb');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', item.title);
      thumb.setAttribute('aria-pressed', String(item.id === active));
      thumb.append(photo(item.image, ''), make('span', '', item.title));
      thumb.addEventListener('click', () => {
        active = item.id;
        render();
        thumbs.querySelector('[aria-pressed="true"]')?.focus();
      });
      thumbs.append(thumb);
    }
  }
  function step(offset) {
    if (visible.length < 2) return;
    const index = visible.findIndex(item => item.id === active);
    active = visible[(index + offset + visible.length) % visible.length].id;
    render();
  }
  select('#work-prev').addEventListener('click', () => step(-1));
  select('#work-next').addEventListener('click', () => step(1));
  for (const button of filterButtons) button.addEventListener('click', () => {
    category = button.dataset.category;
    render();
  });
  stage.addEventListener('keydown', event => {
    if (event.target !== stage || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  });
  let touch;
  stage.addEventListener('touchstart', event => {
    if (event.target.closest('input,video')) return;
    const point = event.changedTouches[0];
    touch = { x: point.clientX, y: point.clientY };
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touch) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    touch = undefined;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
      step(dx < 0 ? 1 : -1);
    }
  });
  stage.addEventListener('touchcancel', () => { touch = undefined; });
  select('#work-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());

  let review = 0;
  function showReview(offset = 0) {
    review = (review + offset + reviews.length) % reviews.length;
    const [excerpt, date] = reviews[review];
    select('#review-quote').textContent = '“' + excerpt + '”';
    select('#review-credit').textContent = 'Customer review excerpt · Loc8NearMe · ' + date;
    select('#review-count').textContent = (review + 1) + ' / ' + reviews.length;
  }
  select('#review-prev').addEventListener('click', () => showReview(-1));
  select('#review-next').addEventListener('click', () => showReview(1));

  showReview();
  render();
}
if (select('#work-stage')) setupWorkPage();
