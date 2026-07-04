import type { QueryClient } from "@tanstack/react-query";

const SERVICE_LIST_QUERY_KEYS = [
  ["activityEmployerServices"],
  ["activityMediatorServices"],
  ["myServices"],
  ["unifiedHomeMyPostedServices"],
  ["employerWorkRequests"],
  ["myWorkRequests"],
  ["employerServices"],
] as const;

const REFETCH_IMMEDIATELY_KEYS = [
  ["activityEmployerServices"],
  ["activityMediatorServices"],
] as const;

export async function invalidateAndRefetchServiceLists(
  queryClient: QueryClient,
  serviceId?: string,
) {
  await Promise.all(
    SERVICE_LIST_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );

  if (serviceId) {
    await queryClient.invalidateQueries({
      queryKey: ["serviceDetails", serviceId],
    });
  }

  await Promise.all(
    REFETCH_IMMEDIATELY_KEYS.map((queryKey) =>
      queryClient.refetchQueries({ queryKey, type: "active" }),
    ),
  );
}
