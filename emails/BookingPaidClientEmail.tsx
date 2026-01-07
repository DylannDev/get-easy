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

interface BookingPaidClientEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  vehicle: {
    brand: string;
    model: string;
  };
}

export const BookingPaidClientEmail = ({
  firstName,
  lastName,
  email,
  startDate,
  endDate,
  totalPrice,
  vehicle,
}: BookingPaidClientEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Confirmation de votre réservation - {vehicle.brand} {vehicle.model}
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
              <Heading className="text-2xl font-bold text-black mb-4 text-center">
                Réservation confirmée !
              </Heading>
              <Text className="text-base text-gray-600 mb-2 capitalize">
                Bonjour {firstName} {lastName},
              </Text>
              <Text className="text-base text-gray-600">
                Votre paiement a été effectué avec succès. Votre réservation est
                maintenant confirmée.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Détails de la réservation */}
            <Section className="p-4">
              <Heading className="text-2xl font-semibold text-black mb-4">
                Détails de votre réservation
              </Heading>

              <div className="space-y-4">
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
                    Montant total
                  </Text>
                  <Text className="text-base text-black font-semibold">
                    {totalPrice.toFixed(2)} €
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 mb-1 font-medium">
                    Email de contact
                  </Text>
                  <Text className="text-base text-black font-semibold">
                    {email}
                  </Text>
                </div>
              </div>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Instructions */}
            <Section className="p-4">
              <Heading className="text-2xl font-semibold text-black mb-4">
                Prochaines étapes
              </Heading>
              <div className="space-y-3">
                <div>
                  <Text className="text-base text-gray-600">
                    Présentez-vous à l&apos;agence le jour de votre réservation
                    avec :
                  </Text>
                  <Text className="text-sm text-gray-600">
                    • Pièce d&apos;identité valide.
                  </Text>
                  <Text className="text-sm text-gray-600">
                    • Permis de conduire
                  </Text>
                  <Text className="text-sm text-gray-600">
                    • Justificatif de domicile
                  </Text>
                </div>
                <div>
                  <Text className="text-base text-gray-600">
                    Pour toute question, n&apos;hésitez pas à contacter notre
                    service client :
                  </Text>
                  <Text className="text-base text-gray-600 text-center underline underline-offset-4">
                    contact@geteasy.com
                  </Text>
                </div>
              </div>
            </Section>

            {/* Footer */}
            <Hr className="border-gray-200 my-0" />
            <Section className="p-4">
              <Text className="text-sm text-gray-500 text-center mb-2">
                Merci d&apos;avoir choisi Get Easy pour votre location de
                véhicule.
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

export default BookingPaidClientEmail;
