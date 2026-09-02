import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Building2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { Header } from "../../components/Header";
import { Button, FormField } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../services/supabase";
import { invalidateQueries } from "../../services/queryCache";
import { useNavigation } from "@react-navigation/native";
import { Actions, Container, Content, LogoCard, LogoPlaceholder, LogoPreview } from "./styles";
import {
  ORGANIZATION_LOGO_MAX_BYTES,
  ORGANIZATION_LOGO_MAX_DIMENSION,
  ORGANIZATION_LOGO_WEBP_QUALITY,
  organizationLogoOutput,
} from "../../domain/organizationLogo";

type Fields = { name: string; legal_name: string; document: string; email: string; phone: string; address: string };
type OptimizedLogo = { uri: string; contentType: "image/png" | "image/webp"; extension: "png" | "webp" };

export function OrganizationProfile() {
  const navigation = useNavigation<any>();
  const { session, refreshSession } = useAuth();
  const theme = useTheme();
  const organization = session!.organization;
  const [fields, setFields] = useState<Fields>({
    name: organization.name, legal_name: organization.legal_name ?? "", document: organization.document ?? "",
    email: organization.email ?? "", phone: organization.phone ?? "", address: organization.address ?? "",
  });
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoAsset, setLogoAsset] = useState<OptimizedLogo | null>(null);
  const [optimizingLogo, setOptimizingLogo] = useState(false);
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 1 });
    if (result.canceled) return;

    try {
      setOptimizingLogo(true);
      const asset = result.assets[0];
      let optimizedLogo: OptimizedLogo | null = null;
      for (const maxDimension of [ORGANIZATION_LOGO_MAX_DIMENSION, 800, 600]) {
        const output = organizationLogoOutput(asset.width, asset.height, asset.mimeType, maxDimension);
        const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
        if (output.width && output.height && (output.width !== asset.width || output.height !== asset.height)) {
          context.resize({ width: output.width, height: output.height });
        }
        const rendered = await context.renderAsync();
        const optimized = await rendered.saveAsync({
          compress: output.preserveTransparency ? 1 : ORGANIZATION_LOGO_WEBP_QUALITY,
          format: output.preserveTransparency ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.WEBP,
        });
        const bytes = await (await fetch(optimized.uri)).arrayBuffer();
        if (bytes.byteLength <= ORGANIZATION_LOGO_MAX_BYTES) {
          optimizedLogo = { uri: optimized.uri, contentType: output.contentType, extension: output.extension };
          break;
        }
      }
      if (!optimizedLogo) {
        throw new Error("A logomarca continua acima de 2 MB após a otimização. Escolha uma imagem mais simples.");
      }
      setLogoAsset(optimizedLogo);
      setLogoUri(optimizedLogo.uri);
    } catch (error) {
      Alert.alert("Não foi possível otimizar a logomarca", error instanceof Error ? error.message : "Escolha outra imagem e tente novamente.");
    } finally {
      setOptimizingLogo(false);
    }
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
      invalidateQueries(`report-company:${organization.id}`);

      if (logoAsset) {
        const path = `${organization.id}/logo-${Date.now()}.${logoAsset.extension}`;
        const bytes = await (await fetch(logoAsset.uri)).arrayBuffer();
        if (bytes.byteLength > ORGANIZATION_LOGO_MAX_BYTES) throw new Error("A logomarca otimizada ultrapassa o limite de 2 MB.");
        const upload = await supabase.storage.from("organization-logos").upload(path, bytes, { contentType: logoAsset.contentType, upsert: false });
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
      <Button label={logoUri ? "Trocar logomarca" : "Selecionar logomarca"} variant="secondary" loading={optimizingLogo} disabled={saving} onPress={chooseLogo} />
    </LogoCard>
    <FormField label="Nome da empresa" required value={fields.name} onChangeText={set("name")} />
    <FormField label="Razão social" value={fields.legal_name} onChangeText={set("legal_name")} />
    <FormField label="CPF ou CNPJ" value={fields.document} onChangeText={set("document")} />
    <FormField label="Telefone" value={fields.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
    <FormField label="E-mail" value={fields.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
    <FormField label="Endereço" value={fields.address} onChangeText={set("address")} multiline />
      <Actions><Button label="Salvar dados da empresa" loading={saving} onPress={save} /><Button label="Excluir minha conta" variant="destructive" onPress={() => navigation.navigate("DeleteAccount")} /></Actions>
  </Content></Container>;
}
