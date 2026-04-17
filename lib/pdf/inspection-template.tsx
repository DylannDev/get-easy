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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: { flex: 1, paddingRight: 16 },
  headerRight: { flex: 1, alignItems: "flex-end" },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
    marginBottom: 8,
  },
  agencyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textAlign: "right",
  },
  metaBlock: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    minWidth: 220,
  },
  metaLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  metaLabel: { color: "#555" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 6,
    color: "#444",
  },
  customerBlock: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    backgroundColor: "#fafafa",
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
    borderRadius: 4,
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
  const agencyLines: string[] = [];
  if (data.agency.address) agencyLines.push(data.agency.address);
  const cityLine = [data.agency.postalCode, data.agency.city]
    .filter(Boolean)
    .join(" ");
  if (cityLine) agencyLines.push(cityLine);
  if (data.agency.country) agencyLines.push(data.agency.country);
  if (data.agency.phone) agencyLines.push(`Tél. ${data.agency.phone}`);
  if (data.agency.email) agencyLines.push(data.agency.email);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.agency.logoUrl && (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={data.agency.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.agencyName}>{data.agency.name}</Text>
            {agencyLines.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>
              État des lieux — {TYPE_LABELS[data.type]}
            </Text>
            <View style={styles.metaBlock}>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text>{formatDate(data.issuedAt)}</Text>
              </View>
              <View style={styles.metaLine}>
                <Text style={styles.metaLabel}>Période</Text>
                <Text>
                  {formatDate(data.startDate)} → {formatDate(data.endDate)}
                </Text>
              </View>
              {data.mileage != null && (
                <View style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Kilométrage</Text>
                  <Text>{data.mileage.toLocaleString("fr-FR")} km</Text>
                </View>
              )}
              {data.fuelLevel && (
                <View style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Carburant</Text>
                  <Text>{FUEL_LABELS[data.fuelLevel] ?? data.fuelLevel}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Client + Véhicule */}
        <View style={{ ...styles.section, flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.customerBlock}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                {data.customer.firstName} {data.customer.lastName}
              </Text>
              <Text>{data.customer.email}</Text>
              <Text>{data.customer.phone}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Véhicule</Text>
            <View style={styles.customerBlock}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                {data.vehicle.brand} {data.vehicle.model}
              </Text>
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

        {/* Photos */}
        {data.photos.length > 0 && (
          <View style={styles.section} wrap={false}>
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
