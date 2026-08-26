import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { ItensSelect } from "../ItemsSelect";
import { ItensProps } from "..";
import API from "../../../../services/API";
import { Device } from "../../../../types/data";
import { Button, PickerModal } from "../../../../design-system";

interface ModalProps { customerId: string; closeModal: React.Dispatch<SetStateAction<boolean>>; setItensSelected: React.Dispatch<SetStateAction<ItensProps[]>>; itensSelected: ItensProps[]; dataTable: string; modalTitle: string; }
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const SelectionItens = ({ customerId, closeModal, setItensSelected, itensSelected, dataTable, modalTitle }: ModalProps) => {
  const [items, setItems] = useState<Device[]>([]); const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const getData = useCallback(async () => { setLoading(true); setError(""); try { const { data } = await API.get(`/${dataTable}/list`); setItems(data.filter((device: Device) => device.Customer.id === customerId)); } catch { setError("Não foi possível carregar os equipamentos."); } finally { setLoading(false); } }, [customerId, dataTable]);
  useEffect(() => { getData(); }, [getData]);
  const filtered = useMemo(() => { const term = normalize(query.trim()); if (!term) return items; return items.filter((item) => normalize(`${item.reference} ${item.brand} ${item.model} ${item.location}`).includes(term)); }, [items, query]);
  return <PickerModal title={modalTitle} description={`${itensSelected.length} ${itensSelected.length === 1 ? "equipamento selecionado" : "equipamentos selecionados"}.`} searchPlaceholder="Buscar por referência, ambiente, marca ou modelo" query={query} onQueryChange={setQuery} data={filtered} loading={loading} error={error} onRetry={getData} onClose={() => closeModal(false)} keyExtractor={(item) => item.id} renderItem={({ item }) => <ItensSelect id={item.id} customerId={item.Customer.id} reference={item.reference} brand={item.brand} model={item.model} location={item.location} setItensSelected={setItensSelected} itensSelected={itensSelected} closeModal={closeModal} />} emptyTitle={query ? "Equipamento não encontrado" : "Cliente sem equipamentos"} footer={<Button label="Concluir seleção" onPress={() => closeModal(false)} />} />;
};
