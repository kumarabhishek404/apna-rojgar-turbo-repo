import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { colors } from "@/constants/theme";

export type ChartSeries = {
  key: string;
  name: string;
  color: string;
  values: number[];
};

type PointSelection = {
  index: number;
  seriesKey: string;
  label: string;
  value: number;
  seriesName: string;
};

export function InteractiveLineChart({
  labels,
  series,
  onSelect,
}: {
  labels: string[];
  series: ChartSeries[];
  onSelect?: (point: PointSelection) => void;
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, Math.min(width - 36, 820));
  const height = 168;
  const pad = 16;
  const count = labels.length;
  const max = Math.max(1, ...series.flatMap((item) => item.values));

  const points = useMemo(
    () =>
      series.map((item) =>
        item.values
          .map((value, index) => {
            const x = count <= 1 ? chartWidth / 2 : pad + (index * (chartWidth - pad * 2)) / (count - 1);
            const y = height - pad - (value / max) * (height - pad * 2);
            return `${x},${y}`;
          })
          .join(" "),
      ),
    [chartWidth, count, max, series],
  );

  return (
    <View>
      <Svg width={chartWidth} height={height}>
        {series.map((item, seriesIndex) => (
          <Polyline
            key={item.key}
            points={points[seriesIndex]}
            fill="none"
            stroke={item.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </Svg>
      <View style={[styles.hitRow, { width: chartWidth, height }]}>
        {labels.map((label, index) => (
          <Pressable
            key={`${label}-${index}`}
            style={styles.hit}
            onPress={() => {
              if (!series.length) return;
              const top = series.reduce((best, item) =>
                (item.values[index] || 0) > (best.values[index] || 0) ? item : best,
              );
              onSelect?.({
                index,
                seriesKey: top.key,
                seriesName: top.name,
                label,
                value: top.values[index] || 0,
              });
            }}
          />
        ))}
      </View>
      <Legend series={series} onSelect={onSelect} labels={labels} />
    </View>
  );
}

export function InteractiveBarChart({
  labels,
  series,
  onSelect,
}: {
  labels: string[];
  series: ChartSeries[];
  onSelect?: (point: PointSelection) => void;
}) {
  const max = Math.max(1, ...series.flatMap((item) => item.values));
  const visible = labels.map((label, index) => ({ label, index }));
  const step = labels.length > 18 ?  Math.ceil(labels.length / 14) : 1;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.bars}>
          {visible.filter((_, index) => index % step === 0 || index === labels.length - 1).map(({ label, index }) => (
            <View key={`${label}-${index}`} style={styles.barGroup}>
              <View style={styles.barStack}>
                {series.map((item) => {
                  const value = item.values[index] || 0;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() =>
                        onSelect?.({
                          index,
                          seriesKey: item.key,
                          seriesName: item.name,
                          label,
                          value,
                        })
                      }
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (value / max) * 120),
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.tick}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Legend series={series} onSelect={onSelect} labels={labels} />
    </View>
  );
}

export function InteractiveDonut({
  slices,
  onSelect,
}: {
  slices: Array<{ key: string; label: string; value: number; color: string }>;
  onSelect?: (slice: { key: string; label: string; value: number }) => void;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const size = 168;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={styles.donutRow}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={18} fill="none" />
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dashOffset = -offset;
          offset += length;
          return (
            <Circle
              key={slice.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={slice.color}
              strokeWidth={18}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
              onPress={() => onSelect?.(slice)}
            />
          );
        })}
      </Svg>
      <View style={{ flex: 1, gap: 8 }}>
        {slices.map((slice) => (
          <Pressable key={slice.key} onPress={() => onSelect?.(slice)} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: slice.color }]} />
            <Text style={styles.legendText}>
              {slice.label} · {slice.value.toLocaleString("en-IN")}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ActivityHeatmap({
  series,
  onSelect,
}: {
  series: Array<{ name: string; data: Array<{ x: string; y: number }> }>;
  onSelect?: (cell: { day: string; hour: string; value: number }) => void;
}) {
  const max = Math.max(
    1,
    ...series.flatMap((row) => row.data.map((cell) => Number(cell.y || 0))),
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {series.map((row) => (
          <View key={row.name} style={styles.heatRow}>
            <Text style={styles.heatLabel}>{row.name}</Text>
            {row.data.map((cell) => {
              const value = Number(cell.y || 0);
              const alpha = 0.12 + (value / max) * 0.88;
              return (
                <Pressable
                  key={`${row.name}-${cell.x}`}
                  onPress={() => onSelect?.({ day: row.name, hour: cell.x, value })}
                  style={[styles.heatCell, { backgroundColor: `rgba(34, 64, 154, ${alpha})` }]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Legend({
  series,
  labels,
  onSelect,
}: {
  series: ChartSeries[];
  labels: string[];
  onSelect?: (point: PointSelection) => void;
}) {
  return (
    <View style={styles.legend}>
      {series.map((item) => (
        <Pressable
          key={item.key}
          style={styles.legendItem}
          onPress={() => {
            const index = item.values.reduce(
              (best, value, current) => (value > item.values[best] ? current : best),
              0,
            );
            onSelect?.({
              index,
              seriesKey: item.key,
              seriesName: item.name,
              label: labels[index] || item.name,
              value: item.values[index] || 0,
            });
          }}
        >
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const chartColors = {
  primary: colors.primary,
  light: colors.primaryLight,
  dark: colors.primaryDark,
  orange: colors.orange,
  amber: colors.amber,
  success: colors.success,
  slate: "#64748b",
};

const styles = StyleSheet.create({
  hitRow: { position: "absolute", left: 0, top: 0, flexDirection: "row" },
  hit: { flex: 1, height: "100%" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 8, minHeight: 150, paddingBottom: 4 },
  barGroup: { alignItems: "center", width: 36 },
  barStack: { height: 124, justifyContent: "flex-end", gap: 3, flexDirection: "row", alignItems: "flex-end" },
  bar: { width: 8, borderRadius: 4 },
  tick: { marginTop: 6, fontSize: 10, color: colors.muted },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 99 },
  legendText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  heatRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  heatLabel: { width: 32, fontSize: 11, color: colors.muted, fontWeight: "700" },
  heatCell: { width: 14, height: 14, borderRadius: 3, marginRight: 2 },
});
