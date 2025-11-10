import React, { useState, useRef, useEffect } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import BottomSheet from "../../components/BottomSheet";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../data/FireBase";

const AccountScreen: React.FC = () => {
  const { user, setUser } = useAuth();
  const { show, confirm } = useMessageBox();

  const [sheet, setSheet] = useState<null | "profile" | "password">(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [originalData, setOriginalData] = useState(formData);
  const editModeRef = useRef<(val: boolean) => void>(() => {}); // ref theo dõi chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "Khách hàng";

  // ✅ Cập nhật thông tin cá nhân
  const handleSaveProfile = async () => {
    if (!user?.id) return show("Không xác định được người dùng!", "error");

    try {
      const ref = doc(db, "users", user.id);
      await updateDoc(ref, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setUser({ id: user.id, ...snapshot.data() } as any);
      }

      show("Cập nhật thông tin thành công!", "success");
      setOriginalData(formData);
      setSheet(null);
    } catch (error) {
      console.error(error);
      show("Không thể cập nhật thông tin!", "error");
    }
  };

  // ✅ Đổi mật khẩu
  const handleChangePassword = async () => {
    const { password, newPassword, confirmPassword } = formData;

    if (!user?.id) {
      show("Vui lòng đăng nhập trước khi đổi mật khẩu!", "info");
      return;
    }

    if (!password || !newPassword || !confirmPassword) {
      show("Vui lòng nhập đầy đủ thông tin!", "info");
      return;
    }

    if (newPassword.length < 6) {
      show("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      show("Mật khẩu xác nhận không khớp!", "error");
      return;
    }

    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { password: newPassword });
      show("Đổi mật khẩu thành công!", "success");

      setFormData({
        ...formData,
        password: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSheet(null);
    } catch (error) {
      console.error("❌ Lỗi khi đổi mật khẩu:", error);
      show("Đổi mật khẩu thất bại!", "error");
    }
  };

  // ✅ Đóng BottomSheet: reset dữ liệu về ban đầu
  const handleCloseSheet = () => {
    if (sheet === "profile") setFormData(originalData);
    setSheet(null);
  };

  // ✅ Đăng xuất
  const handleLogout = async () => {
    const ok = await confirm(`Xác nhận đăng xuất?`);
      if (!ok) return;
    setUser(null);
    show("Đã đăng xuất!", "info");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F58220" />
      <ScrollView style={styles.container}>
        {/* 👤 Header người dùng */}
        <View style={styles.header}>
          <Image
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require("../images/avatar.jpg")
            }
            style={styles.avatar}
          />
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.phone}>{user?.phone || "+84 000 000 000"}</Text>
        </View>

        {/* ⚙️ Menu */}
        <View style={styles.menu}>
          <OptionItem
            icon="person-outline"
            title="Thông tin tài khoản"
            onPress={() => {
              setOriginalData(formData);
              setSheet("profile");
            }}
          />
          <OptionItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            onPress={() => setSheet("password")}
          />
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
        title={
          sheet === "profile"
            ? "Thông tin tài khoản"
            : sheet === "password"
            ? "Đổi mật khẩu"
            : ""
        }
       onBackPress={() => {
        if (sheet === "profile" && isEditing) {
          // 🔹 Nếu đang chỉnh sửa → quay về xem thông tin, reset form
          setFormData(originalData);
          editModeRef.current(false);
          setIsEditing(false);
        } else {
          // 🔹 Nếu chỉ đang xem thông tin → đóng sheet (về trang Account)
          handleCloseSheet();
          setSheet(null);
        }
      }}
      >
        {sheet === "profile" && (
          <ProfileSection
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveProfile}
            editModeRef={editModeRef}
            setIsEditing={setIsEditing} 
          />
        )}

        {sheet === "password" && (
          <View>
            <Input
              label="Mật khẩu hiện tại"
              secure
              value={formData.password}
              onChange={(v: string) => setFormData({ ...formData, password: v })}
            />
            <Input
              label="Mật khẩu mới"
              secure
              value={formData.newPassword}
              onChange={(v: string) =>
                setFormData({ ...formData, newPassword: v })
              }
            />
            <Input
              label="Xác nhận mật khẩu mới"
              secure
              value={formData.confirmPassword}
              onChange={(v: string) =>
                setFormData({ ...formData, confirmPassword: v })
              }
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleChangePassword}
            >
              <Text style={styles.saveText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
};

export default AccountScreen;

/* 👤 Xem & chỉnh sửa thông tin người dùng */
const ProfileSection = ({
  formData,
  setFormData,
  onSave,
  editModeRef,
  setIsEditing,
}: any) => {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    editModeRef.current = setEditMode;
    setIsEditing(editMode); // báo ra ngoài
  }, [editMode]);

  return (
    <View>
      {!editMode ? (
        <>
          <InfoRow label="Họ" value={formData.firstName} />
          <InfoRow label="Tên" value={formData.lastName} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow label="Số điện thoại" value={formData.phone} />

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Input
            label="Họ"
            value={formData.firstName}
            onChange={(v: string) =>
              setFormData({ ...formData, firstName: v })
            }
          />
          <Input
            label="Tên"
            value={formData.lastName}
            onChange={(v: string) => setFormData({ ...formData, lastName: v })}
          />
          <Input
            label="Email"
            value={formData.email}
            onChange={(v: string) => setFormData({ ...formData, email: v })}
          />
          <Input
            label="Số điện thoại"
            value={formData.phone}
            onChange={(v: string) => setFormData({ ...formData, phone: v })}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

/* 🧾 Một dòng thông tin */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
  </View>
);

/* 🧩 Input nhỏ gọn */
const Input = ({
  label,
  value,
  onChange,
  secure = false,
  multiline = false,
}: any) => (
  <View style={{ marginVertical: 8 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      secureTextEntry={secure}
      style={[
        styles.input,
        multiline && { height: 90, textAlignVertical: "top" },
      ]}
      multiline={multiline}
      placeholder={`Nhập ${label.toLowerCase()}`}
    />
  </View>
);

/* ⚙️ Menu item */
const OptionItem = ({
  icon,
  title,
  onPress,
}: {
  icon: any;
  title: string;
  onPress: () => void;
}) => (
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
  header: {
    backgroundColor: "#F58220",
    alignItems: "center",
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  phone: { color: "#fff", opacity: 0.9, fontSize: 14 },
  menu: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { fontSize: 15, color: "#333" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F44336",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  logoutText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },
  infoLabel: { color: "#333", fontWeight: "600", fontSize: 14 },
  infoValue: { color: "#555", fontSize: 14, flexShrink: 1, textAlign: "right" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F58220",
    borderRadius: 8,
    marginTop: 20,
    paddingVertical: 10,
  },
  editText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
  inputLabel: { color: "#555", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#F58220",
    borderRadius: 8,
    marginTop: 15,
    paddingVertical: 12,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
});
