export type SocialMediaPromotion = {
  enabled?: boolean;
  status?: string;
  orderId?: string;
  amount?: number;
  paidAt?: string;
};

export const isServicePromoted = (
  service?: {
    socialMediaPromotion?: SocialMediaPromotion | null;
  } | null,
) =>
  Boolean(
    service?.socialMediaPromotion?.enabled &&
      service?.socialMediaPromotion?.status === "PAID",
  );
