export interface BlueprintModule {
  id: string;
  title: string;
  summary?: string;
  timeMinutes?: number;
  activityTypes?: string[];
  iloIds?: string[];
}

export interface IntendedLearningOutcome {
  id: string;
  text: string;
}

export interface Blueprint {
  overview?: string;
  ilos: IntendedLearningOutcome[];
  modules: BlueprintModule[];
  tone?: string;
  level?: string;
  deliveryMode?: string;
  targetAudience?: string;
  assessmentDescription?: string;
  lockedAt?: string;
}
