import { initials } from "@/lib/format";

interface AvatarProps {
  name: string;
  src: string;
  /** Accessible label; defaults to the name. */
  label?: string;
  /** Size, border and initials font size. */
  className?: string;
}

/** Round portrait; the initials underneath show through if the image fails to load. */
export function Avatar({ name, src, label = name, className = "" }: AvatarProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-[#E8EAF2] font-display font-bold leading-none text-muted ${className}`}
    >
      <span aria-hidden>{initials(name)}</span>
      <span
        role="img"
        aria-label={label}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${src}")` }}
      />
    </div>
  );
}
