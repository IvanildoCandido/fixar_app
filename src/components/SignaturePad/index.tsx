import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, PanResponder } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import Svg, { Path, SvgXml } from "react-native-svg";
import { Maximize2, X } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { Canvas, CaptureActions, CaptureButton, CaptureButtonText, CaptureHeader, CaptureScreen, CaptureTitle, ClearButton, ClearText, CloseButton, PadLabel, Preview, PreviewHint, PreviewText } from "./styles";

type Point = { x: number; y: number };
type Size = { width: number; height: number };
const DEFAULT_SIZE = { width: 640, height: 260 };
const pathData = (stroke: Point[]) => stroke.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
const toSvg = (strokes: Point[][], size: Size) => strokes.length ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}">${strokes.map((stroke) => `<path d="${pathData(stroke)}" fill="none" stroke="#17383A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>` : "";

interface SignaturePadProps { label: string; value?: string; onChange: (svg: string) => void; onDrawingChange?: (drawing: boolean) => void; }

export function SignaturePad({ label, value, onChange, onDrawingChange }: SignaturePadProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const strokesRef = useRef<Point[][]>([]);
  const backupRef = useRef<Point[][]>([]);
  const drawing = useRef<Point[]>([]);
  const updateStrokes = (next: Point[][]) => { strokesRef.current = next; setStrokes(next); };
  const restorePortrait = () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);

  useEffect(() => () => { restorePortrait(); onDrawingChange?.(false); }, []);
  const open = async () => {
    backupRef.current = strokesRef.current.map((stroke) => [...stroke]);
    onDrawingChange?.(true);
    try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); } catch {}
    setVisible(true);
  };
  const close = (confirm: boolean) => {
    if (confirm) onChange(toSvg(strokesRef.current, size)); else updateStrokes(backupRef.current);
    setVisible(false); onDrawingChange?.(false); restorePortrait();
  };
  const clear = () => { updateStrokes([]); drawing.current = []; };
  const clearSaved = () => { clear(); onChange(""); };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => { drawing.current = [{ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }]; updateStrokes([...strokesRef.current, drawing.current]); },
    onPanResponderMove: (event) => { drawing.current = [...drawing.current, { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }]; updateStrokes([...strokesRef.current.slice(0, -1), drawing.current]); },
    onPanResponderTerminationRequest: () => false,
  }), []);
  const hasSignature = Boolean(value || strokes.length);

  return <>
    <PadLabel>{label}</PadLabel>
    <Preview accessibilityRole="button" accessibilityLabel={`${label}. Abrir assinatura em tela cheia`} onPress={open}>
      {hasSignature ? (value && !strokes.length ? <SvgXml xml={value} width="100%" height="100%" /> : <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>{strokes.map((stroke, index) => <Path key={index} d={pathData(stroke)} fill="none" stroke={theme.colors.foreground} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)}</Svg>) : <PreviewHint><Maximize2 size={22} color={theme.colors.primary} /><PreviewText>Toque para assinar em tela cheia</PreviewText></PreviewHint>}
    </Preview>
    {hasSignature ? <ClearButton onPress={clearSaved}><ClearText>Limpar assinatura</ClearText></ClearButton> : null}
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" supportedOrientations={["landscape", "landscape-left", "landscape-right"]} onRequestClose={() => close(false)}>
      <CaptureScreen>
        <CaptureHeader><CaptureTitle>{label}</CaptureTitle><CloseButton accessibilityLabel="Cancelar assinatura" onPress={() => close(false)}><X size={25} color={theme.colors.foreground} /></CloseButton></CaptureHeader>
        <Canvas onLayout={(event) => setSize({ width: Math.max(1, event.nativeEvent.layout.width), height: Math.max(1, event.nativeEvent.layout.height) })} {...responder.panHandlers}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>{strokes.map((stroke, index) => <Path key={index} d={pathData(stroke)} fill="none" stroke={theme.colors.foreground} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)}</Svg>
        </Canvas>
        <CaptureActions><CaptureButton variant="secondary" onPress={clear}><CaptureButtonText variant="secondary">Limpar</CaptureButtonText></CaptureButton><CaptureButton variant="primary" onPress={() => close(true)}><CaptureButtonText variant="primary">Confirmar assinatura</CaptureButtonText></CaptureButton></CaptureActions>
      </CaptureScreen>
    </Modal>
  </>;
}
