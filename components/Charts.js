import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

// Столбчатый график калорий за неделю. Пунктир — цель.
export function BarChart({ data, width, height = 160, goal }) {
  const padB = 22; // место под подписи
  const top = 10;
  const chartH = height - padB - top;
  const max = Math.max(goal || 0, ...data.map((d) => d.cal), 1) * 1.1;
  const n = data.length;
  const slot = width / n;
  const barW = slot * 0.5;

  const y = (v) => top + chartH - (v / max) * chartH;

  return (
    <Svg width={width} height={height}>
      {goal ? (
        <Line x1={0} y1={y(goal)} x2={width} y2={y(goal)} stroke="#475569" strokeWidth={1} strokeDasharray="4 4" />
      ) : null}
      {data.map((d, i) => {
        const h = (d.cal / max) * chartH;
        const x = i * slot + (slot - barW) / 2;
        const isToday = i === n - 1;
        return (
          <Rect
            key={i}
            x={x}
            y={top + chartH - h}
            width={barW}
            height={Math.max(h, 1)}
            rx={5}
            fill={isToday ? '#22c55e' : '#334155'}
          />
        );
      })}
      {data.map((d, i) => (
        <SvgText key={'l' + i} x={i * slot + slot / 2} y={height - 6} fill="#64748b" fontSize="11" textAnchor="middle">
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// Линейный график веса.
export function LineChart({ data, width, height = 160 }) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Пока нет записей веса</Text>
      </View>
    );
  }
  const top = 12;
  const padB = 22;
  const padX = 14;
  const chartH = height - top - padB;
  const innerW = width - padX * 2;

  const vals = data.map((d) => d.kg);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad; max += pad;

  const x = (i) => padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => top + chartH - ((v - min) / (max - min)) * chartH;

  const points = data.map((d, i) => `${x(i)},${y(d.kg)}`).join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />
      {data.map((d, i) => (
        <Circle key={i} cx={x(i)} cy={y(d.kg)} r={4} fill="#22c55e" />
      ))}
      <SvgText x={padX} y={10} fill="#64748b" fontSize="10">{max.toFixed(0)} кг</SvgText>
      <SvgText x={padX} y={height - 4} fill="#64748b" fontSize="10">{min.toFixed(0)} кг</SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#64748b', fontSize: 13 },
});
