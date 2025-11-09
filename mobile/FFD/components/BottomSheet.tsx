import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import { useMessageBox } from "../context/MessageBoxContext"; // chỉnh đường dẫn nếu cần

const { height } = Dimensions.get("window");

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  heightPercent?: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  heightPercent = 0.75,
  showBackButton = false,
  onBackPress,
}) => {
  const { show } = useMessageBox(); // ✅ lấy hàm show()

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={["down"]}
      propagateSwipe
      style={[styles.modal, { zIndex: 10, elevation: 10 }]}       
      useNativeDriver={false}
    >
      <View style={[styles.sheet, { height: height * heightPercent }]}>
        {/* Thanh kéo */}
        <View style={styles.dragBar} />

        {/* Header */}
        <View style={styles.header}>
          {showBackButton ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBackPress}>
              <Ionicons name="arrow-back" size={22} color="#F58220" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22 }} />
          )}

          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Nội dung */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {children}
        </ScrollView>

        {/* ✅ Vùng riêng để MessageBox hiển thị TRONG modal */}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 9999,
            elevation: 9999,
          }}
        >
          {/* Khi bạn gọi show() -> MessageBox từ Context sẽ tự xuất hiện */}
        </View>
      </View>
    </Modal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
    // zIndex: 10,
    // elevation: 10 
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dragBar: {
    alignSelf: "center",
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  title: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#333",
    textAlign: "center",
  },
  backBtn: {
    padding: 4,
  },
});
