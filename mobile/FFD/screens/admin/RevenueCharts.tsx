// screens/RevenueCharts.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Svg, { G, Path, Circle, Rect, Text as SvgText } from "react-native-svg";
import * as d3 from "d3-shape";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../data/FireBase";

type Branch = {
  id: string;
  name: string;
};

type OrderDoc = {
  branchId: string;
  total: number;
  status: string;
  createdAt?: any; // Firestore Timestamp hoặc Date/string
};

type ChartType = "pie" | "bar";
type TimeFilter = "all" | "today" | "7days";

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#D946EF",
  "#14B8A6",
];

const currency = (v: number) =>
  v.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

/* ===================== DONUT PIE ===================== */
const DonutPie: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
  innerRatio?: number;
}> = ({ data, size = 260, innerRatio = 0.6 }) => {
  const radius = size / 2;
  const innerRadius = radius * innerRatio;

  const arcs = useMemo(() => {
    const pieGen = d3.pie<any>().value((d: any) => d.value).sort(null);
    return pieGen(data);
  }, [data]);

  const arcGen = useMemo(
    () => d3.arc<any>().innerRadius(innerRadius).outerRadius(radius),
    [innerRadius, radius]
  );

  const sum = data.reduce((s, d) => s + d.value, 0);
  if (sum === 0) {
    return (
      <Svg width={size} height={size}>
        <G x={radius} y={radius}>
          <Circle r={radius} fill="#eee" />
          <Circle r={innerRadius} fill="#fff" />
        </G>
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size}>
      <G x={radius} y={radius}>
        {arcs.map((a, i) => (
          <Path key={i} d={arcGen(a) as string} fill={data[i].color} />
        ))}
        <Circle r={innerRadius} fill="#fff" />
      </G>
    </Svg>
  );
};

