import { ReactNode, useState } from "react";
import { Check, ChevronDown, ChevronUp, Circle, TriangleAlert } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { FormField } from "../../design-system";
import { TechnicalCheck, TechnicalCheckStatus, TechnicalMeasurement } from "../../types/data";
import { AIR_CONDITIONING_MEASUREMENTS, MeasurementDefinition } from "../../domain/technicalMaintenance";
import { CheckLabel, CheckRow, Chip, Chips, ChipText, Helper, InlineAction, InlineActionText, MeasurementField, MeasurementRow, Section, SectionBody, SectionHeader, SectionMarker, SectionTitle, Unit } from "./styles";

export function CollapsibleSection({ title, state = "pending", initiallyOpen = false, children }: { title: string; state?: "complete" | "pending" | "attention"; initiallyOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen); const theme = useTheme();
  const Marker = state === "complete" ? Check : state === "attention" ? TriangleAlert : Circle;
  return <Section><SectionHeader accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)}><SectionMarker $state={state}><Marker size={15} color={state === "attention" ? theme.colors.danger : theme.colors.primary} /></SectionMarker><SectionTitle>{title}</SectionTitle>{open ? <ChevronUp size={20} color={theme.colors.muted} /> : <ChevronDown size={20} color={theme.colors.muted} />}</SectionHeader>{open ? <SectionBody>{children}</SectionBody> : null}</Section>;
}

const CHECK_OPTIONS: Array<{ value: TechnicalCheckStatus; label: string; tone?: "default" | "warning" | "danger" }> = [
  { value: "ok", label: "✓ OK" }, { value: "attention", label: "⚠ Atenção", tone: "warning" },
  { value: "non_conforming", label: "✕ Não conforme", tone: "danger" },
  { value: "not_checked", label: "— Não verificado" }, { value: "not_applicable", label: "N/A" },
];

export function TechnicalChecksEditor({ checks, onChange }: { checks: TechnicalCheck[]; onChange: (checks: TechnicalCheck[]) => void }) {
  const update = (key: string, patch: Partial<TechnicalCheck>) => onChange(checks.map((item) => item.key === key ? { ...item, ...patch } : item));
  return <><Helper>Marque apenas o que foi verificado. Observações aparecem quando há atenção ou não conformidade.</Helper><InlineAction onPress={() => onChange(checks.map((item) => item.status === "not_checked" ? { ...item, status: "ok" } : item))}><InlineActionText>Marcar pendentes como OK</InlineActionText></InlineAction>{checks.map((item) => <CheckRow key={item.key}><CheckLabel>{item.label}</CheckLabel><Chips>{CHECK_OPTIONS.map((option) => <Chip key={option.value} $selected={item.status === option.value} $tone={option.tone} onPress={() => update(item.key, { status: option.value, observation: option.value === "attention" || option.value === "non_conforming" ? item.observation : "" })}><ChipText $selected={item.status === option.value} $tone={option.tone}>{option.label}</ChipText></Chip>)}</Chips>{item.status === "attention" || item.status === "non_conforming" ? <FormField label="Descreva o problema (opcional)" value={item.observation ?? ""} onChangeText={(observation) => update(item.key, { observation })} multiline /> : null}</CheckRow>)}</>;
}

export function MeasurementsEditor({ measurements, onChange, definitions = AIR_CONDITIONING_MEASUREMENTS }: { measurements: TechnicalMeasurement[]; onChange: (items: TechnicalMeasurement[]) => void; definitions?: MeasurementDefinition[] }) {
  const setValue = (definition: MeasurementDefinition, raw: string, order: number) => {
    const normalized = raw.replace(",", ".").replace(/[^0-9.-]/g, "");
    const remaining = measurements.filter((item) => item.key !== definition.key && item.key !== "delta_t");
    onChange(normalized === "" || normalized === "-" ? remaining : [...remaining, { ...definition, value: Number(normalized), source: "manual", order }]);
  };
  return <><Helper>Preencha somente o que foi medido. A unidade é adicionada automaticamente.</Helper>{definitions.map((definition, order) => { const current = measurements.find((item) => item.key === definition.key); return <MeasurementRow key={definition.key}><MeasurementField><FormField label={definition.label} value={current === undefined ? "" : String(current.value).replace(".", ",")} onChangeText={(value) => setValue(definition, value, order)} keyboardType="decimal-pad" placeholder="Não medido" /></MeasurementField><Unit>{definition.unit}</Unit></MeasurementRow>; })}{measurements.find((item) => item.key === "delta_t") ? <Helper>ΔT calculado automaticamente: {measurements.find((item) => item.key === "delta_t")?.value} °C</Helper> : null}</>;
}

export function ChoiceChips<T extends string>({ value, options, onChange }: { value?: T; options: Array<{ value: T; label: string; tone?: "default" | "warning" | "danger" }>; onChange: (value: T) => void }) {
  return <Chips>{options.map((option) => <Chip key={option.value} $selected={value === option.value} $tone={option.tone} onPress={() => onChange(option.value)}><ChipText $selected={value === option.value} $tone={option.tone}>{option.label}</ChipText></Chip>)}</Chips>;
}
