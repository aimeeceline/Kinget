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
import Svg, { G, Path, Circle } from "react-native-svg";
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
  id: string;      // document id (vd: "B02")
  name: string;    // tên hiển thị (vd: "Chi nhánh B02")
};

type OrderDoc = {
  branchId: string;
  total: number;
  status: string;
  createdAt?: any;
};

const COLORS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#84CC16", "#F97316", "#D946EF", "#14B8A6",
];

const currency = (v: number) =>
  v.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const DonutPie: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
  innerRatio?: number; // 0..1
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

  // Nếu tất cả = 0 thì vẽ vòng tròn xám
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
        {/* lỗ giữa */}
        <Circle r={innerRadius} fill="#fff" />
      </G>
    </Svg>
  );
};

export default function RevenueCharts() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("__all__");
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  // Lấy branches (nếu thiếu name thì tạo tên mặc định)
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
        // Không có collection branches? kệ, sẽ suy ra từ orders bên dưới
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Lấy orders "completed" realtime
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

        // nếu branches rỗng thì suy ra từ orders
        if (branches.length === 0) {
          const uniq = Array.from(new Set(list.map((o) => o.branchId)));
          setBranches(
            uniq.map((id, i) => ({
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

  // Tổng doanh thu theo branch
  const revenueByBranch = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      if (!o.branchId) continue;
      map.set(o.branchId, (map.get(o.branchId) || 0) + (o.total || 0));
    }
    return map;
  }, [orders]);

  const totalAll = useMemo(
    () => Array.from(revenueByBranch.values()).reduce((s, v) => s + v, 0),
    [revenueByBranch]
  );

  // Data cho chart
  const pieData = useMemo(() => {
    if (selectedBranch === "__all__") {
      const rows = branches
        .map((b, idx) => ({
          label: b.name || b.id,
          id: b.id,
          value: revenueByBranch.get(b.id) || 0,
          color: COLORS[idx % COLORS.length],
        }))
        .filter((r) => r.value >= 0);

      // Nếu chưa có branch nào, still return rỗng
      return rows;
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Biểu đồ doanh thu</Text>

      {/* Bộ lọc chi nhánh */}
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
        {selectedBranch !== "__all__" && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setSelectedBranch("__all__")}
          >
            <Text style={styles.clearBtnText}>Xóa lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : (
        <>
          {/* Donut chart */}
          <View style={styles.chartWrap}>
            <DonutPie data={pieData} size={280} innerRatio={0.62} />
            <View style={styles.centerStats}>
              <Text style={styles.centerTop}>
                {selectedBranch === "__all__" ? "Tổng" : "Doanh thu"}
              </Text>
              <Text style={styles.centerMoney}>{currency(totalSelected)}</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendWrap}>
            <Text style={styles.legendTitle}>
              {selectedBranch === "__all__"
                ? "Tỉ trọng theo chi nhánh"
                : "Chi tiết chi nhánh"}
            </Text>

            {pieData.length === 0 && (
              <Text style={styles.empty}>Chưa có dữ liệu.</Text>
            )}

            {pieData.map((row, idx) => {
              const percent =
                totalSelected > 0 ? (row.value / totalSelected) * 100 : 0;
              return (
                <View key={idx} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: row.color }]} />
                  <View style={styles.legendInfo}>
                    <Text style={styles.legendLabel}>{row.label}</Text>
                    <Text style={styles.legendSub}>
                      {currency(row.value)} · {percent.toFixed(1)}%
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
    gap: 10,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 70,
  },
  pickerWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  clearBtnText: {
    fontWeight: "600",
  },
  chartWrap: {
    marginTop: 12,
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
