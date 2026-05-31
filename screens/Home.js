import { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  getDiary, saveDiary, updateDiaryItem,
  saveApiKey, getWater, saveWater, getStreak,
} from '../lib/storage';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import Mascot from '../components/Mascot';

const WATER_GOAL = 8;
const MEALS = [
  { key: 'breakfast', label: 'Завтрак', emoji: '🍳' },
  { key: 'lunch', label: 'Обед', emoji: '🍲' },
  { key: 'dinner', label: 'Ужин', emoji: '🌙' },
  { key: 'snack', label: 'Перекус', emoji: '🍎' },
];

export default function Home({ profile, apiKey, onApiKey, onEditProfile, refreshKey }) {
  const t = profile.targets;
  const [diary, setDiary] = useState([]);
  const [water, setWater] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [editing, setEditing] = useState(null); // запись дневника в редактировании

  async function reload() {
    setDiary(await getDiary());
    setWater(await getWater());
    setStreak(await getStreak());
  }
  useEffect(() => { reload(); }, [refreshKey]);

  const eaten = diary.reduce(
    (s, x) => ({ cal: s.cal + x.calories, p: s.p + x.protein, f: s.f + x.fat, c: s.c + x.carbs }),
    { cal: 0, p: 0, f: 0, c: 0 }
  );

  async function removeItem(id) {
    const next = diary.filter((x) => x.id !== id);
    setDiary(next);
    await saveDiary(next);
  }
  async function changeWater(delta) {
    const n = Math.max(0, water + delta);
    setWater(n);
    await saveWater(n);
  }
  async function saveKey() {
    const k = keyInput.trim();
    await saveApiKey(k);
    onApiKey(k);
    setShowSettings(false);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Привет 👋</Text>
            <Text style={styles.sub}>Цель: {t.calories} ккал/день</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {streak > 0 && (
              <View style={styles.streak}><Text style={styles.streakText}>🔥 {streak}</Text></View>
            )}
            <TouchableOpacity onPress={() => setShowSettings((s) => !s)}>
              <Text style={styles.gear}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showSettings && (
          <View style={styles.settings}>
            <Text style={styles.settingsTitle}>API-ключ OpenRouter</Text>
            <TextInput
              style={styles.input}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-or-v1-..."
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveKey}>
              <Text style={styles.saveBtnText}>Сохранить ключ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editProfile} onPress={onEditProfile}>
              <Text style={styles.editProfileText}>↻ Изменить профиль и норму</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.ringWrap}>
          <CalorieRing eaten={eaten.cal} target={t.calories} />
        </View>

        <Mascot eaten={eaten.cal} target={t.calories} />

        <View style={styles.card}>
          <MacroBar label="Белки" value={eaten.p} target={t.protein} color="#3b82f6" />
          <MacroBar label="Жиры" value={eaten.f} target={t.fat} color="#f59e0b" />
          <MacroBar label="Углеводы" value={eaten.c} target={t.carbs} color="#ef4444" />
        </View>

        {/* Вода */}
        <View style={styles.card}>
          <View style={styles.waterTop}>
            <Text style={styles.waterTitle}>💧 Вода</Text>
            <Text style={styles.waterCount}>{water} / {WATER_GOAL} стак.</Text>
          </View>
          <View style={styles.glasses}>
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <Text key={i} style={[styles.glass, i < water ? styles.glassFull : null]}>{i < water ? '🥛' : '▁'}</Text>
            ))}
          </View>
          <View style={styles.waterBtns}>
            <TouchableOpacity style={styles.waterBtn} onPress={() => changeWater(-1)}>
              <Text style={styles.waterBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.waterBtn, styles.waterBtnPlus]} onPress={() => changeWater(1)}>
              <Text style={styles.waterBtnText}>＋ стакан</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Дневник */}
        {diary.length > 0 ? (
          <View style={styles.diaryBox}>
            <Text style={styles.diaryTitle}>Дневник за сегодня</Text>
            {MEALS.map((m) => {
              const items = diary.filter((x) => (x.meal || 'snack') === m.key);
              if (items.length === 0) return null;
              const sub = items.reduce((s, x) => s + x.calories, 0);
              return (
                <View key={m.key} style={{ marginBottom: 8 }}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealHeaderText}>{m.emoji} {m.label}</Text>
                    <Text style={styles.mealHeaderKcal}>{sub} ккал</Text>
                  </View>
                  {items.map((x) => (
                    <TouchableOpacity key={x.id} style={styles.diaryRow} onPress={() => setEditing(x)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.diaryDish}>{x.dish}</Text>
                        <Text style={styles.diaryMacros}>{x.grams} г · Б {x.protein} · Ж {x.fat} · У {x.carbs}</Text>
                      </View>
                      <Text style={styles.diaryKcal}>{x.calories}</Text>
                      <Text style={styles.editHint}>✎</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyHint}>Нажми ➕ внизу, чтобы добавить еду 🍽</Text>
        )}

        <Text style={styles.disclaimer}>⚠️ Калории примерные. Нажми на запись, чтобы изменить.</Text>

        {/* Подпись автора */}
        <View style={styles.footer}>
          <Text style={styles.footerLine}>design · code · experience</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://t.me/cakkac')}>
            <Text style={styles.footerBrand}>cakkac</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Редактирование записи */}
      <EditItemModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => { setEditing(null); setDiary(await getDiary()); }}
        onDeleted={async (id) => { setEditing(null); await removeItem(id); }}
      />
    </View>
  );
}

function EditItemModal({ item, onClose, onSaved, onDeleted }) {
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState('snack');
  useEffect(() => {
    if (item) { setGrams(item.grams || 100); setMeal(item.meal || 'snack'); }
  }, [item]);
  if (!item) return null;

  const baseG = item.grams > 0 ? item.grams : 100;
  const f = grams / baseG;
  const sc = {
    calories: Math.round(item.calories * f),
    protein: Math.round(item.protein * f),
    fat: Math.round(item.fat * f),
    carbs: Math.round(item.carbs * f),
  };

  async function save() {
    await updateDiaryItem(item.id, { grams: Math.round(grams), meal, ...sc });
    onSaved();
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{item.dish}</Text>
          <Text style={styles.sheetKcal}>{sc.calories} ккал · Б {sc.protein} Ж {sc.fat} У {sc.carbs}</Text>
          <View style={styles.gramsTop}>
            <Text style={styles.gramsLabel}>Вес порции</Text>
            <Text style={styles.gramsValue}>{Math.round(grams)} г</Text>
          </View>
          <Slider
            minimumValue={10}
            maximumValue={Math.max(1000, Math.round(baseG * 3))}
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
          <TouchableOpacity style={styles.saveBtn2} onPress={save}>
            <Text style={styles.saveBtn2Text}>Сохранить</Text>
          </TouchableOpacity>
          <View style={styles.sheetBottom}>
            <TouchableOpacity onPress={() => onDeleted(item.id)}>
              <Text style={styles.delLink}>Удалить</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelLink}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  hello: { fontSize: 24, fontWeight: '900', color: '#f8fafc' },
  sub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  gear: { fontSize: 26 },
  streak: { backgroundColor: '#1e293b', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  streakText: { color: '#f59e0b', fontWeight: '800', fontSize: 14 },

  settings: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16 },
  settingsTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  saveBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  editProfile: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  editProfileText: { color: '#94a3b8', fontWeight: '600' },

  ringWrap: { alignItems: 'center', marginVertical: 6 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginTop: 16 },

  waterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  waterCount: { color: '#38bdf8', fontSize: 14, fontWeight: '700' },
  glasses: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  glass: { fontSize: 22, color: '#334155' },
  glassFull: { color: '#38bdf8' },
  waterBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  waterBtn: { flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  waterBtnPlus: { flex: 2, backgroundColor: '#0ea5e9' },
  waterBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  diaryBox: { marginTop: 24 },
  diaryTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, marginTop: 4 },
  mealHeaderText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  mealHeaderKcal: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  diaryDish: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  diaryMacros: { color: '#64748b', fontSize: 11, marginTop: 2 },
  diaryKcal: { color: '#22c55e', fontSize: 16, fontWeight: '800' },
  editHint: { color: '#475569', fontSize: 15 },
  emptyHint: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 30 },

  disclaimer: { color: '#64748b', fontSize: 11, marginTop: 20, lineHeight: 16, textAlign: 'center' },

  footer: { alignItems: 'center', marginTop: 28, marginBottom: 6 },
  footerLine: { color: '#475569', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  footerBrand: { color: '#22c55e', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginTop: 4 },

  // edit modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 34 },
  sheetTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  sheetKcal: { color: '#22c55e', fontSize: 15, fontWeight: '700', marginTop: 4, marginBottom: 8 },
  gramsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  gramsLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  gramsValue: { color: '#22c55e', fontSize: 18, fontWeight: '800' },
  mealRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mealChip: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  mealChipActive: { backgroundColor: '#16a34a', borderColor: '#22c55e' },
  mealEmoji: { fontSize: 18 },
  mealLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' },
  saveBtn2: { backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
  saveBtn2Text: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sheetBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  delLink: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  cancelLink: { color: '#94a3b8', fontSize: 15, fontWeight: '700' },
});
