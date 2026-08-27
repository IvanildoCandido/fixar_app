import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Bell } from "lucide-react-native";
import styled, { useTheme } from "styled-components/native";
import { Header } from "../../components/Header";
import { EmptyState, ErrorState, SearchInput, Spinner } from "../../design-system";
import { listMaintenanceRemindersPage, ReminderScope } from "../../services/API";
import { MaintenanceReminder } from "../../types/data";

const scopes: Array<{ value: ReminderScope; label: string }> = [{ value: "all", label: "Todas" }, { value: "overdue", label: "Vencidas" }, { value: "today", label: "Hoje" }, { value: "next7", label: "7 dias" }];
const dateLabel = (value: string) => new Date(value).toLocaleDateString("pt-BR");

export const MaintenanceReminders = () => {
  const navigation = useNavigation<any>(); const theme = useTheme(); const listRef = useRef<FlatList<MaintenanceReminder>>(null);
  const [items, setItems] = useState<MaintenanceReminder[]>([]); const [scope, setScope] = useState<ReminderScope>("all"); const [query, setQuery] = useState("");
  const [page, setPage] = useState(0); const [hasMore, setHasMore] = useState(false); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async (nextPage = 0, replace = true) => {
    replace ? setLoading(true) : setLoadingMore(true); setError("");
    try { const result = await listMaintenanceRemindersPage(nextPage, 20, scope); setItems((current) => replace ? result.items : [...current, ...result.items]); setPage(nextPage); setHasMore(result.hasMore); setTotal(result.total); }
    catch { setError("Não foi possível carregar as manutenções programadas."); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [scope]);
  useFocusEffect(useCallback(() => { listRef.current?.scrollToOffset({ offset: 0, animated: false }); load(0, true); }, [load]));
  const filtered = useMemo(() => { const term = query.trim().toLocaleLowerCase("pt-BR"); return term ? items.filter((item) => `${item.Device.reference} ${item.Customer.name} ${item.Device.location}`.toLocaleLowerCase("pt-BR").includes(term)) : items; }, [items, query]);
  return <Container><Header title="Manutenções programadas" icons /><SearchInput value={query} onChangeText={setQuery} placeholder="Buscar cliente ou equipamento" /><Scopes>{scopes.map((option) => <Scope key={option.value} selected={scope === option.value} onPress={() => { setScope(option.value); setItems([]); }}><ScopeText selected={scope === option.value}>{option.label}</ScopeText></Scope>)}</Scopes><Count>{total} {total === 1 ? "manutenção" : "manutenções"}</Count>
    {loading ? <Spinner /> : error ? <ErrorState description={error} /> : <List ref={listRef} data={filtered} keyExtractor={(item) => item.id} onEndReached={() => { if (hasMore && !loadingMore && !query) load(page + 1, false); }} onEndReachedThreshold={0.35} initialNumToRender={12} maxToRenderPerBatch={16} windowSize={7} removeClippedSubviews renderItem={({ item }) => <Card onPress={() => navigation.navigate("Repair", { customer: item.Customer, device: item.Device })}><Bell size={20} color={new Date(item.dueAt).getTime() < Date.now() ? theme.colors.warning : theme.colors.primary} /><Copy><Title>{item.Device.reference}</Title><Meta>{item.Customer.name} · {item.Device.location}</Meta></Copy><Due>{dateLabel(item.dueAt)}</Due></Card>} ListEmptyComponent={<EmptyState title="Nenhuma manutenção encontrada" />} ListFooterComponent={loadingMore ? <Spinner /> : null} />}
  </Container>;
};

const Container = styled.View`flex:1;background-color:${({ theme }) => theme.colors.background};`;
const Scopes = styled.View`flex-direction:row;gap:8px;padding:8px 20px 0;`;
const Scope = styled.Pressable<{ selected: boolean }>`min-height:40px;padding:9px 13px;border-radius:${({ theme }) => theme.radii.pill}px;background-color:${({ theme, selected }) => selected ? theme.colors.primary : theme.colors.surface};border:1px solid ${({ theme, selected }) => selected ? theme.colors.primary : theme.colors.border};`;
const ScopeText = styled.Text<{ selected: boolean }>`font-family:${({ theme }) => theme.fonts.medium};font-size:${({ theme }) => theme.typography.caption.size}px;color:${({ theme, selected }) => selected ? theme.colors.primaryForeground : theme.colors.foreground};`;
const Count = styled.Text`padding:10px 22px 4px;font-family:${({ theme }) => theme.fonts.medium};font-size:${({ theme }) => theme.typography.caption.size}px;color:${({ theme }) => theme.colors.muted};`;
const List = styled(FlatList<MaintenanceReminder>).attrs({ contentContainerStyle: { padding: 20, paddingTop: 8, paddingBottom: 100 } })``;
const Card = styled.Pressable`min-height:74px;flex-direction:row;align-items:center;gap:12px;margin-bottom:10px;padding:14px;border-radius:${({ theme }) => theme.radii.lg}px;border:1px solid ${({ theme }) => theme.colors.border};background-color:${({ theme }) => theme.colors.surface};`;
const Copy = styled.View`flex:1;`; const Title = styled.Text`font-family:${({ theme }) => theme.fonts.semibold};font-size:${({ theme }) => theme.typography.body.size}px;color:${({ theme }) => theme.colors.foreground};`; const Meta = styled.Text`margin-top:3px;font-family:${({ theme }) => theme.fonts.regular};font-size:${({ theme }) => theme.typography.caption.size}px;color:${({ theme }) => theme.colors.muted};`; const Due = styled.Text`font-family:${({ theme }) => theme.fonts.medium};font-size:${({ theme }) => theme.typography.caption.size}px;color:${({ theme }) => theme.colors.primary};`;
