// Demo data for interactive visualizations
export interface GraphNode {
  id: string;
  label: string;
  type: 'document' | 'event' | 'law' | 'institution' | 'media_artifact' | 'person' | 'claim';
  description: string;
  sourceCount: number;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'citation' | 'contradiction' | 'temporal_overlap' | 'source_reuse' | 'financial';
  description: string;
}

export const EDGE_COLORS: Record<string, string> = {
  citation: '#00d4ff',
  contradiction: '#ef4444',
  temporal_overlap: '#22c55e',
  source_reuse: '#a855f7',
  financial: '#eab308',
};

export const NODE_COLORS: Record<string, string> = {
  document: '#00d4ff',
  event: '#eab308',
  law: '#22c55e',
  institution: '#f97316',
  media_artifact: '#a855f7',
  person: '#ec4899',
  claim: '#64748b',
};

export const demoNodes: GraphNode[] = [
  { id: 'n1', label: 'DARPA', type: 'institution', description: 'Defense Advanced Research Projects Agency', sourceCount: 24, group: 1 },
  { id: 'n2', label: 'Project Lifelog', type: 'event', description: 'DARPA project cancelled Feb 4, 2004', sourceCount: 8, group: 1 },
  { id: 'n3', label: 'Facebook Launch', type: 'event', description: 'Facebook launched Feb 4, 2004', sourceCount: 15, group: 2 },
  { id: 'n4', label: 'In-Q-Tel', type: 'institution', description: 'CIA venture capital arm', sourceCount: 12, group: 3 },
  { id: 'n5', label: 'Palantir Technologies', type: 'institution', description: 'Data analytics company', sourceCount: 19, group: 3 },
  { id: 'n6', label: 'Peter Thiel', type: 'person', description: 'First outside investor in Facebook', sourceCount: 31, group: 2 },
  { id: 'n7', label: 'Patriot Act', type: 'law', description: 'USA PATRIOT Act of 2001', sourceCount: 42, group: 4 },
  { id: 'n8', label: 'Section 702 FISA', type: 'law', description: 'Foreign Intelligence Surveillance Act', sourceCount: 28, group: 4 },
  { id: 'n9', label: 'Snowden Leaks', type: 'document', description: 'NSA surveillance documents leaked 2013', sourceCount: 67, group: 5 },
  { id: 'n10', label: 'PRISM Program', type: 'event', description: 'NSA data collection program', sourceCount: 45, group: 5 },
  { id: 'n11', label: 'NSA', type: 'institution', description: 'National Security Agency', sourceCount: 53, group: 5 },
  { id: 'n12', label: 'Google', type: 'institution', description: 'Technology corporation', sourceCount: 38, group: 6 },
  { id: 'n13', label: 'CIA Seed Funding', type: 'document', description: 'Reports of intelligence community funding tech startups', sourceCount: 6, group: 3 },
  { id: 'n14', label: 'Total Information Awareness', type: 'event', description: 'DARPA mass surveillance program 2003', sourceCount: 14, group: 1 },
  { id: 'n15', label: 'Cambridge Analytica', type: 'event', description: 'Political data harvesting scandal 2018', sourceCount: 52, group: 2 },
  { id: 'n16', label: 'Executive Order 12333', type: 'law', description: 'Presidential directive on intelligence activities', sourceCount: 18, group: 4 },
  { id: 'n17', label: 'AT&T Room 641A', type: 'document', description: 'NSA wiretapping facility in SF', sourceCount: 11, group: 5 },
  { id: 'n18', label: 'Whistleblower Report', type: 'media_artifact', description: 'Mark Klein testimony on AT&T surveillance', sourceCount: 9, group: 5 },
];

