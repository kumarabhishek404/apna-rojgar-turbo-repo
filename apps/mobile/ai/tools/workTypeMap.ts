import { WORKTYPES } from "@/constants";

export type WorkTypeOption = { value: string; labelKey: string };

export function listWorkTypes(): WorkTypeOption[] {
  return (Array.isArray(WORKTYPES) ? WORKTYPES : []).map((type: any) => ({
    value: String(type.value),
    labelKey: String(type.label || type.value),
  }));
}

export function listSubTypes(workType?: string): WorkTypeOption[] {
  const type = (Array.isArray(WORKTYPES) ? WORKTYPES : []).find(
    (row: any) => String(row?.value) === String(workType),
  );
  return (type?.subTypes || []).map((sub: any) => ({
    value: String(sub.value),
    labelKey: String(sub.label || sub.value),
  }));
}

export function listWorkerTypes(workType?: string, subType?: string): WorkTypeOption[] {
  const type = (Array.isArray(WORKTYPES) ? WORKTYPES : []).find(
    (row: any) => String(row?.value) === String(workType),
  );
  const sub = (type?.subTypes || []).find(
    (row: any) => String(row?.value) === String(subType),
  );
  return (sub?.workerTypes || []).map((worker: any) => ({
    value: String(worker.value),
    labelKey: String(worker.label || worker.value),
  }));
}

export function mapSkillToWorkCategory(skill?: string): {
  type: string;
  subType: string;
} {
  const needle = String(skill || "").toLowerCase().trim();
  if (needle && Array.isArray(WORKTYPES)) {
    for (const type of WORKTYPES) {
      for (const sub of type?.subTypes || []) {
        for (const worker of sub?.workerTypes || []) {
          if (String(worker?.value || "").toLowerCase() === needle) {
            return { type: String(type.value), subType: String(sub.value) };
          }
        }
      }
    }
  }
  return { type: "homeMaintenance", subType: "homeRepair" };
}

export function matchOption(
  text: string,
  options: WorkTypeOption[],
  translate: (key: string) => string,
): string | undefined {
  const n = String(text || "").toLowerCase().trim();
  if (!n) return undefined;
  for (const opt of options) {
    const value = opt.value.toLowerCase();
    const label = String(translate(opt.labelKey) || "").toLowerCase();
    if (n === value || n === label || n === opt.labelKey.toLowerCase()) {
      return opt.value;
    }
  }
  for (const opt of options) {
    const label = String(translate(opt.labelKey) || "").toLowerCase();
    if (label && n.includes(label)) return opt.value;
  }
  return undefined;
}
