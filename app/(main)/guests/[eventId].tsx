// app/(main)/guests/[eventId].tsx
import { useLocalSearchParams } from "expo-router";
import React from "react";
import GuestList from "../../../src/components/guests/GuestList";

export default function GuestListScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  if (!eventId) {
    return null;
  }

  return <GuestList id={String(eventId)} />;
}
