import { create } from "zustand";

export interface Guest {
  id: string;
  first_person: string;
  second_person?: string;
  invitation_type: string;
  used: boolean;
  place?: string;
  [key: string]: any;
}

interface GuestsState {
  guests: Guest[];
  loading: boolean;
  setGuests: (guests: Guest[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useGuestsStore = create<GuestsState>((set) => ({
  guests: [],
  loading: false,
  setGuests: (guests) => set({ guests }),
  setLoading: (loading) => set({ loading }),
}));
