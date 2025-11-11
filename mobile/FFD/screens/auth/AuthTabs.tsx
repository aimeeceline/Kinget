import React, { useState, useEffect } from "react";
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
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

const AuthTabs: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { show } = useMessageBox();
  const { login, user } = useAuth();


  const [loginIdentifier, setLoginIdentifier] = useState(""); // phone or email
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

  // ================== 🧾 XỬ LÝ ĐĂNG KÝ ==================
  const handleRegister = async () => {
    const { phone, firstName, lastName, email, password, confirmPassword } =
      registerData;

    if (!phone || !firstName || !lastName || !email || !password || !confirmPassword) {
      show("Vui lòng nhập đầy đủ thông tin!", "info");
      return;
    }

    if (password !== confirmPassword) {
      show("Mật khẩu không trùng khớp!", "error");
      return;
    }

    try {
      // 🔹 Kiểm tra trùng số điện thoại hoặc email
      const q1 = query(collection(db, "users"), where("phone", "==", phone));
      const q2 = query(collection(db, "users"), where("email", "==", email));
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      if (!snap1.empty || !snap2.empty) {
        show("Số điện thoại hoặc email đã được đăng ký!", "error");
        return;
      }

      // ✅ Tạo user mới trong Firestore
      await addDoc(collection(db, "users"), {
        phone,
        firstName,
        lastName,
        email,
        password,
        role: "user",
        isActive: true,
        status: "approved",
        createdAt: new Date(),
      });

      show("🎉 Đăng ký thành công! Vui lòng đăng nhập.", "success");
      setTimeout(() => setActiveTab("login"), 800);
    } catch (error) {
      console.error("🔥 Lỗi đăng ký:", error);
      show("Đăng ký không thành công!", "error");
    }
  };

  // ================== 🔐 XỬ LÝ ĐĂNG NHẬP ==================
  const handleLogin = async () => {
  if (!loginIdentifier || !loginPassword) {
    show("Vui lòng nhập đầy đủ thông tin!", "info");
    return;
  }

  try {
    const result = await login(loginIdentifier, loginPassword);

    if (!result || !result.ok) {
      show(result?.msg || "Sai thông tin đăng nhập!", "error");
      return;
    }

    show("Đăng nhập thành công!", "success");

    setTimeout(() => {
      if (user?.role === "restaurant") {
        navigation.replace("RestaurantTabs");
      } else if (user?.role === "admin") {
        navigation.replace("AdminTabs");
      } else {
        navigation.replace("MainTabs");
      }
    }, 600);
  } catch (error) {
    console.error("🔥 Lỗi đăng nhập:", error);
    show("Không thể đăng nhập. Vui lòng thử lại!", "error");
  }
};

  // ================== GIAO DIỆN ==================
  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "login" && styles.tabActive]}
          onPress={() => setActiveTab("login")}
        >
          <Text
            style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}
          >
            Đăng nhập
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "register" && styles.tabActive]}
          onPress={() => setActiveTab("register")}
        >
          <Text
            style={[styles.tabText, activeTab === "register" && styles.tabTextActive]}
          >
            Đăng ký
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========== ĐĂNG NHẬP ========== */}
      {activeTab === "login" && (
        <View style={styles.form}>
          <Text style={styles.label}>Số điện thoại hoặc Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại hoặc email"
            value={loginIdentifier}
            onChangeText={setLoginIdentifier}
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
          <Text style={styles.label}>Họ</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập họ của bạn"
            value={registerData.lastName}
            onChangeText={(t) => setRegisterData({ ...registerData, lastName: t })}
          />

          <Text style={styles.label}>Tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên của bạn"
            value={registerData.firstName}
            onChangeText={(t) => setRegisterData({ ...registerData, firstName: t })}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={registerData.phone}
            onChangeText={(t) => setRegisterData({ ...registerData, phone: t })}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            keyboardType="email-address"
            value={registerData.email}
            onChangeText={(t) => setRegisterData({ ...registerData, email: t })}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={registerData.password}
            onChangeText={(t) => setRegisterData({ ...registerData, password: t })}
          />

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
            value={registerData.confirmPassword}
            onChangeText={(t) =>
              setRegisterData({ ...registerData, confirmPassword: t })
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
