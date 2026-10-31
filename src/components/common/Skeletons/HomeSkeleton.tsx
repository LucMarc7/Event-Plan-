// src/components/common/Skeletons/HomeSkeleton.tsx
import { StyleSheet, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Skeleton from "../Skeleton";

const HomeSkeleton = () => (
  <View style={styles.container}>
    {/* Compteur */}
    <Skeleton
      width={120}
      height={16}
      borderRadius={6}
      style={{ marginVertical: hp(1.5) }}
    />

    {/* Cartes d'événement */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.card}>
        <Skeleton width="100%" height={hp(22)} borderRadius={0} />
        <View style={styles.cardContent}>
          <Skeleton width="70%" height={20} borderRadius={8} />
          <View style={styles.cardMeta}>
            <Skeleton width={100} height={14} borderRadius={6} />
            <Skeleton width={80} height={20} borderRadius={10} />
          </View>
          <View style={styles.cardFooter}>
            <Skeleton width={120} height={12} borderRadius={6} />
            <Skeleton width={80} height={12} borderRadius={6} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    backgroundColor: "#F8FAFC",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardContent: {
    padding: wp(4.5),
    gap: 12,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardFooter: {
    flexDirection: "row",
    gap: 14,
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
});

export default HomeSkeleton;
