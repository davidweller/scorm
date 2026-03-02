export interface ModuleSection {
  id: string;
  heading: string;
  content: string;
  scenario?: string;
  reflectionPrompt?: string;
  knowledgeChecks?: string[];
  resourceSuggestions?: string[];
  /** Inline activities rendered within this section (in order). */
  activityIds?: string[];
}

export interface Module {
  id: string;
  courseId: string;
  order: number;
  title: string;
  sections: ModuleSection[];
  youtubeUrls: string[];
  heroImageUrl?: string;
  lockedAt?: string;
}
