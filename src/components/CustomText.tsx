import { Text as RNText, StyleSheet, TextProps } from "react-native";

export default function Text(props: TextProps) {
  return (
    <RNText {...props} style={[styles.defaultText, props.style]}>
      {props.children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: "Poppins_400Regular", // Ini akan jadi font bawaan untuk semua teks
  },
});
