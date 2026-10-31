import { create } from "zustand";

export interface Event {
  id: string;
  name: string;
  type: string;
  date: string;
  image?: string;
  description?: string;
  event_code?: string;
  [key: string]: any;
}

interface EventsState {
  events: Event[];
  loading: boolean;
  setEvents: (events: Event[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  loading: false,
  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
}));
