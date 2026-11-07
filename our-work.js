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
function readState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('big-john-work-demo'));
    if (saved && Array.isArray(saved.hidden)) return saved;
  } catch { /* Storage may be disabled. */ }
  return { hidden: [], featured: null };
}
const state = readState();
function saveState() {
  try {
    sessionStorage.setItem('big-john-work-demo', JSON.stringify(state));
  } catch { return false; }
  return true;
}
function photo(src, alt) {
  const image = make('img');
  image.src = src;
  image.alt = alt;
  return image;
}
function showHomeFeature() {
  const section = select('#work-feature');
  const job = work.find(item => item.id === state.featured && !state.hidden.includes(item.id));
  if (!job) return;
  section.classList.add('split');
  const details = make('div');
  const link = make('a', 'text-link', 'View this job in Our Work →');
  link.href = 'our-work.html#' + job.id;
  details.append(make('p', 'eyebrow', 'Featured work · Local demo'), make('h2', '', job.title), link);
  section.append(photo(job.image, job.alt), details);
  section.hidden = false;
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
    visible = work.filter(job => !state.hidden.includes(job.id) && (category === 'all' || category === job.category));
    const job = visible.find(item => item.id === active) ?? visible[0];
    active = job?.id;
    stage.replaceChildren();
    thumbs.replaceChildren();
    select('#work-category').textContent = job?.category ?? '';
    select('#work-title').textContent = job?.title ?? 'No gallery media in this category yet.';
    select('#work-note').textContent = job?.note ?? 'Browse all work to see the photos and videos currently available.';
    select('#work-arrows').hidden = visible.length < 2;
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
        fitted.style.clipPath = 'inset(0 0 0 ' + slider.value + '%)';
        comparison.style.setProperty('--split', slider.value + '%');
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
      video.preload = 'metadata';
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

  function setupPublishing() {
    const admin = select('#work-admin');
    for (const job of work) {
      const row = make('fieldset', 'work-record');
      const legend = make('legend', '', job.title);
      const publishLabel = make('label');
      const publish = make('input');
      publish.type = 'checkbox';
      const feature = make('button', 'secondary');
      feature.type = 'button';
      function refresh() {
        publish.checked = !state.hidden.includes(job.id);
        feature.disabled = !publish.checked;
        feature.textContent = state.featured === job.id ? 'Remove homepage feature' : 'Feature on homepage';
      }
      function changed() {
        select('#work-admin-status').textContent = saveState()
          ? 'Demo gallery and homepage settings saved for this tab.'
          : 'Gallery updated. Browser storage is unavailable for the homepage preview.';
        for (const update of refreshers) update();
        render();
      }
      publish.addEventListener('change', () => {
        state.hidden = state.hidden.filter(id => id !== job.id);
        if (!publish.checked) {
          state.hidden.push(job.id);
          if (state.featured === job.id) state.featured = null;
        }
        changed();
      });
      feature.addEventListener('click', () => {
        state.featured = state.featured === job.id ? null : job.id;
        changed();
      });
      publishLabel.append(publish, ' Publish to website');
      row.append(legend, publishLabel, feature);
      admin.append(row);
      refreshers.push(refresh);
      refresh();
    }
  }
  const refreshers = [];
  const feedback = select('#work-feedback');
  feedback.addEventListener('submit', event => {
    event.preventDefault();
    try {
      sessionStorage.setItem('big-john-work-feedback', JSON.stringify(Object.fromEntries(new FormData(feedback))));
      select('#work-feedback-result').textContent = 'Example feedback saved in this browser tab.';
      feedback.reset();
    } catch {
      select('#work-feedback-result').textContent = 'Browser storage is unavailable. Feedback was not saved.';
    }
  });
  feedback.querySelector('button').disabled = false;
  setupPublishing();
  showReview();
  render();
}
if (select('#work-stage')) setupWorkPage();
if (select('#work-feature')) showHomeFeature();
