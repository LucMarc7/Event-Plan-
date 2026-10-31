// src/hooks/useGuestList.ts
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";
import { listInvitations } from "../../src/api/invitations";
import { useDataStore } from "../stores/data.store";

export const useGuestList = (id: string) => {
  const [event, setEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [modalVisible, setModalVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const detailEvent = useDataStore((state) => state.detailEvent);

  // ─── Vérifier la connexion ───
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // ─── Chargement des invités ───
  const fetchGuests = useCallback(async () => {
    if (!id) return;
    try {
      const data = await listInvitations(id);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.invitations)
            ? data.invitations
            : [];
      setGuests(list);
      setEvent(detailEvent);
    } catch (err) {
      console.error("Erreur chargement invités:", err);
    }
  }, [id, detailEvent]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // ─── Rafraîchissement manuel ───
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGuests();
    setRefreshing(false);
  }, [fetchGuests]);

  // ─── Filtrage ───
  const filterAndMarkGuests = useCallback(() => {
    if (!Array.isArray(guests)) return [];
    const query = search.toLowerCase().trim();
    if (!query) return guests;
    return guests.filter((g) => {
      const fullName =
        `${g.first_person || ""} ${g.second_person || ""}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (g.invitation_type || "").toLowerCase().includes(query) ||
        (g.code_invit || "").toLowerCase().includes(query)
      );
    });
  }, [guests, search]);

  // ─── Tri ───
  const sortGuests = useCallback(() => {
    const filtered = filterAndMarkGuests();
    if (!Array.isArray(filtered)) return [];

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "table") {
        const placeA = a.place || "ZZZ";
        const placeB = b.place || "ZZZ";
        return placeA.localeCompare(placeB);
      }
      return (a.first_person || "").localeCompare(b.first_person || "");
    });

    if (sortOption === "name") {
      const sections: Record<string, any[]> = {};
      sorted.forEach((g) => {
        const letter = (g.first_person || "?").charAt(0).toUpperCase();
        if (!sections[letter]) sections[letter] = [];
        sections[letter].push(g);
      });
      return Object.keys(sections)
        .sort()
        .map((key) => ({ title: key, data: sections[key] }));
    }
    return sorted;
  }, [filterAndMarkGuests, sortOption]);

  return {
    event,
    guests,
    search,
    setSearch,
    sortOption,
    setSortOption,
    modalVisible,
    setModalVisible,
    isConnected,
    refreshing,
    onRefresh,
    filterAndMarkGuests,
    sortGuests,
  };
};
