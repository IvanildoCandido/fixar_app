import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView } from "react-native";
import { CheckSquare2, Eye, Plus, QrCode, Square } from "lucide-react-native";
import QRCode from "qrcode";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { SvgXml } from "react-native-svg";
import styled, { useTheme } from "styled-components/native";
import { Header } from "../../components/Header";
import { Button, EmptyState, ErrorState, FormModal, SearchInput, Spinner } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../services/supabase";
import {
  defaultEquipmentLabelPreferences, getEquipmentQrIdentity, listEquipmentLabelItems, listReservedEquipmentQrCodes,
  loadEquipmentLabelPreferences, reserveEquipmentQrCodes, saveEquipmentLabelPreferences,
} from "../../services/API";
import { EquipmentLabelItem } from "../../types/data";
import { createEquipmentPublicUrl, createEquipmentReference } from "@fixar/qr-contract";
import uuid from "react-native-uuid";
import {
  buildEquipmentLabelContent, DEFAULT_LABEL_HEIGHT_MM, DEFAULT_LABEL_WIDTH_MM,
  generateA4LabelsHtml,
} from "../../domain/equipmentLabels";

export function EquipmentLabels() {
  const { session } = useAuth();
  const theme = useTheme();
  const [items, setItems] = useState<EquipmentLabelItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState(defaultEquipmentLabelPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configuring, setConfiguring] = useState(false);
  const [previewSvg, setPreviewSvg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [savingReservation, setSavingReservation] = useState(false);
  const baseUrl = process.env.EXPO_PUBLIC_FIXAR_WEB_URL?.replace(/\/$/, "") ?? "";
  const logoUrl = session?.organization.logo_path ? supabase.storage.from("organization-logos").getPublicUrl(session.organization.logo_path).data.publicUrl : null;

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [rows, reserved, saved] = await Promise.all([listEquipmentLabelItems(), listReservedEquipmentQrCodes(), loadEquipmentLabelPreferences()]);
      setItems([...reserved, ...rows]);
      setPreferences(saved);
    } catch {
      setError("Não foi possível carregar os equipamentos e etiquetas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [
        item.reference,
        item.customerName,
        item.location,
        item.brand,
        item.model,
        item.equipmentType,
      ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return haystack.includes(term);
    });
  }, [items, query]);

  const chosen = items.filter((item) => selected.includes(item.id));
  const labelCompany = {
    name: session?.organization.name ?? "FIXAR",
    phone: session?.organization.phone,
    logoUrl,
    generatorName: session?.user.name ?? "Usuário",
  };
  const previewContent = chosen[0] ? buildEquipmentLabelContent({ ...chosen[0], qrSvg: previewSvg }, labelCompany) : null;
  const generateButtonLabel = selected.length === 0
    ? "Gerar PDF"
    : `Gerar PDF • ${selected.length} ${selected.length === 1 ? "etiqueta" : "etiquetas"}`;

  async function ensureToken(item: EquipmentLabelItem) {
    if (item.publicToken) return item.publicToken;
    const identity = await getEquipmentQrIdentity(item.id);
    setItems((current) => current.map((value) => value.id === item.id ? { ...value, publicToken: identity.publicToken } : value));
    return identity.publicToken;
  }

  async function openConfiguration() {
    if (!chosen.length) return;
    if (!baseUrl) {
      Alert.alert("Configuração ausente", "O endereço público do FIXAR não está configurado.");
      return;
    }
    try {
      const token = await ensureToken(chosen[0]);
      const url = createEquipmentPublicUrl(baseUrl, token);
      setPreviewSvg(await QRCode.toString(url, { type: "svg", width: 180, margin: 1 }));
      setConfiguring(true);
    } catch {
      Alert.alert("QR Code indisponível", "Não foi possível recuperar o QR deste equipamento.");
    }
  }

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  async function createReservations() {
    try {
      setSavingReservation(true);
      const references = Array.from({ length: quantity }, () => {
        const seed = String(uuid.v4()).replace(/-/g, "").slice(0, 7);
        return createEquipmentReference(Uint32Array.from(seed, (character) => character.charCodeAt(0)));
      });
      const created = await reserveEquipmentQrCodes(references);
      setItems((current) => [...created, ...current]);
      setSelected(created.map((item) => item.id));
      setReserving(false);
      setQuantity(1);
    } catch (cause) {
      Alert.alert("Não foi possível gerar os QR Codes", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setSavingReservation(false);
    }
  }

  async function generateDocument() {
    if (!chosen.length) return;
    try {
      setGenerating(true);
      const documentItems = await Promise.all(chosen.map(async (item) => {
        const token = await ensureToken(item);
        const url = createEquipmentPublicUrl(baseUrl, token);
        return { ...item, qrSvg: await QRCode.toString(url, { type: "svg", width: 260, margin: 1 }) };
      }));
      if (session?.role !== "viewer") await saveEquipmentLabelPreferences(preferences);
      const html = generateA4LabelsHtml(documentItems, labelCompany, preferences);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
      setConfiguring(false);
    } catch (cause) {
      Alert.alert("Não foi possível gerar o PDF", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Container>
      <Header title="QR Codes e Etiquetas" onPress={() => setReserving(true)} />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar equipamentos" />

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState description={error} />
      ) : (
        <List>
          {filtered.map((item) => (
            <Row key={item.id} onPress={() => toggle(item.id)}>
              {selected.includes(item.id) ? <CheckSquare2 size={20} color={theme.colors.primary} /> : <Square size={20} color={theme.colors.muted} />}
              <RowCopy>
                <RowTitle>{item.reference}</RowTitle>
                <RowMeta>{item.customerName}</RowMeta>
                <RowMetaSmall>{item.location ? `Ambiente: ${item.location}` : "Ambiente não informado"}</RowMetaSmall>
                <Status $active={Boolean(item.publicToken)}>{Boolean(item.publicToken) ? "QR disponível" : "Sem QR"}</Status>
              </RowCopy>
              <Eye size={18} color={theme.colors.primary} />
            </Row>
          ))}
        </List>
      )}

      {!loading && !error && !filtered.length ? <EmptyState title="Nenhum equipamento encontrado" /> : null}

      <Bottom>
        <Button label={generateButtonLabel} disabled={!selected.length} loading={generating} onPress={openConfiguration} />
      </Bottom>

      <Modal visible={reserving} transparent animationType="fade" onRequestClose={() => setReserving(false)}>
        <FormModal
          title="Gerar novos QR Codes"
          description="Crie etiquetas disponíveis para cadastrar equipamentos depois."
          onClose={() => setReserving(false)}
          footer={<FooterButton label={`Gerar ${quantity} QR Code${quantity > 1 ? "s" : ""}`} loading={savingReservation} onPress={createReservations} />}
        >
          <SectionLabel>Quantidade</SectionLabel>
          <QuantityRow>
            <QuantityButton disabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))}><QuantityText>−</QuantityText></QuantityButton>
            <QuantityValue>{quantity}</QuantityValue>
            <QuantityButton disabled={quantity >= 24} onPress={() => setQuantity((value) => Math.min(24, value + 1))}><Plus size={20} color={theme.colors.primary} /></QuantityButton>
          </QuantityRow>
          <CapacityNotice>Os QR Codes ficam vinculados à sua empresa e serão associados quando o equipamento for cadastrado.</CapacityNotice>
        </FormModal>
      </Modal>

      <Modal visible={configuring} transparent animationType="fade" onRequestClose={() => setConfiguring(false)}>
        <FormModal
          title="Prévia da etiqueta"
          description="A etiqueta será gerada neste mesmo formato."
          onClose={() => setConfiguring(false)}
          footer={<FooterButton label="Gerar PDF" loading={generating} onPress={generateDocument} />}
        >
          <Preview style={{ aspectRatio: DEFAULT_LABEL_WIDTH_MM / DEFAULT_LABEL_HEIGHT_MM }}>
            <PreviewCompanyColumn>
              <PreviewLogoWrap>
                {previewContent?.companyLogoUrl ? <PreviewLogo source={{ uri: previewContent.companyLogoUrl }} resizeMode="contain" /> : <PreviewInitials>{previewContent?.companyInitials}</PreviewInitials>}
              </PreviewLogoWrap>
              <PreviewName>{previewContent?.companyName}</PreviewName>
              {previewContent?.companyPhone ? <PreviewPhone>{previewContent.companyPhone}</PreviewPhone> : null}
            </PreviewCompanyColumn>
            <PreviewQrColumn>
              <PreviewQr>{previewSvg ? <SvgXml xml={previewSvg} width={104} height={104} /> : <QrCode size={92} />}</PreviewQr>
              <PreviewReference>{previewContent?.reference}</PreviewReference>
            </PreviewQrColumn>
          </Preview>
        </FormModal>
      </Modal>
    </Container>
  );
}

