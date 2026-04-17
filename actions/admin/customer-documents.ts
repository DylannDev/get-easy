"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/composition-root/container";

export async function getCustomerDocumentInlineUrl(
  id: string
): Promise<string | null> {
  const { customerDocumentRepository } = getContainer();
  return customerDocumentRepository.getSignedUrl(id);
}

export async function getCustomerDocumentDownloadUrl(
  id: string
): Promise<string | null> {
  const { customerDocumentRepository } = getContainer();
  return customerDocumentRepository.getSignedUrl(id, { forceDownload: true });
}

export async function deleteCustomerDocument(
  id: string,
  redirectPaths: { customerId?: string; bookingId?: string }
) {
  const { customerDocumentRepository } = getContainer();
  await customerDocumentRepository.delete(id);
  if (redirectPaths.customerId) {
    revalidatePath(`/admin/clients/${redirectPaths.customerId}`);
  }
  if (redirectPaths.bookingId) {
    revalidatePath(`/admin/reservations/${redirectPaths.bookingId}`);
  }
}
