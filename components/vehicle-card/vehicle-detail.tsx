import type { IconType } from "react-icons";

interface VehicleDetailProps {
  icon: IconType;
  label: string;
}

export const VehicleDetail = ({ icon: Icon, label }: VehicleDetailProps) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-black rounded-lg p-3">
        <Icon className="size-6 text-green" />
      </div>
      <span>{label}</span>
    </div>
  );
};
