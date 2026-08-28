import React, { useEffect, useState } from "react";
import { Alert, Share, Switch } from "react-native";
import * as Print from "expo-print";
import QRCode from "qrcode";
import { SvgXml } from "react-native-svg";
import styled, { useTheme } from "styled-components/native";
import { Button, FormModal, Spinner } from "../../design-system";
import { DeviceProps } from "../../screens/Devices";
import { manageEquipmentPublicLink } from "../../services/API";

export function PublicEquipmentQr({ device, onClose }: { device: DeviceProps; onClose: () => void }) {
  const theme = useTheme();
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const baseUrl = process.env.EXPO_PUBLIC_FIXAR_WEB_URL?.replace(/\/$/, "");
  const url = baseUrl && token ? `${baseUrl}/e/${token}` : "";

  async function load() {
    try {
      const link = await manageEquipmentPublicLink(device.id);
      setToken(link.publicToken); setEnabled(link.enabled);
    } catch { Alert.alert("QR Code público", "Não foi possível carregar esta configuração."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [device.id]);
  useEffect(() => { if (url) void QRCode.toString(url, { type: "svg", width: 260, margin: 2, color: { dark: theme.colors.foreground, light: "#ffffff" } }).then(setSvg); }, [url, theme.colors.foreground]);

  async function toggle(value: boolean) {
    setSaving(true);
    try { const link = await manageEquipmentPublicLink(device.id, value); setEnabled(link.enabled); }
    catch { Alert.alert("QR Code público", "Não foi possível alterar a consulta pública."); }
    finally { setSaving(false); }
  }
  function rotate() {
    Alert.alert("Gerar um novo QR Code?", "O QR atual deixará de funcionar imediatamente.", [{ text: "Cancelar", style: "cancel" }, { text: "Gerar novo", style: "destructive", onPress: async () => {
      setSaving(true); try { const link = await manageEquipmentPublicLink(device.id, undefined, true); setToken(link.publicToken); } catch { Alert.alert("QR Code público", "Não foi possível gerar um novo código."); } finally { setSaving(false); }
    } }]);
  }
  async function print() {
    if (!svg) return;
    await Print.printAsync({ html: `<html><body style="font-family:Arial;text-align:center;padding:40px"><h1>${device.reference}</h1><p>${device.brand} ${device.model} • ${device.location}</p>${svg}<p>${url}</p></body></html>` });
  }

  return <FormModal title="QR Code público" description="Ficha pública segura para colar no equipamento." onClose={onClose} footer={<><FooterButton label="Fechar" variant="secondary" onPress={onClose} /><FooterButton label="Compartilhar" disabled={!url} onPress={() => Share.share({ message: `Equipamento ${device.reference}: ${url}` })} /></>}>
    {loading ? <Spinner /> : !baseUrl ? <Notice>Configure EXPO_PUBLIC_FIXAR_WEB_URL para gerar o endereço público.</Notice> : <Content>
      <Identity>{device.reference}</Identity><Meta>{[device.brand, device.model, device.location].filter(Boolean).join(" • ")}</Meta>
      {svg ? <QrFrame><SvgXml xml={svg} width={240} height={240} /></QrFrame> : null}
      <Setting><SettingCopy><SettingTitle>Consulta pública</SettingTitle><Meta>{enabled ? "Ativa para quem escanear" : "Desativada"}</Meta></SettingCopy><Switch accessibilityLabel="Ativar consulta pública" value={enabled} disabled={saving} onValueChange={toggle} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} /></Setting>
      <Url selectable>{url}</Url>
      <ActionRow><ActionButton label="Imprimir" variant="secondary" onPress={print} /><ActionButton label="Gerar novo QR" variant="ghost" loading={saving} onPress={rotate} /></ActionRow>
      <Notice>O QR interno de identificação continua separado e não foi alterado.</Notice>
    </Content>}
  </FormModal>;
}

const Content = styled.View`gap: ${({ theme }) => theme.spacing.md}px;`;
const Identity = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; color: ${({ theme }) => theme.colors.foreground};`;
const Meta = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted};`;
const QrFrame = styled.View`align-self: center; padding: ${({ theme }) => theme.spacing.md}px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: #ffffff;`;
const Setting = styled.View`min-height: 60px; flex-direction: row; align-items: center; padding: ${({ theme }) => theme.spacing.md}px; border-radius: ${({ theme }) => theme.radii.md}px; background-color: ${({ theme }) => theme.colors.secondary};`;
const SettingCopy = styled.View`flex: 1; gap: 3px;`;
const SettingTitle = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; color: ${({ theme }) => theme.colors.foreground};`;
const Url = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.primary};`;
const ActionRow = styled.View`flex-direction: row; gap: ${({ theme }) => theme.spacing.sm}px;`;
const ActionButton = styled(Button)`flex: 1;`;
const FooterButton = styled(Button)`flex: 1;`;
const Notice = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px; line-height: ${({ theme }) => theme.typography.caption.lineHeight}px; color: ${({ theme }) => theme.colors.muted};`;
