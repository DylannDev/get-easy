import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/**
 * Template PDF de devis — rendu côté serveur via `@react-pdf/renderer`.
 * Cloné de `invoice-template.tsx` : mêmes blocs (coordonnées agence,
 * client, détail location, lignes) ; seules diffèrent l'en-tête (titre
 * "Devis" + date de validité au lieu du statut "Payée") et l'absence
 * de mention de paiement.
 */

export interface QuoteDataAgency {
  name: string;
  address: string;
  city: string;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  legalForm?: string | null;
  capitalSocial?: string | null;
  rcsCity?: string | null;
  rcsNumber?: string | null;
  siret?: string | null;
  tvaIntracom?: string | null;
  logoUrl?: string | null;
  vatEnabled: boolean;
  rib?: string | null;
  showRibOnQuote?: boolean;
}

export interface QuoteDataCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  /** Champs pro (B2B). Si `companyName` rempli, le bloc "Client" affiche
   *  l'entreprise comme entité principale. */
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
}

export interface QuoteDataVehicle {
  brand: string;
  model: string;
  registrationPlate: string;
}

export interface QuoteLineItem {
  label: string;
  quantity: number;
  unitPriceTTC: number;
  totalTTC: number;
}

export interface QuoteData {
  quoteNumber: string;
  issuedAt: Date;
  /** Date limite de validité du devis (au-delà, prix non garantis). */
  validUntil: Date;
  agency: QuoteDataAgency;
  customer: QuoteDataCustomer;
  vehicle: QuoteDataVehicle;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  pricePerDay: number;
  items: QuoteLineItem[];
  totalTTC: number;
}

const VAT_RATE = 0.2;

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
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  colLabel: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsBlock: {
    alignSelf: "flex-end",
    width: 220,
    marginTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#111",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
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

function fmtMoney(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export function QuotePDFDocument({ data }: { data: QuoteData }) {
  const ttc = data.totalTTC;
  const ht = data.agency.vatEnabled ? ttc / (1 + VAT_RATE) : ttc;
  const vat = data.agency.vatEnabled ? ttc - ht : 0;

  // Ordre demandé : nom (en partyName) → adresse → ville/CP → pays → téléphone → email
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
  if (data.agency.tvaIntracom)
    legalLines.push(`TVA ${data.agency.tvaIntracom}`);

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
            DEVIS-{data.quoteNumber.replace(/^DEV-/, "")}
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
                    À l&apos;attention de {data.customer.firstName}{" "}
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

        {/* Détail de la location encadré */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail de la location</Text>
          <View style={styles.detailsBlock}>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Date d&apos;émission</Text>
              <Text>{formatDate(data.issuedAt)}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Valable jusqu&apos;au</Text>
              <Text>{formatDate(data.validUntil)}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Véhicule</Text>
              <Text>
                {data.vehicle.brand} {data.vehicle.model}
              </Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Immatriculation</Text>
              <Text>{data.vehicle.registrationPlate}</Text>
            </View>
            <View style={styles.metaLine}>
              <Text style={styles.metaLabel}>Période</Text>
              <Text>
                {formatDateTime(data.startDate)} - {formatDateTime(data.endDate)}
              </Text>
            </View>
            <View style={{ ...styles.metaLine, marginBottom: 0 }}>
              <Text style={styles.metaLabel}>Durée</Text>
              <Text>
                {data.numberOfDays} jour{data.numberOfDays > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Lignes */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colLabel}>Désignation</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>Prix unitaire</Text>
            <Text style={styles.colTotal}>Total TTC</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colLabel}>{item.label}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{fmtMoney(item.unitPriceTTC)}</Text>
              <Text style={styles.colTotal}>{fmtMoney(item.totalTTC)}</Text>
            </View>
          ))}

          {/* Totaux */}
          <View style={styles.totalsBlock}>
            {data.agency.vatEnabled ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.metaLabel}>Total HT</Text>
                  <Text>{fmtMoney(ht)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.metaLabel}>
                    TVA ({(VAT_RATE * 100).toFixed(0)} %)
                  </Text>
                  <Text>{fmtMoney(vat)}</Text>
                </View>
              </>
            ) : null}
            <View style={styles.grandTotal}>
              <Text>Total {data.agency.vatEnabled ? "TTC" : ""}</Text>
              <Text>{fmtMoney(ttc)}</Text>
            </View>
          </View>

          {!data.agency.vatEnabled && (
            <Text style={{ marginTop: 12, fontStyle: "italic", color: "#555" }}>
              TVA non applicable, art. 293 B du CGI.
            </Text>
          )}
        </View>

        {/* RIB — affiché uniquement si l'agence a coché l'option */}
        {data.agency.showRibOnQuote && data.agency.rib && (
          <View
            style={{
              marginTop: 16,
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 10,
                marginBottom: 4,
              }}
            >
              Coordonnées bancaires (IBAN)
            </Text>
            <Text style={{ fontSize: 10 }}>{data.agency.rib}</Text>
          </View>
        )}

        {/* Footer — mentions légales */}
        <Text style={styles.footer}>
          {[data.agency.name, ...legalLines].join(" · ")}
        </Text>
      </Page>
    </PDFDocument>
  );
}
