export type ColorSchemeName = "light" | "dark";

const foundations = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radii: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  iconSizes: { sm: 16, md: 20, lg: 24, xl: 28 },
  motion: { fast: 120, normal: 180, slow: 250 },
  typography: {
    display: { size: 32, lineHeight: 40 }, pageTitle: { size: 26, lineHeight: 34 },
    sectionTitle: { size: 18, lineHeight: 26 }, heading: { size: 16, lineHeight: 24 },
    body: { size: 14, lineHeight: 22 }, bodySmall: { size: 12, lineHeight: 18 },
    label: { size: 12, lineHeight: 16 }, caption: { size: 11, lineHeight: 16 },
  },
  breakpoints: { compact: 0, medium: 600, expanded: 1024 }, contentMaxWidth: 1200,
  touchTarget: 44, zIndices: { base: 0, sticky: 10, overlay: 20, modal: 30, toast: 40 },
} as const;

export interface FixarTheme {
  mode: ColorSchemeName;
  colors: {
    background: string; foreground: string; surface: string; surfaceMuted: string;
    card: string; cardForeground: string; primary: string; primaryForeground: string;
    secondary: string; secondaryForeground: string; muted: string; mutedForeground: string;
    title: string; ink: string; border: string; input: string; focus: string;
    success: string; warning: string; danger: string; info: string; attention: string;
    lists: string; overlay: string; dangerSurface: string;
    syncSynced: string; syncPending: string; syncSyncing: string; syncOffline: string;
    syncConflict: string; syncError: string;
  };
  fonts: { regular: string; medium: string; semibold: string; bold: string; mono: string };
  spacing: typeof foundations.spacing; radii: typeof foundations.radii;
  iconSizes: typeof foundations.iconSizes; motion: typeof foundations.motion;
  typography: typeof foundations.typography; breakpoints: typeof foundations.breakpoints;
  contentMaxWidth: number; touchTarget: number; zIndices: typeof foundations.zIndices;
}

const fonts = { regular: "Inter_400Regular", medium: "Inter_500Medium", semibold: "Inter_600SemiBold", bold: "Inter_700Bold", mono: "monospace" };

export const lightTheme: FixarTheme = { ...foundations, mode: "light", fonts, colors: {
  background: "#F6F8F7", foreground: "#14231D", surface: "#FFFFFF", surfaceMuted: "#EEF3F0",
  card: "#FFFFFF", cardForeground: "#14231D", primary: "#167552", primaryForeground: "#FFFFFF",
  secondary: "#DDF1E8", secondaryForeground: "#11553D", muted: "#68766F", mutedForeground: "#68766F",
  title: "#34483F", ink: "#14231D", border: "#DCE4E0", input: "#CFD9D4", focus: "#2A8F6B",
  success: "#23845E", warning: "#B7791F", danger: "#D94C4C", info: "#2879C7", attention: "#D94C4C",
  lists: "#DCE4E0", overlay: "rgba(15, 27, 22, 0.58)", dangerSurface: "#FFF0F0",
  syncSynced: "#23845E", syncPending: "#B7791F", syncSyncing: "#2879C7", syncOffline: "#68766F", syncConflict: "#A855F7", syncError: "#D94C4C",
} };

export const darkTheme: FixarTheme = { ...foundations, mode: "dark", fonts, colors: {
  background: "#0D1411", foreground: "#EDF4F0", surface: "#131D19", surfaceMuted: "#192620",
  card: "#131D19", cardForeground: "#EDF4F0", primary: "#48B88D", primaryForeground: "#07110D",
  secondary: "#183B2E", secondaryForeground: "#A7E5CC", muted: "#94A39C", mutedForeground: "#94A39C",
  title: "#C9D8D1", ink: "#EDF4F0", border: "#293831", input: "#35473F", focus: "#60C9A0",
  success: "#53C795", warning: "#E6AA55", danger: "#F07979", info: "#66AEEF", attention: "#F07979",
  lists: "#293831", overlay: "rgba(0, 0, 0, 0.72)", dangerSurface: "#351B1B",
  syncSynced: "#53C795", syncPending: "#E6AA55", syncSyncing: "#66AEEF", syncOffline: "#94A39C", syncConflict: "#C58AF9", syncError: "#F07979",
} };

export default lightTheme;