export const demoLinks: GraphLink[] = [
  { source: 'n1', target: 'n2', type: 'citation', description: 'DARPA operated Project Lifelog' },
  { source: 'n2', target: 'n3', type: 'temporal_overlap', description: 'Both events occurred on Feb 4, 2004' },
  { source: 'n4', target: 'n5', type: 'financial', description: 'In-Q-Tel provided early funding to Palantir' },
  { source: 'n6', target: 'n3', type: 'financial', description: 'Thiel was first outside investor in Facebook' },
  { source: 'n6', target: 'n5', type: 'financial', description: 'Thiel co-founded Palantir Technologies' },
  { source: 'n7', target: 'n8', type: 'citation', description: 'FISA amended by Patriot Act provisions' },
  { source: 'n9', target: 'n10', type: 'citation', description: 'Snowden documents revealed PRISM' },
  { source: 'n10', target: 'n11', type: 'citation', description: 'PRISM operated by NSA' },
  { source: 'n10', target: 'n12', type: 'citation', description: 'Google listed as PRISM participant' },
  { source: 'n10', target: 'n3', type: 'citation', description: 'Facebook listed as PRISM participant' },
  { source: 'n8', target: 'n10', type: 'citation', description: 'Section 702 provided legal basis for PRISM' },
  { source: 'n4', target: 'n13', type: 'citation', description: 'In-Q-Tel linked to CIA seed funding reports' },
  { source: 'n4', target: 'n12', type: 'financial', description: 'In-Q-Tel invested in Google Earth (Keyhole)' },
  { source: 'n1', target: 'n14', type: 'citation', description: 'DARPA operated TIA program' },
  { source: 'n14', target: 'n2', type: 'source_reuse', description: 'TIA and Lifelog shared surveillance goals' },
  { source: 'n15', target: 'n3', type: 'citation', description: 'Cambridge Analytica harvested Facebook data' },
  { source: 'n16', target: 'n11', type: 'citation', description: 'EO 12333 governs NSA operations' },
  { source: 'n17', target: 'n11', type: 'citation', description: 'Room 641A was NSA facility' },
  { source: 'n18', target: 'n17', type: 'citation', description: 'Klein testified about Room 641A' },
  { source: 'n11', target: 'n7', type: 'citation', description: 'NSA powers expanded by Patriot Act' },
  { source: 'n1', target: 'n11', type: 'source_reuse', description: 'DARPA-NSA shared technology programs' },
  { source: 'n15', target: 'n6', type: 'contradiction', description: 'Thiel claimed no knowledge despite board seat' },
];

// Iceberg data
export interface IcebergItem {
  id: string;
  title: string;
  depth: 'surface' | 'shallow' | 'deep' | 'abyss';
  evidenceCount: number;
  status: 'verified' | 'disputed' | 'speculative' | 'unknown';
  description: string;
}

export const icebergData: IcebergItem[] = [
  { id: 'i1', title: 'NSA collects metadata on US citizens', depth: 'surface', evidenceCount: 67, status: 'verified', description: 'Confirmed by Snowden documents, congressional testimony, and court rulings' },
  { id: 'i2', title: 'PRISM program accessed tech company data', depth: 'surface', evidenceCount: 45, status: 'verified', description: 'Revealed by classified slides, confirmed by multiple sources' },
  { id: 'i3', title: 'Cambridge Analytica harvested Facebook data', depth: 'surface', evidenceCount: 52, status: 'verified', description: 'Confirmed by investigations, whistleblower testimony, and company admissions' },
  { id: 'i4', title: 'In-Q-Tel funds Silicon Valley startups', depth: 'surface', evidenceCount: 38, status: 'verified', description: 'Publicly acknowledged by CIA venture capital arm' },
  { id: 'i5', title: 'Project Lifelog cancelled same day Facebook launched', depth: 'shallow', evidenceCount: 8, status: 'disputed', description: 'Dates confirmed but causal connection disputed' },
  { id: 'i6', title: 'Intelligence community has undisclosed tech investments', depth: 'shallow', evidenceCount: 12, status: 'disputed', description: 'Some evidence from declassified documents, scope unknown' },
  { id: 'i7', title: 'Tech companies provide backdoor access to agencies', depth: 'shallow', evidenceCount: 15, status: 'disputed', description: 'Some evidence from leaked documents, companies deny voluntary cooperation' },
  { id: 'i8', title: 'Social media platforms designed for surveillance', depth: 'deep', evidenceCount: 3, status: 'speculative', description: 'Minimal direct evidence, mostly circumstantial connections' },
  { id: 'i9', title: 'AI systems used for predictive social control', depth: 'deep', evidenceCount: 5, status: 'speculative', description: 'Patents exist but deployment evidence is thin' },
  { id: 'i10', title: 'Complete integration of tech and intelligence apparatus', depth: 'abyss', evidenceCount: 0, status: 'unknown', description: 'No direct evidence — open question' },
  { id: 'i11', title: 'Pre-crime systems actively deployed domestically', depth: 'abyss', evidenceCount: 1, status: 'unknown', description: 'One unconfirmed report, no corroboration' },
];

