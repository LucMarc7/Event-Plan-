// app/onboarding.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../src/theme/tokens";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: 1,
    title: "Bienvenue sur Event Plan",
    subtitle:
      "Créez votre premier événement et générez vos invitations en quelques secondes.",
    image: require("../assets/images/certifications.png"),
    icon: "calendar" as const,
    color: colors.primary,
    colorSoft: colors.primarySoft,
  },
  {
    id: 2,
    title: "Partagez vos invitations",
    subtitle: "Envoyez vos billets et invitations à vos invités en un clic.",
    image: require("../assets/images/qr2.png"),
    icon: "share-2" as const,
    color: colors.secondary,
    colorSoft: colors.secondarySoft,
  },
  {
    id: 3,
    title: "Contrôle d'accès",
    subtitle: "Assignez des contrôleurs pour scanner et valider les entrées.",
    image: require("../assets/images/qr3.png"),
    icon: "shield" as const,
    color: colors.success,
    colorSoft: colors.successSoft,
  },
];

export default function OnBoarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIndex(nextIndex);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      animateTransition(index + 1);
    } else {
      router.replace("/choose");
    }
  };

  const handleSkip = () => router.replace("/choose");

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Skip */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Illustration */}
        <Animated.View
          style={[
            styles.illustrationBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.illustrationCircle,
              { backgroundColor: slide.colorSoft },
            ]}
          >
            <Image
              source={slide.image}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Texte */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[styles.iconBadge, { backgroundColor: slide.colorSoft }]}
          >
            <Feather name={slide.icon} size={20} color={slide.color} />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        {/* Pagination */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => i !== index && animateTransition(i)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dot,
                  i === index && [
                    styles.dotActive,
                    { backgroundColor: slide.color },
                  ],
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton Continuer / Commencer */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: slide.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLast ? "Commencer" : "Continuer"}
          </Text>
          <Feather
            name={isLast ? "check" : "arrow-right"}
            size={18}
            color={colors.textInverse}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  illustrationBlock: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  illustrationCircle: {
    width: width * 0.68,
    height: width * 0.68,
    borderRadius: (width * 0.68) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width * 0.5,
    height: width * 0.5,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: fontSize.base * 1.5,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    shadowColor: colors.text,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
});
