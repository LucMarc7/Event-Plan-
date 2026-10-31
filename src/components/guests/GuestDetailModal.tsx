// src/components/guests/GuestDetailModal.tsx
// Modal détail invité — utilise le QR du backend (qr_code_url)

import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deleteInvitation, readInvitation } from "../../api/invitations";
import { useAppAlert } from "../../hooks/useAppAlert";
import { useDataStore } from "../../stores/data.store";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../theme/tokens";
import { Dialog, Modal } from "../ui";

dayjs.locale("fr");

const DEFAULT_THEME = {
  canvas: { width: 800, height: 600 },
  background: { type: "color", value: "#ffffff" },
  blocks: [],
  pages: [{ background: { type: "color", value: "#ffffff" } }],
};

const hasAppliedTheme = async (
  eventId: string | null | undefined,
): Promise<boolean> => {
  if (!eventId) return false;
  try {
    const currentThemeId = await AsyncStorage.getItem(
      `current_theme_${eventId}`,
    );
    if (!currentThemeId) return false;
    const themesData = await AsyncStorage.getItem(`themes_${eventId}`);
    if (!themesData) return false;
    const themes = JSON.parse(themesData);
    if (!Array.isArray(themes)) return false;
    return themes.some((t: any) => t.id === currentThemeId);
  } catch {
    return false;
  }
};

