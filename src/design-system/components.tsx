import React from "react";
import { ActivityIndicator, PressableProps, TextInputProps, ViewProps } from "react-native";
import { AlertCircle, Check, CloudOff, LoaderCircle, RefreshCw, Search, TriangleAlert } from "lucide-react-native";
import styled, { useTheme } from "styled-components/native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
const ButtonRoot = styled.Pressable<{ variant: ButtonVariant }>`
  min-height: ${({ theme }) => theme.touchTarget}px; padding: 0 ${({ theme }) => theme.spacing.lg}px;
  align-items: center; justify-content: center; flex-direction: row; border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ theme, variant }) => variant === "primary" ? theme.colors.primary : variant === "destructive" ? theme.colors.danger : variant === "secondary" ? theme.colors.secondary : "transparent"};
  border: 1px solid ${({ theme, variant }) => variant === "ghost" ? "transparent" : variant === "secondary" ? theme.colors.border : variant === "destructive" ? theme.colors.danger : theme.colors.primary};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
`;
const ButtonText = styled.Text<{ variant: ButtonVariant }>`
  font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.body.size}px;
  color: ${({ theme, variant }) => variant === "primary" || variant === "destructive" ? theme.colors.primaryForeground : variant === "secondary" ? theme.colors.secondaryForeground : theme.colors.foreground};
`;
export function Button({ label, variant = "primary", loading, ...props }: PressableProps & { label: string; variant?: ButtonVariant; loading?: boolean }) {
  const theme = useTheme();
  return <ButtonRoot accessibilityRole="button" variant={variant} disabled={props.disabled || loading} {...props}>
    {loading ? <ActivityIndicator color={variant === "primary" ? theme.colors.primaryForeground : theme.colors.primary} /> : <ButtonText variant={variant}>{label}</ButtonText>}
  </ButtonRoot>;
}

export const Card = styled.View`
  padding: ${({ theme }) => theme.spacing.lg}px; border-radius: ${({ theme }) => theme.radii.lg}px;
  border: 1px solid ${({ theme }) => theme.colors.border}; background-color: ${({ theme }) => theme.colors.card};
`;
const LabelText = styled.Text`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.label.size}px; color: ${({ theme }) => theme.colors.foreground}; margin-bottom: ${({ theme }) => theme.spacing.sm}px;`;
const ErrorText = styled.Text`font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.danger}; margin-top: ${({ theme }) => theme.spacing.xs}px;`;
const InputRoot = styled.TextInput<{ invalid?: boolean }>`
  min-height: 48px; padding: 0 ${({ theme }) => theme.spacing.md}px; border-radius: ${({ theme }) => theme.radii.md}px;
  border: 1px solid ${({ theme, invalid }) => invalid ? theme.colors.danger : theme.colors.input};
  background-color: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.foreground};
  font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.body.size}px;
`;
export function FormField({ label, error, required, ...props }: TextInputProps & { label: string; error?: string; required?: boolean }) {
  const theme = useTheme();
  const id = `Campo ${label}`;
  return <FormGroup><LabelText>{label}{required ? " *" : ""}</LabelText><InputRoot accessibilityLabel={id} accessibilityHint={error} invalid={Boolean(error)} placeholderTextColor={theme.colors.muted} {...props} />{error ? <ErrorText accessibilityLiveRegion="polite">{error}</ErrorText> : null}</FormGroup>;
}
const FormGroup = styled.View`margin-bottom: ${({ theme }) => theme.spacing.lg}px;`;

