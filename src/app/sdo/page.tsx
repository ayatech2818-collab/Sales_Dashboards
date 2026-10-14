import type { Metadata } from "next";
import { SdoDashboard } from "@/components/sdo/SdoDashboard";

export const metadata: Metadata = {
  title: "SDO · Team Dashboard",
  description:
    "Team and individual KPIs for the Sales Organizers assigned to a Sales Development Officer.",
};

export default function SdoPage() {
  return <SdoDashboard />;
}
