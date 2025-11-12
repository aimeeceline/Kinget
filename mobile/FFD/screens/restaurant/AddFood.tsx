import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../data/FireBase";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";

type Option = { label: string; price: number };

type Food = {
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

const categories = ["Pizza", "Burger", "Drink"];

const AddFoodScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "AddFood">>();
  const { branchId } = route.params;

  const [food, setFood] = useState<Food>({
    name: "",
    category: "",
    description: "",
    image: "",
    price: 0,
    sizes: [],
    bases: [],
    toppings: [],
    addOns: [],
  });

  const handleChange = (key: keyof Food, value: any) => {
    setFood({ ...food, [key]: value });
  };

  const handleArrayChange = (
    key: keyof Pick<Food, "sizes" | "bases" | "toppings" | "addOns">,
    index: number,
    field: keyof Option,
    value: string
  ) => {
    const arr = [...(food[key] as Option[])];
    (arr[index] as any)[field] = field === "price" ? Number(value) : value;
    if (key === "sizes" && index === 0 && field === "price") {
      setFood({ ...food, [key]: arr, price: Number(value) });
    } else {
      setFood({ ...food, [key]: arr });
    }
  };

  const addItem = (key: keyof Pick<Food, "sizes" | "bases" | "toppings" | "addOns">) => {
    const arr = [...(food[key] as Option[])];
    arr.push({ label: "", price: 0 });
    setFood({ ...food, [key]: arr });
  };

  const removeItem = (key: keyof Pick<Food, "sizes" | "bases" | "toppings" | "addOns">, index: number) => {
    const arr = [...(food[key] as Option[])];
    arr.splice(index, 1);
    setFood({ ...food, [key]: arr });
  };

  // ✅ Lưu món mới vào Firestore với ID tự tăng Fxx
  const handleSave = async () => {
    if (!food.name.trim() || !food.category.trim()) {
      Alert.alert("⚠️ Vui lòng nhập đầy đủ thông tin món!");
      return;
    }

    try {
      // ======= SINH ID Fxx CHO FOODS =======
      const foodsSnap = await getDocs(collection(db, "foods"));
      const foodCount = foodsSnap.size;
      const newFoodId = `F${String(foodCount + 1).padStart(2, "0")}`;

      // ======= TẠO DỮ LIỆU MÓN =======
      const newFood: Food = {
        name: food.name.trim(),
        category: food.category.trim(),
        description: food.description?.trim() || "",
        image: food.image?.trim() || "",
        price:
          food.sizes && food.sizes.length > 0
            ? Number(food.sizes[0].price)
            : Number(food.price || 0),
        sizes: Array.isArray(food.sizes) ? food.sizes : [],
        bases: Array.isArray(food.bases) ? food.bases : [],
        toppings: Array.isArray(food.toppings) ? food.toppings : [],
        addOns: Array.isArray(food.addOns) ? food.addOns : [],
      };

      // ======= LƯU VÀO COLLECTION FOODS =======
      await setDoc(doc(db, "foods", newFoodId), {
        ...newFood,
        createdAt: serverTimestamp(),
      });

      // ======= SINH ID Fxx CHO BRANCHFOODS (nếu có branchId) =======
      if (branchId) {
        const branchFoodsSnap = await getDocs(
          collection(db, `branches/${branchId}/branchFoods`)
        );
        const branchFoodCount = branchFoodsSnap.size;
        const newBranchFoodId = `F${String(branchFoodCount + 1).padStart(2, "0")}`;

        await setDoc(
          doc(db, `branches/${branchId}/branchFoods`, newBranchFoodId),
          {
            foodId: newFoodId,
            foodName: newFood.name,
            isAvailable: true,
            stock: 0,
          }
        );
      }

      Alert.alert("✅ Thành công", `Đã thêm món ${newFood.name} (${newFoodId})`);
      navigation.goBack();
    } catch (err) {
      console.error("❌ Lỗi thêm món:", err);
      Alert.alert("Lỗi", "Không thể thêm món, vui lòng thử lại!");
    }
  };

  // 🧩 Giao diện động theo loại món
  const renderDynamicFields = () => {
    switch (food.category) {
      case "Pizza":
        return (
          <>
            <Section
              title="🍕 Kích cỡ"
              data={food.sizes || []}
              onAdd={() => addItem("sizes")}
              onRemove={(i) => removeItem("sizes", i)}
              onChange={(i, f, v) => handleArrayChange("sizes", i, f, v)}
            />
            <Section
              title="🍞 Đế bánh"
              data={food.bases || []}
              onAdd={() => addItem("bases")}
              onRemove={(i) => removeItem("bases", i)}
              onChange={(i, f, v) => handleArrayChange("bases", i, f, v)}
            />
            <Section
              title="🧀 Topping"
              data={food.toppings || []}
              onAdd={() => addItem("toppings")}
              onRemove={(i) => removeItem("toppings", i)}
              onChange={(i, f, v) => handleArrayChange("toppings", i, f, v)}
            />
          </>
        );

      case "Burger":
        return (
          <>
            <Section
              title="🍔 Kích cỡ"
              data={food.sizes || []}
              onAdd={() => addItem("sizes")}
              onRemove={(i) => removeItem("sizes", i)}
              onChange={(i, f, v) => handleArrayChange("sizes", i, f, v)}
            />
            <Section
              title="🥓 Add-ons"
              data={food.addOns || []}
              onAdd={() => addItem("addOns")}
              onRemove={(i) => removeItem("addOns", i)}
              onChange={(i, f, v) => handleArrayChange("addOns", i, f, v)}
            />
          </>
        );

      case "Drink":
        return (
          <Section
            title="🥤 Kích cỡ"
            data={food.sizes || []}
            onAdd={() => addItem("sizes")}
            onRemove={(i) => removeItem("sizes", i)}
            onChange={(i, f, v) => handleArrayChange("sizes", i, f, v)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>➕ Thêm món mới</Text>

      <Text style={styles.label}>Tên món</Text>
      <TextInput
        style={styles.input}
        value={food.name}
        onChangeText={(v) => handleChange("name", v)}
        placeholder="Nhập tên món"
      />

      <Text style={styles.label}>Loại món</Text>
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, food.category === cat && styles.catBtnActive]}
            onPress={() => handleChange("category", cat)}
          >
            <Text
              style={[
                styles.catText,
                food.category === cat && styles.catTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={food.description}
        onChangeText={(v) => handleChange("description", v)}
        multiline
        placeholder="Mô tả món ăn"
      />

      <Text style={styles.label}>Ảnh URL</Text>
      <TextInput
        style={styles.input}
        value={food.image}
        onChangeText={(v) => handleChange("image", v)}
        placeholder="https://..."
      />

      {renderDynamicFields()}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>💾 Lưu món</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

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
          placeholder="Giá"
          keyboardType="numeric"
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

export default AddFoodScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#F58220", marginBottom: 12 },
  label: { fontWeight: "600", marginTop: 10, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  categoryRow: { flexDirection: "row", marginVertical: 8 },
  catBtn: {
    borderWidth: 1,
    borderColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  catBtnActive: { backgroundColor: "#F58220" },
  catText: { color: "#F58220", fontWeight: "500" },
  catTextActive: { color: "#fff" },
  section: { fontWeight: "bold", fontSize: 16, marginTop: 16, color: "#F58220" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  addBtn: { color: "#F58220", fontWeight: "600", marginTop: 4 },
  saveBtn: {
    backgroundColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 30,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});
