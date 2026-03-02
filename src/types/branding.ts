export interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  logoUrl?: string;
}

export const DEFAULT_BRANDING: Branding = {
  primaryColor: "#2563eb",
  secondaryColor: "#64748b",
  accentColor: "#0ea5e9",
  backgroundColor: "#ffffff",
  headingFont: "system-ui, sans-serif",
  bodyFont: "system-ui, sans-serif",
};
