// src/components/common/Skeletons/DetailSkeleton.tsx
import { StyleSheet, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Skeleton from "../Skeleton";

const DetailSkeleton = () => (
  <View style={styles.container}>
    {/* Hero */}
    <Skeleton width="100%" height={hp(48)} borderRadius={0} />

    {/* Info strip */}
    <View style={styles.infoRow}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width="31%" height={70} borderRadius={16} />
      ))}
    </View>

    {/* Sections */}
    {[1, 2].map((i) => (
      <View key={i} style={styles.section}>
        <Skeleton width={120} height={16} borderRadius={6} />
        <Skeleton
          width="90%"
          height={14}
          borderRadius={6}
          style={{ marginTop: 10 }}
        />
        <Skeleton
          width="70%"
          height={14}
          borderRadius={6}
          style={{ marginTop: 6 }}
        />
      </View>
    ))}

    {/* Code card */}
    <View style={styles.codeCard}>
      <Skeleton width={140} height={16} borderRadius={6} />
      <Skeleton
        width={180}
        height={32}
        borderRadius={8}
        style={{ marginTop: 10 }}
      />
      <Skeleton
        width={140}
        height={12}
        borderRadius={6}
        style={{ marginTop: 10 }}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingTop: hp(2.5),
    gap: wp(2),
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: hp(2.2),
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
  },
  codeCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: hp(2.2),
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
    alignItems: "center",
  },
});

export default DetailSkeleton;
