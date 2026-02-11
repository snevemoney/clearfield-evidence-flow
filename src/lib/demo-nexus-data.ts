export interface NexusNode {
  id: string;
  label: string;
  type: "topic" | "evidence" | "claim" | "connection";
  ring: 0 | 1 | 2 | 3; // 0 = center, 1 = inner, 2 = middle, 3 = outer
  description: string;
  sourceCount: number;
  color: string;
  children?: string[]; // IDs of nodes that appear when this becomes center
}

export const RING_LABELS = ["CENTER", "EVIDENCE", "CLAIMS", "CONNECTIONS"];

export const RING_COLORS: Record<number, string> = {
  0: "#00e5ff",
  1: "#a78bfa",
  2: "#f59e0b",
  3: "#22c55e",
};

// Each "topic universe" defines what appears when that topic is centered
export interface TopicUniverse {
  center: NexusNode;
  rings: NexusNode[][]; // [ring1[], ring2[], ring3[]]
}

const universes: Record<string, TopicUniverse> = {
  surveillance: {
    center: {
      id: "surveillance",
      label: "Mass Surveillance",
      type: "topic",
      ring: 0,
      description: "Government and corporate mass surveillance programs documented through leaked materials, court filings, and investigative journalism.",
      sourceCount: 47,
      color: RING_COLORS[0],
    },
    rings: [
      // Ring 1: Evidence
      [
        { id: "snowden-archive", label: "Snowden Archive", type: "evidence", ring: 1, description: "Thousands of classified NSA documents leaked in 2013 by Edward Snowden.", sourceCount: 32, color: RING_COLORS[1] },
        { id: "prism-slides", label: "PRISM Slides", type: "evidence", ring: 1, description: "NSA presentation slides detailing the PRISM collection program.", sourceCount: 8, color: RING_COLORS[1] },
        { id: "fisa-court-orders", label: "FISA Court Orders", type: "evidence", ring: 1, description: "Declassified Foreign Intelligence Surveillance Court orders.", sourceCount: 15, color: RING_COLORS[1] },
        { id: "tempora-docs", label: "Tempora Documents", type: "evidence", ring: 1, description: "GCHQ fiber-optic cable tapping program documentation.", sourceCount: 6, color: RING_COLORS[1] },
        { id: "xkeyscore-manual", label: "XKeyscore Manual", type: "evidence", ring: 1, description: "NSA training slides for the XKeyscore search system.", sourceCount: 4, color: RING_COLORS[1] },
      ],
      // Ring 2: Claims
      [
        { id: "claim-backdoors", label: "Tech Backdoors", type: "claim", ring: 2, description: "Claims that major tech companies provided direct server access to intelligence agencies.", sourceCount: 12, color: RING_COLORS[2], children: ["tech-companies"] },
        { id: "claim-metadata", label: "Metadata Collection", type: "claim", ring: 2, description: "Bulk collection of phone metadata from all major US carriers.", sourceCount: 18, color: RING_COLORS[2] },
        { id: "claim-five-eyes", label: "Five Eyes Bypass", type: "claim", ring: 2, description: "Allied nations spy on each other's citizens to circumvent domestic laws.", sourceCount: 9, color: RING_COLORS[2], children: ["five-eyes"] },
        { id: "claim-corporate", label: "Corporate Complicity", type: "claim", ring: 2, description: "Major corporations knowingly participated in mass data collection.", sourceCount: 14, color: RING_COLORS[2], children: ["tech-companies"] },
        { id: "claim-oversight", label: "Oversight Failures", type: "claim", ring: 2, description: "Congressional oversight committees were misled about program scope.", sourceCount: 11, color: RING_COLORS[2], children: ["us-government"] },
        { id: "claim-legal-basis", label: "Questionable Legal Basis", type: "claim", ring: 2, description: "Programs operated under strained interpretations of Section 215.", sourceCount: 7, color: RING_COLORS[2] },
      ],
      // Ring 3: Connections
      [
        { id: "conn-nsa", label: "NSA", type: "connection", ring: 3, description: "National Security Agency - primary signals intelligence agency.", sourceCount: 25, color: RING_COLORS[3], children: ["us-government"] },
        { id: "conn-gchq", label: "GCHQ", type: "connection", ring: 3, description: "UK Government Communications Headquarters.", sourceCount: 11, color: RING_COLORS[3], children: ["five-eyes"] },
        { id: "conn-google", label: "Google", type: "connection", ring: 3, description: "Named in PRISM program documents.", sourceCount: 9, color: RING_COLORS[3], children: ["tech-companies"] },
        { id: "conn-facebook", label: "Meta/Facebook", type: "connection", ring: 3, description: "Named in PRISM program documents.", sourceCount: 12, color: RING_COLORS[3], children: ["tech-companies"] },
        { id: "conn-congress", label: "US Congress", type: "connection", ring: 3, description: "Oversight responsibility for intelligence programs.", sourceCount: 18, color: RING_COLORS[3], children: ["us-government"] },
        { id: "conn-fisa", label: "FISA Court", type: "connection", ring: 3, description: "Secret court approving surveillance warrants.", sourceCount: 15, color: RING_COLORS[3] },
        { id: "conn-eff", label: "EFF", type: "connection", ring: 3, description: "Electronic Frontier Foundation - key legal challenger.", sourceCount: 6, color: RING_COLORS[3] },
        { id: "conn-aclu", label: "ACLU", type: "connection", ring: 3, description: "American Civil Liberties Union - filed multiple lawsuits.", sourceCount: 5, color: RING_COLORS[3] },
      ],
    ],
  },
  "tech-companies": {
    center: {
      id: "tech-companies",
      label: "Big Tech & Data",
      type: "topic",
      ring: 0,
      description: "The role of major technology corporations in data collection, surveillance cooperation, and market dominance.",
      sourceCount: 38,
      color: RING_COLORS[0],
    },
    rings: [
      [
        { id: "tc-prism-docs", label: "PRISM Documents", type: "evidence", ring: 1, description: "Leaked NSA slides naming tech companies as data providers.", sourceCount: 8, color: RING_COLORS[1] },
        { id: "tc-cambridge", label: "Cambridge Analytica Files", type: "evidence", ring: 1, description: "Documents showing Facebook data harvesting for political campaigns.", sourceCount: 14, color: RING_COLORS[1] },
        { id: "tc-antitrust", label: "Antitrust Filings", type: "evidence", ring: 1, description: "DOJ and EU antitrust case documents against Google, Apple, Meta.", sourceCount: 22, color: RING_COLORS[1] },
        { id: "tc-sec-filings", label: "SEC Filings", type: "evidence", ring: 1, description: "Public financial disclosures revealing data monetization scope.", sourceCount: 10, color: RING_COLORS[1] },
      ],
      [
        { id: "tc-claim-monopoly", label: "Platform Monopolies", type: "claim", ring: 2, description: "Big tech companies operate as de facto monopolies in their sectors.", sourceCount: 16, color: RING_COLORS[2] },
        { id: "tc-claim-election", label: "Election Influence", type: "claim", ring: 2, description: "Social media platforms influenced election outcomes through algorithmic curation.", sourceCount: 11, color: RING_COLORS[2] },
        { id: "tc-claim-censor", label: "Content Censorship", type: "claim", ring: 2, description: "Platforms selectively suppress certain political viewpoints.", sourceCount: 13, color: RING_COLORS[2] },
        { id: "tc-claim-collab", label: "Gov't Collaboration", type: "claim", ring: 2, description: "Companies collaborated with government on censorship requests.", sourceCount: 9, color: RING_COLORS[2], children: ["surveillance"] },
        { id: "tc-claim-privacy", label: "Privacy Violations", type: "claim", ring: 2, description: "Systematic violation of user privacy for profit.", sourceCount: 20, color: RING_COLORS[2] },
      ],
      [
        { id: "tc-conn-google", label: "Google/Alphabet", type: "connection", ring: 3, description: "World's largest search engine and advertising company.", sourceCount: 15, color: RING_COLORS[3] },
        { id: "tc-conn-meta", label: "Meta Platforms", type: "connection", ring: 3, description: "Facebook, Instagram, WhatsApp parent company.", sourceCount: 14, color: RING_COLORS[3] },
        { id: "tc-conn-apple", label: "Apple Inc.", type: "connection", ring: 3, description: "Consumer electronics and services giant.", sourceCount: 8, color: RING_COLORS[3] },
        { id: "tc-conn-amazon", label: "Amazon/AWS", type: "connection", ring: 3, description: "E-commerce and cloud infrastructure dominant player.", sourceCount: 10, color: RING_COLORS[3] },
        { id: "tc-conn-nsa", label: "NSA", type: "connection", ring: 3, description: "PRISM program partner agency.", sourceCount: 25, color: RING_COLORS[3], children: ["surveillance"] },
        { id: "tc-conn-ftc", label: "FTC", type: "connection", ring: 3, description: "Federal Trade Commission - regulatory oversight.", sourceCount: 7, color: RING_COLORS[3], children: ["us-government"] },
      ],
    ],
  },
  "five-eyes": {
    center: {
      id: "five-eyes",
      label: "Five Eyes Alliance",
      type: "topic",
      ring: 0,
      description: "Intelligence alliance comprising Australia, Canada, New Zealand, the United Kingdom, and the United States.",
      sourceCount: 33,
      color: RING_COLORS[0],
    },
    rings: [
      [
        { id: "fe-ukusa", label: "UKUSA Agreement", type: "evidence", ring: 1, description: "1946 treaty establishing signals intelligence cooperation.", sourceCount: 5, color: RING_COLORS[1] },
        { id: "fe-echelon", label: "ECHELON Reports", type: "evidence", ring: 1, description: "European Parliament report on the ECHELON surveillance network.", sourceCount: 8, color: RING_COLORS[1] },
        { id: "fe-snowden", label: "Snowden Files (Five Eyes)", type: "evidence", ring: 1, description: "Documents detailing Five Eyes information sharing procedures.", sourceCount: 12, color: RING_COLORS[1] },
        { id: "fe-pine-gap", label: "Pine Gap Reports", type: "evidence", ring: 1, description: "Investigative reporting on the Joint Defence Facility.", sourceCount: 6, color: RING_COLORS[1] },
      ],
      [
        { id: "fe-claim-bypass", label: "Domestic Law Bypass", type: "claim", ring: 2, description: "Alliance members spy on each other's citizens to avoid domestic surveillance restrictions.", sourceCount: 9, color: RING_COLORS[2] },
        { id: "fe-claim-expand", label: "Expansion to 9/14 Eyes", type: "claim", ring: 2, description: "The alliance has expanded to include additional nations (Nine Eyes, Fourteen Eyes).", sourceCount: 6, color: RING_COLORS[2] },
        { id: "fe-claim-corporate", label: "Corporate Integration", type: "claim", ring: 2, description: "Private contractors deeply integrated into Five Eyes operations.", sourceCount: 7, color: RING_COLORS[2] },
        { id: "fe-claim-cables", label: "Undersea Cable Tapping", type: "claim", ring: 2, description: "Alliance partners tap undersea fiber optic cables for bulk data collection.", sourceCount: 11, color: RING_COLORS[2], children: ["surveillance"] },
      ],
      [
        { id: "fe-conn-nsa", label: "NSA (USA)", type: "connection", ring: 3, description: "Lead SIGINT agency of the alliance.", sourceCount: 25, color: RING_COLORS[3], children: ["surveillance"] },
        { id: "fe-conn-gchq", label: "GCHQ (UK)", type: "connection", ring: 3, description: "UK signals intelligence agency. Operates Tempora program.", sourceCount: 11, color: RING_COLORS[3] },
        { id: "fe-conn-asd", label: "ASD (Australia)", type: "connection", ring: 3, description: "Australian Signals Directorate.", sourceCount: 6, color: RING_COLORS[3] },
        { id: "fe-conn-cse", label: "CSE (Canada)", type: "connection", ring: 3, description: "Communications Security Establishment of Canada.", sourceCount: 5, color: RING_COLORS[3] },
        { id: "fe-conn-gcsb", label: "GCSB (NZ)", type: "connection", ring: 3, description: "Government Communications Security Bureau of New Zealand.", sourceCount: 4, color: RING_COLORS[3] },
        { id: "fe-conn-pine", label: "Pine Gap", type: "connection", ring: 3, description: "Joint US-Australia satellite surveillance facility.", sourceCount: 6, color: RING_COLORS[3] },
      ],
    ],
  },
  "us-government": {
    center: {
      id: "us-government",
      label: "US Government",
      type: "topic",
      ring: 0,
      description: "Executive, legislative, and judicial branches of the United States federal government and their roles in intelligence and policy.",
      sourceCount: 55,
      color: RING_COLORS[0],
    },
    rings: [
      [
        { id: "usg-patriot", label: "Patriot Act Text", type: "evidence", ring: 1, description: "Full text and legislative history of the USA PATRIOT Act.", sourceCount: 10, color: RING_COLORS[1] },
        { id: "usg-exec-orders", label: "Executive Orders", type: "evidence", ring: 1, description: "Presidential executive orders related to intelligence and surveillance.", sourceCount: 14, color: RING_COLORS[1] },
        { id: "usg-church", label: "Church Committee Report", type: "evidence", ring: 1, description: "1975 Senate committee findings on intelligence agency abuses.", sourceCount: 8, color: RING_COLORS[1] },
        { id: "usg-fisa-opinions", label: "FISA Court Opinions", type: "evidence", ring: 1, description: "Declassified opinions from the Foreign Intelligence Surveillance Court.", sourceCount: 15, color: RING_COLORS[1] },
        { id: "usg-ig-reports", label: "IG Reports", type: "evidence", ring: 1, description: "Inspector General reports on intelligence program compliance.", sourceCount: 9, color: RING_COLORS[1] },
      ],
      [
        { id: "usg-claim-overreach", label: "Executive Overreach", type: "claim", ring: 2, description: "The executive branch exceeded its authority in surveillance programs.", sourceCount: 13, color: RING_COLORS[2] },
        { id: "usg-claim-lying", label: "Misleading Congress", type: "claim", ring: 2, description: "Intelligence officials provided misleading testimony to oversight committees.", sourceCount: 11, color: RING_COLORS[2] },
        { id: "usg-claim-rubber", label: "Rubber Stamp Court", type: "claim", ring: 2, description: "FISA Court approves virtually all government surveillance requests.", sourceCount: 8, color: RING_COLORS[2] },
        { id: "usg-claim-reform", label: "Reform Theater", type: "claim", ring: 2, description: "Post-Snowden reforms were cosmetic and did not meaningfully reduce surveillance.", sourceCount: 7, color: RING_COLORS[2], children: ["surveillance"] },
      ],
      [
        { id: "usg-conn-nsa", label: "NSA", type: "connection", ring: 3, description: "National Security Agency.", sourceCount: 25, color: RING_COLORS[3], children: ["surveillance"] },
        { id: "usg-conn-cia", label: "CIA", type: "connection", ring: 3, description: "Central Intelligence Agency.", sourceCount: 20, color: RING_COLORS[3] },
        { id: "usg-conn-fbi", label: "FBI", type: "connection", ring: 3, description: "Federal Bureau of Investigation.", sourceCount: 18, color: RING_COLORS[3] },
        { id: "usg-conn-congress", label: "Congress", type: "connection", ring: 3, description: "Legislative branch with intelligence oversight responsibility.", sourceCount: 18, color: RING_COLORS[3] },
        { id: "usg-conn-darpa", label: "DARPA", type: "connection", ring: 3, description: "Defense Advanced Research Projects Agency.", sourceCount: 10, color: RING_COLORS[3] },
        { id: "usg-conn-tech", label: "Big Tech", type: "connection", ring: 3, description: "Major technology companies involved in government programs.", sourceCount: 15, color: RING_COLORS[3], children: ["tech-companies"] },
        { id: "usg-conn-pharma", label: "Pharma Lobby", type: "connection", ring: 3, description: "Pharmaceutical industry lobbying influence on legislation.", sourceCount: 12, color: RING_COLORS[3], children: ["pharma-industry"] },
        { id: "usg-conn-finance", label: "Wall Street", type: "connection", ring: 3, description: "Financial industry influence on regulatory policy.", sourceCount: 14, color: RING_COLORS[3], children: ["financial-systems"] },
      ],
    ],
  },
  "financial-systems": {
    center: {
      id: "financial-systems",
      label: "Financial Systems",
      type: "topic",
      ring: 0,
      description: "Global banking, central banks, shadow banking, and the opaque financial networks that influence geopolitics and wealth distribution.",
      sourceCount: 52,
      color: RING_COLORS[0],
    },
    rings: [
      [
        { id: "fin-panama", label: "Panama Papers", type: "evidence", ring: 1, description: "11.5 million leaked documents from Mossack Fonseca revealing offshore shell companies used by elites worldwide.", sourceCount: 28, color: RING_COLORS[1] },
        { id: "fin-libor", label: "LIBOR Scandal Filings", type: "evidence", ring: 1, description: "Court documents and regulatory findings on coordinated interest rate manipulation by major banks.", sourceCount: 14, color: RING_COLORS[1] },
        { id: "fin-fed-minutes", label: "Fed Meeting Minutes", type: "evidence", ring: 1, description: "Declassified Federal Reserve meeting transcripts revealing crisis-era decision making.", sourceCount: 18, color: RING_COLORS[1] },
        { id: "fin-pandora", label: "Pandora Papers", type: "evidence", ring: 1, description: "2021 leak of 11.9 million files exposing offshore wealth of world leaders and billionaires.", sourceCount: 22, color: RING_COLORS[1] },
        { id: "fin-2008-docs", label: "2008 Crisis Documents", type: "evidence", ring: 1, description: "Congressional testimony, SEC filings, and internal emails from the 2008 financial crisis.", sourceCount: 16, color: RING_COLORS[1] },
      ],
      [
        { id: "fin-claim-tbtf", label: "Too Big To Fail", type: "claim", ring: 2, description: "Major banks are implicitly backed by taxpayers, creating moral hazard and privatized profits with socialized losses.", sourceCount: 19, color: RING_COLORS[2] },
        { id: "fin-claim-fed", label: "Fed Independence Myth", type: "claim", ring: 2, description: "The Federal Reserve serves banking interests rather than public welfare despite claims of independence.", sourceCount: 11, color: RING_COLORS[2], children: ["us-government"] },
        { id: "fin-claim-offshore", label: "Offshore Tax Havens", type: "claim", ring: 2, description: "Trillions in wealth hidden offshore by corporations and individuals to avoid taxation.", sourceCount: 24, color: RING_COLORS[2] },
        { id: "fin-claim-rigging", label: "Market Manipulation", type: "claim", ring: 2, description: "Major financial institutions systematically manipulate markets including LIBOR, forex, and commodities.", sourceCount: 15, color: RING_COLORS[2] },
        { id: "fin-claim-revolving", label: "Revolving Door", type: "claim", ring: 2, description: "Executives rotate between Wall Street firms and government regulatory positions.", sourceCount: 13, color: RING_COLORS[2], children: ["us-government"] },
      ],
      [
        { id: "fin-conn-jpmorgan", label: "JPMorgan Chase", type: "connection", ring: 3, description: "Largest US bank by assets. Implicated in multiple market manipulation cases.", sourceCount: 16, color: RING_COLORS[3] },
        { id: "fin-conn-goldman", label: "Goldman Sachs", type: "connection", ring: 3, description: "Investment bank with extensive government ties and revolving door appointments.", sourceCount: 14, color: RING_COLORS[3] },
        { id: "fin-conn-blackrock", label: "BlackRock", type: "connection", ring: 3, description: "World's largest asset manager controlling over $10 trillion in assets.", sourceCount: 11, color: RING_COLORS[3] },
        { id: "fin-conn-bis", label: "Bank for Intl. Settlements", type: "connection", ring: 3, description: "Central bank of central banks. Coordinates global monetary policy.", sourceCount: 8, color: RING_COLORS[3] },
        { id: "fin-conn-sec", label: "SEC", type: "connection", ring: 3, description: "Securities and Exchange Commission — regulatory body criticized for lax enforcement.", sourceCount: 10, color: RING_COLORS[3], children: ["us-government"] },
        { id: "fin-conn-imf", label: "IMF", type: "connection", ring: 3, description: "International Monetary Fund — imposes austerity conditions on developing nations.", sourceCount: 9, color: RING_COLORS[3] },
        { id: "fin-conn-media", label: "Financial Media", type: "connection", ring: 3, description: "Media outlets owned by or dependent on financial industry advertising.", sourceCount: 7, color: RING_COLORS[3], children: ["media-propaganda"] },
      ],
    ],
  },
  "pharma-industry": {
    center: {
      id: "pharma-industry",
      label: "Pharmaceutical Industry",
      type: "topic",
      ring: 0,
      description: "The global pharmaceutical industry's influence on public health policy, drug pricing, clinical trials, and regulatory capture.",
      sourceCount: 44,
      color: RING_COLORS[0],
    },
    rings: [
      [
        { id: "ph-opioid-docs", label: "Opioid Litigation Files", type: "evidence", ring: 1, description: "Court documents from Purdue Pharma and other opioid lawsuits revealing marketing of addictive painkillers.", sourceCount: 22, color: RING_COLORS[1] },
        { id: "ph-trial-data", label: "Suppressed Trial Data", type: "evidence", ring: 1, description: "Internal studies showing negative drug outcomes that companies chose not to publish.", sourceCount: 15, color: RING_COLORS[1] },
        { id: "ph-lobby-records", label: "Lobbying Expenditure Records", type: "evidence", ring: 1, description: "OpenSecrets data showing pharma as the top-spending lobbying industry in the US.", sourceCount: 12, color: RING_COLORS[1] },
        { id: "ph-pricing-docs", label: "Drug Pricing Documents", type: "evidence", ring: 1, description: "Congressional investigation documents on insulin and EpiPen price manipulation.", sourceCount: 10, color: RING_COLORS[1] },
        { id: "ph-fda-reviews", label: "FDA Accelerated Approvals", type: "evidence", ring: 1, description: "Data on drugs approved under accelerated pathways without confirmatory evidence.", sourceCount: 8, color: RING_COLORS[1] },
      ],
      [
        { id: "ph-claim-capture", label: "Regulatory Capture", type: "claim", ring: 2, description: "The FDA is substantially influenced by the pharmaceutical companies it is supposed to regulate.", sourceCount: 16, color: RING_COLORS[2], children: ["us-government"] },
        { id: "ph-claim-pricing", label: "Price Gouging", type: "claim", ring: 2, description: "Drug companies exploit patent systems and lack of regulation to charge exorbitant prices.", sourceCount: 18, color: RING_COLORS[2] },
        { id: "ph-claim-suppress", label: "Research Suppression", type: "claim", ring: 2, description: "Negative clinical trial results are systematically suppressed or selectively reported.", sourceCount: 14, color: RING_COLORS[2] },
        { id: "ph-claim-opioid", label: "Engineered Opioid Crisis", type: "claim", ring: 2, description: "Pharmaceutical companies knowingly created and profited from mass opioid addiction.", sourceCount: 20, color: RING_COLORS[2] },
        { id: "ph-claim-media", label: "DTC Advertising Influence", type: "claim", ring: 2, description: "Direct-to-consumer drug advertising creates demand for unnecessary medications and influences media coverage.", sourceCount: 9, color: RING_COLORS[2], children: ["media-propaganda"] },
      ],
      [
        { id: "ph-conn-purdue", label: "Purdue Pharma", type: "connection", ring: 3, description: "Maker of OxyContin. Bankrupt due to opioid crisis liability.", sourceCount: 18, color: RING_COLORS[3] },
        { id: "ph-conn-pfizer", label: "Pfizer", type: "connection", ring: 3, description: "World's largest pharmaceutical company by revenue.", sourceCount: 12, color: RING_COLORS[3] },
        { id: "ph-conn-jnj", label: "Johnson & Johnson", type: "connection", ring: 3, description: "Multinational facing lawsuits over talc, opioids, and device failures.", sourceCount: 14, color: RING_COLORS[3] },
        { id: "ph-conn-fda", label: "FDA", type: "connection", ring: 3, description: "Food and Drug Administration — funded partly by industry user fees.", sourceCount: 15, color: RING_COLORS[3], children: ["us-government"] },
        { id: "ph-conn-who", label: "WHO", type: "connection", ring: 3, description: "World Health Organization — influenced by pharmaceutical industry funding.", sourceCount: 8, color: RING_COLORS[3] },
        { id: "ph-conn-lobby", label: "PhRMA", type: "connection", ring: 3, description: "Pharmaceutical Research and Manufacturers of America — industry lobbying group.", sourceCount: 10, color: RING_COLORS[3] },
        { id: "ph-conn-finance", label: "Wall Street", type: "connection", ring: 3, description: "Financial firms profiting from pharma investment and drug pricing.", sourceCount: 7, color: RING_COLORS[3], children: ["financial-systems"] },
      ],
    ],
  },
  "media-propaganda": {
    center: {
      id: "media-propaganda",
      label: "Media & Propaganda",
      type: "topic",
      ring: 0,
      description: "The concentration of media ownership, manufacturing of consent, information warfare, and the blurring line between journalism and propaganda.",
      sourceCount: 41,
      color: RING_COLORS[0],
    },
    rings: [
      [
        { id: "med-ownership", label: "Media Ownership Maps", type: "evidence", ring: 1, description: "Data showing 6 corporations control 90% of US media, down from 50 companies in 1983.", sourceCount: 12, color: RING_COLORS[1] },
        { id: "med-mockingbird", label: "Operation Mockingbird Files", type: "evidence", ring: 1, description: "Declassified CIA documents on Cold War-era infiltration of American media organizations.", sourceCount: 9, color: RING_COLORS[1] },
        { id: "med-smith-mundt", label: "Smith-Mundt Modernization", type: "evidence", ring: 1, description: "2012 act legalizing the domestic dissemination of government-produced propaganda.", sourceCount: 6, color: RING_COLORS[1] },
        { id: "med-twitter-files", label: "Twitter Files", type: "evidence", ring: 1, description: "Internal communications revealing government influence on content moderation decisions.", sourceCount: 18, color: RING_COLORS[1], children: ["tech-companies"] },
        { id: "med-pentagon-docs", label: "Pentagon Media Program", type: "evidence", ring: 1, description: "Documents on the Pentagon's military analyst program planting favorable commentary.", sourceCount: 8, color: RING_COLORS[1] },
      ],
      [
        { id: "med-claim-consent", label: "Manufacturing Consent", type: "claim", ring: 2, description: "Mass media serves elite interests through systemic filters described by Chomsky's propaganda model.", sourceCount: 15, color: RING_COLORS[2] },
        { id: "med-claim-consolidation", label: "Ownership Consolidation", type: "claim", ring: 2, description: "Media mergers have created an oligopoly that limits diversity of viewpoints.", sourceCount: 11, color: RING_COLORS[2], children: ["financial-systems"] },
        { id: "med-claim-intel", label: "Intelligence Infiltration", type: "claim", ring: 2, description: "Intelligence agencies maintain ongoing relationships with major media outlets for narrative control.", sourceCount: 13, color: RING_COLORS[2], children: ["surveillance"] },
        { id: "med-claim-disinfo", label: "State Disinformation", type: "claim", ring: 2, description: "Government agencies conduct domestic influence operations through social media.", sourceCount: 10, color: RING_COLORS[2], children: ["us-government"] },
        { id: "med-claim-pharma-ad", label: "Pharma Ad Dependency", type: "claim", ring: 2, description: "News outlets' reliance on pharmaceutical advertising compromises critical health reporting.", sourceCount: 8, color: RING_COLORS[2], children: ["pharma-industry"] },
      ],
      [
        { id: "med-conn-disney", label: "Walt Disney Co.", type: "connection", ring: 3, description: "Owns ABC, ESPN, Hulu, and major film studios.", sourceCount: 9, color: RING_COLORS[3] },
        { id: "med-conn-comcast", label: "Comcast/NBCUniversal", type: "connection", ring: 3, description: "Owns NBC, MSNBC, CNBC, and Universal Studios.", sourceCount: 10, color: RING_COLORS[3] },
        { id: "med-conn-newscorp", label: "News Corp / Fox", type: "connection", ring: 3, description: "Rupert Murdoch's media empire spanning news, entertainment, and publishing.", sourceCount: 12, color: RING_COLORS[3] },
        { id: "med-conn-att", label: "Warner Bros. Discovery", type: "connection", ring: 3, description: "Owns CNN, HBO, and major entertainment properties.", sourceCount: 8, color: RING_COLORS[3] },
        { id: "med-conn-cia", label: "CIA", type: "connection", ring: 3, description: "Central Intelligence Agency — historical and alleged ongoing media relationships.", sourceCount: 14, color: RING_COLORS[3], children: ["us-government"] },
        { id: "med-conn-google", label: "Google/YouTube", type: "connection", ring: 3, description: "Dominant digital media gatekeeper controlling search and video platforms.", sourceCount: 11, color: RING_COLORS[3], children: ["tech-companies"] },
        { id: "med-conn-meta", label: "Meta Platforms", type: "connection", ring: 3, description: "Facebook and Instagram — primary social media news distribution channels.", sourceCount: 10, color: RING_COLORS[3], children: ["tech-companies"] },
      ],
    ],
  },
};

// Allow dynamic universes to be added at runtime (e.g., from DB intel data)
export function addDynamicUniverse(id: string, universe: TopicUniverse) {
  universes[id] = universe;
}

export function getTopicUniverse(topicId: string): TopicUniverse {
  return universes[topicId] || universes["surveillance"];
}

export function getAllTopicIds(): string[] {
  return Object.keys(universes);
}

export function getTopicLabel(id: string): string {
  return universes[id]?.center.label || id;
}
