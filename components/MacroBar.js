import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

// Полоска прогресса по одному макронутриенту (белки/жиры/углеводы).
export default function MacroBar({ label, value, target, color }) {
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  const w = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(w, {
      toValue: ratio,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, target]);

  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.item}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value} / {target} г</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  value: { color: '#94a3b8', fontSize: 12 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#1e293b', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