/* ===================== BAR CHART ===================== */
const BarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  height?: number;
}> = ({ data, height = 260 }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 40;
  const gap = 20;
  const width = Math.max(data.length * (barWidth + gap) + gap, 260);
  const chartHeight = height - 40;

  if (data.length === 0) {
    return (
      <Svg width={width} height={height}>
        <SvgText
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="#888"
          fontSize={14}
        >
          Chưa có dữ liệu
        </SvgText>
      </Svg>
    );
  }

  return (
    <Svg width={width} height={height}>
      <G y={10}>
        {data.map((d, i) => {
          const x = gap + i * (barWidth + gap);
          const barHeight = (d.value / maxVal) * (chartHeight - 20);
          const y = chartHeight - barHeight;
          const label =
            d.label.length > 7 ? d.label.slice(0, 6).trim() + "…" : d.label;
          return (
            <G key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={d.color}
                rx={6}
              />
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                fontSize={10}
                textAnchor="middle"
                fill="#444"
              >
                {d.value === 0 ? "" : (d.value / 1000).toFixed(0) + "k"}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 14}
                fontSize={10}
                textAnchor="middle"
                fill="#444"
              >
                {label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
};

/* ===================== SCREEN ===================== */
export default function RevenueCharts() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("__all__");
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all"); // 👈 lọc thời gian
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  // Lấy branches
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "branches"));
        const list: Branch[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data?.name || data?.branchName || d.id,
          };
        });
        if (!cancelled) setBranches(list);
      } catch {
        // không có branches cũng tạm được
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lấy orders có status completed
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "==", "completed")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: OrderDoc[] = snap.docs.map((d) => {
          const data = d.data() as DocumentData;
          return {
            branchId: data.branchId ?? data.branchID ?? data.branch ?? "UNKNOWN",
            total: Number(data.total ?? 0),
            status: String(data.status ?? ""),
            createdAt: data.createdAt,
          };
        });
        setOrders(list);

        // nếu chưa có branches thì suy ra từ orders
        if (branches.length === 0) {
          const uniq = Array.from(new Set(list.map((o) => o.branchId)));
          setBranches(
            uniq.map((id) => ({
              id,
              name: id,
            }))
          );
        }

        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [branches.length]);

  // ===== Helper: convert createdAt to Date =====
  const toDate = (val: any): Date | null => {
    if (!val) return null;
    try {
      if (val.toDate) return val.toDate(); // Firestore Timestamp
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  // ===== Lọc theo ngày / tuần =====
  const filteredOrders = useMemo(() => {
    if (timeFilter === "all") return orders;

    const now = new Date();

    // bắt đầu 0h hôm nay
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // 7 ngày gần đây (kể cả hôm nay)
    const sevenDaysStart = new Date(todayStart);
    sevenDaysStart.setDate(todayStart.getDate() - 6);

    return orders.filter((o) => {
      const d = toDate(o.createdAt);
      if (!d) return true; // nếu thiếu createdAt thì cho qua, tùy em
      if (timeFilter === "today") {
        return d >= todayStart && d <= todayEnd;
      }
      if (timeFilter === "7days") {
        return d >= sevenDaysStart && d <= todayEnd;
      }
      return true;
    });
  }, [orders, timeFilter]);

  // ===== Doanh thu theo branch dựa trên filteredOrders =====
  const revenueByBranch = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filteredOrders) {
      if (!o.branchId) continue;
      map.set(o.branchId, (map.get(o.branchId) || 0) + (o.total || 0));
    }
    return map;
  }, [filteredOrders]);

  const totalAll = useMemo(
    () => Array.from(revenueByBranch.values()).reduce((s, v) => s + v, 0),
    [revenueByBranch]
  );

  // Data cho chart (dùng chung cho pie & bar)
  const chartData = useMemo(() => {
    if (selectedBranch === "__all__") {
      return branches
        .map((b, idx) => ({
          label: b.name || b.id,
          id: b.id,
          value: revenueByBranch.get(b.id) || 0,
          color: COLORS[idx % COLORS.length],
        }))
        .filter((r) => r.value >= 0);
    } else {
      const value = revenueByBranch.get(selectedBranch) || 0;
      const b = branches.find((x) => x.id === selectedBranch);
      return [
        {
          label: b?.name || selectedBranch,
          id: selectedBranch,
          value,
          color: COLORS[0],
        },
      ];
    }
  }, [branches, revenueByBranch, selectedBranch]);

  const totalSelected = useMemo(() => {
    if (selectedBranch === "__all__") return totalAll;
    return revenueByBranch.get(selectedBranch) || 0;
  }, [selectedBranch, totalAll, revenueByBranch]);

  /* ===================== RENDER ===================== */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Báo cáo doanh thu</Text>

      {/* Lọc chi nhánh */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Chi nhánh:</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedBranch}
            onValueChange={(v) => setSelectedBranch(v)}
            dropdownIconColor="#111"
          >
            <Picker.Item label="Tất cả chi nhánh" value="__all__" />
            {branches.map((b) => (
              <Picker.Item key={b.id} label={b.name || b.id} value={b.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Lọc thời gian: tất cả / hôm nay / 7 ngày */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Thời gian:</Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              timeFilter === "all" && styles.toggleBtnActive,
            ]}
            onPress={() => setTimeFilter("all")}
          >
            <Text
              style={[
                styles.toggleText,
                timeFilter === "all" && styles.toggleTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              timeFilter === "today" && styles.toggleBtnActive,
            ]}
            onPress={() => setTimeFilter("today")}
          >
            <Text
              style={[
                styles.toggleText,
                timeFilter === "today" && styles.toggleTextActive,
              ]}
            >
              Hôm nay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              timeFilter === "7days" && styles.toggleBtnActive,
            ]}
            onPress={() => setTimeFilter("7days")}
          >
            <Text
              style={[
                styles.toggleText,
                timeFilter === "7days" && styles.toggleTextActive,
              ]}
            >
              7 ngày
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lọc loại biểu đồ: tròn / cột */}
      <View style={styles.chartTypeRow}>
        <Text style={styles.filterLabel}>Biểu đồ:</Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              chartType === "pie" && styles.toggleBtnActive,
            ]}
            onPress={() => setChartType("pie")}
          >
            <Text
              style={[
                styles.toggleText,
                chartType === "pie" && styles.toggleTextActive,
              ]}
            >
              Tròn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              chartType === "bar" && styles.toggleBtnActive,
            ]}
            onPress={() => setChartType("bar")}
          >
            <Text
              style={[
                styles.toggleText,
                chartType === "bar" && styles.toggleTextActive,
              ]}
            >
              Cột
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : (
        <>
          {/* Chart */}
          <View style={styles.chartWrap}>
            {chartType === "pie" ? (
              <>
                <DonutPie data={chartData} size={280} innerRatio={0.62} />
                <View style={styles.centerStats}>
                  <Text style={styles.centerTop}>
                    {selectedBranch === "__all__" ? "Tổng" : "Doanh thu"}
                  </Text>
                  <Text style={styles.centerMoney}>
                    {currency(totalSelected)}
                  </Text>
                </View>
              </>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                <BarChart data={chartData} height={260} />
              </ScrollView>
            )}
          </View>

          {/* Legend */}
          <View style={styles.legendWrap}>
            <Text style={styles.legendTitle}>
              {selectedBranch === "__all__"
                ? "Chi tiết theo chi nhánh"
                : "Chi tiết chi nhánh"}
            </Text>

            {chartData.length === 0 && (
              <Text style={styles.empty}>Chưa có dữ liệu.</Text>
            )}

            {chartData.map((row, idx) => {
              const percent =
                totalSelected > 0 ? (row.value / totalSelected) * 100 : 0;
              return (
                <View key={idx} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: row.color }]} />
                  <View style={styles.legendInfo}>
                    <Text style={styles.legendLabel}>{row.label}</Text>
                    <Text style={styles.legendSub}>
                      {currency(row.value)} ·{" "}
                      {totalSelected === 0 ? "0.0" : percent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  chartTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 80,
  },
  pickerWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 999,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 2,
  },
  toggleBtnActive: {
    backgroundColor: "#4CAF50",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  toggleTextActive: {
    color: "#fff",
  },
  chartWrap: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  centerStats: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerTop: {
    fontSize: 12,
    color: "#666",
  },
  centerMoney: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  legendWrap: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  legendInfo: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  legendSub: {
    fontSize: 12,
    color: "#666",
  },
  empty: {
    color: "#888",
    fontStyle: "italic",
  },
});
