// Одноразовый сборщик: тянет открытые данные Open Food Facts по России
// и формирует локальную базу lib/foodDbBig.js (русские продукты + БЖУ на 100 г).
// Данные Open Food Facts под лицензией ODbL.
const fs = require('fs');
const path = require('path');

const UA = 'KallApp/1.1 (offline db builder; contact: t.me/cakkac)';
const PAGES = 360;         // страниц по 100 — покрыть всю базу (~34.6к)
const PAGE_SIZE = 100;
const CYR = /[А-Яа-яЁё]/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function num(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

async function fetchPage(page) {
  const url =
    'https://world.openfoodfacts.org/api/v2/search?countries_tags_en=russia' +
    '&fields=product_name,product_name_ru,nutriments' +
    `&page_size=${PAGE_SIZE}&page=${page}`;
  // до 4 попыток с нарастающей паузой (OFF любит 503)
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 503 || r.status === 429) throw new Error('HTTP ' + r.status);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      return d.products || [];
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(1500 * attempt);
    }
  }
  return [];
}

(async () => {
  const seen = new Set();
  const out = [];
  let consecFail = 0;
  for (let page = 1; page <= PAGES; page++) {
    let prods = [];
    try {
      prods = await fetchPage(page);
      consecFail = 0;
    } catch (e) {
      console.log(`page ${page} failed: ${e.message}`);
      consecFail++;
      if (consecFail >= 6) { console.log('too many failures, stop'); break; }
      await sleep(2000);
      continue; // не обрываем весь сбор из-за одной страницы
    }
    if (prods.length === 0) { consecFail++; if (consecFail >= 6) break; continue; }

    for (const p of prods) {
      let name = (p.product_name_ru || p.product_name || '').trim();
      if (!name || !CYR.test(name)) continue;          // только русские названия
      const n = p.nutriments || {};
      let kcal = num(n['energy-kcal_100g']);
      if (!kcal && n['energy_100g']) kcal = num(n['energy_100g']) / 4.184;
      kcal = Math.round(kcal);
      if (kcal <= 0 || kcal > 1000) continue;           // отсекаем мусор
      name = name.replace(/\s+/g, ' ').slice(0, 50);
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([
        name,
        kcal,
        Math.round(num(n.proteins_100g)),
        Math.round(num(n.fat_100g)),
        Math.round(num(n.carbohydrates_100g)),
      ]);
    }
    if (page % 5 === 0) console.log(`page ${page}: collected ${out.length}`);
    await sleep(500);
  }

  const dest = path.join(__dirname, '..', 'lib', 'foodDbBig.js');
  const js =
    '// АВТОСГЕНЕРИРОВАНО из открытых данных Open Food Facts (Россия), лицензия ODbL.\n' +
    '// Формат: [название, ккал, белки, жиры, углеводы] на 100 г.\n' +
    'export default ' + JSON.stringify(out) + ';\n';
  fs.writeFileSync(dest, js);
  console.log('DONE. total items:', out.length, '->', dest);
})();
