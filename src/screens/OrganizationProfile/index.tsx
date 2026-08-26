import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Building2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { Header } from "../../components/Header";
import { Button, FormField } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../services/supabase";
import { Actions, Container, Content, Help, LogoCard, LogoPlaceholder, LogoPreview } from "./styles";

type Fields = { name: string; legal_name: string; document: string; email: string; phone: string; address: string };

export function OrganizationProfile() {
  const { session, refreshSession } = useAuth();
  const theme = useTheme();
  const organization = session!.organization;
  const [fields, setFields] = useState<Fields>({
    name: organization.name, legal_name: organization.legal_name ?? "", document: organization.document ?? "",
    email: organization.email ?? "", phone: organization.phone ?? "", address: organization.address ?? "",
  });
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoAsset, setLogoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("organizations").select("logo_path").eq("id", organization.id).maybeSingle().then(({ data }) => {
      if (data?.logo_path) {
        setLogoPath(data.logo_path);
        setLogoUri(supabase.storage.from("organization-logos").getPublicUrl(data.logo_path).data.publicUrl);
      }
    });
  }, [organization.id]);

  const set = (key: keyof Fields) => (value: string) => setFields((current) => ({ ...current, [key]: value }));

  async function chooseLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Acesso necessário", "Permita o acesso às fotos para selecionar a logomarca.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (!result.canceled) { setLogoAsset(result.assets[0]); setLogoUri(result.assets[0].uri); }
  }

  async function save() {
    if (!fields.name.trim()) { Alert.alert("Nome obrigatório", "Informe o nome da empresa."); return; }
    try {
      setSaving(true);
      const { error } = await supabase.from("organizations").update({
        name: fields.name.trim(), legal_name: fields.legal_name.trim() || null, document: fields.document.trim() || null,
        email: fields.email.trim() || null, phone: fields.phone.trim() || null, address: fields.address.trim() || null,
      }).eq("id", organization.id);
      if (error) throw error;

      if (logoAsset) {
        const contentType = logoAsset.mimeType ?? "image/jpeg";
        const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
        const path = `${organization.id}/logo-${Date.now()}.${extension}`;
        const bytes = await (await fetch(logoAsset.uri)).arrayBuffer();
        const upload = await supabase.storage.from("organization-logos").upload(path, bytes, { contentType, upsert: false });
        if (upload.error) throw upload.error;
        const logoUpdate = await supabase.from("organizations").update({ logo_path: path }).eq("id", organization.id);
        if (logoUpdate.error) throw logoUpdate.error;
        if (logoPath && logoPath !== path) await supabase.storage.from("organization-logos").remove([logoPath]);
        setLogoPath(path);
        setLogoUri(supabase.storage.from("organization-logos").getPublicUrl(path).data.publicUrl);
        setLogoAsset(null);
      }
      try {
        await refreshSession();
      } catch (refreshError) {
        console.warn("Dados salvos; não foi possível atualizar a sessão imediatamente.", refreshError);
      }
      Alert.alert("Dados atualizados", "As próximas ordens e relatórios usarão esta identidade visual.");
    } catch (error) {
      Alert.alert("Não foi possível salvar", error instanceof Error ? error.message : "Tente novamente.");
    } finally { setSaving(false); }
  }

  return <Container><Header title="Dados da empresa" icons /><Content keyboardShouldPersistTaps="handled">
    <LogoCard>
      {logoUri ? <LogoPreview source={{ uri: logoUri }} resizeMode="contain" /> : <LogoPlaceholder><Building2 size={34} color={theme.colors.primary} /></LogoPlaceholder>}
      <Button label={logoUri ? "Trocar logomarca" : "Selecionar logomarca"} variant="secondary" onPress={chooseLogo} />
      <Help>PNG, JPG ou WebP de até 2 MB. Prefira fundo transparente e formato horizontal.</Help>
    </LogoCard>
    <FormField label="Nome da empresa" required value={fields.name} onChangeText={set("name")} />
    <FormField label="Razão social" value={fields.legal_name} onChangeText={set("legal_name")} />
    <FormField label="CPF ou CNPJ" value={fields.document} onChangeText={set("document")} />
    <FormField label="Telefone" value={fields.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
    <FormField label="E-mail" value={fields.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
    <FormField label="Endereço" value={fields.address} onChangeText={set("address")} multiline />
    <Actions><Button label="Salvar dados da empresa" loading={saving} onPress={save} /></Actions>
  </Content></Container>;
}
