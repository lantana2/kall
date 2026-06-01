// Бесплатная база продуктов Open Food Facts (без ключа).
// Все значения приводим к порции 100 г (grams: 100), дальше масштабируются ползунком.

const UA = 'KallApp/4.0 (calorie counter)';

function mapProduct(p) {
  const n = p.nutriments || {};
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);
  const name = [p.product_name, p.brands].filter(Boolean).join(' · ') || 'Продукт';
  return {
    dish: name.slice(0, 60),
    grams: 100,
    calories: Math.round(Number(kcal) || 0),
    protein: Math.round(Number(n.proteins_100g) || 0),
    fat: Math.round(Number(n.fat_100g) || 0),
    carbs: Math.round(Number(n.carbohydrates_100g) || 0),
    confidence: 'high',
    source: 'off',
  };
}

// Поиск по названию. Возвращает массив продуктов (по 100 г).
export async function searchFood(query) {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1' +
    '&lc=ru&page_size=25&fields=product_name,brands,nutriments,code' +
    '&search_terms=' + encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Не удалось получить данные базы (' + res.status + ')');
  const data = await res.json();
  return (data.products || [])
    .map(mapProduct)
    .filter((x) => x.calories > 0); // отбрасываем пустышки
}

// Поиск по штрихкоду. Возвращает один продукт или null.
// Используем стабильный v0-эндпоинт (v2 иногда отдаёт 404).
export async function lookupBarcode(code) {
  const url = 'https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(code) + '.json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  // 404 в OFF означает «такого продукта нет», а не сбой — отдаём null.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Ошибка запроса (' + res.status + ')');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return mapProduct(data.product);
}
