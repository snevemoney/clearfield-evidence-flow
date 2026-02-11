export interface GlobeLocation {
  id: string;
  label: string;
  lat: number;
  lng: number;
  category: "institution" | "event" | "document" | "military" | "corporate" | "government";
  description: string;
  sourceCount: number;
  evidenceIds: string[];
  color: string;
  size: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
  institution: "#00e5ff",
  event: "#ff6b35",
  document: "#a78bfa",
  military: "#ef4444",
  corporate: "#22c55e",
  government: "#f59e0b",
};

export const demoGlobeLocations: GlobeLocation[] = [
  {
    id: "loc-1",
    label: "NSA Headquarters",
    lat: 39.1087,
    lng: -76.7717,
    category: "military",
    description: "National Security Agency, Fort Meade, Maryland. Central hub for signals intelligence (SIGINT) and information assurance. Key node in PRISM surveillance program documentation.",
    sourceCount: 14,
    evidenceIds: ["ev-1", "ev-2"],
    color: CATEGORY_COLORS.military,
    size: 1.2,
  },
  {
    id: "loc-2",
    label: "Google HQ (Googleplex)",
    lat: 37.422,
    lng: -122.084,
    category: "corporate",
    description: "Alphabet Inc. headquarters, Mountain View, CA. Named in PRISM program documents as data provider. Subject of multiple antitrust investigations.",
    sourceCount: 9,
    evidenceIds: ["ev-3"],
    color: CATEGORY_COLORS.corporate,
    size: 1.0,
  },
  {
    id: "loc-3",
    label: "The Pentagon",
    lat: 38.8719,
    lng: -77.0563,
    category: "military",
    description: "United States Department of Defense headquarters. Arlington, VA. Central command for military operations and defense policy.",
    sourceCount: 22,
    evidenceIds: ["ev-1"],
    color: CATEGORY_COLORS.military,
    size: 1.4,
  },
  {
    id: "loc-4",
    label: "U.S. Capitol Building",
    lat: 38.8899,
    lng: -77.0091,
    category: "government",
    description: "Seat of the United States Congress. Washington, D.C. Origin point for legislation including the Patriot Act, FISA Amendments Act, and intelligence oversight committees.",
    sourceCount: 18,
    evidenceIds: ["ev-4", "ev-5"],
    color: CATEGORY_COLORS.government,
    size: 1.3,
  },
  {
    id: "loc-5",
    label: "GCHQ Cheltenham",
    lat: 51.8985,
    lng: -2.1244,
    category: "institution",
    description: "Government Communications Headquarters, UK. Five Eyes alliance member. Documented in Tempora program for mass interception of fiber-optic communications.",
    sourceCount: 11,
    evidenceIds: ["ev-2"],
    color: CATEGORY_COLORS.institution,
    size: 1.1,
  },
  {
    id: "loc-6",
    label: "European Parliament",
    lat: 48.5972,
    lng: 7.7684,
    category: "government",
    description: "Strasbourg, France. Passed GDPR in response to surveillance revelations. Multiple resolutions on mass surveillance and digital rights.",
    sourceCount: 7,
    evidenceIds: ["ev-6"],
    color: CATEGORY_COLORS.government,
    size: 0.9,
  },
  {
    id: "loc-7",
    label: "Meta (Facebook) HQ",
    lat: 37.4845,
    lng: -122.1477,
    category: "corporate",
    description: "Meta Platforms headquarters, Menlo Park, CA. Named in PRISM documents. Subject of Cambridge Analytica data scandal investigations.",
    sourceCount: 12,
    evidenceIds: ["ev-3"],
    color: CATEGORY_COLORS.corporate,
    size: 1.0,
  },
  {
    id: "loc-8",
    label: "Kremlin",
    lat: 55.7520,
    lng: 37.6175,
    category: "government",
    description: "Seat of Russian government, Moscow. Subject of multiple intelligence reports regarding election interference and cyber operations.",
    sourceCount: 15,
    evidenceIds: ["ev-7"],
    color: CATEGORY_COLORS.government,
    size: 1.2,
  },
  {
    id: "loc-9",
    label: "Pine Gap",
    lat: -23.7991,
    lng: 133.7370,
    category: "military",
    description: "Joint Defence Facility Pine Gap, Australia. Five Eyes satellite surveillance station. Jointly operated by Australia and the United States.",
    sourceCount: 6,
    evidenceIds: ["ev-2"],
    color: CATEGORY_COLORS.military,
    size: 0.8,
  },
  {
    id: "loc-10",
    label: "DARPA HQ",
    lat: 38.8814,
    lng: -77.1114,
    category: "institution",
    description: "Defense Advanced Research Projects Agency, Arlington, VA. Origin of foundational internet technology (ARPANET). Ongoing advanced research programs.",
    sourceCount: 10,
    evidenceIds: ["ev-1"],
    color: CATEGORY_COLORS.institution,
    size: 1.0,
  },
  {
    id: "loc-11",
    label: "UN Headquarters",
    lat: 40.7489,
    lng: -73.9680,
    category: "institution",
    description: "United Nations, New York City. International governance body. Subject of surveillance by multiple state actors per leaked documents.",
    sourceCount: 8,
    evidenceIds: ["ev-8"],
    color: CATEGORY_COLORS.institution,
    size: 1.1,
  },
  {
    id: "loc-12",
    label: "Shenzhen Tech District",
    lat: 22.5431,
    lng: 114.0579,
    category: "corporate",
    description: "Major technology manufacturing hub, China. Home to Huawei, Tencent, and ZTE. Subject of supply chain security investigations.",
    sourceCount: 9,
    evidenceIds: ["ev-9"],
    color: CATEGORY_COLORS.corporate,
    size: 1.0,
  },
  {
    id: "loc-13",
    label: "CERN",
    lat: 46.2330,
    lng: 6.0557,
    category: "institution",
    description: "European Organization for Nuclear Research, Geneva. Birthplace of the World Wide Web. Advanced physics research facility.",
    sourceCount: 5,
    evidenceIds: ["ev-10"],
    color: CATEGORY_COLORS.institution,
    size: 0.8,
  },
  {
    id: "loc-14",
    label: "Langley (CIA HQ)",
    lat: 38.9517,
    lng: -77.1467,
    category: "military",
    description: "Central Intelligence Agency headquarters, Langley, VA. Primary U.S. human intelligence (HUMINT) agency. Subject of extensive declassified documentation.",
    sourceCount: 25,
    evidenceIds: ["ev-1", "ev-7"],
    color: CATEGORY_COLORS.military,
    size: 1.5,
  },
  {
    id: "loc-15",
    label: "Bank of England",
    lat: 51.5142,
    lng: -0.0885,
    category: "institution",
    description: "Central bank of the United Kingdom, London. Key node in global financial system. Subject of monetary policy investigations.",
    sourceCount: 7,
    evidenceIds: ["ev-11"],
    color: CATEGORY_COLORS.institution,
    size: 0.9,
  },
  {
    id: "loc-16",
    label: "Federal Reserve",
    lat: 38.8928,
    lng: -77.0452,
    category: "institution",
    description: "Board of Governors, Washington D.C. Central banking system of the United States. Subject of extensive monetary policy and transparency debates.",
    sourceCount: 13,
    evidenceIds: ["ev-11", "ev-12"],
    color: CATEGORY_COLORS.institution,
    size: 1.2,
  },
  {
    id: "loc-17",
    label: "Davos (WEF)",
    lat: 46.8027,
    lng: 9.8360,
    category: "event",
    description: "World Economic Forum annual meeting location, Davos, Switzerland. Global elite gathering for economic and political discussions.",
    sourceCount: 6,
    evidenceIds: ["ev-13"],
    color: CATEGORY_COLORS.event,
    size: 0.9,
  },
  {
    id: "loc-18",
    label: "Bohemian Grove",
    lat: 38.4741,
    lng: -123.0008,
    category: "event",
    description: "Monte Rio, California. Private campground hosting annual gathering of prominent figures. Documented by investigative journalists.",
    sourceCount: 4,
    evidenceIds: ["ev-14"],
    color: CATEGORY_COLORS.event,
    size: 0.7,
  },
];

