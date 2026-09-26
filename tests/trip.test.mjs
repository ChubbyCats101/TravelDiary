import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync('src/types/trip.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
test('form validates calendar dates, coordinates, text and normalized server records',()=>{
  const draft={id:'trip-test',title:'ทริป',date:'2024-02-29',note:'',location:{name:'สถานที่',latitude:0,longitude:0},favorite:false,photo:null};
  assert.equal(Object.values(exports.tripErrors(draft)).some(Boolean),false);
  assert.ok(exports.tripErrors({...draft,date:'2025-02-29'}).date);
  assert.ok(exports.tripErrors({...draft,location:{...draft.location,latitude:NaN}}).location);
  assert.ok(exports.tripErrors({...draft,title:' '}).title);
  assert.equal(exports.isTrip({...draft,createdAt:'2026-09-24',updatedAt:'2026-09-24'}),true);
  assert.equal(exports.isTrip({...draft,location:null}),false);
});
