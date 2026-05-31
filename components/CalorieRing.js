import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Кольцо прогресса калорий с плавной анимацией заполнения и счётчиком.
 * @param eaten  — съедено ккал
 * @param target — дневная норма ккал
 */
export default function CalorieRing({ eaten, target, size = 220 }) {
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const ratio = target > 0 ? Math.min(eaten / target, 1) : 0;
  const over = eaten > target;
  const remaining = Math.max(target - eaten, 0);

  const progress = useRef(new Animated.Value(0)).current; // 0..1 для дуги
  const count = useRef(new Animated.Value(0)).current;     // для счётчика
  const [shown, setShown] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    count.stopAnimation();
    Animated.timing(count, {
      toValue: remaining,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = count.addListener(({ value }) => setShown(Math.round(value)));
    return () => count.removeListener(id);
  }, [eaten, target]);

  const dashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [c, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* фон-кольцо */}
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth={stroke} fill="none" />
        {/* прогресс */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? '#ef4444' : '#22c55e'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashoffset}
          // поворачиваем, чтобы старт был сверху
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.big, over && { color: '#ef4444' }]}>{shown}</Text>
        <Text style={styles.label}>{over ? 'перебор ккал' : 'осталось ккал'}</Text>
        <Text style={styles.sub}>{eaten} / {target}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center' },
  big: { fontSize: 46, fontWeight: '900', color: '#f8fafc' },
  label: { fontSize: 13, color: '#94a3b8', marginTop: -2 },
  sub: { fontSize: 12, color: '#64748b', marginTop: 6 },
});
