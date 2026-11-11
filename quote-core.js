export const glassOptions=['Windshield','Rear glass','Driver side','Passenger side','Quarter / vent glass','Unsure'];
export function normalizeVin(value){return String(value??'').trim().toUpperCase();}
export function validVin(value){return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(value));}

export async function decodeVin(value,{fetcher=fetch,signal=AbortSignal.timeout(8000)}={}){
  const vin=normalizeVin(value);
  if(!validVin(vin))throw Error('Enter a 17-character VIN. VINs do not use I, O or Q.');
  const response=await fetcher('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/'+vin+'?format=json',{signal});
  if(!response.ok)throw Error('VIN lookup is unavailable. Enter your vehicle manually.');
  const row=(await response.json()).Results?.[0];
  if(!row?.Make||!row?.Model||!/^\d{4}$/.test(row.ModelYear)||String(row.ErrorCode)!=='0'){
    throw Error('NHTSA could not verify that VIN. Check it or enter the vehicle manually.');
  }
  return {year:row.ModelYear,make:row.Make,model:row.Model};
}

export function validateQuote(input){
  const limits={vin:17,year:4,make:60,model:60,glass:24,payment:12,location:140,details:700,name:100,phone:32,email:180};
  const data={};
  for(const [key,max] of Object.entries(limits)){
    const value=String(input?.[key]??'').trim();
    if(value.length>max)throw Error('Check the length of your request details.');
    data[key]=value;
  }
  data.vin=normalizeVin(data.vin);
  if(data.vin&&!validVin(data.vin))throw Error('Correct the VIN or leave it blank for manual entry.');
  if(!/^\d{4}$/.test(data.year)||Number(data.year)<1886||Number(data.year)>new Date().getFullYear()+2||!data.make||!data.model)throw Error('Enter a valid vehicle year, make and model.');
  if(!glassOptions.includes(data.glass)||!data.location||!data.name)throw Error('Provide the glass, service location and your name.');
  if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))throw Error('Enter a valid email address.');
  if(data.phone&&!/^\+?[\d(). -]+$/.test(data.phone)||data.phone&&data.phone.replace(/\D/g,'').length<7)throw Error('Enter a valid phone number.');
  if(!data.phone&&!data.email)throw Error('Provide a phone number or email.');
  if(!['insurance','cash','Unsure'].includes(data.payment))throw Error('Choose a payment route.');
  return data;
}
