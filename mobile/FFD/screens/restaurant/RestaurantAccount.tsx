import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "../../components/BottomSheet";
import { useAuth } from "../../context/AuthContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import { db } from "../../data/FireBase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

const RestaurantAccount: React.FC = () => {
  const { user, setUser } = useAuth();
  const { show, confirm } = useMessageBox();

  const [sheet, setSheet] = useState<null | "info" | "password">(null);
  const [isEditing, setIsEditing] = useState(false);
  const editModeRef = useRef<(val: boolean) => void>(() => {});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [originalData, setOriginalData] = useState(formData);

  // ✅ Load dữ liệu từ users + branches
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.branchId) return;

        const branchRef = doc(db, "branches", user.branchId);
        const branchSnap = await getDoc(branchRef);
        const branchData = branchSnap.exists() ? branchSnap.data() : {};

        const q = query(collection(db, "users"), where("branchId", "==", user.branchId));
        const usersSnap = await getDocs(q);
        const userDoc = usersSnap.docs[0];
        const userData = userDoc ? userDoc.data() : {};

        const merged = {
          name: branchData.name || "",
          address: branchData.address || "",
          email: userData.email || "",
          phone: branchData.phone || userData.phone || "",
          password: userData.password || branchData.password || "",
          newPassword: "",
          confirmPassword: "",
        };

        setFormData(merged);
        setOriginalData(merged);
      } catch (err) {
        console.error("🔥 Lỗi load dữ liệu:", err);
        show("Không thể tải thông tin nhà hàng!", "error");
      }
    };

    fetchData();
  }, [user?.branchId]);

  // ✅ Cập nhật đồng bộ users + branches
  const handleSaveInfo = async () => {
    try {
      if (!user?.branchId) return show("Không xác định được chi nhánh!", "error");

      const branchRef = doc(db, "branches", user.branchId);
      const q = query(collection(db, "users"), where("branchId", "==", user.branchId));
      const usersSnap = await getDocs(q);
      const userDoc = usersSnap.docs[0];
      if (!userDoc) return show("Không tìm thấy tài khoản nhà hàng!", "error");
      const userRef = doc(db, "users", userDoc.id);

      await Promise.all([
        updateDoc(branchRef, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
        }),
        updateDoc(userRef, {
          email: formData.email,
          phone: formData.phone,
        }),
      ]);

      show("✅ Đã lưu thông tin thành công!", "success");
      setOriginalData(formData);
      setSheet(null);
    } catch (err) {
      console.error("❌ Lỗi cập nhật thông tin:", err);
      show("Không thể cập nhật thông tin!", "error");
    }
  };

  // ✅ Đổi mật khẩu đồng bộ
  const handleChangePassword = async () => {
    const { password, newPassword, confirmPassword } = formData;
    if (!password || !newPassword || !confirmPassword)
      return show("Vui lòng nhập đầy đủ thông tin!", "info");
    if (newPassword !== confirmPassword)
      return show("Mật khẩu xác nhận không khớp!", "error");
    if (newPassword.length < 3)
      return show("Mật khẩu mới phải ít nhất 3 ký tự!", "error");

    try {
      if (!user?.branchId) return show("Không xác định được chi nhánh!", "error");

      const branchRef = doc(db, "branches", user.branchId);
      const q = query(collection(db, "users"), where("branchId", "==", user.branchId));
      const usersSnap = await getDocs(q);
      const userDoc = usersSnap.docs[0];
      if (!userDoc) return show("Không tìm thấy tài khoản nhà hàng!", "error");
      const userRef = doc(db, "users", userDoc.id);

      await Promise.all([
        updateDoc(branchRef, { password: newPassword }),
        updateDoc(userRef, { password: newPassword }),
      ]);

      show("🔒 Đổi mật khẩu thành công!", "success");
      setFormData({
        ...formData,
        password: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSheet(null);
    } catch (err) {
      console.error("❌ Lỗi đổi mật khẩu:", err);
      show("Đổi mật khẩu thất bại!", "error");
    }
  };

  const handleLogout = async () => {
    const ok = await confirm("Xác nhận đăng xuất?");
    if (!ok) return;
    setUser(null);
    show("Đã đăng xuất!", "info");
  };

  const handleCloseSheet = () => {
    if (sheet === "info") setFormData(originalData);
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F58220" />
      <ScrollView style={styles.container}>
        {/* 👤 Header */}
        <View style={styles.header}>
          <Image source={require("../images/avatar.jpg")} style={styles.avatar} />
          <Text style={styles.name}>{formData.name || "Nhà hàng"}</Text>
          <Text style={styles.phone}>{formData.email || "restaurant@mail.com"}</Text>
        </View>

        {/* ⚙️ Menu */}
        <View style={styles.menu}>
          <OptionItem icon="storefront-outline" title="Thông tin nhà hàng" onPress={() => setSheet("info")} />
          <OptionItem icon="lock-closed-outline" title="Đổi mật khẩu" onPress={() => setSheet("password")} />
        </View>

        {/* 🚪 Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#F44336" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 📱 BottomSheet */}
      <BottomSheet
        visible={!!sheet}
        onClose={handleCloseSheet}
        showBackButton
        title={sheet === "info" ? "Thông tin nhà hàng" : "Đổi mật khẩu"}
        onBackPress={() => {
          if (sheet === "info" && isEditing) {
            setFormData(originalData);
            editModeRef.current(false);
            setIsEditing(false);
          } else handleCloseSheet();
        }}
      >
        {sheet === "info" && (
          <InfoSection
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveInfo}
            editModeRef={editModeRef}
            setIsEditing={setIsEditing}
          />
        )}

        {sheet === "password" && (
          <View>
            <Input label="Mật khẩu hiện tại" secure value={formData.password} onChange={(v: string) => setFormData({ ...formData, password: v })} />
            <Input label="Mật khẩu mới" secure value={formData.newPassword} onChange={(v: string) => setFormData({ ...formData, newPassword: v })} />
            <Input label="Xác nhận mật khẩu mới" secure value={formData.confirmPassword} onChange={(v: string) => setFormData({ ...formData, confirmPassword: v })} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
              <Text style={styles.saveText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
};

export default RestaurantAccount;

/* 🏪 InfoSection component (giống admin) */
const InfoSection = ({ formData, setFormData, onSave, editModeRef, setIsEditing }: any) => {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    editModeRef.current = setEditMode;
    setIsEditing(editMode);
  }, [editMode]);

  return (
    <View>
      {!editMode ? (
        <>
          <InfoRow label="Tên nhà hàng" value={formData.name} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow label="Số điện thoại" value={formData.phone} />
          <InfoRow label="Địa chỉ" value={formData.address} />

          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Input label="Tên nhà hàng" value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} />
          <Input label="Email" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
          <Input label="Số điện thoại" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} />
          <Input label="Địa chỉ" value={formData.address} onChange={(v: string) => setFormData({ ...formData, address: v })} multiline />

          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

/* 🔹 InfoRow + Input giống các màn khác */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
  </View>
);

const Input = ({ label, value, onChange, secure = false, multiline = false }: any) => (
  <View style={{ marginVertical: 8 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      secureTextEntry={secure}
      style={[styles.input, multiline && { height: 90, textAlignVertical: "top" }]}
      placeholder={`Nhập ${label.toLowerCase()}`}
      multiline={multiline}
    />
  </View>
);

const OptionItem = ({ icon, title, onPress }: any) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <View style={styles.optionLeft}>
      <Ionicons name={icon} size={22} color="#555" />
      <Text style={styles.optionText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

/* 🎨 Styles */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { backgroundColor: "#F58220", alignItems: "center", paddingVertical: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  avatar: { width: 90, height: 90, borderRadius: 50, backgroundColor: "#fff", marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  phone: { color: "#fff", opacity: 0.9, fontSize: 14 },
  menu: { marginTop: 20, backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 8, elevation: 1 },
  optionItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderColor: "#eee" },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { fontSize: 15, color: "#333" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F44336", borderRadius: 10, marginHorizontal: 16, marginTop: 30, paddingVertical: 14 },
  logoutText: { color: "#F44336", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 10 },
  infoLabel: { color: "#333", fontWeight: "600", fontSize: 14 },
  infoValue: { color: "#555", fontSize: 14, flexShrink: 1, textAlign: "right" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F58220", borderRadius: 8, marginTop: 20, paddingVertical: 10 },
  editText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
  inputLabel: { color: "#555", marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  saveBtn: { backgroundColor: "#F58220", borderRadius: 8, marginTop: 15, paddingVertical: 12 },
  saveText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 15 },
});
