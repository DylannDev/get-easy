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

interface BookingDocumentsEmailProps {
  firstName: string;
  lastName: string;
  vehicle: { brand: string; model: string };
  startDate: string;
  endDate: string;
  documentLabels: string[];
}

export const BookingDocumentsEmail = ({
  firstName,
  lastName,
  vehicle,
  startDate,
  endDate,
  documentLabels,
}: BookingDocumentsEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Documents de votre réservation - {vehicle.brand} {vehicle.model}
      </Preview>
      <Tailwind>
        <Body className="">
          <Container className="mx-auto max-w-2xl">
            <Section className="px-8 pt-8 pb-4">
              <Img
                src="https://geteasylocation.com/logo.svg"
                alt="Get Easy"
                width="120"
                height="40"
                className="mx-auto"
              />
            </Section>

            <Section className="p-4">
              <Heading className="text-2xl font-bold text-black mb-4 text-center">
                Documents de votre réservation
              </Heading>
              <Text className="text-base text-gray-600 mb-2 capitalize">
                Bonjour {firstName} {lastName},
              </Text>
              <Text className="text-base text-gray-600">
                Vous trouverez en pièces jointes les documents relatifs à votre
                location du véhicule {vehicle.brand} {vehicle.model} ({startDate}{" "}
                au {endDate}).
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            <Section className="p-4">
              <Heading className="text-2xl font-semibold text-black mb-4">
                Pièces jointes
              </Heading>
              <div className="space-y-2">
                {documentLabels.map((label, i) => (
                  <Text key={i} className="text-base text-black">
                    • {label}
                  </Text>
                ))}
              </div>
            </Section>

            <Hr className="border-gray-200 my-0" />
            <Section className="p-4">
              <Text className="text-sm text-gray-500 text-center mb-2">
                Pour toute question, n&apos;hésitez pas à nous contacter.
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

export default BookingDocumentsEmail;
