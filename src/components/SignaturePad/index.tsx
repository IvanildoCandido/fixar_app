import { useMemo, useRef, useState } from "react";
import { PanResponder } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { ClearButton, ClearText, Pad, PadLabel } from "./styles";

type Point = { x: number; y: number };
const WIDTH = 320; const HEIGHT = 130;
const pathData = (stroke: Point[]) => stroke.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
const toSvg = (strokes: Point[][]) => strokes.length ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">${strokes.map((stroke) => `<path d="${pathData(stroke)}" fill="none" stroke="#17383A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>` : "";

export function SignaturePad({ label, value, onChange }: { label: string; value?: string; onChange: (svg: string) => void }) {
  const theme = useTheme(); const [strokes, setStrokes] = useState<Point[][]>([]); const drawing = useRef<Point[]>([]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => { drawing.current = [{ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }]; setStrokes((items) => [...items, drawing.current]); },
    onPanResponderMove: (event) => { drawing.current = [...drawing.current, { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }]; setStrokes((items) => [...items.slice(0, -1), drawing.current]); },
    onPanResponderRelease: () => onChange(toSvg(strokes.length ? [...strokes.slice(0, -1), drawing.current] : [drawing.current])),
  }), [onChange, strokes]);
  const clear = () => { setStrokes([]); drawing.current = []; onChange(""); };
  return <><PadLabel>{label}</PadLabel><Pad accessibilityLabel={label} {...responder.panHandlers}><Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>{strokes.map((stroke, index) => <Path key={index} d={pathData(stroke)} fill="none" stroke={theme.colors.foreground} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />)}</Svg></Pad>{value || strokes.length ? <ClearButton onPress={clear}><ClearText>Limpar assinatura</ClearText></ClearButton> : null}</>;
}