// Timeline data
export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'verified' | 'disputed' | 'unknown' | 'redacted';
  branch: string;
  evidenceCount: number;
  description: string;
}

export const timelineData: TimelineEvent[] = [
  { id: 't1', title: 'Total Information Awareness launched', date: '2002-01', type: 'verified', branch: 'main', evidenceCount: 14, description: 'DARPA initiates mass surveillance research program' },
  { id: 't2', title: 'TIA defunded by Congress', date: '2003-09', type: 'verified', branch: 'main', evidenceCount: 11, description: 'Public backlash leads to defunding' },
  { id: 't3', title: 'Project Lifelog cancelled', date: '2004-02', type: 'verified', branch: 'main', evidenceCount: 8, description: 'DARPA cancels personal data project' },
  { id: 't4', title: 'Facebook launches', date: '2004-02', type: 'verified', branch: 'main', evidenceCount: 15, description: 'Social network launches from Harvard dorm' },
  { id: 't5', title: 'TIA components continue classified', date: '2004-03', type: 'disputed', branch: 'shadow', evidenceCount: 4, description: 'Reports suggest TIA tech moved to classified programs' },
  { id: 't6', title: 'AT&T Room 641A discovered', date: '2006-01', type: 'verified', branch: 'main', evidenceCount: 11, description: 'NSA wiretapping facility exposed by technician' },
  { id: 't7', title: 'Peter Thiel invests in Facebook', date: '2004-06', type: 'verified', branch: 'main', evidenceCount: 31, description: 'First outside investment of $500,000' },
  { id: 't8', title: 'In-Q-Tel investments expand', date: '2005-01', type: 'verified', branch: 'main', evidenceCount: 12, description: 'CIA venture arm increases Silicon Valley portfolio' },
  { id: 't9', title: '[REDACTED PERIOD]', date: '2007-06', type: 'redacted', branch: 'main', evidenceCount: 0, description: 'Classified activities — no public record' },
  { id: 't10', title: 'PRISM program begins', date: '2007-09', type: 'verified', branch: 'main', evidenceCount: 45, description: 'NSA starts collecting data from tech companies' },
  { id: 't11', title: 'Snowden revelations', date: '2013-06', type: 'verified', branch: 'main', evidenceCount: 67, description: 'Edward Snowden leaks classified NSA documents' },
  { id: 't12', title: 'Parallel construction revealed', date: '2013-08', type: 'disputed', branch: 'shadow', evidenceCount: 6, description: 'Reports of DEA using NSA data while hiding source' },
  { id: 't13', title: 'Cambridge Analytica scandal', date: '2018-03', type: 'verified', branch: 'main', evidenceCount: 52, description: 'Political data harvesting from Facebook exposed' },
  { id: 't14', title: 'Section 702 reauthorized', date: '2018-01', type: 'verified', branch: 'main', evidenceCount: 28, description: 'FISA surveillance powers renewed' },
];
