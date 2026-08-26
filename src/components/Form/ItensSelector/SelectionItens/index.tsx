import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { ItensSelect } from "../ItemsSelect";
import { ItensProps } from "..";
import API from "../../../../services/API";
import { Button, PickerModal } from "../../../../design-system";

interface ModalProps { closeModal: React.Dispatch<SetStateAction<boolean>>; setItensSelected: React.Dispatch<SetStateAction<ItensProps[]>>; itensSelected: ItensProps[]; dataTable: string; modalTitle: string; }
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const SelectionItens = ({ closeModal, setItensSelected, itensSelected, dataTable, modalTitle }: ModalProps) => {
  const [items, setItems] = useState<ItensProps[]>([]); const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const getData = useCallback(async () => { setLoading(true); setError(""); try { const { data } = await API.get(`/${dataTable}/list`); setItems(data); } catch { setError("Não foi possível carregar os itens."); } finally { setLoading(false); } }, [dataTable]);
  useEffect(() => { getData(); }, [getData]);
  const filtered = useMemo(() => { const term = normalize(query.trim()); if (!term) return items; return items.filter((item) => normalize(`${item.name} ${item.description || ""} ${item.price}`).includes(term)); }, [items, query]);
  return <PickerModal title={modalTitle} description={`${itensSelected.length} ${itensSelected.length === 1 ? "item selecionado" : "itens selecionados"}.`} searchPlaceholder="Buscar por nome ou descrição" query={query} onQueryChange={setQuery} data={filtered} loading={loading} error={error} onRetry={getData} onClose={() => closeModal(false)} keyExtractor={(item) => item.id} renderItem={({ item }) => <ItensSelect {...item} setItensSelected={setItensSelected} itensSelected={itensSelected} closeModal={closeModal} />} emptyTitle={query ? "Item não encontrado" : "Nenhum item cadastrado"} footer={<Button label="Concluir seleção" onPress={() => closeModal(false)} />} />;
};
