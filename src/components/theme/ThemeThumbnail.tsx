// src/components/theme/ThemeThumbnail.tsx
// Aperçu miniature d'un thème (background + blocs)

import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../theme/tokens";
import { getFontFamily } from "./helpers";

interface Props {
  theme: any;
  width: number;
  height: number;
}

const ThemeThumbnail: React.FC<Props> = ({ theme, width, height }) => {
  if (!theme || !Array.isArray(theme.pages) || theme.pages.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { width, height, backgroundColor: colors.surfaceAlt },
        ]}
      >
        <Feather name="layers" size={32} color={colors.textMuted} />
      </View>
    );
  }

  const canvasW = theme.canvas?.width || theme.meta?.canvasW || 800;
  const canvasH = theme.canvas?.height || theme.meta?.canvasH || 1200;
  const scale = Math.min(width / canvasW, height / canvasH);

  const page = theme.pages[0];
  const blocksOnPage = (theme.blocks || []).filter(
    (b: any) => (b.pageIndex ?? 0) === 0,
  );

  const bgIsColor = page?.background?.type === "color";
  const bgIsImage =
    page?.background?.type === "image" || page?.background?.type === "uri";
  const bgIsAsset = page?.background?.type === "asset";

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: bgIsColor ? page.background.value : "#FFFFFF",
        },
      ]}
    >
      {/* Background image */}
      {bgIsImage && page.background.value && (
        <Image
          source={{ uri: page.background.value }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      {bgIsAsset && page.background.assetModule && (
        <Image
          source={page.background.assetModule}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* Blocs */}
      {blocksOnPage.map((b: any) => {
        // Support des formats px et % (stockage)
        const blockX =
          b.xPercent !== undefined
            ? (b.xPercent / 100) * canvasW * scale
            : (b.x || 0) * scale;
        const blockY =
          b.yPercent !== undefined
            ? (b.yPercent / 100) * canvasH * scale
            : (b.y || 0) * scale;
        const blockW =
          b.widthPercent !== undefined
            ? (b.widthPercent / 100) * canvasW * scale
            : (b.width || 100) * scale;
        const blockH =
          b.heightPercent !== undefined
            ? (b.heightPercent / 100) * canvasH * scale
            : (b.height || 40) * scale;

        return (
          <View
            key={b.id}
            style={{
              position: "absolute",
              left: blockX,
              top: blockY,
              width: blockW,
              height: blockH,
              transform: [{ rotate: `${b.rotation || 0}deg` }],
              overflow: "hidden",
            }}
          >
            {b.type === "text" && (
              <Text
                style={{
                  fontSize: Math.max(4, (b.style?.fontSize || 18) * scale),
                  color: b.style?.color || colors.text,
                  textAlign: b.style?.align || "left",
                  fontWeight: b.style?.fontWeight || "normal",
                  fontFamily: getFontFamily(b.style?.fontFamily),
                  fontStyle: b.style?.fontStyle || "normal",
                  textDecorationLine: b.style?.textDecorationLine || "none",
                }}
                numberOfLines={2}
              >
                {b.text || "Texte"}
              </Text>
            )}

            {b.type === "image" &&
              (b.assetModule ? (
                <Image
                  source={b.assetModule}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : b.src ? (
                <Image
                  source={{ uri: b.src }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : null)}

            {b.type === "qr" && (
              <View
                style={{
                  flex: 1,
                  backgroundColor: b.style?.backgroundColor || "#FFFFFF",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                }}
              >
                <Feather
                  name="grid"
                  size={Math.max(8, Math.min(blockW, blockH) * 0.4)}
                  color={colors.textMuted}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  empty: {
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ThemeThumbnail;
