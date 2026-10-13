import type { Metadata } from "next";
import { HomeExperience } from "@/components/maritime";

export const metadata: Metadata = {
  title: "BNB SHOREBRIDGE 55 — Landing Craft / Cargo Ro-Ro",
  description:
    "BNB SHOREBRIDGE 55, our 55-metre landing craft / cargo Ro-Ro. Containers, vehicles, pallets, fuel tanks and hazardous materials; designed for sea state 5, with beach landing capability. Reference newbuild LOURDES: 52.68 m overall with ramp, 24 TEU nominal, 610 t cargo payload; current newbuild programme at our shipyard in Fomar, Shiroda, Goa, under Bureau Veritas (BV) classification with the AUT-UMS notation. 400–500 DWT design-to-order enquiries welcome.",
};

export default function Home() {
  return <HomeExperience />;
}
