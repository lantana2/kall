import { API_KEY, API_URL, MODELS } from '../config';

// Промпт для модели: просим строгий JSON на русском.
const PROMPT = `Ты — нутрициолог. На фото — еда. Оцени блюдо и его пищевую ценность.
Отвечай ТОЛЬКО валидным JSON без markdown, без пояснений, строго по схеме:
{
  "dish": "название блюда на русском",
  "grams": число (примерный вес порции в граммах),
  "calories": число (ккал на всю порцию),
  "protein": число (белки, г),
  "fat": число (жиры, г),
  "carbs": число (углеводы, г),
  "confidence": "low" | "medium" | "high"
}
Если на фото нет еды — верни {"dish":"не еда","grams":0,"calories":0,"protein":0,"fat":0,"carbs":0,"confidence":"low"}.`;

// Достаём JSON даже если модель завернула его в текст/```.
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Модель вернула ответ без JSON: ' + text.slice(0, 120));
  return JSON.parse(match[0]);
}

// Один запрос к конкретной модели. Возвращает текст ответа модели.
async function callModel(model, key, base64) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      // Рекомендованные OpenRouter заголовки (помогают с доступом к :free моделям)
      'HTTP-Referer': 'https://kall.app',
      'X-Title': 'Kall Calorie Counter',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(errText.slice(0, 200));
    err.status = res.status; // 404 = модель недоступна, 429 = лимит
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Пустой ответ от модели.');
  return content;
}

/**
 * Отправляет фото в vision-модель и возвращает объект с калориями/БЖУ.
 * Перебирает модели из MODELS по очереди: недоступную (404) или занятую лимитом
 * (429) пропускает и берёт следующую.
 * @param {string} base64 — фото в base64 (без префикса data:)
 * @param {string} [apiKey] — ключ из настроек приложения (приоритетнее config.js)
 */
export async function analyzeFood(base64, apiKey) {
  const key = apiKey || API_KEY;
  if (!key || key === 'ВСТАВЬ_СЮДА_КЛЮЧ') {
    throw new Error('Нет API-ключа. Добавь бесплатный ключ OpenRouter, чтобы считать калории по фото (или используй поиск/штрихкод).');
  }

  let lastErr = null;
  let rateLimited = false; // 429 — модель перегружена/лимит
  let needCredit = false;  // 402 — нужен баланс на ключе
  let badKey = false;      // 401/403 — ключ не подошёл

  for (const model of MODELS) {
    try {
      const content = await callModel(model, key, base64);
      const parsed = extractJson(content);
      return {
        dish: String(parsed.dish ?? 'неизвестно'),
        grams: Number(parsed.grams) || 0,
        calories: Math.round(Number(parsed.calories) || 0),
        protein: Math.round(Number(parsed.protein) || 0),
        fat: Math.round(Number(parsed.fat) || 0),
        carbs: Math.round(Number(parsed.carbs) || 0),
        confidence: parsed.confidence ?? 'low',
      };
    } catch (e) {
      lastErr = e;
      if (e.status === 429) { rateLimited = true; continue; }   // занято — следующая
      if (e.status === 404) { continue; }                        // модель убрали
      if (e.status === 402) { needCredit = true; continue; }     // нет баланса — следующая
      if (e.status === 401 || e.status === 403) { badKey = true; break; } // ключ кривой
      // прочее — пробуем следующую
    }
  }

  if (badKey) {
    throw new Error('Ключ не подошёл. Обнови ключ в боте @kallsk_bot и вставь заново.');
  }
  if (rateLimited || needCredit) {
    throw new Error(
      'Бесплатные ИИ-модели сейчас перегружены (общий лимит). Подожди 1–2 минуты и попробуй снова. Если повторяется часто — обнови ключ в @kallsk_bot.'
    );
  }
  throw new Error('Не удалось распознать. ' + (lastErr ? lastErr.message : 'Проверь интернет и ключ.'));
}
