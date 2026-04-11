import { PiArrowCircleRight, PiArrowCircleLeft, PiCar } from "react-icons/pi";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardsProps {
  departuresCount: number;
  returnsCount: number;
  activeRentalsCount: number;
}

export function SummaryCards({
  departuresCount,
  returnsCount,
  activeRentalsCount,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Départs du jour",
      value: departuresCount.toString(),
      description: "Véhicules à remettre aujourd'hui",
      icon: PiArrowCircleRight,
    },
    {
      title: "Retours du jour",
      value: returnsCount.toString(),
      description: "Véhicules attendus aujourd'hui",
      icon: PiArrowCircleLeft,
    },
    {
      title: "Locations en cours",
      value: activeRentalsCount.toString(),
      description: "Véhicules actuellement loués",
      icon: PiCar,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-black">
                {card.title}
              </p>
              <div className="rounded-lg bg-black p-2">
                <card.icon className="size-5 text-green" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
