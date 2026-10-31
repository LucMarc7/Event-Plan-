// src/components/common/Skeletons/ProfileSkeleton.tsx
import { StyleSheet, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Skeleton from "../Skeleton";

const ProfileSkeleton = () => (
  <View style={styles.container}>
    {/* Avatar */}
    <View style={styles.avatarSection}>
      <Skeleton width={hp(12)} height={hp(12)} variant="circle" />
      <Skeleton
        width={150}
        height={22}
        borderRadius={8}
        style={{ marginTop: hp(2) }}
      />
      <Skeleton
        width={200}
        height={16}
        borderRadius={6}
        style={{ marginTop: 8 }}
      />
      <Skeleton
        width={140}
        height={40}
        borderRadius={20}
        style={{ marginTop: hp(2) }}
      />
    </View>

    {/* Sections */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.section}>
        <Skeleton
          width={80}
          height={14}
          borderRadius={6}
          style={{ marginBottom: hp(1) }}
        />
        <View style={styles.sectionContent}>
          {[1, 2, 3].map((j) => (
            <View key={j} style={styles.row}>
              <Skeleton width={22} height={22} variant="circle" />
              <Skeleton width="50%" height={16} borderRadius={6} />
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: hp(3),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: hp(1),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(3),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
});

export default ProfileSkeleton;
