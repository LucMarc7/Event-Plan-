// src/components/Alerts/CustomAlert.js
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const CustomAlert = ({ visible, title, message, onCancel, onConfirm }) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackground}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={styles.buttonText}>Oui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertContainer: {
    width: wp("80%"),
    backgroundColor: "white",
    borderRadius: wp(2),
    padding: wp(5),
    alignItems: "center",
  },
  alertTitle: {
    fontSize: hp(2.5),
    fontWeight: "bold",
    marginBottom: hp(1),
  },
  alertMessage: {
    fontSize: hp(2),
    marginBottom: hp(2),
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: hp(1.5),
    margin: wp(1),
    borderRadius: wp(2),
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: hp(2),
  },
});

export default CustomAlert;
