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

interface BookingRejectedEmailProps {
  firstName: string;
  lastName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  startDate: string;
  endDate: string;
  reason: "unavailable" | "already_paid" | "not_found";
}

export const BookingRejectedEmail = ({
  firstName,
  lastName,
  vehicle,
  startDate,
  endDate,
  reason,
}: BookingRejectedEmailProps) => {
  const getReasonText = () => {
    switch (reason) {
      case "unavailable":
        return "Le véhicule a été réservé par un autre client pendant que vous effectuiez votre paiement. Les dates que vous aviez sélectionnées ne sont malheureusement plus disponibles.";
      case "already_paid":
        return "Cette réservation a déjà été payée. Il semble que vous ayez effectué un paiement en double. Pas d'inquiétude, ce paiement sera automatiquement remboursé.";
      case "not_found":
        return "La réservation associée à ce paiement n'a pas été trouvée dans notre système. Cela peut arriver si la réservation a été annulée ou supprimée.";
      default:
        return "Votre paiement n'a pas pu être validé. Veuillez nous contacter pour plus d'informations.";
    }
  };

  const getRecommendation = () => {
    switch (reason) {
      case "unavailable":
        return "Nous vous recommandons de consulter à nouveau nos disponibilités et de finaliser votre paiement rapidement après avoir sélectionné vos dates.";
      case "already_paid":
        return "Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter. Votre paiement en double sera automatiquement remboursé.";
      case "not_found":
        return "Si vous avez des questions, n'hésitez pas à nous contacter avec les détails de votre réservation.";
      default:
        return "Pour toute question, n'hésitez pas à nous contacter.";
    }
  };

  return (
    <Html>
      <Head />
      <Preview>
        Votre paiement ne peut pas être validé - {vehicle.brand} {vehicle.model}
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
                Paiement non validé
              </Heading>
              <Text className="text-base text-gray-600 mb-2 capitalize">
                Bonjour {firstName} {lastName},
              </Text>
              <Text className="text-base text-gray-600">
                Nous avons reçu votre paiement, mais nous ne pouvons
                malheureusement pas le valider pour la raison suivante :
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Raison du rejet */}
            <Section className="p-4 bg-orange-50">
              <Text className="text-base text-gray-800 font-medium">
                {getReasonText()}
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Détails de la tentative de réservation */}
            <Section className="p-4">
              <Heading className="text-xl font-semibold text-black mb-4">
                Détails de votre demande
              </Heading>

              <div className="space-y-3">
                <div>
                  <Text className="text-sm text-gray-500 m-0 mb-1">
                    Véhicule
                  </Text>
                  <Text className="text-base text-black font-medium m-0">
                    {vehicle.brand} {vehicle.model}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 m-0 mb-1">
                    Date de départ
                  </Text>
                  <Text className="text-base text-black m-0">{startDate}</Text>
                </div>

                <div>
                  <Text className="text-sm text-gray-500 m-0 mb-1">
                    Date de retour
                  </Text>
                  <Text className="text-base text-black m-0">{endDate}</Text>
                </div>
              </div>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Remboursement */}
            <Section className="p-4 bg-green-50">
              <Heading className="text-lg font-semibold text-black mb-2">
                Remboursement automatique
              </Heading>
              <Text className="text-base text-gray-800 m-0">
                Votre paiement sera automatiquement remboursé sur votre moyen de
                paiement dans un délai de 5 à 10 jours ouvrés.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Prochaines étapes */}
            <Section className="p-4">
              <Heading className="text-lg font-semibold text-black mb-2">
                {reason === "unavailable"
                  ? "Nouvelle réservation"
                  : "Que faire ?"}
              </Heading>
              {reason === "unavailable" && (
                <Text className="text-base text-gray-600 m-0 mb-4">
                  Vous pouvez effectuer une nouvelle réservation sur notre site
                  web en consultant les disponibilités en temps réel.
                </Text>
              )}
              <Text className="text-base text-gray-600 m-0">
                {getRecommendation()}
              </Text>
            </Section>

            <Hr className="border-gray-200 my-0" />

            {/* Footer */}
            <Section className="p-4 text-center">
              <Text className="text-sm text-gray-500">
                Pour toute question, n'hésitez pas à nous contacter.
              </Text>
              <Text className="text-sm text-gray-500 m-0">
                L'équipe Get Easy
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
