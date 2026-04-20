import type { PricingTargetGroupIconId } from "@features/pricing";

type IconProps = {
  className?: string;
};

function CitizensIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 20v-2.2A3.8 3.8 0 0 1 11.8 14h.4A3.8 3.8 0 0 1 16 17.8V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20v-1.1c0-1.5 1.2-2.7 2.7-2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19.5 20v-1.1c0-1.5-1.2-2.7-2.7-2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function OrganizationsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6.5 20V9.2l5.5-2.7V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 20V4l5.5 2.7V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.8 11.5h1.2M8.8 14h1.2M14 9h1.2M14 12h1.2M14 15h1.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MunicipalitiesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3.8 20h16.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6.2 20V10.5h11.6V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 4.2 4.8 9.4h14.4L12 4.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10.2 20v-4.3h3.6V20M8.2 13h.8M15 13h.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MediaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.8" y="6.2" width="16.4" height="11.6" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.2 10h5.3M7.2 12.9h3.8M15.1 10h1.7M15.1 12.9h1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.4 17.8v2.1M15.6 17.8v2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function VogSystemIcon({ icon, className }: { icon: PricingTargetGroupIconId; className?: string }) {
  switch (icon) {
    case "citizens":
      return <CitizensIcon className={className} />;
    case "organizations":
      return <OrganizationsIcon className={className} />;
    case "municipalities":
      return <MunicipalitiesIcon className={className} />;
    case "media":
      return <MediaIcon className={className} />;
    default:
      return null;
  }
}
