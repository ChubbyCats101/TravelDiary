import { tripErrors, isTrip } from '../types/trip';
import { trip } from './fixtures';

it('accepts leap day and coordinate limits', () => {
  expect(Object.values(tripErrors({ ...trip, date: '2024-02-29', location: { name: 'ขั้วโลก', latitude: 90, longitude: -180 } })).some(Boolean)).toBe(false);
  expect(isTrip(trip)).toBe(true);
});

it.each([
  ['title', { title: ' ' }], ['title', { title: 'a'.repeat(101) }],
  ['date', { date: '2026-02-29' }], ['date', { date: '2026-02-30' }],
  ['note', { note: 'a'.repeat(4001) }],
  ['location', { location: { ...trip.location, latitude: NaN } }],
  ['location', { location: { ...trip.location, longitude: 181 } }],
] as const)('rejects invalid %s', (field, change) => {
  expect(tripErrors({ ...trip, ...change })[field]).not.toBe('');
});
