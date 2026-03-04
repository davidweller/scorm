import type { BrandConfig } from "./branding";

export type ContentBlockType =
  | "text"
  | "heading"
  | "image"
  | "video_embed"
  | "key_insight"
  | "key_point";
export type InteractionBlockType =
  | "multiple_choice"
  | "true_false"
  | "reflection"
  | "drag_and_drop"
  | "matching"
  | "dialog_cards";

export interface ContentBlockData {
  id: string;
  pageId: string;
  type: ContentBlockType;
  content: Record<string, unknown>;
  order: number;
}

export interface InteractionBlockData {
  id: string;
  pageId: string;
  type: InteractionBlockType;
  config:
    | MultipleChoiceConfig
    | TrueFalseConfig
    | ReflectionConfig
    | DragAndDropConfig
    | MatchingConfig
    | DialogCardsConfig;
  order: number;
}

export interface MultipleChoiceConfig {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface TrueFalseConfig {
  question: string;
  correct: boolean;
  explanation?: string;
}

export interface ReflectionConfig {
  prompt: string;
}

export interface DragAndDropConfig {
  question: string;
  items: string[];
  correctOrder: number[];
  explanation?: string;
}

export interface MatchingConfig {
  question: string;
  pairs: { left: string; right: string }[];
  explanation?: string;
}

export interface DialogCardsConfig {
  title?: string;
  cards: { front: string; back: string }[];
}

export type InteractionDensity = "light" | "moderate" | "heavy";

export interface InteractionPlacement {
  withinLessons: boolean;
  endOfModule: boolean;
  finalAssessment: boolean;
}

export interface InteractionConfig {
  enabledTypes: InteractionBlockType[];
  density: InteractionDensity;
  placement: InteractionPlacement;
  includeExplanations: boolean;
}

export interface PageData {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  completionRules?: Record<string, unknown> | null;
  contentBlocks: ContentBlockData[];
  interactionBlocks: InteractionBlockData[];
}

export interface LessonData {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  pages: PageData[];
}

export interface ModuleData {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: LessonData[];
}

export interface CourseData {
  id: string;
  title: string;
  overview: string | null;
  brandConfig: BrandConfig | null;
  createdAt: string;
  updatedAt: string;
  modules: ModuleData[];
}
