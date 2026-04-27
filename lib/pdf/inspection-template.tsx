import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

export interface InspectionPdfData {
  type: "departure" | "return";
  issuedAt: Date;
  agency: {
    name: string;
    address: string;
    city: string;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    legalForm?: string | null;
    capitalSocial?: string | null;
    rcsCity?: string | null;
    rcsNumber?: string | null;
    siret?: string | null;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    companyName?: string | null;
    siret?: string | null;
    vatNumber?: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    registrationPlate: string;
  };
  startDate: Date;
  endDate: Date;
  mileage: number | null;
  fuelLevel: string | null;
  notes: string | null;
  /** Data URLs (base64) des photos — déjà chargées côté serveur. */
  photos: { dataUrl: string; note: string | null }[];
  /** Signature client en data URL PNG. */
  customerSignature: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  // Header : logo (gauche) + titre (droite, aligné verticalement avec le logo)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  metaLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  metaLabel: { color: "#555" },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 6,
    color: "#444",
  },
  partyName: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  partyBlock: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    flexDirection: "column",
  },
  detailsBlock: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    flexDirection: "column",
  },
  // Photos — grille 2 colonnes
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoCard: {
    width: "48%",
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  photoNote: {
    fontSize: 8,
    color: "#555",
    marginTop: 3,
    fontStyle: "italic",
  },
  notesBlock: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    minHeight: 40,
  },
  signatureBlock: {
    marginTop: 16,
    alignItems: "flex-start",
  },
  signatureImage: {
    width: 200,
    height: 80,
    objectFit: "contain",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 4,
    backgroundColor: "#fff",
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    fontSize: 8,
    color: "#777",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    textAlign: "center",
  },
});

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Ex. "29/03/2026 à 7h00" — utilisé pour les dates de période avec horaire. */
function formatDateTime(d: Date): string {
  const date = formatDate(d);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${date} à ${hours}h${minutes}`;
}

/** Format avec espaces simples (le NBSP `toLocaleString` peut s'afficher
 *  comme un slash dans certaines polices PDF). */
function formatNumberFr(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const FUEL_LABELS: Record<string, string> = {
  empty: "Vide",
  "1/4": "1/4",
  "1/2": "1/2",
  "3/4": "3/4",
  full: "Plein",
};

const TYPE_LABELS = {
  departure: "Départ",
  return: "Retour",
};

export function InspectionPDFDocument({
  data,
}: {
  data: InspectionPdfData;
}) {
  // Ordre demandé : nom, adresse, téléphone, email
  // (le nom est affiché à part en haut du bloc, donc on commence à l'adresse)
  const agencyLines: string[] = [];
  if (data.agency.address) agencyLines.push(data.agency.address);
  const agencyCityLine = [data.agency.postalCode, data.agency.city]
    .filter(Boolean)
    .join(" ");
  if (agencyCityLine) agencyLines.push(agencyCityLine);
  if (data.agency.country) agencyLines.push(data.agency.country);
  if (data.agency.phone) agencyLines.push(data.agency.phone);
  if (data.agency.email) agencyLines.push(data.agency.email);

  const customerLines: string[] = [];
  if (data.customer.address) customerLines.push(data.customer.address);
  const customerCityLine = [data.customer.postalCode, data.customer.city]
    .filter(Boolean)
    .join(" ");
  if (customerCityLine) customerLines.push(customerCityLine);
  if (data.customer.country) customerLines.push(data.customer.country);
  if (data.customer.phone) customerLines.push(data.customer.phone);
  if (data.customer.email) customerLines.push(data.customer.email);

  const legalLines: string[] = [];
  if (data.agency.legalForm) legalLines.push(data.agency.legalForm);
  if (data.agency.capitalSocial) {
    const raw = data.agency.capitalSocial.trim();
    const hasUnit = /€|eur/i.test(raw);
    legalLines.push(`Capital : ${hasUnit ? raw : `${raw} €`}`);
  }
  if (data.agency.rcsCity && data.agency.rcsNumber) {
    legalLines.push(`RCS ${data.agency.rcsCity} ${data.agency.rcsNumber}`);
  }
  if (data.agency.siret) legalLines.push(`SIRET ${data.agency.siret}`);

  return (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        {/* Header — logo + titre alignés sur la même ligne */}
        <View style={styles.header}>
          {data.agency.logoUrl ? (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image src={data.agency.logoUrl} style={styles.logo} />
          ) : (
            <View style={styles.logo} />
          )}
          <Text style={styles.title}>
            État des lieux — {TYPE_LABELS[data.type]}
          </Text>
        </View>

        {/* Loueur + Client — labels au-dessus, blocs côte-à-côte */}
        <View style={{ ...styles.section, flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Loueur</Text>
            <View style={styles.partyBlock}>
              <Text style={styles.partyName}>{data.agency.name}</Text>
              {agencyLines.map((line, i) => (
                <Text key={i}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.partyBlock}>
              {data.customer.companyName ? (
                <>
                  <Text style={styles.partyName}>
                    {data.customer.companyName}
                  </Text>
                  {data.customer.siret && (
                    <Text>SIRET {data.customer.siret}</Text>
                  )}
                  {data.customer.vatNumber && (
                    <Text>TVA {data.customer.vatNumber}</Text>
                  )}
                  {customerLines.map((line, i) => (
                    <Text key={i}>{line}</Text>
                  ))}
                  <Text style={{ marginTop: 4, color: "#555" }}>
                    Conducteur : {data.customer.firstName}{" "}
                    {data.customer.lastName}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.partyName}>
                    {data.customer.firstName} {data.customer.lastName}
                  </Text>
                  {customerLines.map((line, i) => (
                    <Text key={i}>{line}</Text>
                  ))}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Infos location encadrées (Date, Période, Kilométrage, Carburant, Véhicule, Plaque) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail de la location</Text>
          <View style={styles.detailsBlock}>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text>{formatDate(data.issuedAt)}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Période</Text>
              <Text>
                {formatDateTime(data.startDate)} - {formatDateTime(data.endDate)}
              </Text>
            </View>
            {data.mileage != null && (
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Kilométrage</Text>
                <Text>{formatNumberFr(data.mileage)} km</Text>
              </View>
            )}
            {data.fuelLevel && (
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Carburant</Text>
                <Text>{FUEL_LABELS[data.fuelLevel] ?? data.fuelLevel}</Text>
              </View>
            )}
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Véhicule</Text>
              <Text>
                {data.vehicle.brand} {data.vehicle.model}
              </Text>
            </View>
            <View style={{ ...styles.metaLine, marginBottom: 0 }}>
              <Text style={styles.metaLabel}>Immatriculation</Text>
              <Text>{data.vehicle.registrationPlate}</Text>
            </View>
          </View>
        </View>

        {/* Observations */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observations</Text>
            <View style={styles.notesBlock}>
              <Text>{data.notes}</Text>
            </View>
          </View>
        )}

        {/* Photos — flow naturel sans wrap={false} pour éviter les vides */}
        {data.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Photos ({data.photos.length})
            </Text>
            <View style={styles.photoGrid}>
              {data.photos.map((photo, i) => (
                <View key={i} style={styles.photoCard} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={photo.dataUrl} style={styles.photoImage} />
                  {photo.note && (
                    <Text style={styles.photoNote}>{photo.note}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signature */}
        {data.customerSignature && (
          <View style={styles.signatureBlock} wrap={false}>
            <Text style={styles.sectionTitle}>Signature du client</Text>
            <Text style={{ fontSize: 8, color: "#555", marginBottom: 4 }}>
              Lu et approuvé
            </Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={data.customerSignature}
              style={styles.signatureImage}
            />
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {[data.agency.name, ...legalLines].join(" · ")}
        </Text>
      </Page>
    </PDFDocument>
  );
}
