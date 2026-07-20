// Maps category keys to their view component type
// This is the single source of truth for the spec's category→view mapping

export type CategoryViewType = 'file' | 'structured' | 'org-chart' | 'contact-cards' | 'hybrid';

export const CATEGORY_VIEW_MAP: Record<string, CategoryViewType> = {
  sops: 'file',
  hierarchy: 'org-chart',
  spoc: 'contact-cards',
  workflow: 'file',
  faq: 'structured',
  pitch: 'file',
  brochures: 'file',
  flyers: 'file',
  mail_draft: 'structured',
  recordings: 'file',
  leads_storage: 'structured',
  updates: 'structured',
  prices: 'structured',
  targets: 'structured',
  competitor_info: 'hybrid',
  features: 'structured',
  videos: 'file',
  plan_of_action: 'structured',
};

// Category display metadata
export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  sops: { label: 'SOPs', icon: 'FileText', description: 'Standard Operating Procedures' },
  hierarchy: { label: 'Hierarchy', icon: 'GitBranch', description: 'Organization chart & reporting structure' },
  spoc: { label: 'SPOC', icon: 'Users', description: 'Single Points of Contact' },
  workflow: { label: 'Workflow', icon: 'GitMerge', description: 'Process flowcharts & diagrams' },
  faq: { label: 'FAQ', icon: 'HelpCircle', description: 'Frequently Asked Questions' },
  pitch: { label: 'Pitch', icon: 'Presentation', description: 'Pitch decks & presentations' },
  brochures: { label: 'Brochures', icon: 'BookOpen', description: 'Marketing brochures' },
  flyers: { label: 'Flyers', icon: 'Image', description: 'Promotional flyers' },
  mail_draft: { label: 'Mail Draft', icon: 'Mail', description: 'Email templates with variables' },
  recordings: { label: 'Recordings', icon: 'Mic', description: 'Audio & video recordings' },
  leads_storage: { label: 'Leads', icon: 'Database', description: 'Lead pipeline & CRM data' },
  updates: { label: 'Updates', icon: 'Bell', description: 'Changelog & announcements' },
  prices: { label: 'Prices', icon: 'DollarSign', description: 'Pricing history & records' },
  targets: { label: 'Targets', icon: 'Target', description: 'KPIs & performance targets' },
  competitor_info: { label: 'Competitors', icon: 'Shield', description: 'Competitor research & analysis' },
  features: { label: 'Features', icon: 'Star', description: 'Product features & roadmap' },
  videos: { label: 'Videos', icon: 'Video', description: 'Video content library' },
  plan_of_action: { label: 'Plan of Action', icon: 'CheckSquare', description: 'Tasks, owners & deadlines' },
};
