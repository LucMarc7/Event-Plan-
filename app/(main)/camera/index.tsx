// app/(main)/camera/index.tsx
import Feather from "@expo/vector-icons/Feather";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { controllerValidate } from "../../../src/api/controles";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../src/theme/tokens";

type ValidationResult =
  | { kind: "valid"; data: any }
  | { kind: "already"; data: any }
  | { kind: "wrong_event"; data: any }
  | { kind: "fake"; data: any }
  | { kind: "error"; message: string };

export default function CameraControl() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [torch, setTorch] = useState(false);
  const isProcessing = useRef(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const [viewfinderH, setViewfinderH] = useState(280);
  const viewfinderRef = useRef<View>(null);
  const [vfFrame, setVfFrame] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  /* -------------------- Animations d'entrée -------------------- */
  useEffect(() => {
    const scan = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );
    scan.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => {
      scan.stop();
      pulse.stop();
    };
  }, []);

  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
    }
  }, [result]);

  /* -------------------- Scan (logique inchangée) -------------------- */
  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setScanned(true);

      try {
        let qrPayload: string | Record<string, any> = data;
        try {
          if (typeof data === "string" && data.trim().startsWith("{")) {
            qrPayload = JSON.parse(data);
          }
        } catch {
          /* noop */
        }

        const response = await controllerValidate({ qr_data: qrPayload });

        if (response.status === "validated") {
          setResult({ kind: "valid", data: response });
          Vibration.vibrate(50);
        } else if (response.status === "already_validated") {
          setResult({ kind: "already", data: response });
          Vibration.vibrate([100, 100, 100]);
        } else {
          setResult({ kind: "valid", data: response });
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const body = err?.response?.data || {};

        if (status === 403 && body.status === "wrong_event") {
          setResult({ kind: "wrong_event", data: body });
        } else if (status === 400 && body.status === "fake") {
          setResult({ kind: "fake", data: body });
        } else {
          setResult({
            kind: "error",
            message: body.error || body.detail || "Erreur de validation",
          });
        }
        Vibration.vibrate([150, 100]);
      } finally {
        isProcessing.current = false;
      }
    },
    [],
  );

  const closeModal = useCallback(() => {
    setResult(null);
    setScanned(false);
  }, []);

  const measureViewfinder = useCallback(() => {
    requestAnimationFrame(() => {
      viewfinderRef.current?.measureInWindow((x, y, w, h) => {
        setVfFrame({ x, y, w, h });
        if (h > 0) setViewfinderH(h);
      });
    });
  }, []);

  /* -------------------- Permission -------------------- */
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.permissionBgCircle1} pointerEvents="none" />
        <View style={styles.permissionBgCircle2} pointerEvents="none" />

        <View style={styles.permissionIconWrap}>
          <View style={styles.permissionIconRing} />
          <View style={styles.permissionIcon}>
            <Feather name="camera-off" size={38} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.permissionTitle}>Accès à la caméra</Text>
        <Text style={styles.permissionText}>
          Event Plan a besoin d’accéder à votre caméra pour scanner les QR codes
          d’invitation.
        </Text>

        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
          activeOpacity={0.85}
        >
          <Feather name="camera" size={18} color="#FFF" />
          <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* -------------------- Modale de résultat -------------------- */
  const renderResultModal = () => {
    if (!result) return null;

    const CONFIG: Record<
      ValidationResult["kind"],
      {
        icon: any;
        color: string;
        bg: string;
        title: string;
        message: string;
        details?: { label: string; value: string }[];
      }
    > = {
      valid: {
        icon: "check",
        color: colors.success,
        bg: colors.successSoft,
        title: "Accès autorisé",
        message: "Invitation valide, laissez passer.",
        details:
          result.kind === "valid"
            ? [
                {
                  label: "Invité",
                  value:
                    result.data.guest_name || result.data.buyer_name || "—",
                },
                ...(result.data.second_person
                  ? [
                      {
                        label: "Accompagnant",
                        value: result.data.second_person,
                      },
                    ]
                  : []),
                ...(result.data.place
                  ? [{ label: "Table", value: String(result.data.place) }]
                  : []),
              ]
            : [],
      },
      already: {
        icon: "clock",
        color: colors.warning,
        bg: colors.warningSoft,
        title: "Déjà scanné",
        message:
          result.kind === "already"
            ? result.data.message || "Cette invitation a déjà été validée."
            : "",
        details:
          result.kind === "already"
            ? [
                ...(result.data.guest_name
                  ? [{ label: "Invité", value: result.data.guest_name }]
                  : []),
                ...(result.data.validated_at
                  ? [
                      {
                        label: "Scanné le",
                        value: new Date(
                          result.data.validated_at,
                        ).toLocaleString("fr-FR"),
                      },
                    ]
                  : []),
              ]
            : [],
      },
      wrong_event: {
        icon: "alert-triangle",
        color: colors.error,
        bg: colors.errorSoft,
        title: "Mauvais événement",
        message:
          result.kind === "wrong_event"
            ? `Ce QR appartient à : ${
                result.data.other_event_name || "un autre événement"
              }`
            : "",
      },
      fake: {
        icon: "x-circle",
        color: colors.error,
        bg: colors.errorSoft,
        title: "QR invalide",
        message:
          result.kind === "fake"
            ? result.data.error || "Ce QR n'a pas été émis par Event Plan."
            : "",
      },
      error: {
        icon: "alert-circle",
        color: colors.error,
        bg: colors.errorSoft,
        title: "Erreur",
        message: result.kind === "error" ? result.message : "",
      },
    };

    const c = CONFIG[result.kind];

    return (
      <Modal
        visible
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <Animated.View
            style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}
          >
            <View
              style={[styles.modalAccentBar, { backgroundColor: c.color }]}
            />

            <View style={[styles.modalIconCircle, { backgroundColor: c.bg }]}>
              <Feather name={c.icon} size={36} color={c.color} />
            </View>

            <Text style={[styles.modalTitle, { color: c.color }]}>
              {c.title}
            </Text>

            <Text style={styles.modalMessage}>{c.message}</Text>

            {c.details && c.details.length > 0 ? (
              <View style={styles.detailsCard}>
                {c.details.map((d, i) => (
                  <View
                    key={i}
                    style={[
                      styles.detailRow,
                      i === c.details!.length - 1 && styles.detailRowLast,
                    ]}
                  >
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {d.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: c.color }]}
              onPress={closeModal}
              activeOpacity={0.85}
            >
              <Feather name="maximize" size={16} color="#FFF" />
              <Text style={styles.modalBtnText}>Scanner à nouveau</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => {
                closeModal();
                router.back();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnSecondaryText}>Fermer</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  /* -------------------- Vue caméra -------------------- */
  const cornerPulse = {
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.65, 1],
    }),
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        enableTorch={torch}
      />

      {/* Overlay assombri autour du cadre (cutout) */}
      {vfFrame ? (
        <View style={styles.dimLayer} pointerEvents="none">
          <View
            style={[
              styles.dim,
              { top: 0, left: 0, right: 0, height: vfFrame.y },
            ]}
          />
          <View
            style={[
              styles.dim,
              { top: vfFrame.y + vfFrame.h, left: 0, right: 0, bottom: 0 },
            ]}
          />
          <View
            style={[
              styles.dim,
              { top: vfFrame.y, left: 0, width: vfFrame.x, height: vfFrame.h },
            ]}
          />
          <View
            style={[
              styles.dim,
              {
                top: vfFrame.y,
                left: vfFrame.x + vfFrame.w,
                right: 0,
                height: vfFrame.h,
              },
            ]}
          />
        </View>
      ) : null}

      <View style={styles.overlay} pointerEvents="box-none">
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="x" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Scanner un QR code</Text>
            <Text style={styles.headerSubtitle}>Contrôle des invitations</Text>
          </View>

          <TouchableOpacity
            style={[styles.headerBtn, torch && styles.headerBtnActive]}
            onPress={() => setTorch((t) => !t)}
            activeOpacity={0.7}
          >
            <Feather
              name={torch ? "zap" : "zap-off"}
              size={18}
              color={torch ? colors.warning : "#FFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Cadre de visée */}
        <View style={styles.viewfinderWrap}>
          <View
            ref={viewfinderRef}
            style={styles.viewfinder}
            onLayout={measureViewfinder}
          >
            <Animated.View
              style={[styles.corner, styles.topLeft, cornerPulse]}
            />
            <Animated.View
              style={[styles.corner, styles.topRight, cornerPulse]}
            />
            <Animated.View
              style={[styles.corner, styles.bottomLeft, cornerPulse]}
            />
            <Animated.View
              style={[styles.corner, styles.bottomRight, cornerPulse]}
            />

            {!scanned ? (
              <Animated.View
                style={[
                  styles.scanContainer,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.max(viewfinderH - 4, 0)],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.scanGlow} />
                <View style={styles.scanLine} />
              </Animated.View>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <View style={styles.hintPill}>
            <Feather name="maximize" size={14} color="#FFF" />
            <Text style={styles.hintText}>
              Alignez le QR code dans le cadre
            </Text>
          </View>
        </View>
      </View>

      {renderResultModal()}
    </View>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

  /* Assombrissement autour du cadre */
  dimLayer: { ...StyleSheet.absoluteFillObject },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.62)" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  headerBtnActive: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "#FFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  /* Cadre */
  viewfinderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  viewfinder: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 46,
    height: 46,
    borderColor: colors.success,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: radius.lg,
  },
  topRight: {
    top: -2,
    right: -2,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: radius.lg,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: radius.lg,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: radius.lg,
  },

  /* Ligne de scan (halo symétrique) */
  scanContainer: {
    position: "absolute",
    left: 14,
    right: 14,
    alignItems: "stretch",
  },
  scanGlow: {
    height: 8,
    marginBottom: -4,
    marginTop: -4,
    backgroundColor: colors.success,
    opacity: 0.28,
    borderRadius: 4,
  },
  scanLine: {
    height: 2,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 2,
  },

  /* Footer */
  footer: { alignItems: "center", paddingHorizontal: spacing.lg },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  hintText: {
    color: "#FFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  /* Modale */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    position: "relative",
    ...shadows.lg,
  },
  modalAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  modalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  modalMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.bold,
    maxWidth: "60%",
    textAlign: "right",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  modalBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  modalBtnSecondary: {
    width: "100%",
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  modalBtnSecondaryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },

  /* Écran permission */
  permissionScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  permissionBgCircle1: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primarySoft,
    opacity: 0.5,
  },
  permissionBgCircle2: {
    position: "absolute",
    bottom: -160,
    left: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primarySoft,
    opacity: 0.35,
  },
  permissionIconWrap: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  permissionIconRing: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
    borderColor: colors.primary,
    opacity: 0.25,
  },
  permissionIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  permissionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  permissionBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
