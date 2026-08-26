import { SetStateAction, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScanLine, X } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { Button } from "../../design-system";
import { CameraArea, CloseButton, Container, Frame, Header, HeaderCopy, Instruction, PermissionCard, PermissionText, PermissionTitle, ScannerIcon, Title } from "./styles";

interface ModalProps { closeModal: React.Dispatch<SetStateAction<boolean>>; handleQRcode: (data: string) => void; }

export const ScannerQR = ({ closeModal, handleQRcode }: ModalProps) => {
  const theme = useTheme(); const [permission, requestPermission] = useCameraPermissions(); const [scanned, setScanned] = useState(false);
  useEffect(() => { if (permission && !permission.granted && permission.canAskAgain) requestPermission(); }, [permission, requestPermission]);
  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => { setScanned(true); handleQRcode(data.substring(data.length - 7)); closeModal(false); };

  if (!permission?.granted) return <Container><PermissionCard><ScannerIcon><ScanLine size={28} color={theme.colors.primary} /></ScannerIcon><PermissionTitle>Acesso à câmera</PermissionTitle><PermissionText>Precisamos da câmera para identificar o código do equipamento.</PermissionText>{permission?.canAskAgain ? <Button label="Permitir acesso" onPress={requestPermission} /> : <PermissionText>Ative a câmera nos Ajustes do dispositivo para continuar.</PermissionText>}<Button label="Voltar" variant="ghost" onPress={() => closeModal(false)} /></PermissionCard></Container>;

  return <Container><CameraView onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFillObject} barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "code93", "datamatrix", "pdf417"] }} /><CameraArea><Header><HeaderCopy><Title>Ler código</Title><Instruction>Centralize o QR Code dentro da área indicada.</Instruction></HeaderCopy><CloseButton accessibilityLabel="Fechar leitor" onPress={() => closeModal(false)}><X size={22} color="#FFFFFF" /></CloseButton></Header><Frame accessibilityLabel="Área de leitura do código"><ScanLine size={32} color={theme.colors.primaryForeground} /></Frame><Instruction>O código será reconhecido automaticamente.</Instruction></CameraArea></Container>;
};
