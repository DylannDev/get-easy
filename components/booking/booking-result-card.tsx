import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface BookingResultCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string | ReactNode;
  primaryButton: {
    label: string;
    onClick: () => void;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
    variant?: "outline" | "ghost" | "secondary";
  };
}

export function BookingResultCard({
  icon: Icon,
  iconColor,
  title,
  description,
  primaryButton,
  secondaryButton,
}: BookingResultCardProps) {
  return (
    <Card className="max-w-lg text-center w-full p-8">
      <div className="flex flex-col items-center justify-center gap-2 mb-6">
        <Icon className={`size-16 mx-auto mb-4 ${iconColor}`} />
        <h1 className="text-3xl font-bold text-black mb-2">{title}</h1>
        {typeof description === "string" ? (
          <p className="text-gray-600">{description}</p>
        ) : (
          description
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={primaryButton.onClick} className="w-full" size="lg">
          {primaryButton.label}
        </Button>

        {secondaryButton && (
          <Button
            onClick={secondaryButton.onClick}
            variant={secondaryButton.variant || "outline"}
            className="w-full"
            size="lg"
          >
            {secondaryButton.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
