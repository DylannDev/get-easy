import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/**
 * Template PDF du contrat — 100 % statique.
 *
 * Depuis 6A.3, l'édition du contrat se fait dans l'application (formulaire
 * dédié côté admin) et le PDF généré n'est jamais modifiable. Cela garantit
 * qu'un PDF qui sort de l'app (téléchargement, envoi par email, etc.) ne
 * peut pas être altéré par le destinataire.
 *
 * Les signatures, si présentes, sont embarquées comme images (data URL) dans
 * les encadrés dédiés en fin de document.
 */

export interface ContractData {
  generatedAt: Date;

  agency: {
    name: string;
    legalForm?: string | null;
    capitalSocial?: string | null;
    address: string;
    postalCode?: string | null;
    city: string;
    country?: string | null;
    rcsCity?: string | null;
    rcsNumber?: string | null;
    siret?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };

  // Section "Locataire" — valeurs éditables (éditeur de contrat admin).
  customer: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    birthPlace?: string;
    idNumber?: string;
    idIssuedAt?: string;
    licenseNumber?: string;
    licenseIssuedAt?: string;
    licenseValidUntil?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
  };

  vehicle: {
    brand?: string;
    model?: string;
    color?: string;
    registrationPlate?: string;
    fiscalPower?: string;
    mileageStart?: string;
    mileageEnd?: string;
    fuelStart?: string;
    fuelEnd?: string;
  };

  rental: {
    durationLabel?: string;
    start?: string; // libellé prêt à afficher
    end?: string;
    pricePerDay?: string;
    priceTotal?: string;
    returnAddress?: string;
    returnDatetime?: string;
    constatDate?: string;
    contractCity?: string;
    contractDate?: string;
  };

  /** Data URL PNG des signatures, si le contrat est signé. */
  customerSignature?: string | null;
  loueurSignature?: string | null;
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 34,
    paddingTop: 30,
    paddingBottom: 46,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111",
    lineHeight: 1.3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  logo: { width: 90, height: 40, objectFit: "contain" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  intro: { marginBottom: 6 },
  partyTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginTop: 8,
    marginBottom: 4,
  },
  block: { marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 155, color: "#555" },
  value: { flex: 1 },
  valueBlank: { flex: 1, color: "#888", fontStyle: "italic" },
  articleTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginTop: 9,
    marginBottom: 3,
  },
  paragraph: { marginBottom: 4, textAlign: "justify" },
  bullet: { flexDirection: "row", marginBottom: 1.5 },
  bulletDot: { width: 9 },
  bulletText: { flex: 1 },
  signatureBlock: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: "#333",
    borderRadius: 3,
    padding: 6,
  },
  signatureLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 2,
  },
  signatureHint: {
    fontSize: 7.5,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 4,
  },
  signatureArea: {
    height: 70,
    backgroundColor: "#fafafa",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  signatureImage: { height: 70, width: "100%", objectFit: "contain" },
  pageNumber: {
    position: "absolute",
    bottom: 16,
    right: 34,
    fontSize: 7.5,
    color: "#666",
  },
});

