const find = selector => document.querySelector(selector);
const claim = find('#claim');
const field = name => claim.elements.namedItem(name);
const answer = name => field(name).value.trim();
const shop = 'Big Johns Customs LLC · 703 Thomas Ave, Suite 104, Leesburg, FL 34748 · (352) 787-1113';
const oemQuestion = 'Will my policy cover OEM glass for this vehicle? If there is a price difference, who pays it?';
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = number => currency.format(number);

// Local stand-in for CRM Company Settings. Registration and billing details require verification.
const carriers = {
  geico: {
    name: 'GEICO', url: 'https://www.geico.com/claims/glass-claims-guide/',
    app: 'Use the glass claims guide or open Claims in the GEICO Mobile app.',
    question: 'Any glass claim reference from GEICO?',
    requirements: 'Check which photos and documents GEICO requests during filing.',
    registration: null, shopId: null, network: null, assignment: null, pricingProfile: null, billing: null,
  },
  progressive: {
    name: 'Progressive', url: 'https://www.progressive.com/claims/faq/how-to-report-a-claim/',
    app: 'Sign in online or in the Progressive app and choose the glass claim type.',
    question: 'Any glass claim reference from Progressive?',
    requirements: 'Have the incident date, location, vehicle, and driver details ready.',
    registration: null, shopId: null, network: null, assignment: null, pricingProfile: null, billing: null,
  },
};
const replacement = { OEM: 650, Aftermarket: 400 };
const deposit = 100;
const pricingProfiles = { example: { replacementRate: 375 } };
const demoBilling = { name: 'Example carrier billing profile', format: 'reference-first', rule: 'Bill authorized work only' };
const job = { id: 'DEMO-GLASS-001', filing: false, assignment: 'Unverified', schedule: null, feedback: null };
let sheet = [];

const sampleVIN = '5UXWX7C5*BA';
const demoVehicle = { year: '2011', make: 'BMW', model: 'X3' };

function applyEntryChoices() {
  const params = new URLSearchParams(location.search);
  for (const key of ['payment', 'glass']) {
    const choice = params.get(key);
    if ([...field(key).options].some(option => option.value === choice)) field(key).value = choice;
  }
}

function decodeSample() {
  const status = find('#vin-status');
  if (answer('vin').toUpperCase() !== sampleVIN) {
    status.textContent = 'This demo can decode the published sample VIN only. Enter the sample vehicle details manually or choose Use sample VIN.';
    return;
  }
  for (const [key, value] of Object.entries(demoVehicle)) {
    if (!answer(key)) field(key).value = value;
  }
  status.textContent = 'NHTSA example: 2011 BMW X3. Existing entries were kept. Check the vehicle fields before continuing.';
  render();
}

find('#vin-sample').addEventListener('click', () => {
  field('vin').value = sampleVIN;
  decodeSample();
});
find('#vin-decode').addEventListener('click', decodeSample);

function render() {
  const carrier = carriers[answer('carrier')];
  const cash = answer('payment') === 'cash';
  const preference = answer('preference');
  const locationChoice = answer('serviceLocation');
  const total = replacement[preference];
  const isRepair = answer('service') === 'Repair';
  const deductible = answer('deductible');
  const knownDeductible = deductible !== '' && field('deductible').validity.valid;
  const photos = [...field('photos').files].map(file => file.name).join(', ');
  find('#carrier-fields').hidden = cash;
  find('#schedule-location').textContent = locationChoice
    ? 'Service preference: ' + locationChoice
    : 'Choose mobile or shop service in your glass request.';
  find('#schedule-guide').textContent = cash
    ? 'The shop confirms the actual service window after reviewing the request.'
    : 'The shop confirms the actual service window after receiving the assignment.';
  find('#other-carrier').hidden = answer('carrier') !== 'other';
  find('#filing').hidden = cash;
  find('#insurance-cost').hidden = cash;
  find('#cash-cost').hidden = !cash;
  find('#carrier-question').hidden = !carrier;
  find('#carrier-question span').textContent = carrier?.question ?? '';
  find('#carrier-instructions').textContent = carrier
    ? carrier.app + ' ' + carrier.requirements
    : 'Use your insurer’s official app or website. Select a listed carrier to see its official instructions.';
  const link = find('#carrier-link');
  link.hidden = !carrier;
  if (carrier) {
    link.href = carrier.url;
    link.textContent = 'Open ' + carrier.name + ' claims instructions (new tab)';
  } else {
    link.removeAttribute('href');
  }
  find('#assignment-guide').textContent = carrier?.assignment ??
    'Ask your insurer to confirm the shop listing before assigning the work. A registered shop name, shop ID, and network code are awaiting verification.';
  find('#mark-filed').textContent = job.filing ? 'Clear demo filing status' : 'Mark filed in this demo';
  find('#claim-status').textContent = job.filing
    ? 'Customer filing: Marked filed in this demo. No claim was sent.'
    : 'Customer filing: Not marked filed.';
  find('#estimate').textContent = isRepair
    ? 'Repair price and deductible treatment need confirmation.'
    : 'Example replacement pricing basis: ' + money(replacement.Aftermarket) + ' aftermarket or ' +
      money(replacement.OEM) + ' OEM. ' +
      (knownDeductible ? 'Deductible entered: ' + money(Number(deductible)) + '. ' : '') +
      'Actual out-of-pocket cost and coverage are unconfirmed.';
  find('#cash-cost').textContent = isRepair
    ? 'Repair pricing requires a shop assessment.'
    : total
      ? 'Example cash quote: ' + money(total) + '. Example deposit before ordering: ' + money(deposit) +
        '. Example balance after completion: ' + money(total - deposit) + '. Confirm the actual quote and deposit with the shop.'
      : 'Select OEM or aftermarket to see the example replacement quote, deposit before ordering, and balance due after completion.';

  sheet = [
    ['Shop', shop],
    ['Vehicle', [answer('year'), answer('make'), answer('model')].filter(Boolean).join(' ')],
    ['VIN', answer('vin')],
    ['Damaged glass', answer('glass')],
    ['Service location', locationChoice],
    ['Requested service', answer('service') || 'Confirm repair or replacement with the shop'],
    ['Glass preference', preference],
    ['Glass markings / features', answer('specs') || 'Confirm manufacturer, part number, DOT code and features with the shop'],
    ['Damage location', answer('incidentPlace')],
    ['Incident date', answer('incidentDate')],
    ['Driver', answer('driver')],
    ['Larger than a dollar bill?', answer('size')],
    ['Photos', photos],
    ['Payment preference', cash ? 'Cash / out of pocket' : 'Insurance'],
  ];
  if (!cash) sheet.push(
    ['Carrier', carrier?.name ?? (answer('carrier') === 'other' ? answer('otherCarrier') || 'Other' : '')],
    ['Policy number', answer('policy')],
    ['Glass coverage', answer('coverage') || 'Verify glass coverage with the carrier'],
    ['Deductible reminder', knownDeductible ? money(Number(deductible)) + ' entered. Confirm with the carrier.' : 'Confirm the deductible and any glass exception.'],
    ['OEM coverage question', oemQuestion],
    ['Registered shop / network', [carrier?.registration, carrier?.shopId, carrier?.network].filter(Boolean).join(' · ') || 'Confirm the registered listing and IDs before assignment'],
    ...(carrier ? [[carrier.question, answer('extra')]] : []),
  );
  const rows = sheet.map(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value || 'Not provided';
    row.append(term, detail);
    if (value) {
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'secondary';
      copy.textContent = 'Copy';
      copy.setAttribute('aria-label', 'Copy ' + label);
      copy.addEventListener('click', () => copyText(value));
      row.append(copy);
    }
    return row;
  });
  find('#sheet').replaceChildren(...rows);
}

