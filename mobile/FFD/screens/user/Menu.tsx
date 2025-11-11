import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../data/FireBase";
import { Food } from "../../types/food";
import FoodCard from "../../components/FoodCard";

const categories = ["Tất cả", "Pizza", "Burger", "Drink"];

const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeBranch, setActiveBranch] = useState<string | undefined>();
  const [branchKeys, setBranchKeys] = useState<Set<string>>(new Set());

  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingBranchFoods, setLoadingBranchFoods] = useState(true);

  // ===== 🏢 Lấy danh sách chi nhánh
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "branches"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as any).name,
      }));
      setBranches(list);
      if (!activeBranch && list.length > 0) setActiveBranch(list[0].id);
      setLoadingBranches(false);
    });
    return unsub;
  }, []);

  // ===== 🍔 Lấy danh sách món ăn
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "foods"), (snap) => {
      const list: Food[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Food, "id">),
      }));
      setFoods(list);
      setLoadingFoods(false);
    });
    return unsub;
  }, []);

  // ===== 🧩 Lấy branchFoods theo chi nhánh
  useEffect(() => {
    if (!activeBranch) return;

    setLoadingBranchFoods(true);
    setBranchKeys(new Set()); // reset keys khi đổi chi nhánh
    setFilteredFoods([]); // clear danh sách tạm thời

    const unsub = onSnapshot(
      collection(db, `branches/${activeBranch}/branchFoods`),
      (snap) => {
        const keys = new Set<string>();
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.isActive === true) {
            if (data.foodId) keys.add(String(data.foodId));
          }
        });
        setBranchKeys(keys);
        setLoadingBranchFoods(false);
      }
    );

    return unsub;
  }, [activeBranch]);

  // ===== 🔍 Lọc danh sách món hiển thị
  useEffect(() => {
    if (loadingFoods || loadingBranches || loadingBranchFoods) return;

    let result = foods;

    // Lọc theo branchFoods
    if (activeBranch && branchKeys.size > 0) {
      result = result.filter((f) => branchKeys.has(f.id));
    } else {
      result = [];
    }

    // Lọc theo category
    if (activeCategory !== "Tất cả") {
      result = result.filter((f) => f.category === activeCategory);
    }

    setFilteredFoods(result);
  }, [
    foods,
    branchKeys,
    activeBranch,
    activeCategory,
    loadingFoods,
    loadingBranches,
    loadingBranchFoods,
  ]);

  const isLoading = loadingFoods || loadingBranches || loadingBranchFoods;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text>Đang tải menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== Tabs Chi nhánh ===== */}
      <View style={styles.tabSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.tabButton,
                activeBranch === b.id && styles.activeTab,
              ]}
              onPress={() => setActiveBranch(b.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeBranch === b.id && styles.activeTabText,
                ]}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Tabs Category ===== */}
      <View style={styles.tabSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tabButton,
                activeCategory === cat && styles.activeTab,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === cat && styles.activeTabText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Danh sách món ===== */}
      <FlatList
        data={filteredFoods}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FoodCard
            food={item}
            onPress={() =>
              navigation.navigate("FoodDetail", {
                food: item,
                branchId: activeBranch,
                branchName:
                  branches.find((b) => b.id === activeBranch)?.name || undefined,
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: "#777" }}>
            Chi nhánh này chưa có món ăn khả dụng.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default MenuScreen;

// ============== STYLES ==============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  tabSection: { marginBottom: 6 },
  tabScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  tabButton: {
    backgroundColor: "#EDECEC",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: { backgroundColor: "#F58220" },
  tabText: { fontSize: 15, color: "#333", fontWeight: "600" },
  activeTabText: { color: "#fff" },
});
