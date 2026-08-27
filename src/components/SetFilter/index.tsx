import { SetStateAction, useState } from "react";
import { Button, FormModal } from "../../design-system";
import { Customer, Device, Period, RepairFilters } from "../../types/data";
import { defaultCustomer, defaultDevice } from "../../utils/dafaultValues";
import { SelectCustomers } from "../Form/SelectCustomers";
import { SelectDevices } from "../Form/SelectDevices";
import { SelectPeriod } from "../Form/SelectPeriod";

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  selectedPeriod: Period;
  setSelectedPeriod: React.Dispatch<SetStateAction<Period>>;
  onFiltersApplied: (filters: RepairFilters) => void;
}

export const SetFilter = ({
  closeModal,
  selectedPeriod,
  setSelectedPeriod,
  onFiltersApplied,
}: ModalProps) => {
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(defaultCustomer);
  const [selectedDevice, setSelectedDevice] = useState<Device>(defaultDevice);

  const applyFilters = (
    customer?: Customer,
    device?: Device,
    period?: Period
  ) => {
    const end = period?.end ? new Date(period.end) : undefined;
    if (end) end.setHours(23, 59, 59, 999);
    onFiltersApplied({ customerId: customer?.id || undefined, deviceId: device?.id || undefined, startAt: period?.start ? new Date(period.start).toISOString() : undefined, endAt: end?.toISOString() });
    closeModal(false);
  };

  const handleButtonCancel = () => {
    closeModal(false);
  };

  return (
    <FormModal title="Filtrar ordens" description="Combine cliente, equipamento e período para refinar os resultados." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Aplicar filtros" onPress={() => applyFilters(selectedCustomer, selectedDevice, selectedPeriod)} /></>}>
          <SelectCustomers
            selected={selectedCustomer}
            setSelected={setSelectedCustomer}
          />
          <SelectDevices
            customerId={selectedCustomer.id}
            selected={selectedDevice}
            setSelected={setSelectedDevice}
          />
          <SelectPeriod
            customerId={selectedCustomer.id}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
    </FormModal>
  );
};
