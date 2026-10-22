"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuCrown,
  LuLayers,
  LuShield,
  LuSlidersHorizontal,
  LuUser,
} from "react-icons/lu";

interface RoleOption {
  href: string;
  role: string;
  label: string;
  tier: string;
  level: string;
  icon: typeof LuCrown;
  activeBg: string;
  activeRing: string;
  iconColor: string;
  badgeActive: string;
}

const ROLES: RoleOption[] = [
  {
    href: "/sm",
    role: "SM",
    label: "Sales Manager",
    tier: "Zone Head",
    level: "L1",
    icon: LuCrown,
    activeBg: "bg-[#0f172a] text-white",
    activeRing: "ring-1 ring-sky-400/50 shadow-sm",
    iconColor: "text-amber-400",
    badgeActive: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40",
  },
  {
    href: "/csdo",
    role: "CSDO",
    label: "Chief SDO",
    tier: "Regional",
    level: "L2",
    icon: LuShield,
    activeBg: "bg-[#11734a] text-white",
    activeRing: "ring-1 ring-emerald-400/50 shadow-sm",
    iconColor: "text-emerald-300",
    badgeActive: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40",
  },
  {
    href: "/sdo",
    role: "SDO",
    label: "Team Leader",
    tier: "Field Team",
    level: "L3",
    icon: LuLayers,
    activeBg: "bg-[#8e3479] text-white",
    activeRing: "ring-1 ring-pink-400/50 shadow-sm",
    iconColor: "text-pink-300",
    badgeActive: "bg-pink-500/20 text-pink-200 ring-1 ring-pink-400/40",
  },
  {
    href: "/",
    role: "SO",
    label: "Sales Organizer",
    tier: "Frontline",
    level: "L4",
    icon: LuUser,
    activeBg: "bg-[#2563eb] text-white",
    activeRing: "ring-1 ring-blue-400/50 shadow-sm",
    iconColor: "text-sky-300",
    badgeActive: "bg-blue-500/20 text-sky-200 ring-1 ring-blue-400/40",
  },
];

interface RoleSwitcherProps {
  className?: string;
}

/**
 * Role Filter & Switcher Card:
 * Positioned directly below the promo carousel to seamlessly navigate between
 * all 4 tiers of the Ayadi sales hierarchy (SM -> CSDO -> SDO -> SO).
 */
export function RoleSwitcher({ className = "" }: RoleSwitcherProps) {
  const pathname = usePathname();

  const currentRole =
    ROLES.find((r) =>
      r.href === "/" ? pathname === "/" : pathname.startsWith(r.href)
    ) || ROLES[0];

  return (
    <section
      aria-label="Sales Hierarchy Role Filter"
      className={`flex flex-col gap-2 rounded-2xl border border-[#cbd5e1]/80 bg-white p-3 shadow-xs ${className}`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <LuSlidersHorizontal size={13} className="text-[#0284c7]" />
          <span className="text-[11px] font-extrabold tracking-wider text-[#475569] uppercase">
            Role Filter · Hierarchy View
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Active: {currentRole.role} ({currentRole.tier})
          </span>
        </div>
      </div>

      {/* 4-Tier Grid */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {ROLES.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex cursor-pointer flex-col gap-1 rounded-xl p-2.5 transition-all ${
                isActive
                  ? `${item.activeBg} ${item.activeRing}`
                  : "border border-[#e2e8f0] bg-[#f8fafc] text-navy hover:border-[#cbd5e1] hover:bg-white hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    size={15}
                    className={
                      isActive
                        ? item.iconColor
                        : "text-pewter transition-colors group-hover:text-navy"
                    }
                  />
                  <span className="text-[13px] font-black tracking-tight">
                    {item.role}
                  </span>
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                    isActive
                      ? item.badgeActive
                      : "bg-[#e2e8f0]/80 text-[#64748b] group-hover:bg-[#cbd5e1]/60"
                  }`}
                >
                  {item.level}
                </span>
              </div>

              <div className="flex flex-col leading-none">
                <span
                  className={`truncate text-[11px] font-bold ${
                    isActive ? "text-white" : "text-navy"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`mt-0.5 truncate text-[10px] font-medium ${
                    isActive ? "text-white/70" : "text-pewter"
                  }`}
                >
                  {item.tier}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
