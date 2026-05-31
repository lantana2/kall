import { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Экран подключения ИИ-ключа (показывается после онбординга, если ключа ещё нет).
export default function ApiKeyScreen({ initial, onSave, onSkip }) {
  const [key, setKey] = useState(initial || '');
  const valid = key.trim().length > 10;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🔑</Text>
        <Text style={styles.h1}>Подключи ИИ</Text>
        <Text style={styles.lead}>
          Чтобы считать калории по фото, получи бесплатный ключ в нашем
          Telegram-боте. Это займёт минуту.
        </Text>

        {/* Шаги */}
        <View style={styles.steps}>
          <Step n="1" text="Открой бота @kallsk_bot в Telegram" />
          <Step n="2" text="Создай ключ в боте и скопируй его" />
          <Step n="3" text="Вставь этот ключ ниже и нажми «Сохранить»" />
        </View>

        {/* Кнопка-ссылка на бота */}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL('https://t.me/kallsk_bot')}
        >
          <Text style={styles.linkBtnText}>🤖 Открыть бота @kallsk_bot</Text>
        </TouchableOpacity>

        {/* Поле ключа */}
        <TextInput
          style={styles.input}
          value={key}
          onChangeText={setKey}
          placeholder="Вставь ключ сюда: sk-or-v1-..."
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />

        <TouchableOpacity
          style={[styles.primary, !valid && styles.disabled]}
          onPress={() => valid && onSave(key.trim())}
          disabled={!valid}
        >
          <Text style={styles.primaryText}>Сохранить и начать</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Ключ выдаётся бесплатно в боте @kallsk_bot.
        </Text>
      </ScrollView>
    </View>
  );
}

function Step({ n, text }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 80, paddingBottom: 40 },
  logo: { fontSize: 64, textAlign: 'center' },
  h1: { fontSize: 28, fontWeight: '900', color: '#f8fafc', textAlign: 'center', marginTop: 8 },
  lead: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 22 },

  steps: { marginTop: 26, gap: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '900' },
  stepText: { flex: 1, color: '#e2e8f0', fontSize: 14, lineHeight: 20 },

  linkBtn: { backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: '#334155' },
  linkBtnText: { color: '#38bdf8', fontSize: 16, fontWeight: '700' },

  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#f8fafc', borderWidth: 1, borderColor: '#334155', marginTop: 16, minHeight: 54 },

  primary: { backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  disabled: { backgroundColor: '#334155' },

  skip: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  skipText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  note: { color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
