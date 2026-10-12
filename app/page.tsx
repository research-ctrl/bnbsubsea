import type { Metadata } from "next";
import { HomeExperience } from "@/components/maritime";

export const metadata: Metadata = {
  title: "Lourdes — Ro-Ro / Landing Craft",
  description:
    "Lourdes: our 52.68 m Ro-Ro / landing craft with 24 TEU nominal capacity and beach landing capability, with a cyber-resilience notation in scope. To be built under Bureau Veritas classification at our shipyard in Fomar, Shiroda, Goa.",
};

export default function Home() {
  return <HomeExperience />;
}
