const explorer = document.querySelector('.glass-explorer');
const panel = explorer.querySelector('.glass-description');
const buttons = [...explorer.querySelectorAll('[data-part]')];
const glassChoices = {
  windshield: 'Windshield',
  'front-door': 'Front door (side unsure)',
  'rear-door': 'Rear door (side unsure)',
  quarter: 'Quarter glass (side unsure)',
  rear: 'Rear windshield',
};
const quote = panel.querySelector('#glass-quote');
const parts = {
  windshield: ['Windshield replacement', 'The large front glass in front of the driver. Tell us your vehicle year, make, and model so we can review the replacement you need.', 'windshield', 'Windshield options'],
  'front-door': ['Front door glass', 'The window beside the driver or front passenger. Tell us which side is damaged and whether the window still moves.', 'side', 'Side glass options'],
  'rear-door': ['Rear door glass', 'The window in a rear passenger door. Tell us the side and whether the broken piece moves or is fixed.', 'side', 'Side glass options'],
  quarter: ['Quarter glass', 'The small fixed window behind the rear door on some vehicles. Its shape and placement vary by vehicle.', 'side', 'Side glass options'],
  rear: ['Rear glass replacement', 'The large window at the back of the vehicle. Tell us if it has a defroster or rear wiper so we can review the right glass.', 'rear', 'Rear glass options'],
};
for (const button of buttons) {
  button.addEventListener('click', () => {
    const [title, description, target, linkText] = parts[button.dataset.part];
    panel.querySelector('h3').textContent = title;
    panel.querySelector('p').textContent = description;
    const link = panel.querySelector('a');
    link.href = 'services.html#' + target;
    link.textContent = linkText + ' →';
    quote.href = 'contact.html?glass=' + encodeURIComponent(glassChoices[button.dataset.part]) + '#quote';
    for (const option of buttons) {
      option.setAttribute('aria-pressed', String(option === button));
    }
  });
}

const vehicle = document.querySelector('#glass-vehicle');
const dial = document.querySelector('.orbit-dial');
const frames = Array.from({ length: 12 }, (_, index) => {
  const image = new Image();
  image.src = 'assets/fixed-orbit/' + String(index).padStart(2, '0') + '.webp';
  return image;
});
let current = 0;
let drag;
function showFrame(index) {
  current = (index % frames.length + frames.length) % frames.length;
  vehicle.src = frames[current].src;
}
for (const control of [vehicle, dial]) {
  control.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, start: current };
    control.setPointerCapture(event.pointerId);
  });
  control.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    const step = Math.round((event.clientX - drag.x) / 28);
    const target = (drag.start + step + frames.length) % frames.length;
    if (target !== current) showFrame(target);
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    control.addEventListener(name, (event) => {
      if (drag?.id === event.pointerId) drag = undefined;
    });
  }
}
dial.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
  event.preventDefault();
  showFrame(event.key === 'Home' ? 0 : current + (event.key === 'ArrowLeft' ? -1 : 1));
});
dial.addEventListener('click', (event) => {
  if (event.detail === 0) showFrame(0);
});
