import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { analyzeFood } from '../lib/analyzeFood';
import { searchFood, lookupBarcode } from '../lib/openfoodfacts';
import {
  getDiary, saveDiary, getFavorites, addFavorite, removeFavoriteByDish,
} from '../lib/storage';

const MEALS = [
  { key: 'breakfast', label: 'Завтрак', emoji: '🍳' },
  { key: 'lunch', label: 'Обед', emoji: '🍲' },
  { key: 'dinner', label: 'Ужин', emoji: '🌙' },
  { key: 'snack', label: 'Перекус', emoji: '🍎' },
];
function autoMeal() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export default function AddFoodModal({ visible, onClose, apiKey, onSaved }) {
  const [view, setView] = useState('menu'); // menu|loading|search|barcode|favorites|edit|error
  const [origin, setOrigin] = useState('menu'); // куда возвращаться из edit
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);

  const [base, setBase] = useState(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState('lunch');
  const [fav, setFav] = useState(false);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const searchTimer = useRef(null);

  const [favList, setFavList] = useState([]);

  const [perm, requestPerm] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function goMenu() {
    setView('menu');
    setError('');
    setScanned(false);
  }
  function fullReset() {
    goMenu();
    setPhoto(null);
    setBase(null);
    setQuery('');
    setResults([]);
    setFav(false);
  }
  function close() {
    fullReset();
    onClose();
  }
  // «Назад»: из карточки товара — к источнику (поиск/избранное/меню), иначе — в меню.
  function back() {
    if (view === 'edit') {
      setPhoto(null);
      setView(origin);
    } else {
      goMenu();
    }
  }

  async function openEdit(result, withPhoto, from) {
    setBase(result);
    setGrams(result.grams > 0 ? result.grams : 100);
    setMeal(autoMeal());
    setOrigin(from || 'menu');
    setPhoto(withPhoto || null);
    // отметить ⭐ если этот продукт уже в избранном
    const favs = await getFavorites();
    setFav(favs.some((f) => f.dish === result.dish));
    setView('edit');
  }

  // ── Фото / галерея ──
  async function pickPhoto(fromCamera) {
    const p = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) {
      setError('Нет доступа к ' + (fromCamera ? 'камере' : 'галерее'));
      setView('error');
      return;
    }
    const opts = { mediaTypes: ['images'], quality: 0.4, base64: true, allowsEditing: true };
    const r = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled) return;
    setView('loading');
    try {
      const result = await analyzeFood(r.assets[0].base64, apiKey);
      openEdit(result, r.assets[0].uri, 'menu');
    } catch (e) {
      setError(e.message);
      setView('error');
    }
  }

  // ── Поиск (динамический) ──
  async function runSearch(q) {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      setResults(await searchFood(q.trim()));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }
  function onQueryChange(text) {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => runSearch(text), 450);
  }
  useEffect(() => () => searchTimer.current && clearTimeout(searchTimer.current), []);

  // ── Штрихкод ──
  async function openBarcode() {
    if (!perm?.granted) {
      const r = await requestPerm();
      if (!r.granted) {
        setError('Нужен доступ к камере для сканера штрихкодов');
        setView('error');
        return;
      }
    }
    setScanned(false);
    setView('barcode');
  }
  async function onScan({ data }) {
    if (scanned) return;
    setScanned(true);
    setView('loading');
    try {
      const product = await lookupBarcode(data);
      if (!product) {
        setError('Продукт не найден в базе (штрихкод ' + data + ').\nПопробуй добавить фото или поиском.');
        setView('error');
        return;
      }
      openEdit(product, null, 'menu');
    } catch (e) {
      setError(e.message);
      setView('error');
    }
  }

  // ── Избранное ──
  async function openFavorites() {
    setFavList(await getFavorites());
    setView('favorites');
  }

  // ── Расчёт по граммам ──
  const baseGrams = base && base.grams > 0 ? base.grams : 100;
  const factor = grams / baseGrams;
  const scaled = base
    ? {
        calories: Math.round(base.calories * factor),
        protein: Math.round(base.protein * factor),
        fat: Math.round(base.fat * factor),
        carbs: Math.round(base.carbs * factor),
      }
    : null;

  // ⭐ переключатель избранного — сохраняет СРАЗУ.
  async function toggleFav() {
    if (!base) return;
    if (fav) {
      await removeFavoriteByDish(base.dish);
      setFav(false);
    } else {
      await addFavorite(base);
      setFav(true);
    }
  }

  async function save() {
    if (!base || !scaled) return;
    const item = {
      id: Date.now(),
      dish: base.dish,
      grams: Math.round(grams),
      meal,
      confidence: base.confidence,
      ...scaled,
    };
    const diary = await getDiary();
    await saveDiary([...diary, item]);
    onSaved && onSaved();
    close();
  }

  const headerTitle =
    view === 'edit' ? 'Добавить'
    : view === 'search' ? 'Поиск'
    : view === 'barcode' ? 'Штрихкод'
    : view === 'favorites' ? 'Избранное'
    : 'Что добавим?';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.screen}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>{headerTitle}</Text>
          <TouchableOpacity onPress={() => (view === 'menu' ? close() : view === 'loading' ? goMenu() : back())}>
            <Text style={styles.headClose}>{view === 'menu' ? '✕' : '‹ Назад'}</Text>
          </TouchableOpacity>
        </View>

        {/* МЕНЮ */}
        {view === 'menu' && (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            <MenuItem emoji="📷" title="Сфотографировать" desc="ИИ оценит калории по фото" onPress={() => pickPhoto(true)} />
            <MenuItem emoji="🖼" title="Из галереи" desc="Выбрать готовое фото" onPress={() => pickPhoto(false)} />
            <MenuItem emoji="▦" title="Штрихкод" desc="Сканировать упаковку" onPress={openBarcode} />
            <MenuItem emoji="🔍" title="Поиск по базе" desc="Найти продукт по названию" onPress={() => setView('search')} />
            <MenuItem emoji="⭐" title="Избранное" desc="Частые блюда в один тап" onPress={openFavorites} />
          </ScrollView>
        )}

        {view === 'loading' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.muted}>Минутку…</Text>
          </View>
        )}

        {view === 'error' && (
          <View style={styles.centerBox}>
            <Text style={styles.errEmoji}>😕</Text>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity style={styles.primary} onPress={goMenu}>
              <Text style={styles.primaryText}>В меню</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ПОИСК (динамический) */}
        {view === 'search' && (
          <View style={{ flex: 1, padding: 20 }}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={onQueryChange}
                placeholder="Начни вводить: творог…"
                placeholderTextColor="#64748b"
                autoFocus
                autoCorrect={false}
              />
              {searching ? <ActivityIndicator color="#22c55e" style={{ marginLeft: 10 }} /> : null}
            </View>
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resRow} onPress={() => openEdit(item, null, 'search')}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resName}>{item.dish}</Text>
                    <Text style={styles.resMacros}>Б {item.protein} · Ж {item.fat} · У {item.carbs} / 100 г</Text>
                  </View>
                  <Text style={styles.resKcal}>{item.calories}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !searching ? (
                  <Text style={styles.muted}>
                    {query.trim().length < 2 ? 'Введи хотя бы 2 буквы' : 'Ничего не найдено'}
                  </Text>
                ) : null
              }
            />
          </View>
        )}

        {/* ШТРИХКОД */}
        {view === 'barcode' && (
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
              onBarcodeScanned={scanned ? undefined : onScan}
            />
            <View style={styles.scanHint}>
              <Text style={styles.scanHintText}>Наведи камеру на штрихкод</Text>
            </View>
          </View>
        )}

        {/* ИЗБРАННОЕ */}
        {view === 'favorites' && (
          <View style={{ flex: 1, padding: 20 }}>
            {favList.length === 0 ? (
              <Text style={styles.muted}>Пусто. Открой блюдо и нажми ☆, чтобы добавить в избранное.</Text>
            ) : (
              <FlatList
                data={favList}
                keyExtractor={(it) => String(it.favId)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resRow} onPress={() => openEdit(item, null, 'favorites')}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resName}>{item.dish}</Text>
                      <Text style={styles.resMacros}>Б {item.protein} · Ж {item.fat} · У {item.carbs}</Text>
                    </View>
                    <Text style={styles.resKcal}>{item.calories}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* РЕДАКТИРОВАНИЕ / СОХРАНЕНИЕ */}
        {view === 'edit' && base && scaled && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {photo && <Image source={{ uri: photo }} style={styles.preview} />}
            <Text style={styles.dish}>{base.dish}</Text>
            <Text style={styles.kcal}>{scaled.calories} ккал</Text>
            <View style={styles.macrosRow}>
              <Macro label="Б" value={scaled.protein} color="#3b82f6" />
              <Macro label="Ж" value={scaled.fat} color="#f59e0b" />
              <Macro label="У" value={scaled.carbs} color="#ef4444" />
            </View>

            <View style={styles.gramsTop}>
              <Text style={styles.gramsLabel}>Вес порции</Text>
              <Text style={styles.gramsValue}>{Math.round(grams)} г</Text>
            </View>
            <Slider
              minimumValue={10}
              maximumValue={Math.max(1000, Math.round(baseGrams * 3))}
              step={5}
              value={grams}
              onValueChange={setGrams}
              minimumTrackTintColor="#22c55e"
              maximumTrackTintColor="#334155"
              thumbTintColor="#22c55e"
            />

            <View style={styles.mealRow}>
              {MEALS.map((m) => (
                <TouchableOpacity key={m.key} style={[styles.mealChip, meal === m.key && styles.mealChipActive]} onPress={() => setMeal(m.key)}>
                  <Text style={styles.mealEmoji}>{m.emoji}</Text>
                  <Text style={[styles.mealLabel, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.favToggle} onPress={toggleFav}>
              <Text style={styles.favToggleText}>{fav ? '⭐ В избранном' : '☆ Добавить в избранное'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primary} onPress={save}>
              <Text style={styles.primaryText}>＋ Добавить в дневник</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function MenuItem({ emoji, title, desc, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDesc}>{desc}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}
function Macro({ label, value, color }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color }}>{value}г</Text>
      <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  headTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  headClose: { color: '#94a3b8', fontSize: 16, fontWeight: '700' },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1e293b', borderRadius: 16, padding: 18 },
  menuEmoji: { fontSize: 28 },
  menuTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  menuDesc: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  menuArrow: { color: '#475569', fontSize: 24 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 14 },
  muted: { color: '#64748b', fontSize: 13, marginTop: 16, textAlign: 'center' },
  errEmoji: { fontSize: 48 },
  errText: { color: '#fecaca', fontSize: 14, textAlign: 'center' },

  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginTop: 10 },
  resName: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  resMacros: { color: '#64748b', fontSize: 11, marginTop: 2 },
  resKcal: { color: '#22c55e', fontSize: 16, fontWeight: '800' },

  scanHint: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  scanHintText: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, overflow: 'hidden' },

  preview: { width: '100%', height: 180, borderRadius: 16, marginBottom: 14 },
  dish: { color: '#f8fafc', fontSize: 22, fontWeight: '800' },
  kcal: { color: '#22c55e', fontSize: 42, fontWeight: '900', marginVertical: 8 },
  macrosRow: { flexDirection: 'row', gap: 24, marginBottom: 8 },

  gramsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  gramsLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  gramsValue: { color: '#22c55e', fontSize: 18, fontWeight: '800' },

  mealRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mealChip: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  mealChipActive: { backgroundColor: '#16a34a', borderColor: '#22c55e' },
  mealEmoji: { fontSize: 18 },
  mealLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' },

  favToggle: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  favToggleText: { color: '#f59e0b', fontSize: 15, fontWeight: '700' },

  primary: { backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
