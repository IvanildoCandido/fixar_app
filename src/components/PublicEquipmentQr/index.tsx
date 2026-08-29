import React, { useEffect, useState } from "react";
import { Alert, Share } from "react-native";
import * as Print from "expo-print";
import QRCode from "qrcode";
import { SvgXml } from "react-native-svg";
import styled, { useTheme } from "styled-components/native";
import { Button, FormModal, Spinner } from "../../design-system";
import { DeviceProps } from "../../screens/Devices";
import { getEquipmentQrIdentity } from "../../services/API";
import { createEquipmentPublicUrl } from "@fixar/qr-contract";

export function EquipmentQr({ device, onClose }: { device: DeviceProps; onClose: () => void }) {
  const theme = useTheme();
  const [token, setToken] = useState("");
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.EXPO_PUBLIC_FIXAR_WEB_URL?.replace(/\/$/, "");
  const url = baseUrl && token ? createEquipmentPublicUrl(baseUrl, token) : "";

  async function load() {
    try {
      const link = await getEquipmentQrIdentity(device.id);
      setToken(link.publicToken);
    } catch { Alert.alert("QR Code do equipamento", "Não foi possível carregar esta configuração."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [device.id]);
  useEffect(() => { if (url) void QRCode.toString(url, { type: "svg", width: 260, margin: 2, color: { dark: theme.colors.foreground, light: "#ffffff" } }).then(setSvg); }, [url, theme.colors.foreground]);

  async function print() {
    if (!svg) return;
    await Print.printAsync({ html: `<html><body style="font-family:Arial;text-align:center;padding:40px"><h1>${device.reference}</h1><p>${device.brand} ${device.model} • ${device.location}</p>${svg}<p>${url}</p></body></html>` });
  }

  return <FormModal title="QR Code do equipamento" description="Uma única etiqueta para identificação no FIXAR e consulta pelo cliente." onClose={onClose} footer={<><FooterButton label="Fechar" variant="secondary" onPress={onClose} /><FooterButton label="Compartilhar" disabled={!url} onPress={() => Share.share({ message: `Equipamento ${device.reference}: ${url}` })} /></>}>
    {loading ? <Spinner /> : !baseUrl ? <Notice>Configure EXPO_PUBLIC_FIXAR_WEB_URL para gerar o endereço público.</Notice> : <Content>
      <Identity>{device.reference}</Identity><Meta>{[device.brand, device.model, device.location].filter(Boolean).join(" • ")}</Meta>
      {svg ? <QrFrame><SvgXml xml={svg} width={240} height={240} /></QrFrame> : null}
      <Setting><SettingCopy><SettingTitle>Uma etiqueta, dois usos</SettingTitle><Meta>A câmera abre a ficha pública; o scanner do FIXAR identifica este equipamento.</Meta></SettingCopy></Setting>
      <Notice>Este QR já é público e permanente. Imprima esta etiqueta e use a mesma identificação no equipamento.</Notice>
      <Url selectable>{url}</Url>
      <ActionRow><ActionButton label="Imprimir etiqueta" variant="secondary" onPress={print} /></ActionRow>
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