function Row({ label, value }: { label: string; value?: string | null }) {
  const hasValue = value !== undefined && value !== null && value.trim().length > 0;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={hasValue ? styles.value : styles.valueBlank}>
        {hasValue ? value : "—"}
      </Text>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export function ContractPDFDocument({ data }: { data: ContractData }) {
  const a = data.agency;
  const c = data.customer;
  const v = data.vehicle;
  const r = data.rental;

  const agencyAddress = [
    a.address,
    [a.postalCode, a.city].filter(Boolean).join(" "),
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
  const customerAddress = [
    c.address,
    [c.postalCode, c.city].filter(Boolean).join(" "),
    c.country,
  ]
    .filter(Boolean)
    .join(", ");

  const capitalFmt = a.capitalSocial
    ? /€|eur/i.test(a.capitalSocial)
      ? a.capitalSocial
      : `${a.capitalSocial} €`
    : null;
  const rcsFmt =
    a.rcsCity && a.rcsNumber ? `${a.rcsCity} ${a.rcsNumber}` : null;
  const customerName =
    c.firstName || c.lastName
      ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
      : "";
  const birthFmt =
    c.birthPlace && c.birthDate
      ? `${c.birthDate} à ${c.birthPlace}`
      : c.birthDate || c.birthPlace || "";

  return (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {a.logoUrl ? (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image src={a.logoUrl} style={styles.logo} />
          ) : (
            <View style={{ width: 90, height: 40 }} />
          )}
          <Text style={styles.title}>CONTRAT DE LOCATION DE VÉHICULE</Text>
          <View style={{ width: 90 }} />
        </View>

        <Text style={styles.intro}>Entre les soussignés :</Text>

        <Text style={styles.partyTitle}>Le Loueur</Text>
        <View style={styles.block}>
          <Row label="Dénomination" value={a.name} />
          <Row label="Forme juridique" value={a.legalForm ?? undefined} />
          <Row label="Capital social" value={capitalFmt ?? undefined} />
          <Row label="Adresse" value={agencyAddress || undefined} />
          <Row label="RCS" value={rcsFmt ?? undefined} />
          <Row label="SIRET" value={a.siret ?? undefined} />
          <Row label="Téléphone" value={a.phone ?? undefined} />
          <Row label="Email" value={a.email ?? undefined} />
        </View>

        <Text style={styles.partyTitle}>Et : Le Locataire</Text>
        <View style={styles.block}>
          <Row label="Nom et prénoms" value={customerName || undefined} />
          <Row label="Date et lieu de naissance" value={birthFmt || undefined} />
          <Row label="N° pièce d'identité" value={c.idNumber} />
          <Row label="Délivrée le" value={c.idIssuedAt} />
          <Row label="N° permis de conduire" value={c.licenseNumber} />
          <Row label="Délivré le" value={c.licenseIssuedAt} />
          <Row label="Valable jusqu'au" value={c.licenseValidUntil} />
          <Row label="Adresse" value={customerAddress || undefined} />
          <Row label="Téléphone" value={c.phone} />
          <Row label="Email" value={c.email} />
        </View>

        <Text style={styles.paragraph}>
          Le locataire certifie avoir le permis de conduire en état de
          validité l&apos;autorisant à conduire le véhicule sous contrat.
        </Text>

        <Text style={styles.articleTitle}>Article 1.1 — Objet du contrat</Text>
        <Text style={styles.paragraph}>
          Le présent contrat a pour objet la location d&apos;un véhicule
          automobile appartenant à la société {a.name}. Le Loueur met à la
          disposition du Locataire un véhicule en bon état de fonctionnement,
          conforme aux prescriptions légales.
        </Text>
        <View style={styles.block}>
          <Row label="Marque" value={v.brand} />
          <Row label="Modèle" value={v.model} />
          <Row label="Puissance (CV)" value={v.fiscalPower} />
          <Row label="Couleur" value={v.color} />
          <Row label="Immatriculation" value={v.registrationPlate} />
          <Row label="Kilométrage (départ)" value={v.mileageStart} />
          <Row label="Niveau carburant (départ)" value={v.fuelStart} />
        </View>
        <Text style={styles.paragraph}>
          Le véhicule demeure la propriété exclusive du Loueur. Ce contrat ne
          peut être assimilé à un contrat de transport, de prêt ou de
          crédit-bail.
        </Text>

        <Text style={styles.articleTitle}>
          Article 1.2 — Conditions générales de location
        </Text>
        <Text style={styles.paragraph}>
          L&apos;âge requis pour la location est de 23 ans, en possession
          d&apos;un permis de conduire valide depuis au moins 3 ans. Un
          supplément de caution jeune conducteur de 1 800,00 € à 2 500,00 €
          maximum peut être demandé pour les conducteurs de moins de 23 ans.
        </Text>
        <Text style={styles.paragraph}>
          Le paiement est possible avec les cartes de crédit Mastercard, Visa
          ou Eurocard. Les cartes bancaires nationales et cartes de retrait
          ne sont pas acceptées. Le titulaire de la carte doit être inscrit
          en premier conducteur.
        </Text>

        <Text style={styles.articleTitle}>Article 2 — Durée de la location</Text>
        <Text style={styles.paragraph}>
          La durée correspond à la période pendant laquelle le locataire est
          responsable du véhicule, depuis la remise des clés jusqu&apos;à la
          restitution effective.
        </Text>
        <View style={styles.block}>
          <Row label="Durée totale" value={r.durationLabel} />
          <Row label="Du" value={r.start} />
          <Row label="Au" value={r.end} />
        </View>
        <Text style={styles.paragraph}>
          Tout retard non autorisé sera facturé 39,00 € par tranche de 24 H
          entamée. Toute prolongation doit être formulée avant
          l&apos;expiration du contrat et acceptée expressément par le
          loueur. En cas de restitution anticipée, aucun remboursement
          n&apos;est effectué.
        </Text>

        <Text style={styles.articleTitle}>Article 3 — Montant de la location</Text>
        <View style={styles.block}>
          <Row label="Prix / jour" value={r.pricePerDay} />
          <Row label="Total location" value={r.priceTotal} />
        </View>
        <Text style={styles.paragraph}>
          En cas de prolongation autorisée, le Locataire devra régler
          immédiatement le complément. Tout retard de paiement entraîne
          l&apos;application de pénalités au taux légal en vigueur.
        </Text>

        <Text style={styles.articleTitle}>Article 4 — Caution</Text>
        <Text style={styles.paragraph}>
          Caution de 1 000,00 € exigée à la prise en charge. Elle est
          restituée si le véhicule est rendu propre et sans dommages. Le
          loueur se réserve 48 H pour contester. Elle peut couvrir : frais
          de réparation, nettoyage (120,00 €), carburant non remis à niveau
          (90,00 €).
        </Text>

        <Text style={styles.articleTitle}>
          Article 5 — Assurance, responsabilité et franchise
        </Text>
        <Text style={styles.paragraph}>
          Le véhicule est assuré au titre de la responsabilité civile
          obligatoire. En cas de sinistre (accident, vol, dégradation), une
          franchise de 1 200,00 € reste à la charge du Locataire. Toute
          dégradation, infraction ou amende reste à sa charge. Le montant
          des réparations est déduit du dépôt de garantie.
        </Text>

        <Text style={styles.articleTitle}>Article 6 — Utilisation du véhicule</Text>
        <Text style={styles.paragraph}>Le locataire s&apos;engage à :</Text>
        <Bullet>Utiliser le véhicule uniquement pour un usage personnel.</Bullet>
        <Bullet>
          Veiller à la sécurité du véhicule et le garer dans des lieux sûrs.
        </Bullet>
        <Bullet>
          Informer immédiatement le loueur de toute panne, accident, vol ou
          dégradation.
        </Bullet>
        <Bullet>
          Restituer le véhicule à la date et heure prévues, avec le plein
          de carburant.
        </Bullet>
        <Bullet>Respecter le Code de la route.</Bullet>
        <Bullet>
          Surveiller les niveaux (huile, eau, pression des pneus)
          {a.phone
            ? ` et contacter le loueur au ${a.phone} en cas de problème.`
            : "."}
        </Bullet>
        <Bullet>
          Ne pas quitter le territoire autorisé
          {a.country ? ` : ${a.country}.` : "."}
        </Bullet>
        <Text style={styles.paragraph}>Il est interdit :</Text>
        <Bullet>D&apos;utiliser le véhicule à des fins illicites ou dangereuses.</Bullet>
        <Bullet>
          De participer à des compétitions, courses ou essais chronométrés.
        </Bullet>
        <Bullet>De sous-louer, prêter ou céder le véhicule à un tiers.</Bullet>
        <Bullet>De transporter des passagers ou marchandises illégales.</Bullet>
        <Bullet>D&apos;utiliser le véhicule pour un remorquage.</Bullet>
        <Bullet>
          De conduire sous l&apos;influence d&apos;alcool, de stupéfiants ou
          toute substance altérant les facultés.
        </Bullet>

        <Text style={styles.articleTitle}>
          Article 7 — Panne, accident, état des lieux
        </Text>
        <Text style={styles.paragraph}>
          Le Locataire s&apos;engage à rembourser l&apos;intégralité des
          réparations en cas de dommage. Aucune réparation ne peut être
          effectuée sans accord préalable.
          {a.phone ? ` Contact d'urgence : ${a.phone}.` : ""}
        </Text>
        <Row label="Constat amiable établi le" value={r.constatDate} />
        <Text style={styles.paragraph}>
          Un état des lieux contradictoire est établi à la remise et à la
          restitution. Toute dégradation intérieure ou extérieure constatée
          fera l&apos;objet d&apos;une facturation.
        </Text>

        <Text style={styles.articleTitle}>Article 8 — Restitution du véhicule</Text>
        <View style={styles.block}>
          <Row
            label="Adresse de restitution"
            value={r.returnAddress || agencyAddress}
          />
          <Row label="Date et heure" value={r.returnDatetime || r.end} />
          <Row label="Kilométrage (retour)" value={v.mileageEnd} />
          <Row label="Niveau carburant (retour)" value={v.fuelEnd} />
        </View>
        <Text style={styles.paragraph}>
          Restitution dans l&apos;état initial (sous réserve de l&apos;usure
          normale), avec le plein de carburant et tous les équipements
          fournis. En cas de restitution tardive, 39,00 € par tranche de
          24 H seront appliqués.
        </Text>

        <Text style={styles.articleTitle}>
          Article 9 — Dispositif de géolocalisation
        </Text>
        <Text style={styles.paragraph}>
          Tous les véhicules de {a.name} sont équipés d&apos;un traceur GPS
          pour la sécurité du véhicule, la gestion du parc et le constat
          d&apos;usage non conforme. Données conservées 30 jours max, sauf
          incident. Droits d&apos;accès, rectification et opposition
          conformes au RGPD.
        </Text>

        <Text style={styles.articleTitle}>
          Article 10 — Droit applicable et litiges
        </Text>
        <Text style={styles.paragraph}>
          Le présent contrat est soumis à la législation française. En cas
          de litige, les parties s&apos;engagent à rechercher une solution
          amiable avant toute procédure. À défaut, tribunaux compétents du
          siège de {a.name}.
        </Text>

        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={styles.label}>Fait à</Text>
          <Text style={styles.value}>
            {r.contractCity || a.city || ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Le</Text>
          <Text style={styles.value}>{r.contractDate || ""}</Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: 4 }]}>
          Signatures précédées de la mention « lu et approuvé ».
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Locataire</Text>
            <Text style={styles.signatureHint}>« lu et approuvé »</Text>
            <View style={styles.signatureArea}>
              {data.customerSignature ? (
                /* eslint-disable-next-line jsx-a11y/alt-text */
                <Image
                  src={data.customerSignature}
                  style={styles.signatureImage}
                />
              ) : null}
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le Loueur</Text>
            <Text style={styles.signatureHint}>« lu et approuvé »</Text>
            <View style={styles.signatureArea}>
              {data.loueurSignature ? (
                /* eslint-disable-next-line jsx-a11y/alt-text */
                <Image
                  src={data.loueurSignature}
                  style={styles.signatureImage}
                />
              ) : null}
            </View>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </PDFDocument>
  );
}
