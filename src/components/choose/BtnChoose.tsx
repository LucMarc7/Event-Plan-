import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";

interface BtnChooseProps {
  title: string;
  onPress: () => void;
}

export default function BtnChoose({ title, onPress }: BtnChooseProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#000F30",
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(10),
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    color: "#FFFFFF",
    fontSize: hp(2),
    fontWeight: "600",
  },
});
