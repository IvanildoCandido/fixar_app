import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { DeviceItemSelect } from "../DeviceItemSelect";
import { Device } from "../../../../types/data";
import { listDevicesByCustomer } from "../../../../services/API";
import { PickerModal } from "../../../../design-system";

interface ModalProps {
  customerId: string;
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  setDevice?: React.Dispatch<SetStateAction<Device>>;
  onSelect?: (device: Device) => void;
}
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const SelectionDevice = ({ closeModal, setDevice, onSelect, customerId }: ModalProps) => {
  const [devices, setDevices] = useState<Device[]>([]); const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const getDevices = useCallback(async () => { setLoading(true); setError(""); try { setDevices(await listDevicesByCustomer(customerId)); } catch { setError("Não foi possível carregar os equipamentos."); } finally { setLoading(false); } }, [customerId]);
  useEffect(() => { getDevices(); }, [getDevices]);
  const filtered = useMemo(() => { const term = normalize(query.trim()); if (!term) return devices; return devices.filter((device) => normalize(`${device.reference} ${device.location} ${device.brand} ${device.model}`).includes(term)); }, [devices, query]);
  return <PickerModal title="Selecionar equipamento" description="Escolha um equipamento para iniciar uma nova manutenção." searchPlaceholder="Buscar por referência, ambiente, marca ou modelo" query={query} onQueryChange={setQuery} data={filtered} loading={loading} error={error} onRetry={getDevices} onClose={() => closeModal(false)} keyExtractor={(item) => item.id} renderItem={({ item }) => <DeviceItemSelect device={item} setDevice={setDevice} onSelect={onSelect} closeModal={closeModal} />} emptyTitle={query ? "Equipamento não encontrado" : "Cliente sem equipamentos"} />;
};
