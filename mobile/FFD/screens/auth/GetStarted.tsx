import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "GetStarted">;

const GetStartedScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView
      style={styles.container}              // nền cam, full màn
      contentContainerStyle={styles.scrollContent} // canh giữa & padding
      bounces={false}
    >
      {/* Logo */}
      <Image
        source={require("../images/Kinget.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Nút Đăng nhập */}
      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={() => navigation.navigate("Auth", { initialTab: "login" })}
      >
        <Text style={[styles.text, { color: "#F58220" }]}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Nút Đăng ký */}
      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={() =>
          navigation.navigate("Auth", { initialTab: "register" })
        }
      >
        <Text style={[styles.text, { color: "#fff" }]}>Đăng ký</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F58220",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: "100%",
    height: 300,
    marginVertical: 100,
  },
  button: {
    width: "100%",
    maxWidth: 400,
    paddingVertical: 14,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: {
    backgroundColor: "#fff",
  },
  registerButton: {
    borderWidth: 1,
    borderColor: "#fff",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
