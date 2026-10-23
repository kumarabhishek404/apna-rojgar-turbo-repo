import { useSyncExternalStore } from "react";
import { router } from "expo-router";
import type { AdminService, AdminUser } from "@/lib/types";

const users = new Map<string, AdminUser>();
const services = new Map<string, AdminService>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecordsVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

export function rememberUser(user: AdminUser) {
  users.set(user._id, { ...users.get(user._id), ...user });
}

export function rememberUsers(rows: AdminUser[]) {
  rows.forEach(rememberUser);
  emit();
}

export function rememberService(service: AdminService) {
  services.set(service._id, { ...services.get(service._id), ...service });
}

export function rememberServices(rows: AdminService[]) {
  rows.forEach(rememberService);
  emit();
}

export function getUser(id: string) {
  return users.get(id) || null;
}

export function getService(id: string) {
  return services.get(id) || null;
}

export function patchUser(id: string, patch: Partial<AdminUser>) {
  const current = users.get(id);
  if (!current) return;
  users.set(id, { ...current, ...patch });
  emit();
}

export function patchService(id: string, patch: Partial<AdminService>) {
  const current = services.get(id);
  if (!current) return;
  services.set(id, { ...current, ...patch });
  emit();
}

export function openUser(user: AdminUser) {
  rememberUser(user);
  emit();
  router.push(`/user/${user._id}`);
}

export function openService(service: AdminService) {
  rememberService(service);
  emit();
  router.push(`/service/${service._id}`);
}
