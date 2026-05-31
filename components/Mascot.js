import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

// Реплика маскота по проценту выполнения нормы.
function pick(eaten, target) {
  const r = target > 0 ? eaten / target : 0;
  const h = new Date().getHours();
  if (eaten === 0) {
    if (h < 11) return 'Доброе утро! Погнали? 🌅';
    return 'Пока пусто. Чем перекусим? 😋';
  }
  if (r < 0.5) return 'Хороший старт, так держать! 💪';
  if (r < 0.85) return 'Уже больше половины нормы 🙌';
  if (r <= 1.1) return 'Идеально, прямо в цель! 🎯';
  if (r <= 1.3) return 'Чуть перебор, но бывает 😅';
  return 'Сегодня знатно поели 🍰 Завтра ровнее!';
}

export default function Mascot({ eaten, target }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -6, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.avatar, { transform: [{ translateY: bob }] }]}>
        <Text style={styles.emoji}>🥑</Text>
      </Animated.View>
      <View style={styles.bubble}>
        <Text style={styles.text}>{pick(eaten, target)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 16, padding: 14, marginTop: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#14321f', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
  bubble: { flex: 1 },
  text: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
