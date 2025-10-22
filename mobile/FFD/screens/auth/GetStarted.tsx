import React, { useContext,useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { AuthContext } from "../../context/AuthContext";
type Props = NativeStackScreenProps<RootStackParamList, "GetStarted">;

const GetStartedScreen: React.FC<Props> = ({ navigation }) => {
  const { setGuestMode } = useContext(AuthContext);
 
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../images/Kinget.png")} 
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Nút Đăng nhập */}
      <TouchableOpacity style={[styles.button, styles.loginButton]}
                        onPress={() => navigation.navigate("Auth", { initialTab: "login" })}
      >
        <Text style={[styles.text, { color: "#F58220" }]}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Nút Đăng ký */}
      <TouchableOpacity style={[styles.button, styles.registerButton]}
                        onPress={() => navigation.navigate("Auth", { initialTab: "register" })}
       >
        <Text style={[styles.text, { color: "#fff" }]} >Đăng ký</Text>
      </TouchableOpacity>

      {/* Nút Bỏ qua */}
      <TouchableOpacity style={styles.skipButton}
                        onPress={() => {
                        setGuestMode(true);
                        navigation.replace("MainTabs"); // chuyển đến trang chính dành cho user
                        }}
 >
        <Text style={[styles.text, { color: "#fff" }]}>Bỏ qua</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F58220", 
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  logo: {
    width: "100%",
    height: 300,
    marginVertical: 100,
  },
  button: {
    width: 400,
    paddingVertical: 14,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  loginButton: {
    backgroundColor: "#fff" // nền trắng
  },
  registerButton: {
    borderWidth: 1,
    borderColor: "#fff" // nền cam, viền trắng
  },
  skipButton: {
    marginTop: 8
  },
  text: {
    fontSize: 16,
    fontWeight: "bold"
  }
});
