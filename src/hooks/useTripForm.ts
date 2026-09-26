import { useRef, useState } from 'react';
import { useTrips } from '../contexts/TripsContext';
import { getMeetingLocation, LocationPermissionError } from '../services/meeting-location';
import { tripErrors, type Trip } from '../types/trip';
import type { Venue } from '../types/event';
const localDate = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function useTripForm(initial: Trip | undefined, onSaved: (id:string)=>void) {
  const {save} = useTrips();
  const [id] = useState(()=>initial?.id ?? `trip-${Date.now()}-${Math.random().toString(36).slice(2,12)}`);
  const [title,setTitle]=useState(initial?.title??''); const [date,setDate]=useState(initial?.date??localDate());
  const [note,setNote]=useState(initial?.note??''); const [place,setPlace]=useState(initial?.location.name??'');
  const [lat,setLat]=useState(initial ? String(initial.location.latitude):''); const [lng,setLng]=useState(initial ? String(initial.location.longitude):'');
  const [photo,setPhoto]=useState<string|null>(initial?.photo??null); const [favorite,setFavorite]=useState(initial?.favorite??false);
  const [busy,setBusy]=useState(false); const [photoBusy,setPhotoBusy]=useState(false); const [locating,setLocating]=useState(false); const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState(''); const [settings,setSettings]=useState(false); const lock=useRef(false); const locationLock=useRef(false);
  const location={name:place.trim(),latitude:lat.trim()?Number(lat):NaN,longitude:lng.trim()?Number(lng):NaN};
  const draft={id,title,date,note,location,photo,favorite}; const errors=tripErrors(draft);
  const validCoordinates=Number.isFinite(location.latitude)&&Math.abs(location.latitude)<=90&&Number.isFinite(location.longitude)&&Math.abs(location.longitude)<=180;
  function choosePoint(point:Venue) {setLat(String(point.latitude));setLng(String(point.longitude));}
  async function locate() {
    if(locationLock.current) return; locationLock.current=true; setLocating(true);setError('');setSettings(false);
    try {choosePoint(await getMeetingLocation());} catch(e){setError(e instanceof Error?e.message:'อ่านตำแหน่งไม่ได้');if(e instanceof LocationPermissionError)setSettings(e.openSettings);} finally{locationLock.current=false;setLocating(false);}
  }
  async function submit() {
    setSubmitted(true);if(lock.current||photoBusy||locating||Object.values(errors).some(Boolean))return;
    lock.current=true;setBusy(true);setError('');
    try{await save(draft);onSaved(id);}catch(e){setError(e instanceof Error?e.message:'บันทึกไม่ได้ กรุณาลองใหม่');}finally{lock.current=false;setBusy(false);}
  }
  return {title,setTitle,date,setDate,note,setNote,place,setPlace,lat,setLat,lng,setLng,photo,setPhoto,favorite,setFavorite,busy,photoBusy,setPhotoBusy,locating,submitted,error,setError,settings,location,validCoordinates,errors,choosePoint,locate,submit};
}
