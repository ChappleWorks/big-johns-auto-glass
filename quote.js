import {decodeVin,glassOptions,normalizeVin} from './quote-core.js';
const form=document.querySelector('#quote-request');
const fields=form.elements;
const result=document.querySelector('#quote-result');
const vinResult=document.querySelector('#vin-result');
const lookup=document.querySelector('#decode-vin');
const send=document.querySelector('#send-quote');
const params=new URLSearchParams(location.search);
const incoming=params.get('glass')||'';
fields.glass.value=glassOptions.includes(incoming)?incoming:({ 'Rear windshield':'Rear glass','Quarter glass (side unsure)':'Quarter / vent glass','Front door (side unsure)':'Unsure','Rear door (side unsure)':'Unsure' })[incoming]||'';
if(['cash','insurance'].includes(params.get('payment')))fields.payment.value=params.get('payment');

lookup.addEventListener('click',async()=>{
  const vin=normalizeVin(fields.vin.value);
  const previous=['year','make','model'].map(key=>fields[key].value);
  lookup.disabled=true;
  vinResult.textContent='Checking NHTSA…';
  try{
    const decoded=await decodeVin(vin);
    if(normalizeVin(fields.vin.value)!==vin||['year','make','model'].some((key,i)=>fields[key].value!==previous[i])){
      vinResult.textContent='Vehicle details changed during lookup. Your entries were kept.';return;
    }
    for(const [key,value] of Object.entries(decoded))fields[key].value=value;
    fields.vin.value=vin;
    vinResult.textContent='Vehicle decoded. Confirm the details before continuing.';
  }catch(error){vinResult.textContent=error instanceof TypeError||error.name==='TimeoutError'?'VIN lookup is unavailable. Enter your vehicle manually.':error.message;}
  finally{lookup.disabled=false;}
});

const carrierField=document.querySelector('#carrier-field');
function updateCarrier(){
  const insurance=fields.payment.value==='insurance';
  carrierField.hidden=!insurance;
  fields.carrier.disabled=!insurance;
  fields.carrier.required=insurance;
}
fields.payment.addEventListener('change',updateCarrier);
updateCarrier();

const steps=['customer','vehicle','service'].map(id=>document.getElementById(id));
const markers=[...document.querySelectorAll('.quote-progress li')];
const next=document.querySelector('#quote-next');
const back=document.querySelector('#quote-back');
const stepLabel=document.querySelector('#quote-step-label');
const summary=document.querySelector('#quote-summary');
let current=0;

function renderSummary(){
  const payment={insurance:'Insurance',cash:'Cash',considering:'Considering cash'}[fields.payment.value];
  const rows=[
    ['Contact',[fields.name.value,fields.phone.value,fields.email.value].filter(Boolean).join(' · ')],
    ['Address',[fields.address.value,fields.city.value,fields.zip.value].filter(Boolean).join(', ')],
    ['Vehicle',[fields.year.value,fields.make.value,fields.model.value].filter(Boolean).join(' ')],
    ['VIN',fields.vin.value],['Glass',fields.glass.value],['Damage',fields.damage.value],
    ['Payment',payment],['Carrier',fields.carrier.disabled?'':fields.carrier.value],
    ['Preference',fields.preference.value],['Schedule',[fields.service.value,fields.timeframe.value].filter(Boolean).join(' · ')],
    ['Notes',fields.notes.value]
  ];
  summary.replaceChildren();
  for(const [label,value] of rows){
    if(!value)continue;
    const row=document.createElement('div');
    const term=document.createElement('dt');
    const detail=document.createElement('dd');
    term.textContent=label;
    detail.textContent=value;
    row.append(term,detail);
    summary.append(row);
  }
}
function showStep(index,focus=true){
  current=index;
  steps.forEach((section,i)=>{
    section.hidden=i!==index;
    if(i===index)markers[i].setAttribute('aria-current','step');
    else markers[i].removeAttribute('aria-current');
  });
  stepLabel.textContent='Step '+(index+1)+' of 3';
  back.hidden=index===0;
  next.hidden=index===2;
  send.hidden=index!==2;
  next.textContent=index===0?'Next: Vehicle':'Next: Service & review';
  if(index===2)renderSummary();
  if(focus){
    const legend=steps[index].querySelector('legend');
    legend.tabIndex=-1;
    legend.focus();
  }
}
function validateStep(index){
  const invalid=[...steps[index].querySelectorAll('input,select,textarea')].find(field=>field.willValidate&&!field.validity.valid);
  if(!invalid)return true;
  if(current!==index)showStep(index,false);
  invalid.reportValidity();
  return false;
}
function advance(){
  if(current<2&&validateStep(current))showStep(current+1);
}
form.noValidate=true;
next.addEventListener('click',advance);
back.addEventListener('click',()=>showStep(current-1));
form.addEventListener('input',()=>{if(current===2)renderSummary();});
form.addEventListener('change',()=>{if(current===2)renderSummary();});
showStep(0,false);

const photoInput=document.querySelector('#quote-photos');
const photoStatus=document.querySelector('#quote-photo-status');
const photoPreviews=document.querySelector('#quote-photo-previews');
const clearPhotos=document.querySelector('#clear-photos');
let photoUrls=[];
function resetPhotos(){
  for(const url of photoUrls)URL.revokeObjectURL(url);
  photoUrls=[];
  photoPreviews.replaceChildren();
  clearPhotos.hidden=true;
  photoStatus.textContent='';
}
photoInput.addEventListener('change',()=>{
  resetPhotos();
  const files=[...photoInput.files];
  if(files.length>3||files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)){
    photoInput.value='';
    photoStatus.textContent='Choose up to three JPG, PNG, or WebP images, each no larger than 8 MB.';
    return;
  }
  files.forEach((file,i)=>{
    const url=URL.createObjectURL(file);
    photoUrls.push(url);
    const image=document.createElement('img');
    image.src=url;
    image.alt='Selected damage photo '+(i+1);
    photoPreviews.append(image);
  });
  clearPhotos.hidden=files.length===0;
  if(files.length)photoStatus.textContent=files.length+' selected for preview on this device.';
});
clearPhotos.addEventListener('click',()=>{
  photoInput.value='';
  resetPhotos();
  photoInput.focus();
});

const download=document.querySelector("#download-quote");
function showResult(message, state) {
  result.textContent = message;
  result.dataset.state = state;
}
send.disabled = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (current < 2) { advance(); return; }
  if (!steps.every((_, index) => validateStep(index))) return;
  showResult('Preview complete. No quote request was sent.', 'success');
  result.focus();
});
download.addEventListener('click',()=>{
  const draft=Object.entries(Object.fromEntries(new FormData(form)))
    .filter(([name,value])=>name!=='website'&&value)
    .map(([name,value])=>name+': '+value).join('\n');
  const url=URL.createObjectURL(new Blob(['Big John’s Customs — quote request draft\n\n'+draft],{type:'text/plain'}));
  const link=document.createElement('a');
  link.href=url;
  link.download='big-john-quote-request.txt';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showResult('Your draft was downloaded. It has not been sent.','pending');
});
