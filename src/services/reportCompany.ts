import { FixarOrganization } from "../auth/AuthContext";
import { ReportOrganization } from "../components/ReportModels/reportDocument";
import { supabase } from "./supabase";
import { cachedQuery } from "./queryCache";

export async function loadReportCompany(organization: FixarOrganization): Promise<ReportOrganization> {
  return cachedQuery(`report-company:${organization.id}`, 300000, async () => {
  const { data } = await supabase.from("organizations")
    .select("name, legal_name, document, email, phone, address, logo_path")
    .eq("id", organization.id).maybeSingle();

  const source = data ?? organization;
  const logoPath = "logo_path" in source ? source.logo_path : null;
  const logoUrl = logoPath
    ? supabase.storage.from("organization-logos").getPublicUrl(logoPath).data.publicUrl
    : null;

  return { ...source, logo_url: logoUrl };
  });
}