async function copyText(text) {
  const status = find('#copy-status');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Copied.';
  } catch {
    const manual = document.createElement('textarea');
    manual.readOnly = true;
    manual.value = text;
    manual.setAttribute('aria-label', 'Select and copy these answers');
    status.replaceChildren('Copy the selected text manually. ', manual);
    manual.select();
  }
}
find('#copy-all').addEventListener('click', () => copyText(sheet.filter(([, value]) => value)
  .map(([label, value]) => label + ': ' + value).join('\n')));
claim.addEventListener('submit', event => event.preventDefault());
claim.addEventListener('input', event => {
  if (event.target === field('carrier')) {
    field('extra').value = '';
    job.filing = false;
  }
  render();
});
find('#mark-filed').addEventListener('click', () => {
  job.filing = !job.filing;
  render();
});
const schedule = find('#schedule-form');
const day = schedule.elements.namedItem('day');
const now = new Date();
day.min = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
schedule.addEventListener('submit', event => {
  event.preventDefault();
  if (!answer('serviceLocation')) {
    find('#schedule-result').textContent = 'Choose a service location before saving the demo request.';
    field('serviceLocation').focus();
    return;
  }
  job.schedule = { ...Object.fromEntries(new FormData(schedule)), location: answer('serviceLocation') };
  find('#schedule-result').textContent = 'Demo request recorded for ' + job.schedule.day +
    ' (' + job.schedule.location + '). Sooner contact: ' + job.schedule.sooner + '. A shop confirmation would be needed.';
});
const feedback = find('#feedback-form');
feedback.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(feedback);
  job.feedback = { calls: Number(data.get('calls')), review: data.get('review') };
  find('#feedback-result').textContent = 'Saved on this demo job: ' + job.feedback.calls + ' insurance calls.';
});
find('#show-invoices').addEventListener('click', () => {
  const carrier = carriers[answer('carrier')];
  const pricing = pricingProfiles[carrier?.pricingProfile] ?? pricingProfiles.example;
  const billing = carrier?.billing ?? demoBilling;
  const standard = [job.id, 'Example windshield replacement', 'Customer total: ' + money(replacement.Aftermarket)];
  const reference = 'Reference: ' + job.id;
  const insurance = [
    'Profile: ' + billing.name,
    'Configured example rate: ' + money(pricing.replacementRate),
    'Rule: ' + billing.rule,
    carrier ? carrier.name + ' billing configuration requires verification.' : 'Carrier billing configuration requires verification.',
  ];
  if (billing.format === 'reference-first') insurance.unshift(reference);
  else insurance.push(reference);
  find('#customer-invoice').textContent = standard.join('\n');
  find('#carrier-invoice').textContent = insurance.join('\n');
  find('#invoices').hidden = false;
});
applyEntryChoices();
render();
schedule.querySelector('button[type=submit]').disabled = false;
feedback.querySelector('button[type=submit]').disabled = false;
