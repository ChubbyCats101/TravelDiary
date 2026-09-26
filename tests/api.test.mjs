import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApi } from '../server/api.mjs';
import { mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('private diary: authentication, create, retry, edit, favorite, validation, ownership and delete', async () => {
  const server=createApi(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  async function request(path,method='GET',body,token) {
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
    return {status:response.status,data:await response.json()};
  }
  try {
    assert.equal((await request('/trips')).status,401);
    const a=(await request('/auth/register','POST',{email:'a@example.test',password:'TestPassword12'})).data.token;
    const b=(await request('/auth/register','POST',{email:'b@example.test',password:'TestPassword12'})).data.token;
    assert.equal((await request('/profile')).status,401);
    const profile={name:'นักเดินทาง',bio:'ชอบภูเขา',photo:null};
    assert.equal((await request('/profile','PUT',{...profile,email:'b@example.test'},a)).status,200);
    assert.deepEqual((await request('/profile','GET',null,a)).data,profile);
    assert.equal((await request('/profile','GET',null,b)).data.name,'นักเก็บความทรงจำ');
    for(const change of [{name:' '},{name:'x'.repeat(61)},{bio:'x'.repeat(301)},{photo:'https://example.test/a.jpg'},{photo:'data:image/jpeg;base64,AAAA'}]) {
      assert.equal((await request('/profile','PUT',{...profile,...change},a)).status,400);
    }
    assert.deepEqual((await request('/profile','GET',null,a)).data,profile);
    assert.ok(a&&b); assert.equal((await request('/auth/login','POST',{email:'a@example.test',password:'wrongpass'})).status,401);
    const draft={id:'test-trip',title:'เชียงใหม่',date:'2026-09-24',note:'ความทรงจำ',location:{name:'ดอยสุเทพ',latitude:18.8,longitude:98.9},photo:null,favorite:false};
    const created=await request('/trips/test-trip','PUT',draft,a);assert.equal(created.status,201);
    assert.equal((await request('/trips/test-trip','PUT',draft,a)).status,200);
    assert.equal((await request('/trips','GET',null,a)).data.length,1);
    assert.equal((await request('/trips','GET',null,b)).data.length,0);
    assert.equal((await request('/trips/test-trip','PUT',draft,b)).status,404);
    assert.equal((await request('/trips/test-trip','DELETE',null,b)).status,404);
    const edited=await request('/trips/test-trip','PUT',{...draft,title:'เชียงใหม่วันที่สอง',favorite:true},a);
    assert.equal(edited.status,200);assert.equal(edited.data.favorite,true);assert.equal(edited.data.createdAt,created.data.createdAt);
    for(const change of [{date:'2026-02-30'},{date:'invalid'},{title:''},{photo:'data:image/jpeg;base64,AAAA'},{location:{...draft.location,latitude:91}},{favorite:'yes'},{id:'other'}]) {
      assert.equal((await request('/trips/test-trip','PUT',{...draft,...change},a)).status,400);
    }
    assert.equal((await request('/trips/test-trip','DELETE',null,a)).status,200);
    assert.equal((await request('/trips','GET',null,a)).data.length,0);
    await request('/auth/logout','POST',{},a);assert.equal((await request('/trips','GET',null,a)).status,401);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
test('diary and account survive an API restart in an independent database', async()=>{
  const dir=await mkdtemp(join(tmpdir(),'traveldiary-test-'));const database=join(dir,'diary.sqlite');
  let server=createApi({database});server.listen(0,'127.0.0.1');await once(server,'listening');
  const send=async(path,method,body,token)=>fetch(`http://127.0.0.1:${server.address().port}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
  try{
    const account={email:'persist@example.test',password:'TestPassword12'};
    const session=await(await send('/auth/register','POST',account)).json();
    const profile={name:'ชื่อที่เก็บไว้',bio:'ออกไปเจอโลก',photo:null};
    assert.equal((await send('/profile','PUT',profile,session.token)).status,200);
    const draft={id:'persist-trip',title:'ทริปที่เก็บไว้',date:'2026-09-24',note:'ปิดเปิดเซิร์ฟเวอร์',location:{name:'ขอนแก่น',latitude:16.4,longitude:102.8},photo:null,favorite:false};
    assert.equal((await send('/trips/persist-trip','PUT',draft,session.token)).status,201);
    await new Promise(resolve=>server.close(resolve));server=createApi({database});server.listen(0,'127.0.0.1');await once(server,'listening');
    const login=await(await send('/auth/login','POST',account)).json();
    assert.deepEqual(await(await send('/profile','GET',null,login.token)).json(),profile);
    const trips=await(await send('/trips','GET',null,login.token)).json();assert.equal(trips[0].title,draft.title);
  }finally{await new Promise(resolve=>server.close(resolve));await unlink(database);await rmdir(dir);}
});
