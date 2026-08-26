import { SetStateAction, useState } from "react";
import { Button, FormModal } from "../../design-system";
import { Customer, Device, Period, Repair } from "../../types/data";
import { defaultCustomer, defaultDevice } from "../../utils/dafaultValues";
import { SelectCustomers } from "../Form/SelectCustomers";
import { SelectDevices } from "../Form/SelectDevices";
import { SelectPeriod } from "../Form/SelectPeriod";
import API from "../../services/API";
import { isBetween } from "../../utils/getPlatformDate";

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  setFiltered: React.Dispatch<SetStateAction<Repair[]>>;
  selectedPeriod: Period;
  setSelectedPeriod: React.Dispatch<SetStateAction<Period>>;
  onFiltersApplied: () => void;
}

export const SetFilter = ({
  closeModal,
  setFiltered,
  selectedPeriod,
  setSelectedPeriod,
  onFiltersApplied,
}: ModalProps) => {
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(defaultCustomer);
  const [selectedDevice, setSelectedDevice] = useState<Device>(defaultDevice);

  const getFiltered = async (
    customer?: Customer,
    device?: Device,
    period?: Period
  ) => {
    const { data } = await API.get("/repairs/list");
    let filter = data;
    if (customer?.id) {
      filter = data.filter(
        (repair: Repair) => repair.Customer.id === customer?.id
      );
    }
    if (device?.id) {
      filter = filter.filter(
        (repair: Repair) => repair.Device.id === device?.id
      );
    }
    if (period?.start) {
      filter = filter.filter((repair: Repair) =>
        isBetween(selectedPeriod, repair.date)
      );
    }
    setFiltered(filter);
    onFiltersApplied();
    closeModal(false);
  };

  const handleButtonCancel = () => {
    closeModal(false);
  };

  return (
    <FormModal title="Filtrar ordens" description="Combine cliente, equipamento e período para refinar os resultados." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Aplicar filtros" onPress={() => getFiltered(selectedCustomer, selectedDevice, selectedPeriod)} /></>}>
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
