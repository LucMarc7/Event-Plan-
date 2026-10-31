// src/components/events/TicketBillingStep.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";

export type BillingMode = "free" | "paid";

export interface TicketCategory {
  id: string;
  name: string;
  price: string;
  quantity_total: string;
  commission_rate: string;
}

interface Props {
  mode: BillingMode;
  onModeChange: (m: BillingMode) => void;
  categories: TicketCategory[];
  onCategoriesChange: (c: TicketCategory[]) => void;
  freeQuantity: string;
  onFreeQuantityChange: (v: string) => void;
  accent: string;
  placeholderColor: string;
}

const THEME_INPUT_BG = "#F2F2F7";
const THEME_DANGER = "#FF3B30";
const THEME_BORDER = "#E5E5EA";

export default function TicketBillingStep({
  mode,
  onModeChange,
  categories,
  onCategoriesChange,
  freeQuantity,
  onFreeQuantityChange,
  accent,
  placeholderColor,
}: Props) {
  const updateCategory = (
    id: string,
    field: keyof TicketCategory,
    value: string,
  ) => {
    onCategoriesChange(
      categories.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const removeCategory = (id: string) => {
    if (categories.length <= 1) return;
    onCategoriesChange(categories.filter((c) => c.id !== id));
  };

  const addCategory = () => {
    onCategoriesChange([
      ...categories,
      {
        id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        price: "0",
        quantity_total: "0",
        commission_rate: "10",
      },
    ]);
  };

  return (
    <View>
      {/* Mode toggle */}
      <View style={{ flexDirection: "row", gap: wp(2), marginBottom: hp(2) }}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === "free" && {
              backgroundColor: accent,
              borderColor: accent,
            },
          ]}
          onPress={() => onModeChange("free")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="gift"
            size={hp(2)}
            color={mode === "free" ? "#FFF" : accent}
          />
          <Text
            style={[styles.modeBtnText, mode === "free" && { color: "#FFF" }]}
          >
            Gratuit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === "paid" && {
              backgroundColor: accent,
              borderColor: accent,
            },
          ]}
          onPress={() => onModeChange("paid")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="cash"
            size={hp(2)}
            color={mode === "paid" ? "#FFF" : accent}
          />
          <Text
            style={[styles.modeBtnText, mode === "paid" && { color: "#FFF" }]}
          >
            Payant
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "free" ? (
        <>
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Nombre de places disponibles</Text>
            <TextInput
              placeholder="Ex: 200"
              keyboardType="number-pad"
              style={styles.input}
              value={freeQuantity}
              onChangeText={onFreeQuantityChange}
              placeholderTextColor={placeholderColor}
            />
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={hp(2)} color={accent} />
            <Text style={styles.infoBoxText}>
              Les participants s'inscrivent gratuitement sur le web. Un billet
              QR sera généré pour chaque place.
            </Text>
          </View>
        </>
      ) : (
        <>
          {categories.map((cat, idx) => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Catégorie {idx + 1}</Text>
                {categories.length > 1 && (
                  <TouchableOpacity onPress={() => removeCategory(cat.id)}>
                    <Ionicons name="trash" size={hp(2)} color={THEME_DANGER} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                placeholder="Nom (ex: Ticket Standard)"
                style={styles.input}
                value={cat.name}
                onChangeText={(v) => updateCategory(cat.id, "name", v)}
                placeholderTextColor={placeholderColor}
              />
              <View
                style={{
                  flexDirection: "row",
                  gap: wp(2),
                  marginTop: hp(1),
                }}
              >
                <TextInput
                  placeholder="Prix (0 = gratuit)"
                  keyboardType="decimal-pad"
                  style={[styles.input, { flex: 1 }]}
                  value={cat.price}
                  onChangeText={(v) => updateCategory(cat.id, "price", v)}
                  placeholderTextColor={placeholderColor}
                />
                <TextInput
                  placeholder="Quantité"
                  keyboardType="number-pad"
                  style={[styles.input, { flex: 1 }]}
                  value={cat.quantity_total}
                  onChangeText={(v) =>
                    updateCategory(cat.id, "quantity_total", v)
                  }
                  placeholderTextColor={placeholderColor}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={addCategory}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={hp(2.4)} color={accent} />
            <Text style={[styles.addBtnText, { color: accent }]}>
              Ajouter une catégorie
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="globe" size={hp(2)} color={accent} />
            <Text style={styles.infoBoxText}>
              Les acheteurs paieront sur le web. Cette app gère uniquement le
              contrôle d'accès et la gestion des contrôleurs.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(1.5),
    paddingVertical: hp(1.4),
    borderRadius: 14,
    backgroundColor: THEME_INPUT_BG,
    borderWidth: 1.5,
    borderColor: THEME_BORDER,
  },
  modeBtnText: {
    fontSize: hp(1.7),
    fontWeight: "700",
    color: "#1C1C1E",
  },
  fieldWrapper: { marginBottom: hp(1.5) },
  fieldLabel: {
    fontSize: hp(1.6),
    fontWeight: "600",
    marginBottom: hp(0.5),
    color: "#1C1C1E",
    marginLeft: wp(1),
  },
  input: {
    height: hp(5.5),
    backgroundColor: THEME_INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: wp(3),
    fontSize: hp(1.7),
    color: "#1C1C1E",
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: wp(3),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: THEME_BORDER,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1),
  },
  categoryTitle: {
    fontSize: hp(1.6),
    fontWeight: "700",
    color: "#1C1C1E",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(1.5),
    paddingVertical: hp(1.4),
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: THEME_BORDER,
    marginBottom: hp(1.5),
  },
  addBtnText: {
    fontSize: hp(1.6),
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    gap: wp(2),
    padding: wp(3),
    backgroundColor: THEME_INPUT_BG,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    fontSize: hp(1.4),
    color: "#6B7280",
    lineHeight: hp(1.9),
  },
});
