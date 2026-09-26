import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('map opens without GPS, selects by tap/drag, and preserves read-only detail maps', () => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync('src/services/venue-map-html.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  const messages = [], mapEvents = {}, markerEvents = {};
  let mounted = false, draggable = false, zoom, center, position;
  const map = {
    setView(point, nextZoom) { center = point; zoom = nextZoom; return this; },
    getZoom() { return zoom; },
    on(event, fn) { mapEvents[event] = fn; return this; },
    removeLayer() { mounted = false; },
    wrapLatLng(point) { return point; },
  };
  const marker = {
    setLatLng(point) { position = point; return this; },
    getLatLng() { return { lat: position[0], lng: position[1] }; },
    addTo() { assert.ok(zoom); mounted = true; return this; },
    on(event, fn) { markerEvents[event] = fn; return this; },
    dragging: { enable() { draggable = true; }, disable() { draggable = false; } },
  };
  const tile = { on() { return this; }, addTo() { return this; } };
  const window = { ReactNativeWebView: { postMessage: raw => messages.push(JSON.parse(raw)) } };
  vm.runInNewContext(exports.venueMapHtml.match(/<script>([\s\S]*?)<\/script>/)[1], { window, L: { map: () => map, marker: () => marker, tileLayer: () => tile } });
  window.updateVenue(null, null, true);
  assert.equal(zoom, 5); assert.equal(mounted, false);
  assert.equal(messages.filter(m => m.type === 'point').length, 0);
  mapEvents.click({ latlng: { lat: 18.8, lng: 98.9 } });
  assert.equal(mounted, true); assert.equal(draggable, true);
  assert.deepEqual(messages.at(-1), { type: 'point', latitude: 18.8, longitude: 98.9 });
  marker.setLatLng([18.9, 99]); markerEvents.dragend();
  assert.deepEqual(messages.at(-1), { type: 'point', latitude: 18.9, longitude: 99 });
  window.updateVenue(16.4, 102.8, false);
  assert.equal(center[0], 16.4); assert.equal(draggable, false);
  const count = messages.length;
  mapEvents.click({ latlng: { lat: 1, lng: 2 } }); markerEvents.dragend();
  assert.equal(messages.length, count);
  window.updateVenue(null, null, true);
  assert.equal(mounted, false); assert.equal(messages.length, count);
  mapEvents.click({ latlng: { lat: 91, lng: 2 } });
  assert.equal(messages.length, count);
});
