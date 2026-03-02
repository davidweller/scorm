/** MVP: multiple_choice | flashcards. Post-MVP: true_false | fill_blanks | drag_drop */
export type H5PActivityType = "multiple_choice" | "flashcards";

export interface Activity {
  id: string;
  courseId: string;
  moduleId?: string;
  type: H5PActivityType;
  h5pJson: Record<string, unknown>;
  order: number;
}
