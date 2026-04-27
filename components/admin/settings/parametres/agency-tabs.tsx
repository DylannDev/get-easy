"use client";

export type AgencyTab = "general" | "terms";

interface Props {
  tab: AgencyTab;
  onChange: (tab: AgencyTab) => void;
}

/** Onglets "Général / Conditions de location" sous le sélecteur d'agence.
 *  L'onglet "Conditions" est masqué sous sm pour éviter le débordement. */
export function AgencyTabs({ tab, onChange }: Props) {
  return (
    <div className="border-b border-gray-200 flex gap-1">
      <TabButton active={tab === "general"} onClick={() => onChange("general")}>
        Général
      </TabButton>
      <TabButton
        active={tab === "terms"}
        onClick={() => onChange("terms")}
        className="hidden sm:inline-flex"
      >
        Conditions de location
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 ${
        active
          ? "border-black text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
