import React from "react";
import { FlatList, ListRenderItem, Platform, TextInput } from "react-native";
import { Search, X } from "lucide-react-native";
import styled, { useTheme } from "styled-components/native";
import { Button, EmptyState, ErrorState, Spinner } from "./components";

interface PickerModalProps<T> {
  title: string; description: string; query: string;
  onQueryChange: (query: string) => void; data: T[];
  renderItem: ListRenderItem<T>; keyExtractor: (item: T) => string;
  loading?: boolean; error?: string; onRetry?: () => void; onClose: () => void;
  emptyTitle?: string; searchPlaceholder?: string; footer?: React.ReactNode;
}

export function PickerModal<T>({ title, description, query, onQueryChange, data, renderItem, keyExtractor, loading, error, onRetry, onClose, emptyTitle = "Nenhum resultado encontrado", searchPlaceholder = "Buscar", footer }: PickerModalProps<T>) {
  const theme = useTheme();
  return <Backdrop><Sheet accessibilityViewIsModal><Handle />
    <Header><HeaderCopy><Title>{title}</Title><Description>{description}</Description></HeaderCopy><CloseButton accessibilityRole="button" accessibilityLabel="Fechar seletor" onPress={onClose}><X size={20} color={theme.colors.muted} /></CloseButton></Header>
    <SearchBox><Search size={18} color={theme.colors.muted} /><SearchInput value={query} onChangeText={onQueryChange} placeholder={searchPlaceholder} placeholderTextColor={theme.colors.muted} autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" /></SearchBox>
    <ResultCount accessibilityLiveRegion="polite">{loading ? "Carregando…" : `${data.length} ${data.length === 1 ? "resultado" : "resultados"}`}</ResultCount>
    {loading ? <Spinner /> : error ? <StateArea><ErrorState description={error} />{onRetry ? <Button label="Tentar novamente" variant="secondary" onPress={onRetry} /> : null}</StateArea> : <FlatList data={data} renderItem={renderItem} keyExtractor={keyExtractor} keyboardShouldPersistTaps="handled" initialNumToRender={15} maxToRenderPerBatch={20} windowSize={9} removeClippedSubviews ItemSeparatorComponent={Separator} contentContainerStyle={data.length ? { paddingBottom: 24 } : { flexGrow: 1 }} ListEmptyComponent={<EmptyState title={emptyTitle} description="Revise o termo informado ou cadastre um novo item." />} />}{footer ? <Footer>{footer}</Footer> : null}
  </Sheet></Backdrop>;
}

const Backdrop = styled.KeyboardAvoidingView.attrs({ behavior: Platform.OS === "ios" ? "padding" : "height" })`flex: 1; justify-content: flex-end; background-color: ${({ theme }) => theme.colors.overlay};`;
const Sheet = styled.View`height: 88%; padding: 8px 20px 0; border-top-left-radius: 24px; border-top-right-radius: 24px; background-color: ${({ theme }) => theme.colors.surface}; border: 1px solid ${({ theme }) => theme.colors.border};`;
const Handle = styled.View`align-self: center; width: 36px; height: 4px; margin-bottom: 16px; border-radius: 2px; background-color: ${({ theme }) => theme.colors.border};`;
const Header = styled.View`flex-direction: row; align-items: flex-start; margin-bottom: 16px;`;
const HeaderCopy = styled.View`flex: 1; padding-right: 12px;`;
const Title = styled.Text`font-family: ${({ theme }) => theme.fonts.semibold}; font-size: ${({ theme }) => theme.typography.sectionTitle.size}px; color: ${({ theme }) => theme.colors.foreground};`;
const Description = styled.Text`margin-top: 4px; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.bodySmall.size}px; line-height: ${({ theme }) => theme.typography.bodySmall.lineHeight}px; color: ${({ theme }) => theme.colors.muted};`;
const CloseButton = styled.TouchableOpacity`width: ${({ theme }) => theme.touchTarget}px; height: ${({ theme }) => theme.touchTarget}px; align-items: center; justify-content: center; border-radius: ${({ theme }) => theme.radii.md}px;`;
const SearchBox = styled.View`height: 48px; flex-direction: row; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid ${({ theme }) => theme.colors.input}; border-radius: ${({ theme }) => theme.radii.md}px; background-color: ${({ theme }) => theme.colors.surfaceMuted};`;
const SearchInput = styled(TextInput)`flex: 1; height: 100%; font-family: ${({ theme }) => theme.fonts.regular}; font-size: ${({ theme }) => theme.typography.body.size}px; color: ${({ theme }) => theme.colors.foreground};`;
const ResultCount = styled.Text`margin: 12px 2px 10px; font-family: ${({ theme }) => theme.fonts.medium}; font-size: ${({ theme }) => theme.typography.caption.size}px; color: ${({ theme }) => theme.colors.muted};`;
const Separator = styled.View`height: 8px;`;
const StateArea = styled.View`flex: 1; padding-bottom: 24px;`;
const Footer = styled.View`padding: 12px 0 20px; border-top-width: 1px; border-top-color: ${({ theme }) => theme.colors.border};`;
