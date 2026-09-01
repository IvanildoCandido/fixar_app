export const ORGANIZATION_LOGO_MAX_DIMENSION = 1200;
export const ORGANIZATION_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const ORGANIZATION_LOGO_WEBP_QUALITY = 0.82;

export type OrganizationLogoOutput = {
  width?: number;
  height?: number;
  contentType: "image/png" | "image/webp";
  extension: "png" | "webp";
  preserveTransparency: boolean;
};

export function organizationLogoOutput(width: number | undefined, height: number | undefined, mimeType?: string | null, maxDimension = ORGANIZATION_LOGO_MAX_DIMENSION): OrganizationLogoOutput {
  const largestSide = Math.max(width ?? 0, height ?? 0);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
  const preserveTransparency = mimeType?.toLowerCase() === "image/png";

  return {
    width: width ? Math.round(width * scale) : undefined,
    height: height ? Math.round(height * scale) : undefined,
    contentType: preserveTransparency ? "image/png" : "image/webp",
    extension: preserveTransparency ? "png" : "webp",
    preserveTransparency,
  };
}
