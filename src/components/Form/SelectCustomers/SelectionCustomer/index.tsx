import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { CustomerItemSelect } from "../CustomerItemSelect";
import { Customer } from "../../../../types/data";
import API from "../../../../services/API";
import { PickerModal } from "../../../../design-system";

interface ModalProps { closeModal: React.Dispatch<SetStateAction<boolean>>; setCustomer: React.Dispatch<SetStateAction<Customer>>; }
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const SelectionCustomer = ({ closeModal, setCustomer }: ModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const getCustomers = useCallback(async () => { setLoading(true); setError(""); try { const { data } = await API.get("/customers/list"); setCustomers(data); } catch { setError("Não foi possível carregar os clientes."); } finally { setLoading(false); } }, []);
  useEffect(() => { getCustomers(); }, [getCustomers]);
  const filtered = useMemo(() => { const term = normalize(query.trim()); if (!term) return customers; return customers.filter((customer) => normalize(`${customer.name} ${customer.phone} ${customer.email} ${customer.document}`).includes(term)); }, [customers, query]);
  return <PickerModal title="Selecionar cliente" description="Escolha o proprietário deste equipamento." query={query} onQueryChange={setQuery} data={filtered} loading={loading} error={error} onRetry={getCustomers} onClose={() => closeModal(false)} keyExtractor={(item) => item.id} renderItem={({ item }) => <CustomerItemSelect {...item} setCustomer={setCustomer} closeModal={closeModal} />} emptyTitle={query ? "Cliente não encontrado" : "Nenhum cliente cadastrado"} />;
};
