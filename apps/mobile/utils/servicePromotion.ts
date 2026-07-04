export const isServicePromoted = (service: any) =>
  Boolean(
    service?.socialMediaPromotion?.enabled &&
      service?.socialMediaPromotion?.status === "PAID",
  );
