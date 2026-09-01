import React, { useEffect, useState } from "react";
import { Alert, Share } from "react-native";
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

  return <FormModal title="QR Code do equipamento" description="A câmera abre a ficha pública deste equipamento." onClose={onClose} footer={<FooterButton label="Compartilhar" disabled={!url} onPress={() => Share.share({ message: `Equipamento ${device.reference}: ${url}` })} />}>
    {loading ? <Spinner /> : !baseUrl ? <Notice>Configure EXPO_PUBLIC_FIXAR_WEB_URL para gerar o endereço público.</Notice> : <Content>
      <Identity>{device.reference}</Identity><Meta>{[device.brand, device.model, device.location].filter(Boolean).join(" • ")}</Meta>
      {svg ? <QrFrame><SvgXml xml={svg} width={240} height={240} /></QrFrame> : null}
    </Content>}
  </FormModal>;
}

const Content = styled.View`gap: ${({ theme }) => theme.spacing.md}px;`;
const Identity = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; color: ${({ theme }) => theme.colors.foreground};`;
const Meta = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted};`;
const QrFrame = styled.View`align-self: center; padding: ${({ theme }) => theme.spacing.md}px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.lg}px; background-color: #ffffff;`;
const FooterButton = styled(Button)`flex: 1;`;
const Notice = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px; line-height: ${({ theme }) => theme.typography.caption.lineHeight}px; color: ${({ theme }) => theme.colors.muted};`;
