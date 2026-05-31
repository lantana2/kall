import { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart } from '../components/Charts';
import {
  getDailyCalories,
  getWeights,
  addWeight,
  getStreak,
  getLoggedDaysCount,
} from '../lib/storage';

const W = Dimensions.get('window').width - 40 - 32; // экран - padding экрана - padding карточки

function achievements(streak, days, weighs) {
  return [
    { emoji: '📸', title: 'Первый приём', done: days >= 1 },
    { emoji: '🔥', title: '3 дня подряд', done: streak >= 3 },
    { emoji: '⚖️', title: 'Замер веса', done: weighs >= 1 },
    { emoji: '📅', title: 'Неделя дневника', done: days >= 7 },
    { emoji: '💪', title: 'Стрик 14 дней', done: streak >= 14 },
    { emoji: '🏆', title: 'Месяц дисциплины', done: days >= 30 },
  ];
}

export default function Stats({ profile, refreshKey }) {
  const [week, setWeek] = useState([]);
  const [weights, setWeights] = useState([]);
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState(0);
  const [wInput, setWInput] = useState('');

  async function load() {
    setWeek(await getDailyCalories(7));
    setWeights(await getWeights());
    setStreak(await getStreak());
    setDays(await getLoggedDaysCount());
  }
  useEffect(() => {
    load();
  }, [refreshKey]);

  async function submitWeight() {
    const kg = parseFloat(wInput.replace(',', '.'));
    if (!kg || kg < 20 || kg > 400) return;
    const next = await addWeight(Math.round(kg * 10) / 10);
    setWeights(next);
    setWInput('');
  }

  const avg = week.length ? Math.round(week.reduce((s, d) => s + d.cal, 0) / week.length) : 0;
  const ach = achievements(streak, days, weights.length);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Статистика</Text>

        {/* Сводка */}
        <View style={styles.summaryRow}>
          <Summary value={streak} label="дней подряд 🔥" />
          <Summary value={avg} label="ккал в среднем" />
          <Summary value={days} label="дней в дневнике" />
        </View>

        {/* Калории за неделю */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Калории за неделю</Text>
          <BarChart data={week} width={W} goal={profile?.targets?.calories} />
          <Text style={styles.legend}>● сегодня · - - - цель {profile?.targets?.calories} ккал</Text>
        </View>

        {/* Вес */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Динамика веса</Text>
          <LineChart data={weights} width={W} />
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              value={wInput}
              onChangeText={setWInput}
              placeholder="Вес сегодня, кг"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.weightBtn} onPress={submitWeight}>
              <Text style={styles.weightBtnText}>Записать</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Достижения */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Достижения</Text>
          <View style={styles.achGrid}>
            {ach.map((a, i) => (
              <View key={i} style={[styles.ach, !a.done && styles.achLocked]}>
                <Text style={[styles.achEmoji, !a.done && { opacity: 0.3 }]}>{a.emoji}</Text>
                <Text style={[styles.achTitle, a.done ? { color: '#e2e8f0' } : { color: '#475569' }]}>
                  {a.title}
                </Text>
                {a.done && <Text style={styles.achDone}>✓</Text>}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Summary({ value, label }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '900', color: '#f8fafc', marginBottom: 16 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summary: { flex: 1, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryValue: { color: '#22c55e', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2, textAlign: 'center' },

  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  legend: { color: '#64748b', fontSize: 11, marginTop: 8 },

  weightRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  weightInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  weightBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  weightBtnText: { color: '#fff', fontWeight: '700' },

  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ach: { width: (W - 20) / 3, backgroundColor: '#16321f', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#22c55e' },
  achLocked: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  achEmoji: { fontSize: 28 },
  achTitle: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  achDone: { color: '#22c55e', fontSize: 12, fontWeight: '900', marginTop: 2 },
});
