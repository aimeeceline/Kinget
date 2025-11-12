import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { db } from "../../data/FireBase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type Option = { label: string; price: number };
type Food = {
  id?: string;
  name: string;
  category: string;
  description?: string;
  image?: string;
  price?: number;
  sizes?: Option[];
  bases?: Option[];
  toppings?: Option[];
  addOns?: Option[];
};

const RestaurantFoodDetail: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "RestaurantFoodDetail">>();
  const navigation = useNavigation();
  const { food } = route.params;

  const [current, setCurrent] = useState<Food | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ Luôn fetch lại dữ liệu gốc từ Firestore
  useEffect(() => {
    const fetchFoodDetail = async () => {
      const foodId = food?.id || food?.foodId;
      if (!foodId) {
        console.warn("⚠️ Không có id hợp lệ để tải chi tiết món");
        setCurrent(food);
        return;
      }

      try {
        const ref = doc(db, "foods", foodId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Food;
          console.log("✅ Firestore data:", data);

          // 🔹 Merge dữ liệu gốc từ Firestore và dữ liệu được truyền
          setCurrent({
            ...data,
            ...food,
            id: foodId,
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            bases: Array.isArray(data.bases) ? data.bases : [],
            toppings: Array.isArray(data.toppings) ? data.toppings : [],
            addOns: Array.isArray(data.addOns) ? data.addOns : [],
          });
        } else {
          console.warn("⚠️ Không tìm thấy món ăn trong Firestore:", foodId);
          setCurrent(food);
        }
      } catch (err) {
        console.error("🔥 Lỗi load chi tiết món:", err);
        setCurrent(food);
      }
    };

    fetchFoodDetail();
  }, [food]);

  if (!current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // === HANDLERS ===
  const handleChange = (key: keyof Food, value: any) =>
    setCurrent({ ...current, [key]: value });

  const handleArrayChange = (
    key: keyof Pick<Food, "sizes" | "bases" | "toppings" | "addOns">,
    index: number,
    field: keyof Option,
    value: string
  ) => {
    const arr = [...(current[key] as Option[])];
    (arr[index] as any)[field] = field === "price" ? Number(value) : value;
    // Nếu sửa size đầu tiên => cập nhật luôn giá cơ bản
    if (key === "sizes" && index === 0 && field === "price") {
      setCurrent({ ...current, [key]: arr, price: Number(value) });
    } else {
      setCurrent({ ...current, [key]: arr });
    }
  };

  const addItem = (key: keyof Pick<Food, "sizes" | "bases" | "toppings" | "addOns">) => {
    const arr = [...(current[key] as Option[])];
    arr.push({ label: "", price: 0 });
    setCurrent({ ...current, [key]: arr });
  };

  const removeItem = (key: keyof Pick<Food, "sizes" | "bases" | "toppings" | "addOns">, index: number) => {
    const arr = [...(current[key] as Option[])];
    arr.splice(index, 1);
    setCurrent({ ...current, [key]: arr });
  };

  // === Lưu Firestore ===
  const handleSave = async () => {
    if (!current?.id) return Alert.alert("Thiếu thông tin món ăn");

    try {
      setSaving(true);
      const ref = doc(db, "foods", current.id);

      await updateDoc(ref, {
        name: current.name,
        category: current.category,
        description: current.description || "",
        image: current.image || "",
        // ✅ Giá cơ bản = giá của size đầu tiên (nếu có)
        price: Number(
          current.sizes && current.sizes.length > 0
            ? current.sizes[0].price
            : current.price || 0
        ),
        sizes: current.sizes || [],
        bases: current.bases || [],
        toppings: current.toppings || [],
        addOns: current.addOns || [],
      });

      Alert.alert("✅ Thành công", "Đã lưu thay đổi vào Firestore");
      navigation.goBack();
    } catch (err) {
      console.error("🔥 Lỗi lưu Firestore:", err);
      Alert.alert("❌ Lỗi", "Không thể lưu thay đổi, hãy thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // === Giao diện ===
  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: current.image || "https://via.placeholder.com/300" }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.label}>Tên món</Text>
      <TextInput
        style={styles.input}
        value={current.name}
        onChangeText={(v) => handleChange("name", v)}
      />

      <Text style={styles.label}>Loại món</Text>
      <TextInput
        style={styles.input}
        value={current.category || "Không xác định"}
        editable={false}
      />

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, { height: 90 }]}
        value={current.description || ""}
        onChangeText={(v) => handleChange("description", v)}
        multiline
      />

      <Text style={styles.label}>Ảnh</Text>
      <TextInput
        style={styles.input}
        value={current.image || ""}
        onChangeText={(v) => handleChange("image", v)}
      />

      <Text style={styles.label}>Giá cơ bản (₫)</Text>
      <TextInput
        key={String(current.price)}
        style={styles.input}
        keyboardType="numeric"
        value={String(current.price ?? "")}
        onChangeText={(v) => handleChange("price", Number(v))}
      />

      {/* 🧩 Các phần động theo category */}
      {current.category === "Pizza" && (
        <>
          <Section title="🍕 Kích cỡ" data={current.sizes || []} onAdd={() => addItem("sizes")}
            onRemove={(i) => removeItem("sizes", i)} onChange={(i, f, v) => handleArrayChange("sizes", i, f, v)} />
          <Section title="🍞 Đế bánh" data={current.bases || []} onAdd={() => addItem("bases")}
            onRemove={(i) => removeItem("bases", i)} onChange={(i, f, v) => handleArrayChange("bases", i, f, v)} />
          <Section title="🧀 Topping" data={current.toppings || []} onAdd={() => addItem("toppings")}
            onRemove={(i) => removeItem("toppings", i)} onChange={(i, f, v) => handleArrayChange("toppings", i, f, v)} />
        </>
      )}

      {current.category === "Burger" && (
        <>
          <Section title="🍔 Kích cỡ" data={current.sizes || []} onAdd={() => addItem("sizes")}
            onRemove={(i) => removeItem("sizes", i)} onChange={(i, f, v) => handleArrayChange("sizes", i, f, v)} />
          <Section title="🥓 Add-ons" data={current.addOns || []} onAdd={() => addItem("addOns")}
            onRemove={(i) => removeItem("addOns", i)} onChange={(i, f, v) => handleArrayChange("addOns", i, f, v)} />
        </>
      )}

      {current.category === "Drink" && (
        <Section title="🥤 Kích cỡ" data={current.sizes || []}
          onAdd={() => addItem("sizes")} onRemove={(i) => removeItem("sizes", i)}
          onChange={(i, f, v) => handleArrayChange("sizes", i, f, v)} />
      )}

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/* 🔸 Component phụ hiển thị Section (size, base, topping, addon) */
const Section = ({
  title,
  data,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  data: Option[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: keyof Option, val: string) => void;
}) => (
  <>
    <Text style={styles.section}>{title}</Text>
    {data.map((item, i) => (
      <View key={i} style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="Tên"
          value={item.label}
          onChangeText={(v) => onChange(i, "label", v)}
        />
        <TextInput
          style={[styles.input, { width: 100 }]}
          keyboardType="numeric"
          placeholder="Giá"
          value={String(item.price)}
          onChangeText={(v) => onChange(i, "price", v)}
        />
        <TouchableOpacity onPress={() => onRemove(i)}>
          <Ionicons name="trash-outline" size={22} color="red" />
        </TouchableOpacity>
      </View>
    ))}
    <TouchableOpacity onPress={onAdd}>
      <Text style={styles.addBtn}>+ Thêm</Text>
    </TouchableOpacity>
  </>
);

export default RestaurantFoodDetail;

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 16, fontWeight: "bold", color: "#F58220", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  section: { fontWeight: "bold", fontSize: 16, marginTop: 16, color: "#F58220" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  addBtn: { color: "#F58220", fontWeight: "600", marginTop: 4 },
  imageWrapper: { alignItems: "center", marginBottom: 12 },
  image: {
    width: "90%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
  },
  saveBtn: {
    backgroundColor: "#F58220",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});
