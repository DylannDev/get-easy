import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getContainer } from "@/composition-root/container";

const DAY_ORDER = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
const DAY_SHORT: Record<string, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
};
const DAY_FULL: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

interface ScheduleDay {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  slots?: { openTime: string; closeTime: string }[];
}

function formatSlots(slots: { openTime: string; closeTime: string }[]): string {
  return slots
    .map((s) => `${formatTime(s.openTime)} - ${formatTime(s.closeTime)}`)
    .join(" / ");
}

function getDaySlots(day: ScheduleDay): { openTime: string; closeTime: string }[] {
  if (day.slots && day.slots.length > 0) return day.slots;
  return [{ openTime: day.openTime, closeTime: day.closeTime }];
}

function slotsEqual(
  a: { openTime: string; closeTime: string }[],
  b: { openTime: string; closeTime: string }[]
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (s, i) => s.openTime === b[i].openTime && s.closeTime === b[i].closeTime
    )
  );
}

function formatScheduleHours(
  schedule?: { allDays: boolean; days: Record<string, ScheduleDay> }
): string {
  if (!schedule) return "";

  const entries = DAY_ORDER.map((day) => ({
    day,
    ...schedule.days[day],
    resolvedSlots: getDaySlots(schedule.days[day]),
  }));

  const enabledEntries = entries.filter((e) => e.enabled);
  if (enabledEntries.length === 0) return "Fermé";

  // All 7 days with same slots
  if (
    enabledEntries.length === 7 &&
    enabledEntries.every((e) =>
      slotsEqual(e.resolvedSlots, enabledEntries[0].resolvedSlots)
    )
  ) {
    return `${formatSlots(enabledEntries[0].resolvedSlots)} 7j/7`;
  }

  // Group consecutive days with same slots
  const groups: {
    days: string[];
    slots: { openTime: string; closeTime: string }[];
  }[] = [];

  for (const entry of entries) {
    if (!entry.enabled) continue;
    const last = groups[groups.length - 1];
    if (last && slotsEqual(last.slots, entry.resolvedSlots)) {
      last.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], slots: entry.resolvedSlots });
    }
  }

  return groups
    .map((g) => {
      const timeStr = formatSlots(g.slots);
      if (g.days.length === 1) {
        return `${DAY_FULL[g.days[0]]} : ${timeStr}`;
      }
      return `${DAY_FULL[g.days[0]]} - ${DAY_FULL[g.days[g.days.length - 1]]} : ${timeStr}`;
    })
    .join("\n");
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { agencyRepository } = getContainer();
  const agencies = await agencyRepository.findAll();

  const allContacts: Record<string, import("@/components/layout/navbar").ContactInfo> = {};
  for (const agency of agencies) {
    allContacts[agency.id] = {
      phone: agency.phone ?? "",
      email: agency.email ?? "",
      address: `${agency.address}, ${agency.city}`,
      hours: agency.schedule
        ? formatScheduleHours(agency.schedule)
        : `${agency.hours.openTime} - ${agency.hours.closeTime} 7j/7`,
      deliveryLabel: agency.deliveryLabel ?? "",
      deliveryZones: agency.deliveryZones ?? "",
    };
  }

  const defaultContact = agencies[0] ? allContacts[agencies[0].id] : undefined;
  const defaultAgencyId = agencies[0]?.id ?? "";

  return (
    <>
      <Navbar
        contactInfo={defaultContact}
        allContacts={allContacts}
        defaultAgencyId={defaultAgencyId}
      />
      {children}
      <Footer />
    </>
  );
}
