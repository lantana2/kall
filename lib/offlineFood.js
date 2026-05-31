// Офлайн-распознавание еды моделью TFLite (AIY Food V1) прямо на телефоне.
// Даёт НАЗВАНИЕ блюда; калории прикидываем по категории (foodCalories).
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import { decode as jpegDecode } from 'jpeg-js';
import { toByteArray } from 'base64-js';
import LABELS from './foodLabels';
import { estimateNutrition } from './foodCalories';

const MODEL_MODULE = require('../assets/model/food_v1.tflite');

let _model = null;
let _loading = null;

export async function loadModel() {
  if (_model) return _model;
  if (!_loading) {
    _loading = (async () => {
      // Гарантированно скачиваем ассет и берём локальный file:// путь.
      const loaded = await Asset.loadAsync(MODEL_MODULE);
      const asset = Array.isArray(loaded) ? loaded[0] : loaded;
      let uri = asset && (asset.localUri || asset.uri);
      if (!uri) throw new Error('модель не найдена (uri пустой)');
      // На некоторых сборках путь приходит без схемы file://
      if (!/^(file|content|https?):/.test(uri)) uri = 'file://' + uri;
      try {
        return await loadTensorflowModel({ url: uri });
      } catch (e) {
        throw new Error('загрузка модели: ' + uri + ' :: ' + (e.message || e));
      }
    })();
  }
  _model = await _loading;
  return _model;
}

function topK(arr, k) {
  const idx = [];
  for (let i = 1; i < arr.length; i++) idx.push(i); // 0 = __background__, пропускаем
  idx.sort((a, b) => arr[b] - arr[a]);
  return idx.slice(0, k);
}

/**
 * Распознаёт еду на фото офлайн. Возвращает объект как у analyzeFood.
 * @param {string} uri — локальный путь к фото
 */
export async function recognizeOffline(uri) {
  const model = await loadModel();
  const input = model.inputs[0];
  const shape = input.shape || [1, 224, 224, 3];
  const h = shape[1] || 224;
  const w = shape[2] || 224;
  const dtype = String(input.dataType || 'uint8');

  // Уменьшаем фото до входа модели и берём пиксели.
  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: w, height: h } }],
    { base64: true, compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );
  const jpegBytes = toByteArray(manip.base64);
  const { data, width, height } = jpegDecode(jpegBytes, { useTArray: true }); // RGBA

  const px = width * height;
  let inputData;
  if (dtype.includes('float')) {
    inputData = new Float32Array(px * 3);
    for (let i = 0; i < px; i++) {
      inputData[i * 3] = data[i * 4] / 255;
      inputData[i * 3 + 1] = data[i * 4 + 1] / 255;
      inputData[i * 3 + 2] = data[i * 4 + 2] / 255;
    }
  } else {
    inputData = new Uint8Array(px * 3);
    for (let i = 0; i < px; i++) {
      inputData[i * 3] = data[i * 4];
      inputData[i * 3 + 1] = data[i * 4 + 1];
      inputData[i * 3 + 2] = data[i * 4 + 2];
    }
  }

  const outputs = model.runSync([inputData]);
  const probs = outputs[0];

  const top = topK(probs, 3);
  const best = top[0];
  const dish = LABELS[best] || 'еда';
  // нормируем «уверенность» (выход может быть 0..1 или 0..255)
  const raw = Number(probs[best]) || 0;
  const conf = raw > 1 ? raw / 255 : raw;
  const n = estimateNutrition(dish);

  return {
    dish,
    grams: 100,
    calories: n.calories,
    protein: n.protein,
    fat: n.fat,
    carbs: n.carbs,
    confidence: conf >= 0.45 ? 'medium' : 'low',
    source: 'offline',
    alternatives: top.map((i) => LABELS[i]).filter(Boolean),
  };
}
