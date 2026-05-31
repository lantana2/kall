import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { ACTIVITIES, GOALS, computeTargets } from '../lib/calorie';

const STEPS = ['welcome', 'sex', 'age', 'height', 'weight', 'activity', 'goal', 'result'];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState(null);
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState('medium');
  const [goal, setGoal] = useState('lose');

  // Анимация появления каждого шага.
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    fade.setValue(0);
    slide.setValue(30);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  const name = STEPS[step];
  const profile = { sex, age, height, weight, activity, goal };
  const targets = computeTargets(profile);

  function next() {
    if (name === 'sex' && !sex) return; // пол обязателен
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }
  function finish() {
    onDone({ ...profile, targets });
  }

  return (
    <View style={styles.screen}>
      {/* Прогресс */}
      {name !== 'welcome' && (
        <View style={styles.progressRow}>
          {STEPS.slice(1).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i <= step - 1 ? styles.dotActive : null]}
            />
          ))}
        </View>
      )}

      <Animated.View
        style={[styles.body, { opacity: fade, transform: [{ translateY: slide }] }]}
      >
        {name === 'welcome' && (
          <View style={styles.center}>
            <Text style={styles.logo}>🍎</Text>
            <Text style={styles.h1}>Калории по фото</Text>
            <Text style={styles.lead}>
              Сфоткай еду — ИИ посчитает калории.{'\n'}А мы подберём твою дневную норму.
            </Text>
          </View>
        )}

        {name === 'sex' && (
          <View>
            <Text style={styles.q}>Твой пол?</Text>
            <View style={styles.cardsRow}>
              <SelectCard emoji="👨" label="Мужчина" active={sex === 'male'} onPress={() => setSex('male')} />
              <SelectCard emoji="👩" label="Женщина" active={sex === 'female'} onPress={() => setSex('female')} />
            </View>
          </View>
        )}

        {name === 'age' && (
          <SliderStep title="Сколько тебе лет?" value={age} unit="лет" min={14} max={90} step={1} onChange={setAge} />
        )}
        {name === 'height' && (
          <SliderStep title="Твой рост?" value={height} unit="см" min={120} max={220} step={1} onChange={setHeight} />
        )}
        {name === 'weight' && (
          <SliderStep title="Твой вес?" value={weight} unit="кг" min={35} max={180} step={1} onChange={setWeight} />
        )}

        {name === 'activity' && (
          <View>
            <Text style={styles.q}>Уровень активности?</Text>
            {ACTIVITIES.map((a) => (
              <ListRow
                key={a.key}
                title={a.label}
                desc={a.desc}
                active={activity === a.key}
                onPress={() => setActivity(a.key)}
              />
            ))}
          </View>
        )}

        {name === 'goal' && (
          <View>
            <Text style={styles.q}>Какая цель?</Text>
            {GOALS.map((g) => (
              <ListRow
                key={g.key}
                emoji={g.emoji}
                title={g.label}
                desc={g.desc}
                active={goal === g.key}
                onPress={() => setGoal(g.key)}
              />
            ))}
          </View>
        )}

        {name === 'result' && (
          <View style={styles.center}>
            <Text style={styles.q}>Твоя дневная норма</Text>
            <Text style={styles.bigKcal}>{targets.calories}</Text>
            <Text style={styles.lead}>ккал в день</Text>
            <View style={styles.macroPills}>
              <Pill label="Белки" value={targets.protein + ' г'} color="#3b82f6" />
              <Pill label="Жиры" value={targets.fat + ' г'} color="#f59e0b" />
              <Pill label="Углеводы" value={targets.carbs + ' г'} color="#ef4444" />
            </View>
            <Text style={styles.note}>Базовый обмен: {targets.bmr} ккал · С активностью: {targets.tdee} ккал</Text>
          </View>
        )}
      </Animated.View>

      {/* Кнопки */}
      <View style={styles.footer}>
        {step > 0 && step < STEPS.length - 1 && (
          <TouchableOpacity style={styles.back} onPress={back}>
            <Text style={styles.backText}>Назад</Text>
          </TouchableOpacity>
        )}
        {name === 'welcome' && (
          <TouchableOpacity style={styles.primary} onPress={next}>
            <Text style={styles.primaryText}>Начать</Text>
          </TouchableOpacity>
        )}
        {name !== 'welcome' && name !== 'result' && (
          <TouchableOpacity
            style={[styles.primary, name === 'sex' && !sex && styles.disabled]}
            onPress={next}
          >
            <Text style={styles.primaryText}>Далее</Text>
          </TouchableOpacity>
        )}
        {name === 'result' && (
          <TouchableOpacity style={styles.primary} onPress={finish}>
            <Text style={styles.primaryText}>Поехали 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SelectCard({ emoji, label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.selCard, active && styles.selCardActive]} onPress={onPress}>
      <Text style={styles.selEmoji}>{emoji}</Text>
      <Text style={[styles.selLabel, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ListRow({ emoji, title, desc, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.listRow, active && styles.listRowActive]} onPress={onPress}>
      {emoji ? <Text style={styles.listEmoji}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, active && { color: '#fff' }]}>{title}</Text>
        <Text style={styles.listDesc}>{desc}</Text>
      </View>
      {active ? <Text style={styles.check}>✓</Text> : null}
    </TouchableOpacity>
  );
}

function SliderStep({ title, value, unit, min, max, step, onChange }) {
  return (
    <View style={styles.center}>
      <Text style={styles.q}>{title}</Text>
      <Text style={styles.sliderValue}>{value}<Text style={styles.sliderUnit}> {unit}</Text></Text>
      <Slider
        style={{ width: '100%', height: 48 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#22c55e"
        maximumTrackTintColor="#334155"
        thumbTintColor="#22c55e"
      />
      <View style={styles.minmax}>
        <Text style={styles.minmaxText}>{min}</Text>
        <Text style={styles.minmaxText}>{max}</Text>
      </View>
    </View>
  );
}

function Pill({ label, value, color }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 70, paddingBottom: 36 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 30 },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#1e293b' },
  dotActive: { backgroundColor: '#22c55e' },
  body: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center' },

  logo: { fontSize: 72, marginBottom: 10 },
  h1: { fontSize: 30, fontWeight: '900', color: '#f8fafc', textAlign: 'center' },
  lead: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  q: { fontSize: 24, fontWeight: '800', color: '#f8fafc', textAlign: 'center', marginBottom: 24 },

  cardsRow: { flexDirection: 'row', gap: 14 },
  selCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 18, paddingVertical: 30, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selCardActive: { backgroundColor: '#16a34a', borderColor: '#22c55e' },
  selEmoji: { fontSize: 48, marginBottom: 10 },
  selLabel: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },

  sliderValue: { fontSize: 56, fontWeight: '900', color: '#22c55e' },
  sliderUnit: { fontSize: 22, fontWeight: '700', color: '#94a3b8' },
  minmax: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  minmaxText: { color: '#64748b', fontSize: 12 },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  listRowActive: { borderColor: '#22c55e', backgroundColor: '#14321f' },
  listEmoji: { fontSize: 26 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  listDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  check: { color: '#22c55e', fontSize: 20, fontWeight: '900' },

  bigKcal: { fontSize: 72, fontWeight: '900', color: '#22c55e' },
  macroPills: { flexDirection: 'row', gap: 10, marginTop: 24 },
  pill: { backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  pillValue: { fontSize: 18, fontWeight: '800' },
  pillLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  note: { color: '#64748b', fontSize: 12, marginTop: 24, textAlign: 'center' },

  footer: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  back: { paddingVertical: 16, paddingHorizontal: 20 },
  backText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  primary: { flex: 1, backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  disabled: { backgroundColor: '#334155' },
});
