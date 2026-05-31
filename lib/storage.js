import AsyncStorage from '@react-native-async-storage/async-storage';

const K_PROFILE = 'profile';
const K_APIKEY = 'openrouter_api_key';
const K_WEIGHTS = 'weights';
const K_FAVORITES = 'favorites';

// ── Ключи по дате ──
function ymd(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function diaryKey(d) {
  return `diary_${ymd(d)}`;
}
function waterKey(d) {
  return `water_${ymd(d)}`;
}
export function todayKey() {
  return diaryKey(new Date());
}

// ── Профиль ──
export async function getProfile() {
  const raw = await AsyncStorage.getItem(K_PROFILE);
  return raw ? JSON.parse(raw) : null;
}
export async function saveProfile(profile) {
  await AsyncStorage.setItem(K_PROFILE, JSON.stringify(profile));
}

// ── API-ключ ──
export async function getApiKey() {
  return (await AsyncStorage.getItem(K_APIKEY)) || '';
}
export async function saveApiKey(key) {
  await AsyncStorage.setItem(K_APIKEY, key);
}

// ── Дневник за сегодня ──
export async function getDiary() {
  const raw = await AsyncStorage.getItem(todayKey());
  return raw ? JSON.parse(raw) : [];
}
export async function saveDiary(items) {
  await AsyncStorage.setItem(todayKey(), JSON.stringify(items));
}
// Обновить одну запись дневника по id.
export async function updateDiaryItem(id, patch) {
  const items = await getDiary();
  const next = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
  await saveDiary(next);
  return next;
}

// ── Избранные блюда (база на 100 г / порцию для быстрого добавления) ──
export async function getFavorites() {
  const raw = await AsyncStorage.getItem(K_FAVORITES);
  return raw ? JSON.parse(raw) : [];
}
export async function addFavorite(fav) {
  const list = await getFavorites();
  // не дублируем по названию
  if (list.some((f) => f.dish === fav.dish)) return list;
  const next = [{ ...fav, favId: Date.now() }, ...list].slice(0, 50);
  await AsyncStorage.setItem(K_FAVORITES, JSON.stringify(next));
  return next;
}
export async function removeFavorite(favId) {
  const list = await getFavorites();
  const next = list.filter((f) => f.favId !== favId);
  await AsyncStorage.setItem(K_FAVORITES, JSON.stringify(next));
  return next;
}
export async function removeFavoriteByDish(dish) {
  const list = await getFavorites();
  const next = list.filter((f) => f.dish !== dish);
  await AsyncStorage.setItem(K_FAVORITES, JSON.stringify(next));
  return next;
}

// ── Вода за сегодня (кол-во стаканов) ──
export async function getWater() {
  const raw = await AsyncStorage.getItem(waterKey(new Date()));
  return raw ? Number(raw) : 0;
}
export async function saveWater(n) {
  await AsyncStorage.setItem(waterKey(new Date()), String(Math.max(0, n)));
}

// ── Записи веса: [{ date: 'YYYY-MM-DD', kg }] ──
export async function getWeights() {
  const raw = await AsyncStorage.getItem(K_WEIGHTS);
  return raw ? JSON.parse(raw) : [];
}
export async function addWeight(kg) {
  const list = await getWeights();
  const today = ymd(new Date());
  const without = list.filter((w) => w.date !== today); // одна запись в день
  const next = [...without, { date: today, kg }].sort((a, b) => a.date.localeCompare(b.date));
  await AsyncStorage.setItem(K_WEIGHTS, JSON.stringify(next));
  return next;
}

// ── Калории за последние N дней: [{ date: Date, label, cal }] ──
export async function getDailyCalories(days = 7) {
  const dates = [];
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
    keys.push(diaryKey(d));
  }
  const pairs = await AsyncStorage.multiGet(keys);
  const wd = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return pairs.map(([, v], idx) => {
    const items = v ? JSON.parse(v) : [];
    const cal = items.reduce((s, x) => s + (x.calories || 0), 0);
    return { date: dates[idx], label: wd[dates[idx].getDay()], cal };
  });
}

// ── Стрик: сколько дней подряд (от сегодня назад) есть записи ──
export async function getStreak() {
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const raw = await AsyncStorage.getItem(diaryKey(d));
    const items = raw ? JSON.parse(raw) : [];
    if (items.length > 0) {
      streak++;
    } else if (i === 0) {
      continue; // сегодня ещё не ел — стрик считаем со вчера
    } else {
      break;
    }
  }
  return streak;
}

// ── Сколько всего дней с записями (для достижений) ──
export async function getLoggedDaysCount() {
  const all = await AsyncStorage.getAllKeys();
  let count = 0;
  const diaryKeys = all.filter((k) => k.startsWith('diary_'));
  const pairs = await AsyncStorage.multiGet(diaryKeys);
  for (const [, v] of pairs) {
    const items = v ? JSON.parse(v) : [];
    if (items.length > 0) count++;
  }
  return count;
}
