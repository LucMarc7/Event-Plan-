// src/hooks/useGuests.ts
import { useEffect } from "react";
import { listInvitations } from "../api/invitations";
import { useGuestsStore } from "../stores/guests.store";

export const useGuests = (eventId: string) => {
  const { guests, loading, setGuests, setLoading } = useGuestsStore();

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const data = await listInvitations(eventId);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.invitations)
            ? data.invitations
            : [];
      setGuests(list);
    } catch (error) {
      console.error("Erreur chargement invités", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchGuests();
  }, [eventId]);

  return { guests, loading, refresh: fetchGuests };
};