export type SyncState = "draft" | "synced" | "pending" | "syncing" | "offline" | "conflict" | "error" | "blocked_commercial";
const syncLabels: Record<SyncState, string> = { draft: "Rascunho", synced: "Sincronizado", pending: "Aguardando sincronização", syncing: "Sincronizando", offline: "Offline", conflict: "Conflito", error: "Falha na sincronização", blocked_commercial: "Aguardando plano" };
const BadgeRoot = styled.View<{ color: string }>`align-self: flex-start; flex-direction: row; align-items: center; gap: 6px; padding: 5px 9px; border-radius: ${({ theme }) => theme.radii.pill}px; border: 1px solid ${({ color }) => color};`;
const BadgeText = styled.Text<{ color: string }>`font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ color }) => color};`;
export function SyncBadge({ state }: { state: SyncState }) {
  const theme = useTheme();
  const colors: Record<SyncState, string> = { draft: theme.colors.syncOffline, synced: theme.colors.syncSynced, pending: theme.colors.syncPending, syncing: theme.colors.syncSyncing, offline: theme.colors.syncOffline, conflict: theme.colors.syncConflict, error: theme.colors.syncError, blocked_commercial: theme.colors.syncPending };
  const Icon = state === "synced" ? Check : state === "offline" ? CloudOff : state === "conflict" ? TriangleAlert : state === "error" ? AlertCircle : state === "syncing" ? LoaderCircle : RefreshCw;
  return <BadgeRoot color={colors[state]} accessibilityRole="text" accessibilityLabel={syncLabels[state]}><Icon size={14} color={colors[state]} /><BadgeText color={colors[state]}>{syncLabels[state]}</BadgeText></BadgeRoot>;
}

const StateRoot = styled.View`flex: 1; min-height: 180px; align-items: center; justify-content: center; padding: ${({ theme }) => theme.spacing.xl}px;`;
const StateTitle = styled.Text`margin-top: ${({ theme }) => theme.spacing.md}px; text-align: center; font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.heading.size}px; color: ${({ theme }) => theme.colors.foreground};`;
const StateDescription = styled.Text`margin-top: ${({ theme }) => theme.spacing.xs}px; text-align: center; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; color: ${({ theme }) => theme.colors.muted};`;
export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description?: string; actionLabel?: string; onAction?: () => void }) { const theme = useTheme(); return <StateRoot><AlertCircle size={28} color={theme.colors.muted} /><StateTitle>{title}</StateTitle>{description ? <StateDescription>{description}</StateDescription> : null}{actionLabel && onAction ? <Button label={actionLabel} variant="secondary" onPress={onAction} style={{ marginTop: theme.spacing.lg }} /> : null}</StateRoot>; }
export function ErrorState({ title = "Não foi possível carregar", description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) { const theme = useTheme(); return <StateRoot accessibilityLiveRegion="polite"><TriangleAlert size={28} color={theme.colors.danger} /><StateTitle>{title}</StateTitle>{description ? <StateDescription>{description}</StateDescription> : null}{onRetry ? <RetryButton accessibilityRole="button" onPress={onRetry}><RetryText>Tentar novamente</RetryText></RetryButton> : null}</StateRoot>; }
const RetryButton = styled.Pressable`margin-top:${({theme})=>theme.spacing.lg}px;padding:${({theme})=>theme.spacing.md}px ${({theme})=>theme.spacing.lg}px;border-radius:${({theme})=>theme.radii.md}px;background-color:${({theme})=>theme.colors.secondary};`;
const RetryText = styled.Text`color:${({theme})=>theme.colors.secondaryForeground};font-family:${({theme})=>theme.fonts.semibold};`;
export function Spinner(props: ViewProps) { const theme = useTheme(); return <StateRoot {...props}><ActivityIndicator color={theme.colors.primary} /></StateRoot>; }

const SearchRoot = styled.View`height: 48px; margin: ${({ theme }) => theme.spacing.lg}px; flex-direction: row; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid ${({ theme }) => theme.colors.input}; border-radius: ${({ theme }) => theme.radii.md}px; background-color: ${({ theme }) => theme.colors.surface};`;
const SearchField = styled.TextInput`flex: 1; height: 100%; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;
export function SearchInput({ placeholder = "Buscar", ...props }: TextInputProps) { const theme = useTheme(); return <SearchRoot><Search size={18} color={theme.colors.muted} /><SearchField accessibilityRole="search" placeholder={placeholder} placeholderTextColor={theme.colors.muted} autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" {...props} /></SearchRoot>; }
