"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuCrown, LuLayers, LuShield, LuUser } from "react-icons/lu";

export function RoleNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/sm",
      role: "SM",
      label: "Sales Manager",
      icon: LuCrown,
      tag: "Zone Head",
      activeBg: "bg-[#0f172a] text-white shadow-sm ring-1 ring-sky-400/40",
      iconColor: "text-amber-400",
    },
    {
      href: "/csdo",
      role: "CSDO",
      label: "Chief SDO",
      icon: LuShield,
      tag: "Regional",
      activeBg: "bg-[#11734a] text-white shadow-sm ring-1 ring-emerald-400/40",
      iconColor: "text-emerald-300",
    },
    {
      href: "/sdo",
      role: "SDO",
      label: "Team Leader",
      icon: LuLayers,
      tag: "Field Team",
      activeBg: "bg-[#8e3479] text-white shadow-sm ring-1 ring-pink-400/40",
      iconColor: "text-pink-300",
    },
    {
      href: "/",
      role: "SO",
      label: "Sales Organizer",
      icon: LuUser,
      tag: "Frontline",
      activeBg: "bg-[#2563eb] text-white shadow-sm ring-1 ring-blue-400/40",
      iconColor: "text-sky-300",
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0]/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3.5 py-2 md:px-6">
        {/* Brand / Logo */}
        <Link href="/sm" className="flex items-center gap-2 text-navy no-underline group">
          <div className="flex size-7.5 items-center justify-center rounded-lg bg-navy font-black text-white text-[13px] shadow-xs group-hover:scale-105 transition-transform">
            AY
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-[15px] tracking-tight text-navy">
              Ayadi <span className="text-[#0284c7]">Sales</span>
            </span>
            <span className="text-[10px] font-bold text-pewter tracking-wider uppercase">
              Hierarchy Hub
            </span>
          </div>
        </Link>

        {/* 4-Tier Role Navigation Switcher */}
        <nav
          aria-label="Sales Role Navigation"
          className="flex items-center gap-1 rounded-full bg-[#f1f5f9] p-1 border border-[#e2e8f0]"
        >
          {links.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold transition-all ${
                  isActive
                    ? item.activeBg
                    : "text-[#64748b] hover:text-navy hover:bg-white/80"
                }`}
              >
                <Icon size={14} className={isActive ? item.iconColor : "text-pewter"} />
                <span>{item.role}</span>
                <span className="hidden sm:inline text-[10.5px] opacity-75 font-normal">
                  ({item.tag})
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
