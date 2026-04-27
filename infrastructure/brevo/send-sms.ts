import "server-only";

const BREVO_API_URL = "https://api.brevo.com/v3/transactionalSMS/sms";

interface SendSmsInput {
  to: string;
  content: string;
  sender?: string;
}

/**
 * Envoie un SMS transactionnel via l'API Brevo.
 * Nécessite la variable d'environnement `BREVO_API_KEY`.
 *
 * Le numéro `to` doit être au format international (ex. "+594694030670").
 * `sender` est limité à 11 caractères alphanumériques par Brevo.
 */
export async function sendSms(input: SendSmsInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[sendSms] BREVO_API_KEY non configurée — SMS non envoyé.");
    return;
  }

  const sender = input.sender ?? "GetEasy";

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      type: "transactional",
      unicodeEnabled: true,
      sender,
      recipient: input.to,
      content: input.content,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `[sendSms] Brevo error ${response.status}: ${body}`
    );
  }
}
