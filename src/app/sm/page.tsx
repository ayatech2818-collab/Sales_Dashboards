import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SmDashboard } from "@/components/sm/SmDashboard";

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: "500",
});

export const metadata: Metadata = {
  title: "SM · Sales Manager Executive Dashboard",
  description:
    "State and zonal sales operations dashboard for Sales Managers supervising Chief SDOs, SDO teams, and frontline Sales Organizers.",
};

export default function SmPage() {
  return (
    <div className={mono.variable}>
      <SmDashboard />
    </div>
  );
}
