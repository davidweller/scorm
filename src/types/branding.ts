export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  /** Text/ink color for body and headings (high contrast). Default #1b0101 */
  textColor?: string;
  headingFont: string;
  bodyFont: string;
  logoUrl?: string;
}

/** Default brand: deep blue primary, light blue secondary, orange accent, off-white background, Work Sans + Ubuntu */
export const DEFAULT_BRANDING: Branding = {
  primaryColor: "#015887",
  secondaryColor: "#86bfe2",
  accentColor: "#ff7700",
  backgroundColor: "#f8f8f8",
  textColor: "#1b0101",
  headingFont: "Work Sans, sans-serif",
  bodyFont: "Ubuntu, sans-serif",
};