const Container = styled.View`flex:1;background:${({theme})=>theme.colors.background};`;
const List = styled(ScrollView).attrs({ contentContainerStyle: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 } })``;
const Row = styled(Pressable)`min-height:88px;flex-direction:row;align-items:center;gap:10px;padding:12px 10px;margin-bottom:10px;border:1px solid ${({theme})=>theme.colors.border};border-radius:${({theme})=>theme.radii.lg}px;background:${({theme})=>theme.colors.surface};`;
const RowCopy = styled.View`flex:1;`;
const RowTitle = styled.Text`font-family:${({theme})=>theme.fonts.semibold};font-size:${({theme})=>theme.typography.body.size}px;color:${({theme})=>theme.colors.foreground};`;
const RowMeta = styled.Text`margin-top:3px;font-size:${({theme})=>theme.typography.caption.size}px;color:${({theme})=>theme.colors.muted};`;
const RowMetaSmall = styled.Text`margin-top:2px;font-size:11px;color:${({theme})=>theme.colors.muted};`;
const Status = styled.Text<{$active:boolean}>`margin-top:4px;font-family:${({theme})=>theme.fonts.medium};font-size:11px;color:${({theme,$active})=>$active ? theme.colors.success : theme.colors.warning};`;
const Bottom = styled.View`position:absolute;left:0;right:0;bottom:0;padding:12px 20px 28px;border-top-width:1px;border-color:${({theme})=>theme.colors.border};background:${({theme})=>theme.colors.surface};`;
const FooterButton = styled(Button)`flex:1;`;
const SectionLabel = styled.Text`margin-top:12px;margin-bottom:8px;font-family:${({theme})=>theme.fonts.semibold};color:${({theme})=>theme.colors.foreground};`;
const QuantityRow = styled.View`flex-direction:row;align-items:center;justify-content:center;gap:20px;padding:18px 0;`;
const QuantityButton = styled.Pressable`width:44px;height:44px;align-items:center;justify-content:center;border:1px solid ${({theme})=>theme.colors.border};border-radius:${({theme})=>theme.radii.md}px;background:${({theme})=>theme.colors.surface};`;
const QuantityText = styled.Text`font-size:24px;color:${({theme})=>theme.colors.primary};`;
const QuantityValue = styled.Text`min-width:44px;text-align:center;font-size:24px;font-family:${({theme})=>theme.fonts.bold};color:${({theme})=>theme.colors.foreground};`;
const CapacityNotice = styled.Text`padding:10px 12px;border-radius:${({theme})=>theme.radii.md}px;background:${({theme})=>theme.colors.secondary};font-size:${({theme})=>theme.typography.caption.size}px;color:${({theme})=>theme.colors.foreground};`;
const Preview = styled.View`width:100%;max-height:250px;padding:12px;flex-direction:row;border:1px solid ${({theme})=>theme.colors.border};border-radius:${({theme})=>theme.radii.lg}px;background:${({theme})=>theme.colors.surface};`;
const PreviewCompanyColumn = styled.View`flex:45;min-width:0;align-items:center;justify-content:center;padding-right:10px;gap:7px;`;
const PreviewQrColumn = styled.View`flex:55;min-width:0;align-items:center;justify-content:center;padding-left:10px;border-left-width:1px;border-color:#e3ebe7;gap:5px;`;
const PreviewLogoWrap = styled.View`width:100%;height:52px;justify-content:center;align-items:center;`;
const PreviewLogo = styled.Image`width:88%;height:48px;`;
const PreviewInitials = styled.Text`padding:6px 8px;border-radius:8px;background:#ddf1e8;color:#167552;font-weight:700;`;
const PreviewName = styled.Text`max-width:100%;text-align:center;font-size:12px;font-weight:700;color:#10261d;`;
const PreviewPhone = styled.Text`max-width:100%;text-align:center;font-size:10px;color:#43564d;`;
const PreviewQr = styled.View`align-items:center;justify-content:center;`;
const PreviewReference = styled.Text`max-width:100%;text-align:center;font-size:13px;font-weight:700;color:#10261d;`;
