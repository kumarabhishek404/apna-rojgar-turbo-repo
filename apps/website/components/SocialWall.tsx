import { SOCIAL_BRAND_ICON_BY_ID } from "@/components/social/socialBrandIcons";
import { SOCIAL_NAV_ITEMS } from "@/constants/social";

export default function SocialWall() {
  return (
    <aside
      className="pointer-events-none fixed right-[max(0.5rem,env(safe-area-inset-right,0px))] top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-md md:pointer-events-auto md:flex lg:right-[max(0.75rem,env(safe-area-inset-right,0px))]"
      aria-label="Social links"
    >
      {SOCIAL_NAV_ITEMS.map(({ id, label, href }) => {
        const Icon = SOCIAL_BRAND_ICON_BY_ID[id];
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={label}
            title={label}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#22409a] transition hover:bg-slate-100 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22409a] active:scale-[0.98]"
          >
            <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 overflow-visible" aria-hidden />
          </a>
        );
      })}
    </aside>
  );
}
