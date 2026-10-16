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
test('sushi burger photos and labels match shrimp, salmon and chuka fillings',()=>{
  const hot=categories.find(c=>c.id==='roll_vtemp');
  const burgers=Array.from(hot.items).filter(item=>item.name.startsWith('Суши-бургер'));
  assert.deepEqual(burgers.map(({name,image,description})=>[name,image,description]),[
    ['Суши-бургер с лососем','assets/hot/sushi-burger-salmon-approved.png','Состав: рис, сливочный сыр, огурец, авокадо, лосось. Снаружи панко.'],
    ['Суши-бургер с креветкой','assets/hot/sushi-burger-shrimp-approved.png','Состав: рис, сливочный сыр, огурец, авокадо, креветка. Снаружи панко.'],
    ['Суши-бургер с чукой','assets/hot/sushi-burger-chuka-approved.png','Состав: рис, сливочный сыр, огурец, авокадо, чука. Снаружи панко.'],
  ]);
});
test('five optional snack sauces are visible with generated 30 g menu photos and correct prices',()=>{
  const sauces=Array.from(categories.find(c=>c.id==='sauces').items).filter(item=>item.isSnackSauce);
  assert.equal(categories.find(c=>c.id==='sauces').label,'Соусы и добавки');
  assert.deepEqual(sauces.map(({catalogId,name,price,image})=>[catalogId,name,price,image]),[
    ['edenfood-sauces-005','Кетчуп (30 г)','10 руб','assets/sauces/ketchup.webp'],
    ['edenfood-sauces-006','Майонез (30 г)','10 руб','assets/sauces/mayonnaise.webp'],
    ['edenfood-sauces-007','Сырный соус (30 г)','10 руб','assets/sauces/cheese.webp'],
    ['edenfood-sauces-008','Сладкий брусничный соус (30 г)','15 руб','assets/sauces/lingonberry.webp'],
    ['edenfood-sauces-009','Кисло-сладкий соус (30 г)','15 руб','assets/sauces/sweet-sour.webp'],
  ]);
  for(const item of sauces) assert.ok(fs.existsSync(path.join(__dirname,'..',item.image)),`missing photo for ${item.name}`);
});