interface Props {
  visible: boolean;
  guestId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function GuestDetailModal({
  visible,
  guestId,
  onClose,
  onDeleted,
}: Props) {
  const router = useRouter();
  const eventDetail = useDataStore((state) => state.detailEvent);

  const { showAlert, AlertHost } = useAppAlert();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateFormatted = eventDetail?.date
    ? dayjs(eventDetail.date).format("DD/MM/YY")
    : "";

  useEffect(() => {
    if (!visible || !guestId) {
      setData(null);
      setError(null);
      return;
    }
    const fetchInvitation = async () => {
      setLoading(true);
      setError(null);
      try {
        const invitation = await readInvitation(guestId);
        setData(invitation);
      } catch (err: any) {
        console.error("Erreur lecture invitation:", err);
        setError("Impossible de charger cet invité.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [visible, guestId]);

  // ═══════════════════════════════════════════════════════════════
  // HELPERS PDF
  // ═══════════════════════════════════════════════════════════════
  const fileToBase64 = async (uri: string): Promise<string> => {
    if (!uri || !uri.startsWith("file://")) return uri;
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.split(".").pop()?.toLowerCase();
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${base64}`;
    } catch (e) {
      console.warn("Conversion base64 impossible :", e);
      return uri;
    }
  };

  const fetchQRBase64 = async (qrUrl: string | null): Promise<string> => {
    if (!qrUrl) return "";
    try {
      const raw = String(qrUrl).trim();

      if (raw.startsWith("data:")) {
        return raw;
      }

      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        const extMatch = raw.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        const localPath =
          (FileSystem.cacheDirectory || "") + `qr_${data?.id}.${ext}`;
        await FileSystem.downloadAsync(raw, localPath);
        const base64 = await FileSystem.readAsStringAsync(localPath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        return `data:${mime};base64,${base64}`;
      }

      if (raw.startsWith("/")) {
        const absoluteUrl = "https://klmarc.pythonanywhere.com" + raw;
        const extMatch = raw.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        const localPath =
          (FileSystem.cacheDirectory || "") + `qr_${data?.id}.${ext}`;
        await FileSystem.downloadAsync(absoluteUrl, localPath);
        const base64 = await FileSystem.readAsStringAsync(localPath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        return `data:${mime};base64,${base64}`;
      }

      if (raw.startsWith("file://")) {
        return await fileToBase64(raw);
      }

      if (raw.length > 100) {
        return `data:image/png;base64,${raw}`;
      }

      const absoluteUrl = "https://klmarc.pythonanywhere.com/" + raw;
      const localPath =
        (FileSystem.cacheDirectory || "") + `qr_${data?.id}.png`;
      await FileSystem.downloadAsync(absoluteUrl, localPath);
      const base64 = await FileSystem.readAsStringAsync(localPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/png;base64,${base64}`;
    } catch (e) {
      console.warn("Échec téléchargement QR:", e);
      return "";
    }
  };

  const replaceVariables = (
    template: string,
    variables: Record<string, string>,
  ): string => {
    if (!template) return "";
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.split(key).join(value || "");
    }
    return result;
  };

  const getAppliedTheme = async () => {
    try {
      const eventId = eventDetail?.id;
      if (!eventId) return DEFAULT_THEME;

      const currentThemeId = await AsyncStorage.getItem(
        `current_theme_${eventId}`,
      );
      if (!currentThemeId) return DEFAULT_THEME;

      const themesData = await AsyncStorage.getItem(`themes_${eventId}`);
      if (!themesData) return DEFAULT_THEME;

      const themes = JSON.parse(themesData);
      const savedTheme = themes.find((t: any) => t.id === currentThemeId);
      if (!savedTheme) return DEFAULT_THEME;

      let pages = savedTheme.pages || DEFAULT_THEME.pages;
      const canvasW = savedTheme.canvas?.width || DEFAULT_THEME.canvas.width;
      const canvasH = savedTheme.canvas?.height || DEFAULT_THEME.canvas.height;

      pages = await Promise.all(
        pages.map(async (page: any) => {
          let bg = page.background;
          if (bg?.type === "image" && bg.value?.startsWith("file://")) {
            bg = { ...bg, value: await fileToBase64(bg.value) };
          }
          return { ...page, background: bg };
        }),
      );

      let blocks = savedTheme.blocks;
      if (!blocks || !Array.isArray(blocks)) blocks = [];

      blocks = await Promise.all(
        blocks.map(async (b: any) => {
          if (b.type === "image" && b.src?.startsWith("file://")) {
            return { ...b, src: await fileToBase64(b.src) };
          }
          return b;
        }),
      );

      return {
        ...DEFAULT_THEME,
        ...savedTheme,
        canvas: { width: canvasW, height: canvasH },
        pages,
        blocks,
      };
    } catch (err) {
      console.error("Erreur chargement thème:", err);
      return DEFAULT_THEME;
    }
  };

  // ─── Génération PDF ───
  const handleGeneratePDF = async () => {
    if (!data) {
      showAlert({
        title: "Données manquantes",
        message:
          "Impossible de générer le PDF : les informations de l'invité ne sont pas chargées.",
        variant: "danger",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    const eventIdForTheme = eventDetail?.id;
    const themeApplied = await hasAppliedTheme(eventIdForTheme);
    if (!themeApplied) {
      showAlert({
        title: "Aucun thème appliqué",
        message:
          "Vous devez d'abord créer un thème et l'appliquer à cet événement avant de pouvoir générer l'invitation PDF.",
        variant: "warning",
        buttons: [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Choisir un thème",
            onPress: () => {
              if (!eventIdForTheme) return;
              onClose();
              router.push({
                pathname: "/(main)/guests/themes/[eventId]",
                params: { eventId: String(eventIdForTheme) },
              });
            },
          },
        ],
      });
      return;
    }

    setGenerating(true);
    try {
      const theme = await getAppliedTheme();
      const canvasW = theme.canvas?.width || 800;
      const canvasH = theme.canvas?.height || 600;

      const qrBase64 = await fetchQRBase64(
        data.qr_code_url || data.qr_code || data.qr_url || null,
      );

      const guestFullName =
        `${data.first_person || ""} ${data.second_person || ""}`.trim() ||
        "Invité";

      const variables: Record<string, string> = {
        "{{nom_invite}}": guestFullName,
        "{{code_invitation}}": data.code_invit || data.id || "",
        "{{table}}": data.place || "Non assignée",
        "{{categorie}}": data.invitation_type || "Standard",
        "{{categorie_invite}}": data.invitation_type || "Standard",
        "{{telephone}}": data.tel || "Non renseigné",
        "{{email}}": data.email || "Non renseigné",
        "{{nom_evenement}}": eventDetail?.name || "Événement",
        "{{date_evenement}}": dateFormatted || "Date inconnue",
        "{{lieu}}": eventDetail?.location || "Non précisé",
      };

      const pagesHTML = theme.pages
        .map((page: any, pageIndex: number) => {
          const pageBlocks = theme.blocks.filter(
            (b: any) => (b.pageIndex ?? 0) === pageIndex,
          );
          const bg = page.background;
          let bgStyle = "";
          if (bg?.type === "color") {
            bgStyle = `background-color: ${bg.value};`;
          } else if (bg?.type === "image" && bg?.value) {
            bgStyle = `background-image: url('${bg.value}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
          }

          const blocksHTML = pageBlocks
            .map((block: any) => {
              let leftPct, topPct, widthPct, heightPct;
              if (block.xPercent !== undefined) {
                leftPct = block.xPercent;
                topPct = block.yPercent;
                widthPct = block.widthPercent;
                heightPct = block.heightPercent;
              } else {
                leftPct = ((block.x || 0) / canvasW) * 100;
                topPct = ((block.y || 0) / canvasH) * 100;
                widthPct = ((block.width || 100) / canvasW) * 100;
                heightPct = ((block.height || 40) / canvasH) * 100;
              }

              const positionStyle = `position: absolute; left: ${leftPct}%; top: ${topPct}%; width: ${widthPct}%; height: ${heightPct}%; transform: rotate(${block.rotation || 0}deg); z-index: 2;`;

              let contentHTML = "";
              switch (block.type) {
                case "text": {
                  const text = replaceVariables(block.text || "", variables);
                  const style = block.style || {};
                  const safeText = text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;")
                    .replace(/\n/g, "<br/>");
                  contentHTML = `<div style="font-size: ${style.fontSize || 24}px; color: ${style.color || "#000000"}; text-align: ${style.align || "left"}; font-family: ${style.fontFamily || "Arial"}; font-weight: ${style.fontWeight || "normal"}; width: 100%; height: 100%; display: flex; align-items: center; ${style.align === "center" ? "justify-content: center;" : ""} overflow: hidden; line-height: 1.2;">${safeText}</div>`;
                  break;
                }
                case "image":
                  contentHTML = `<div style="width: 100%; height: 100%; background-image: url('${block.src || ""}'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>`;
                  break;
                case "qr":
                  if (qrBase64) {
                    contentHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"><img src="${qrBase64}" style="max-width: 90%; max-height: 90%; width: auto; height: auto;" /></div>`;
                  } else {
                    contentHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 14pt;">QR indisponible</div>`;
                  }
                  break;
                default:
                  contentHTML = `<div></div>`;
              }
              return `<div style="${positionStyle}">${contentHTML}</div>`;
            })
            .join("");

          // ✅ CORRECTION — plus de page-break-after inline
          return `<div class="page" style="width: ${canvasW}pt; height: ${canvasH}pt; position: relative; overflow: hidden; ${bgStyle}">${blocksHTML}</div>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      @page { size: ${canvasW}pt ${canvasH}pt; margin: 0; }
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
      * { box-sizing: border-box; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
    </style>
  </head>
  <body>${pagesHTML}</body>
</html>`;

      // ✅ Générer le PDF en base64
      const result = await Print.printToFileAsync({
        html,
        width: canvasW,
        height: canvasH,
        base64: true,
      });

      if (!result.base64) {
        throw new Error("La génération du PDF en base64 a échoué.");
      }

      // ✅ Nom MAJUSCULE sans accents ni caractères spéciaux (comme GuestList)
      const baseName = guestFullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      const safeBaseName = baseName || "INVITE";
      const fileName = `${safeBaseName}.pdf`;
      const pdfPath = (FileSystem.documentDirectory || "") + fileName;

      await FileSystem.writeAsStringAsync(pdfPath, result.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Le partage n'est pas disponible sur cet appareil.");
      }

      await Sharing.shareAsync(pdfPath, {
        mimeType: "application/pdf",
        dialogTitle: "Partager l'invitation",
        UTI: "com.adobe.pdf",
      });
    } catch (err: any) {
      console.error("Erreur génération PDF:", err);
      showAlert({
        title: "Erreur de génération",
        message: err?.message || "Impossible de générer le PDF.",
        variant: "danger",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setGenerating(false);
    }
  };

  // ─── Actions ───
  const handleModify = () => {
    setBottomSheetVisible(false);
    if (!data?.id) return;
    onClose();
    router.push({
      pathname: "/(main)/guests/update/[guestId]",
      params: { guestId: data.id },
    });
  };

  const handleDeletePress = () => {
    setBottomSheetVisible(false);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!data?.id) return;
    setDeleting(true);
    try {
      await deleteInvitation(data.id);
      setDeleteDialogVisible(false);
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error("Erreur suppression:", err);
      showAlert({
        title: "Erreur",
        message: "Impossible de supprimer cet invité. Réessayez.",
        variant: "danger",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setDeleting(false);
    }
  };

  const guestFullName = data
    ? `${data.first_person || ""} ${data.second_person || ""}`.trim() ||
      "Invité"
    : "";
  const initials = (data?.first_person || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        position="bottom"
        animationType="slide"
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={32} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorBtn} onPress={onClose}>
              <Text style={styles.errorBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.base }}
          >
            <View style={styles.hero}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.guestName}>{guestFullName}</Text>
              <View style={styles.eventBadge}>
                <Feather name="calendar" size={12} color={colors.primary} />
                <Text style={styles.eventBadgeText}>
                  {eventDetail?.name || "Événement"}
                  {dateFormatted ? ` · ${dateFormatted}` : ""}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoCardTitle}>Informations</Text>
                <View style={styles.infoCardBadge}>
                  <Text style={styles.infoCardBadgeText}>
                    {data?.invitation_type || "Standard"}
                  </Text>
                </View>
              </View>

              <InfoRow
                icon="hash"
                label="Code invitation"
                value={data?.code_invit || data?.id}
              />
              <InfoRow
                icon="map-pin"
                label="Table assignée"
                value={data?.place || "Non assignée"}
              />
              <InfoRow
                icon="phone"
                label="Téléphone"
                value={data?.tel || "—"}
              />
              <InfoRow
                icon="mail"
                label="Email"
                value={data?.email || "—"}
                isLast
              />
            </View>

            <View style={styles.noteRow}>
              <Feather name="info" size={14} color={colors.textMuted} />
              <Text style={styles.noteText}>
                Cette invitation doit être envoyée au destinataire pour
                validation.
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={handleGeneratePDF}
                disabled={generating}
                activeOpacity={0.85}
              >
                {generating ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <>
                    <Feather
                      name="share-2"
                      size={16}
                      color={colors.textInverse}
                    />
                    <Text style={styles.actionBtnTextPrimary}>
                      Partager PDF
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => setBottomSheetVisible(true)}
                disabled={generating}
                activeOpacity={0.85}
              >
                <Feather
                  name="more-horizontal"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.actionBtnTextSecondary}>Options</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={generating}
            >
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </Modal>

      <Modal
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        position="bottom"
        animationType="slide"
      >
        <Text style={styles.sheetTitle}>Options</Text>

        <TouchableOpacity
          style={styles.sheetOption}
          onPress={handleModify}
          activeOpacity={0.7}
        >
          <View
            style={[styles.sheetIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Feather name="edit-2" size={18} color={colors.primary} />
          </View>
          <Text style={styles.sheetOptionText}>Modifier l'invité</Text>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sheetOption, styles.sheetOptionDanger]}
          onPress={handleDeletePress}
          activeOpacity={0.7}
        >
          <View
            style={[styles.sheetIcon, { backgroundColor: colors.errorSoft }]}
          >
            <Feather name="trash-2" size={18} color={colors.error} />
          </View>
          <Text style={[styles.sheetOptionText, { color: colors.error }]}>
            Supprimer l'invité
          </Text>
          <Feather name="chevron-right" size={18} color={colors.error} />
        </TouchableOpacity>
      </Modal>

      <Dialog
        visible={deleteDialogVisible}
        title="Supprimer l'invité ?"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer cet invité ?"
        variant="danger"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
        loading={deleting}
      />

      {AlertHost}
    </>
  );
}

const InfoRow: React.FC<{
  icon: any;
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ icon, label, value, isLast }) => (
  <View style={[infoStyles.row, !isLast && infoStyles.rowBorder]}>
    <View style={infoStyles.left}>
      <View style={infoStyles.iconBox}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={infoStyles.label}>{label}</Text>
    </View>
    <Text style={infoStyles.value} numberOfLines={1}>
      {value || "—"}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  loadingBox: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    gap: spacing.base,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  errorBox: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  errorBtnText: {
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },

  hero: { alignItems: "center", marginBottom: spacing.lg },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.textInverse,
    letterSpacing: 1,
  },
  guestName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  eventBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  eventBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  infoCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  infoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoCardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  infoCardBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  infoCardBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: fontSize.xs * 1.6,
  },

  actionsRow: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 46,
    borderRadius: radius.md,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  actionBtnSecondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  actionBtnTextPrimary: {
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  actionBtnTextSecondary: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  closeBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },

  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  sheetOptionDanger: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  sheetIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetOptionText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.bold,
    maxWidth: "55%",
    textAlign: "right",
  },
});
