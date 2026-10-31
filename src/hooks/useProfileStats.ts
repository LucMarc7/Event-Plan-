// src/hooks/useProfileStats.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/client";

const CACHE_KEY = "profile_stats_cache_v1";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface ProfileStats {
  events: number;
  guests: number;
  controllers: number;
  loading: boolean;
  fromCache: boolean;
  lastUpdated: number | null;
}

interface CachedStats {
  events: number;
  guests: number;
  controllers: number;
  timestamp: number;
}

const DEFAULT_STATS: ProfileStats = {
  events: 0,
  guests: 0,
  controllers: 0,
  loading: true,
  fromCache: false,
  lastUpdated: null,
};

/**
 * Hook qui charge les stats du profil (événements, invités, contrôleurs).
 *
 * ✅ Optimisations :
 *  - Cache AsyncStorage avec TTL 30 min
 *  - Ne fait AUCUN appel réseau si le cache est valide
 *  - Expose `refresh()` pour forcer le refetch (pull-to-refresh)
 *
 * Usage :
 *   const { events, guests, controllers, loading, refresh } = useProfileStats();
 */
export const useProfileStats = () => {
  const [stats, setStats] = useState<ProfileStats>(DEFAULT_STATS);
  const fetchingRef = useRef(false);

  // ─── Lecture du cache ───
  const readCache = async (): Promise<CachedStats | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedStats;
      if (!parsed?.timestamp) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  // ─── Écriture du cache ───
  const writeCache = async (data: Omit<CachedStats, "timestamp">) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...data, timestamp: Date.now() }),
      );
    } catch (e) {
      console.warn("[useProfileStats] Erreur écriture cache:", e);
    }
  };

  // ─── Récupération depuis l'API (agrégation) ───
  const fetchFromAPI = async (): Promise<Omit<CachedStats, "timestamp">> => {
    // 1. Liste des événements
    const eventsRes = await api.get("/events/");
    const events = Array.isArray(eventsRes.data)
      ? eventsRes.data
      : (eventsRes.data?.results ?? []);

    const eventsCount = events.length;

    // 2. Pour chaque événement, on agrège invitations + contrôleurs
    const perEvent = await Promise.allSettled(
      events.map(async (ev: any) => {
        const id = ev.id;
        if (!id) return { controllers: 0, guests: 0 };

        const [ctrlRes, invRes] = await Promise.allSettled([
          api.get(`/events/${id}/controllers/`),
          api.get(`/invitations/api/invitations_list/${id}/`),
        ]);

        const controllers =
          ctrlRes.status === "fulfilled"
            ? (ctrlRes.value.data?.controllers?.length ?? 0)
            : 0;

        const guests =
          invRes.status === "fulfilled" && Array.isArray(invRes.value.data)
            ? invRes.value.data.length
            : 0;

        return { controllers, guests };
      }),
    );

    let totalGuests = 0;
    let totalControllers = 0;
    perEvent.forEach((r) => {
      if (r.status === "fulfilled") {
        totalGuests += r.value.guests;
        totalControllers += r.value.controllers;
      }
    });

    return {
      events: eventsCount,
      guests: totalGuests,
      controllers: totalControllers,
    };
  };

  // ─── Chargement principal ───
  const load = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // 1. Vérifier le cache (sauf si force)
      if (!force) {
        const cached = await readCache();
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log("[useProfileStats] ✅ Cache valide, pas de requête");
          setStats({
            events: cached.events,
            guests: cached.guests,
            controllers: cached.controllers,
            loading: false,
            fromCache: true,
            lastUpdated: cached.timestamp,
          });
          fetchingRef.current = false;
          return;
        }
      }

      console.log("[useProfileStats] 🔄 Refetch depuis l'API");
      const fresh = await fetchFromAPI();
      await writeCache(fresh);

      setStats({
        ...fresh,
        loading: false,
        fromCache: false,
        lastUpdated: Date.now(),
      });
    } catch (e) {
      console.warn("[useProfileStats] Erreur:", e);
      // Fallback : cache même expiré
      const cached = await readCache();
      if (cached) {
        setStats({
          events: cached.events,
          guests: cached.guests,
          controllers: cached.controllers,
          loading: false,
          fromCache: true,
          lastUpdated: cached.timestamp,
        });
      } else {
        setStats((s) => ({ ...s, loading: false }));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ─── Effet initial : charge une fois (avec cache) ───
  useEffect(() => {
    load(false);
  }, [load]);

  // ─── Refresh manuel (pull-to-refresh) ───
  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  // ─── Invalidation (à appeler après création event/invité/contrôleur) ───
  const invalidate = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {}
    await load(true);
  }, [load]);

  return {
    events: stats.events,
    guests: stats.guests,
    controllers: stats.controllers,
    loading: stats.loading,
    fromCache: stats.fromCache,
    lastUpdated: stats.lastUpdated,
    refresh,
    invalidate,
  };
};

export default useProfileStats;
