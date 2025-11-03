import React, { createContext, useContext, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

type MessageType = "success" | "error" | "info";

interface MessageBoxData {
  visible: boolean;
  message: string;
  type: MessageType;
}

const MessageBoxContext = createContext<{
  show: (message?: string, type?: MessageType) => void;
  confirm: (message: string) => Promise<boolean>;
} | null>(null);

export const useMessageBox = () => {
  const ctx = useContext(MessageBoxContext);
  if (!ctx)
    throw new Error("useMessageBox must be used within MessageBoxProvider");
  return ctx;
};

export const MessageBoxProvider = ({ children }: any) => {
  const [box, setBox] = useState<MessageBoxData>({
    visible: false,
    message: "",
    type: "info",
  });

  const [confirmBox, setConfirmBox] = useState<{
    visible: boolean;
    message: string;
    resolver?: (value: boolean) => void;
  }>({
    visible: false,
    message: "",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* 🔹 SHOW MESSAGE BOX */
  const show = (message = "", type: MessageType = "info") => {
    setBox({ visible: true, message, type });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setBox({ ...box, visible: false }));
    }, 1000);
  };

  /* 🔹 CONFIRM BOX */
  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmBox({ visible: true, message, resolver: resolve });
    });
  };

  const handleConfirm = (result: boolean) => {
    if (confirmBox.resolver) confirmBox.resolver(result);
    setConfirmBox({ visible: false, message: "" });
  };

  const getColor = () => {
    switch (box.type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#E53935";
      default:
        return "#2196F3";
    }
  };

  const getIcon = () => {
    switch (box.type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      default:
        return "information-circle";
    }
  };

  return (
    <MessageBoxContext.Provider value={{ show, confirm }}>
      {children}

      {/* 🔹 MessageBox hiển thị thông báo ngắn */}
      {box.visible && (
        <>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.messageBox, { opacity: fadeAnim }]}>
            <Ionicons name={getIcon() as any} size={48} color={getColor()} />
            {box.message ? (
              <Text style={styles.message}>{box.message}</Text>
            ) : null}
          </Animated.View>
        </>
      )}

      {/* 🔸 ConfirmBox hỏi xác nhận */}
      {confirmBox.visible && (
        <>
          <View style={styles.overlay} />
          <View style={styles.confirmBox}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#F58220"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.confirmMessage}>{confirmBox.message}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => handleConfirm(false)}
              >
                <Text style={styles.cancelText}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.okBtn]}
                onPress={() => handleConfirm(true)}
              >
                <Text style={styles.okText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </MessageBoxContext.Provider>
  );
};

/* 🎨 Styles */
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width,
    height,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 9999,
  },
  messageBox: {
    position: "absolute",
    top: height / 2 - 100,
    left: width / 2 - 150,
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    zIndex: 10000,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    fontSize: 17,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
    textAlign: "center",
  },
  confirmBox: {
    position: "absolute",
    top: height / 2 - 100,
    left: width / 2 - 160,
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelBtn: { backgroundColor: "#eee" },
  okBtn: { backgroundColor: "#F58220" },
  cancelText: { color: "#333", fontWeight: "600", fontSize: 15 },
  okText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