export interface GlobeArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  label: string;
  network: string;
  description: string;
}

export const ARC_NETWORKS: Record<string, { color: string; label: string }> = {
  five_eyes: { color: "#00e5ff", label: "FIVE EYES" },
  prism: { color: "#a78bfa", label: "PRISM PROGRAM" },
  financial: { color: "#f59e0b", label: "FINANCIAL" },
  intelligence: { color: "#ef4444", label: "INTELLIGENCE" },
  policy: { color: "#22c55e", label: "POLICY / GOVERNANCE" },
};

// Helper to find location coords by id
const loc = (id: string) => {
  const l = demoGlobeLocations.find((x) => x.id === id);
  return l ? { lat: l.lat, lng: l.lng } : { lat: 0, lng: 0 };
};

export const demoGlobeArcs: GlobeArc[] = [
  // Five Eyes Alliance
  { id: "arc-1", ...loc("loc-1"), ...({ endLat: loc("loc-5").lat, endLng: loc("loc-5").lng }), startLat: loc("loc-1").lat, startLng: loc("loc-1").lng, color: ["#00e5ff", "#00e5ff"], label: "NSA ↔ GCHQ", network: "five_eyes", description: "Five Eyes SIGINT sharing agreement. Joint surveillance operations documented in Snowden archive." },
  { id: "arc-2", startLat: loc("loc-1").lat, startLng: loc("loc-1").lng, endLat: loc("loc-9").lat, endLng: loc("loc-9").lng, color: ["#00e5ff", "#00e5ff"], label: "NSA ↔ Pine Gap", network: "five_eyes", description: "Joint US-Australia satellite surveillance facility. Five Eyes SIGINT relay station." },
  { id: "arc-3", startLat: loc("loc-5").lat, startLng: loc("loc-5").lng, endLat: loc("loc-9").lat, endLng: loc("loc-9").lng, color: ["#00e5ff", "#00e5ff"], label: "GCHQ ↔ Pine Gap", network: "five_eyes", description: "UK-Australia intelligence link within Five Eyes framework." },
  // PRISM Program connections
  { id: "arc-4", startLat: loc("loc-1").lat, startLng: loc("loc-1").lng, endLat: loc("loc-2").lat, endLng: loc("loc-2").lng, color: ["#a78bfa", "#a78bfa"], label: "NSA ↔ Google", network: "prism", description: "Google named as PRISM data provider in leaked NSA slides (2013)." },
  { id: "arc-5", startLat: loc("loc-1").lat, startLng: loc("loc-1").lng, endLat: loc("loc-7").lat, endLng: loc("loc-7").lng, color: ["#a78bfa", "#a78bfa"], label: "NSA ↔ Meta", network: "prism", description: "Facebook/Meta named as PRISM data provider in leaked NSA slides." },
  // Intelligence links
  { id: "arc-6", startLat: loc("loc-14").lat, startLng: loc("loc-14").lng, endLat: loc("loc-3").lat, endLng: loc("loc-3").lng, color: ["#ef4444", "#ef4444"], label: "CIA ↔ Pentagon", network: "intelligence", description: "Intelligence coordination between CIA and Department of Defense." },
  { id: "arc-7", startLat: loc("loc-14").lat, startLng: loc("loc-14").lng, endLat: loc("loc-8").lat, endLng: loc("loc-8").lng, color: ["#ef4444", "#ef4444"], label: "CIA ↔ Kremlin", network: "intelligence", description: "Documented Cold War and post-Cold War intelligence operations. Subject of multiple declassified reports." },
  { id: "arc-8", startLat: loc("loc-14").lat, startLng: loc("loc-14").lng, endLat: loc("loc-5").lat, endLng: loc("loc-5").lng, color: ["#ef4444", "#00e5ff"], label: "CIA ↔ GCHQ", network: "intelligence", description: "US-UK intelligence sharing. Special relationship in HUMINT and SIGINT." },
  // Financial network
  { id: "arc-9", startLat: loc("loc-16").lat, startLng: loc("loc-16").lng, endLat: loc("loc-15").lat, endLng: loc("loc-15").lng, color: ["#f59e0b", "#f59e0b"], label: "Fed ↔ Bank of England", network: "financial", description: "Central bank coordination. Joint monetary policy actions documented during financial crises." },
  { id: "arc-10", startLat: loc("loc-16").lat, startLng: loc("loc-16").lng, endLat: loc("loc-17").lat, endLng: loc("loc-17").lng, color: ["#f59e0b", "#f59e0b"], label: "Fed ↔ WEF Davos", network: "financial", description: "Federal Reserve officials regular attendees at World Economic Forum. Policy coordination documented." },
  // Policy / Governance
  { id: "arc-11", startLat: loc("loc-4").lat, startLng: loc("loc-4").lng, endLat: loc("loc-6").lat, endLng: loc("loc-6").lng, color: ["#22c55e", "#22c55e"], label: "US Congress ↔ EU Parliament", network: "policy", description: "Transatlantic policy coordination. GDPR enacted partly in response to US surveillance revelations." },
  { id: "arc-12", startLat: loc("loc-4").lat, startLng: loc("loc-4").lng, endLat: loc("loc-11").lat, endLng: loc("loc-11").lng, color: ["#22c55e", "#22c55e"], label: "US Congress ↔ UN", network: "policy", description: "UN surveillance resolutions following Snowden disclosures. US voting record documented." },
  // Supply chain / tech
  { id: "arc-13", startLat: loc("loc-12").lat, startLng: loc("loc-12").lng, endLat: loc("loc-3").lat, endLng: loc("loc-3").lng, color: ["#ef4444", "#22c55e"], label: "Shenzhen ↔ Pentagon", network: "intelligence", description: "Supply chain security investigations. Pentagon reports on Chinese tech component risks." },
  { id: "arc-14", startLat: loc("loc-10").lat, startLng: loc("loc-10").lng, endLat: loc("loc-13").lat, endLng: loc("loc-13").lng, color: ["#00e5ff", "#a78bfa"], label: "DARPA ↔ CERN", network: "policy", description: "Historical ARPANET collaboration. Foundational internet protocol development." },
];
