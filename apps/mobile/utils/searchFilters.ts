import { calculateDistance } from "@/constants/functions";
import {
  resolveDisplayUserRole,
  type AppUserRole,
} from "@/utils/resolveDisplayUserRole";

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type GeoLike = {
  coordinates?: unknown;
};

const DISTANCE_TO_KM: Record<string, number> = {
  within_5km: 5,
  within_10km: 10,
  within_25km: 25,
  within_50km: 50,
  within_100km: 100,
};

export const getDistanceFilterKm = (filterKey?: string | null) => {
  if (!filterKey) return null;
  return DISTANCE_TO_KM[filterKey] ?? null;
};

export const extractGeoPoint = (location?: GeoLike | null): GeoPoint | null => {
  const coordinates = Array.isArray(location?.coordinates)
    ? location.coordinates
    : null;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

export const getDistanceBetweenLocations = (
  userLocation?: GeoLike | null,
  targetLocation?: GeoLike | null,
) => {
  const userPoint = extractGeoPoint(userLocation);
  const targetPoint = extractGeoPoint(targetLocation);

  if (!userPoint || !targetPoint) {
    return null;
  }

  const distance = calculateDistance(userPoint, targetPoint);
  return Number.isFinite(distance) ? distance : null;
};

export const matchesDistanceFilter = (
  filterKey?: string | null,
  userLocation?: GeoLike | null,
  targetLocation?: GeoLike | null,
) => {
  if (!filterKey || filterKey === "anywhere") {
    return true;
  }

  const distance = getDistanceBetweenLocations(userLocation, targetLocation);
  if (distance == null) {
    return false;
  }

  if (filterKey === "more_than_100km") {
    return distance > 100;
  }

  const maxDistance = getDistanceFilterKm(filterKey);
  if (maxDistance == null) {
    return true;
  }

  return distance <= maxDistance;
};

export const matchesUserRoleFilter = (
  filterRole?: AppUserRole | "" | null,
  user?: { role?: unknown; skills?: unknown } | null,
) => {
  if (!filterRole) {
    return true;
  }

  return resolveDisplayUserRole(user ?? {}) === filterRole;
};

export const applyWorkerClientFilters = (
  users: any[],
  filters: {
    distance?: string;
    role?: AppUserRole | "";
    skills?: string[];
  },
  loggedInUserLocation?: GeoLike | null,
) => {
  return users?.filter((user) => {
    const userLocation = user?.geoLocation ?? user?.location;
    const roleMatch = matchesUserRoleFilter(filters?.role, user);
    const distanceMatch = matchesDistanceFilter(
      filters?.distance,
      loggedInUserLocation,
      userLocation,
    );

    if (!roleMatch || !distanceMatch) {
      return false;
    }

    if (!filters?.skills?.length) {
      return true;
    }

    const normalizedSelectedSkills = filters.skills.map(String);
    const userSkills = Array.isArray(user?.skills) ? user.skills : [];

    return userSkills.some((entry: any) => {
      if (typeof entry === "string") {
        return normalizedSelectedSkills.includes(entry);
      }

      if (entry && typeof entry === "object") {
        return normalizedSelectedSkills.includes(String(entry?.skill ?? ""));
      }

      return false;
    });
  });
};

export const applyServiceClientDistanceFilter = (
  services: any[],
  filters: {
    distance?: string;
  },
  loggedInUserLocation?: GeoLike | null,
) => {
  return services?.filter((service) =>
    matchesDistanceFilter(
      filters?.distance,
      loggedInUserLocation,
      service?.geoLocation ?? service?.location,
    ),
  );
};
