import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { CsdoDashboard } from "@/components/csdo/CsdoDashboard";

// Associate and enrolment IDs are set in a monospace face.
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: "500",
});

export const metadata: Metadata = {
  title: "CSDO · Organization Dashboard",
  description:
    "Sales performance for a Chief SDO's direct Sales Organizers and their SDOs' teams, from organization down to one SO.",
};

export default function CsdoPage() {
  return (
    <div className={mono.variable}>
      <CsdoDashboard />
    </div>
  );
}
