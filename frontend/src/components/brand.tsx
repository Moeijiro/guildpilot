import { BrandMark } from "@/components/kit/brand";

/** A compass needle: guiding new members. */
export function Logo({ wordmark = true, className }: { wordmark?: boolean; className?: string }) {
  return (
    <BrandMark name="GuildPilot" wordmark={wordmark} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </BrandMark>
  );
}
