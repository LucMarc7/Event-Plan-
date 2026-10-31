// src/hooks/useEvents.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getAllEvents } from "../api/events";
import { useEventsStore } from "../stores/events.store";

export const useEvents = () => {
  const { events, setEvents, loading, setLoading } = useEventsStore();
  const [initialized, setInitialized] = useState(false);
  const isFetching = useRef(false); // 🔥 Évite les appels simultanés

  const fetchEvents = useCallback(
    async (forceRefresh = false) => {
      // Empêche les appels multiples simultanés
      if (isFetching.current) {
        console.log("⏳ Un appel est déjà en cours, ignoré");
        return;
      }
      isFetching.current = true;
      setLoading(true);
      try {
        const data = await getAllEvents(forceRefresh);
        setEvents(data);
      } catch (error) {
        console.error("Erreur fetchEvents:", error);
      } finally {
        setLoading(false);
        isFetching.current = false;
        setInitialized(true);
      }
    },
    [setLoading, setEvents],
  );

  // Chargement initial UNIQUEMENT une fois
  useEffect(() => {
    if (!initialized && !isFetching.current) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ⚠️ Tableau vide = exécution unique

  return { events, loading, initialized, refresh: fetchEvents };
};
