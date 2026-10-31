// src/components/common/Skeletons/GuestListSkeleton.tsx
import { StyleSheet, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Skeleton from "../Skeleton";

const GuestListSkeleton = () => (
  <View style={styles.container}>
    {/* Header card */}
    <View style={styles.headerCard}>
      <Skeleton width={100} height={14} borderRadius={6} />
      <Skeleton
        width={200}
        height={24}
        borderRadius={8}
        style={{ marginTop: 8 }}
      />
    </View>

    {/* Search */}
    <View style={styles.searchRow}>
      <Skeleton width="78%" height={52} borderRadius={14} />
      <Skeleton width={52} height={52} borderRadius={14} />
    </View>

    {/* Compteur */}
    <Skeleton
      width={100}
      height={16}
      borderRadius={6}
      style={{ marginTop: hp(1), marginHorizontal: wp(4) }}
    />

    {/* Cartes invités */}
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={styles.guestCard}>
        <Skeleton width={hp(5.5)} height={hp(5.5)} variant="circle" />
        <View style={styles.guestContent}>
          <Skeleton width="60%" height={16} borderRadius={6} />
          <View style={styles.guestMeta}>
            <Skeleton width={80} height={12} borderRadius={6} />
            <Skeleton width={60} height={12} borderRadius={6} />
          </View>
        </View>
        <Skeleton width={24} height={24} variant="circle" />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: hp(5),
  },
  headerCard: {
    backgroundColor: "#FFF",
    marginHorizontal: wp(4),
    borderRadius: 24,
    padding: wp(5),
    marginBottom: hp(1.5),
  },
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    gap: wp(2.5),
  },
  guestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: hp(1.8),
    marginHorizontal: wp(4),
    marginTop: hp(1.2),
    gap: wp(3),
  },
  guestContent: {
    flex: 1,
    gap: 8,
  },
  guestMeta: {
    flexDirection: "row",
    gap: 12,
  },
});

export default GuestListSkeleton;
