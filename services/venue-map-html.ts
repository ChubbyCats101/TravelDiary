export const venueMapHtml = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0}body{background:#e5eee8}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="window.ReactNativeWebView.postMessage(JSON.stringify({type:'script-error'}))"></script><script>
const send = value => window.ReactNativeWebView.postMessage(JSON.stringify(value));
const map = L.map('map');
const marker = L.marker([0,0], {draggable:true});
let editable = false, selected = false, initialized = false;
window.updateVenue = (lat,lng,canEdit) => {
  editable = canEdit;
  if(lat === null || lng === null) {
    if(selected) map.removeLayer(marker);
    selected = false;
    // Overview only: never send a default location into the form.
    if(!initialized) { map.setView([15.87,100.99],5); initialized = true; }
    return;
  }
  map.setView([lat,lng], initialized ? map.getZoom() : 14);
  initialized = true; marker.setLatLng([lat,lng]);
  if(!selected) marker.addTo(map);
  selected = true;
  if(canEdit) marker.dragging.enable(); else marker.dragging.disable();
};
const select = point => {
  if(!editable) return;
  const p = map.wrapLatLng(point);
  if(!Number.isFinite(p.lat) || Math.abs(p.lat)>90 || !Number.isFinite(p.lng) || Math.abs(p.lng)>180) return;
  window.updateVenue(p.lat,p.lng,editable);
  send({type:'point',latitude:p.lat,longitude:p.lng});
};
map.on('click', e => select(e.latlng));
marker.on('dragend', () => select(marker.getLatLng()));
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).on('tileload', () => send({type:'loaded'})).on('tileerror', () => send({type:'error'})).addTo(map);
send({type:'ready'});
</script></body></html>`;
