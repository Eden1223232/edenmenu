const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.createContext(context);
for(const file of ['menu-data.js','extra-menu-data.js','street-menu-data.js','menu-search.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
const {search}=context.window.EdenMenuSearch;
const categories=context.window.EDEN_MENU;
const all=categories.flatMap(c=>c.items);
const namesFor=q=>new Set(search(categories,q).map(r=>r.item.name));
test('all Philadelphia names found, across all categories and spelling variants',()=>{
  const expected=all.filter(i=>/филадельфи/i.test(i.name));
  assert.ok(expected.length>5);
  for(const q of ['филадельфия','Фила','Philadelphia','filadelfiya','филаделфия','филадлеьфия','abkfltkmabz','abkf']){
    const names=namesFor(q);
    for(const item of expected) assert.ok(names.has(item.name),q+': '+item.name);
  }
});
test('title matches precede set/composition matches',()=>{
  const results=search(categories,'филадельфия');
  const firstComposition=results.findIndex(r=>!/филадельфи/i.test(r.item.name));
  assert.ok(firstComposition>0);
  assert.ok(results.slice(firstComposition).every(r=>!/филадельфи/i.test(r.item.name)));
  assert.ok(results.some(r=>r.category.id==='seti'));
});
test('multiword ingredients, transliteration, English and keyboard mistakes',()=>{
  for(const [a,b] of [['с угрём','eel'],['лосось','salmon'],['мини ролл','mini roll'],['горячие роллы','hot roll'],['Калифорния','California']]){
    const left=namesFor(a),right=namesFor(b);
    assert.ok(left.size>0,a);
    assert.deepEqual(right,left,a+' == '+b);
  }
  assert.ok(namesFor('фила лосось').size>0);
  assert.ok(namesFor('фила угорь').size<namesFor('фила').size);
  assert.deepEqual(namesFor('зршдфвудзршф'),namesFor('Philadelphia'));
});
test('empty/nonsense query; exact numeric price; no duplicate results',()=>{
  assert.equal(search(categories,'').length,0);
  assert.equal(search(categories,'неизвестноещщблюдо').length,0);
  const result=search(categories,'199');
  assert.ok(result.length>=7);
  assert.ok(result.every(r=>/199/.test(r.item.price)));
  assert.equal(new Set(result.map(r=>r.item)).size,result.length);
});
test('street rolls are sellable at 199; existing tube stays an addon at 50',()=>{
  const street=categories.find(c=>c.id==='street_rolls');
  assert.equal(street.items.length,7);
  for(const item of street.items){assert.equal(item.price,'199 руб');assert.equal(item.sellable,true);assert.ok(!item.enquiryOnly);}
  assert.match(categories.find(c=>c.id==='tubus').items[0].price,/50/);
});
