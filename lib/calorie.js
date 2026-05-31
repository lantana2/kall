// Расчёт дневной нормы калорий и БЖУ.
// Формула Миффлина-Сан Жеора (используется в большинстве приложений).

export const ACTIVITIES = [
  { key: 'low',     label: 'Минимум',      desc: 'Сидячий образ жизни',        factor: 1.2 },
  { key: 'light',   label: 'Лёгкая',       desc: 'Спорт 1-3 раза в неделю',    factor: 1.375 },
  { key: 'medium',  label: 'Средняя',      desc: 'Спорт 3-5 раз в неделю',     factor: 1.55 },
  { key: 'high',    label: 'Высокая',      desc: 'Спорт 6-7 раз в неделю',     factor: 1.725 },
  { key: 'extreme', label: 'Очень высокая', desc: 'Тяжёлый труд / 2 трен/день', factor: 1.9 },
];

export const GOALS = [
  { key: 'lose',     label: 'Похудеть',     desc: '-0,5 кг в неделю', emoji: '🔥', delta: -500 },
  { key: 'maintain', label: 'Поддерживать', desc: 'Держать вес',       emoji: '⚖️', delta: 0 },
  { key: 'gain',     label: 'Набрать массу', desc: '+0,4 кг в неделю', emoji: '💪', delta: 400 },
];

// Базовый обмен (ккал в покое).
export function bmr({ sex, age, height, weight }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

// Полный расчёт целей по профилю.
export function computeTargets(profile) {
  const a = ACTIVITIES.find((x) => x.key === profile.activity) || ACTIVITIES[0];
  const g = GOALS.find((x) => x.key === profile.goal) || GOALS[1];

  const base = bmr(profile);
  const tdee = base * a.factor;
  let calories = Math.round(tdee + g.delta);
  // Защита от слишком низкой нормы.
  const floor = profile.sex === 'female' ? 1200 : 1500;
  if (calories < floor) calories = floor;

  // БЖУ: белок по весу, жир 25% калорий, остальное — углеводы.
  const protein = Math.round(profile.weight * 1.8);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { bmr: Math.round(base), tdee: Math.round(tdee), calories, protein, fat, carbs };
}
