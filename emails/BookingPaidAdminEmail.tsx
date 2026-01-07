import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Tailwind,
} from "@react-email/components";

interface BookingPaidAdminEmailProps {
  firstName: string;
  lastName: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  vehicle: {
    brand: string;
    model: string;
  };
}

export const BookingPaidAdminEmail = ({
  firstName,
  lastName,
  customerEmail,
  startDate,
  endDate,
  totalPrice,
  vehicle,
}: BookingPaidAdminEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Nouvelle réservation confirmée - {vehicle.brand} {vehicle.model}
      </Preview>
      <Tailwind>
        <Body className="">
          <Container className="mx-auto max-w-2xl">
            {/* Logo */}
            <Section className="px-8 pt-8 pb-4">
              <Img
                src="https://geteasylocation.com/logo.svg"
                alt="Get Easy"
                width="120"
                height="40"
                className="mx-auto"
              />
            </Section>

            {/* En-tête */}
            <Section className="p-4">
              <Heading className="text-3xl font-bold text-black mb-4">
                Nouvelle réservation
              </Heading>
              <Text className="text-base text-gray-600">
                Une nouvelle réservation vient d&apos;être confirmée sur votre
                plateforme.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Détails de la réservation */}
            <Section className="p-4">
              <Heading className="text-2xl font-semibold text-black mb-4">
                Détails de la réservation
              </Heading>

              <div className="space-y-4">
                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Client
                  </Text>
                  <Text className="text-base text-black font-semibold capitalize">
                    {firstName} {lastName}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Email du client
                  </Text>
                  <Text className="text-base text-black font-semibold">
                    {customerEmail}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Véhicule
                  </Text>
                  <Text className="text-base text-black font-semibold">
                    {vehicle.brand} {vehicle.model}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Date de début
                  </Text>
                  <Text className="text-base text-black font-semibold">
                    {startDate}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Date de fin
                  </Text>
                  <Text className="text-base text-black font-semibold">
                    {endDate}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Montant total payé
                  </Text>
                  <Text className="text-2xl text-black font-bold">
                    {totalPrice.toFixed(2)} €
                  </Text>
                </div>
              </div>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Actions à prendre */}
            <Section className="p-4">
              <Heading className="text-2xl font-semibold text-black mb-4">
                Actions à prendre
              </Heading>
              <div className="space-y-3">
                <Text className="text-base text-gray-600">
                  • Vérifier la disponibilité du véhicule pour les dates
                  demandées
                </Text>
                <Text className="text-base text-gray-600">
                  • Préparer le véhicule avant la date de début de location
                </Text>
                <Text className="text-base text-gray-600">
                  • Contacter le client si nécessaire pour confirmer les détails
                </Text>
              </div>
            </Section>

            {/* Footer */}
            <Hr className="border-gray-200 my-0" />
            <Section className="p-4">
              <Text className="text-sm text-gray-500 text-center mb-2">
                Cet email est envoyé automatiquement par Get Easy.
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                © {new Date().getFullYear()} Get Easy. Tous droits réservés.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingPaidAdminEmail;
