import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";

import { useAuth } from "../../context/AuthContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import { db } from "../../data/FireBase";
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc  } from "firebase/firestore";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

const AuthTabs: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, setUser } = useAuth();
  const { show } = useMessageBox();
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");  
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  useEffect(() => {
    if (route.params?.initialTab === "register") {
      setActiveTab("register");
    }
  }, [route.params?.initialTab]);

  // ================== 🔐 XỬ LÝ ĐĂNG KÍ ==================
  const handleRegister = async () => {
  const { phone, firstName, lastName, email, password, confirmPassword } = registerData;

  if (!phone || !firstName || !lastName || !email || !password || !confirmPassword) {
    show("Vui lòng nhập đầy đủ thông tin!", "info");
    return;
  }

  if (password !== confirmPassword) {
    show("Mật khẩu không trùng khớp!", "error");
    return;
  }

  try {
    // Kiểm tra trùng số điện thoại
    const q = query(collection(db, "users"), where("phone", "==", phone));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      show("Số điện thoại đã được đăng ký!", "error");
      return;
    }

    // ✅ Tạo user mới trong Firestore
    const newUserRef = await addDoc(collection(db, "users"), {
      phone,
      firstName,
      lastName,
      email,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    });

    show("Đăng ký thành công! Hãy đăng nhập.", "success");
    setActiveTab("login");
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    show("Đăng ký không thành công!", "error");
  }
};

// ================== ĐĂNG NHẬP ==================
const handleLogin = async () => {
  if (!loginPhone || !loginPassword) {
    show("Vui lòng nhập đầy đủ số điện thoại và mật khẩu!", "info");
    return;
  }

  try {
    const q = query(
      collection(db, "users"),
      where("phone", "==", loginPhone),
      where("password", "==", loginPassword)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const userData = { id: docSnap.id, ...(docSnap.data() as any) };

      // ✅ Lưu user vào Context
      setUser(userData);

      // ❌ Không cần navigate, AppNavigator sẽ tự vào đúng trang
      show(`Đăng nhập thành công (${userData.role})!`, "success");
    } else {
      show("Số điện thoại hoặc mật khẩu không đúng!", "error");
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    show("Không thể đăng nhập!", "error");
  }
};
  // ================== GIAO DIỆN ==================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "login" && styles.tabActive]}
          onPress={() => setActiveTab("login")}
        >
          <Text style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}>
            Đăng nhập
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "register" && styles.tabActive]}
          onPress={() => setActiveTab("register")}
        >
          <Text style={[styles.tabText, activeTab === "register" && styles.tabTextActive]}>
            Đăng ký
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========== ĐĂNG NHẬP ========== */}
      {activeTab === "login" && (
        <View style={styles.form}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            value={loginPhone}
            onChangeText={setLoginPhone}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========== ĐĂNG KÝ ========== */}
      {activeTab === "register" && (
        <View style={styles.form}>
          <Text style={styles.label}>Tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên của bạn"
            value={registerData.firstName}
            onChangeText={(text) => setRegisterData({ ...registerData, firstName: text })}
          />

          <Text style={styles.label}>Họ</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ của bạn"
            value={registerData.lastName}
            onChangeText={(text) => setRegisterData({ ...registerData, lastName: text })}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={registerData.phone}
            onChangeText={(text) => setRegisterData({ ...registerData, phone: text })}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            keyboardType="email-address"
            value={registerData.email}
            onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={registerData.password}
            onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
          />

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            value={registerData.confirmPassword}
            onChangeText={(text) =>
              setRegisterData({ ...registerData, confirmPassword: text })
            }
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AuthTabs;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabContainer: { flexDirection: "row", marginTop: 10 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
  },
  tabActive: { borderBottomColor: "#F58220" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#555" },
  tabTextActive: { color: "#F58220", fontWeight: "bold" },
  form: { padding: 20 },
  label: { color: "#F58220", fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#F58220",
    marginTop: 20,
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
