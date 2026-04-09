export const PaymentStatus = {
  Created: "created",
  Succeeded: "succeeded",
  Failed: "failed",
  Refunded: "refunded",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
