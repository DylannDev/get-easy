import { create } from "zustand";
import type { ContactInfo } from "@/components/layout/navbar";

interface AgencyStore {
  agencyContacts: Record<string, ContactInfo>;
  activeAgencyId: string;
  setActiveAgencyId: (id: string) => void;
  setAgencyContacts: (contacts: Record<string, ContactInfo>) => void;
  getActiveContact: () => ContactInfo | undefined;
}

export const useAgencyStore = create<AgencyStore>((set, get) => ({
  agencyContacts: {},
  activeAgencyId: "",
  setActiveAgencyId: (id) => set({ activeAgencyId: id }),
  setAgencyContacts: (contacts) => set({ agencyContacts: contacts }),
  getActiveContact: () => {
    const { agencyContacts, activeAgencyId } = get();
    return agencyContacts[activeAgencyId];
  },
}));
