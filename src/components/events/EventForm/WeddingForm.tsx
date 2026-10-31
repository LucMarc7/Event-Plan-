import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import { Button, HelperText, ProgressBar, TextInput } from "react-native-paper";
import { createEvent } from "../../../api/events";
import { theme } from "../../../theme";

const steps = ["Informations", "Date & heure", "Lieu", "Description"];

export const WeddingForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    const payload = { ...data, date: date.toISOString().split("T")[0] };
    await createEvent(payload);
    onSuccess();
  };

  return (
    <ScrollView>
      <ProgressBar
        progress={(step + 1) / steps.length}
        color={theme.colors.primary}
      />
      <Text variant="headlineSmall" style={{ marginVertical: 16 }}>
        {steps[step]}
      </Text>

      {step === 0 && (
        <>
          <Controller
            control={control}
            name="name"
            rules={{ required: "Nom requis" }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nom de l'événement"
                value={value}
                onChangeText={onChange}
                error={!!errors.name}
              />
            )}
          />
          <HelperText type="error">{errors.name?.message}</HelperText>
          {/* Autres champs */}
        </>
      )}
      {/* Autres steps */}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        {step > 0 && (
          <Button mode="outlined" onPress={() => setStep(step - 1)}>
            Précédent
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button mode="contained" onPress={() => setStep(step + 1)}>
            Suivant
          </Button>
        ) : (
          <Button mode="contained" onPress={handleSubmit(onSubmit)}>
            Créer
          </Button>
        )}
      </View>
    </ScrollView>
  );
};
