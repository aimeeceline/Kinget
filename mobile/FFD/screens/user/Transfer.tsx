import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../data/FireBase";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMessageBox } from "../../context/MessageBoxContext";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";

const TransferScreen = () => {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const { orderData } = params;
  const { show } = useMessageBox();

  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scanning, setScanning] = useState(false);

  // 🔹 Chuỗi nội dung QR mô phỏng
  const qrValue = `Ngân hàng: VPBank
Số TK: 123456789
Chủ TK: Kinget FastFood
Nội dung: THANHTOAN_${orderData.userId}_${Math.floor(Math.random() * 10000)}
Số tiền: ${orderData.total.toLocaleString("vi-VN")}₫`;

  // 🔹 Mô phỏng quét mã QR và thanh toán thành công
  const handleScanQR = async () => {
    setScanning(true);
    // Giả lập thời gian quét QR (3 giây)
    await new Promise((res) => setTimeout(res, 3000));
    setScanning(false);
    setShowSuccessModal(true);
  };

  const handleConfirmTransfer = async () => {
    try {
      setProcessing(true);
      // Lưu đơn hàng vào Firestore
      await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "processing",
        createdAt: serverTimestamp(),
      });

      setShowSuccessModal(false);
      show("Thanh toán thành công! Đơn hàng đã được tạo.", "success");

      // Quay lại tab "Đơn hàng"
      navigation.navigate("MainTabs", { screen: "Đơn hàng" });
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận thanh toán:", error);
      show("Không thể hoàn tất thanh toán!", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thanh toán chuyển khoản</Text>

      {/* 🏦 Thông tin ngân hàng */}
      <View style={styles.bankBox}>
        <Text style={styles.bankLine}>Ngân hàng: VPBank</Text>
        <Text style={styles.bankLine}>Số tài khoản: 123 456 789</Text>
        <Text style={styles.bankLine}>Chủ TK: Kinget FastFood</Text>
      </View>

      <Text style={styles.amountText}>
        Số tiền: {orderData.total.toLocaleString("vi-VN")} ₫
      </Text>

      {/* 🔳 Mã QR giả lập */}
      <View style={styles.qrBox}>
        <QRCode value={qrValue} size={200} />
        <Text style={styles.qrHint}>
          Quét mã QR để thanh toán bằng ứng dụng ngân hàng
        </Text>
      </View>

      {/* 🔘 Nút hành động */}
      <TouchableOpacity
        disabled={scanning || processing}
        onPress={handleScanQR}
        style={[
          styles.scanBtn,
          (scanning || processing) && { opacity: 0.6 },
        ]}
      >
        <Text style={styles.scanText}>
          {scanning ? "Đang quét mã QR..." : "Quét mã QR"}
        </Text>
      </TouchableOpacity>

      {/* ❌ Hủy */}
      <TouchableOpacity
        disabled={processing}
        onPress={() => navigation.goBack()}
        style={[styles.cancelBtn, processing && { opacity: 0.5 }]}
      >
        <Text style={styles.cancelText}>Hủy giao dịch</Text>
      </TouchableOpacity>

      {/* 💳 Modal thông báo thành công */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={70} color="#4CAF50" />
            <Text style={styles.successText}>
              Bạn đã thanh toán thành công!
            </Text>
            <Text style={styles.thanksText}>
              Cảm ơn bạn đã lựa chọn{" "}
              <Text style={{ color: "#F58220", fontWeight: "bold" }}>
                Kinget 🍔
              </Text>
            </Text>

            <TouchableOpacity
              style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
              onPress={handleConfirmTransfer}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>OK</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TransferScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F58220",
    marginBottom: 15,
  },
  bankBox: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F58220",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFF7ED",
    width: "100%",
  },
  bankLine: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E53935",
    marginVertical: 20,
  },
  qrBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  qrHint: {
    color: "#777",
    fontSize: 13,
    marginTop: 8,
  },
  scanBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: "#E53935",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    padding: 24,
  },
  successText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  thanksText: {
    fontSize: 15,
    color: "#555",
    marginVertical: 8,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 10,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
