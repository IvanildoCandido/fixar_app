import { SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Modal,
} from "react-native";
import { Button, FormModal } from "../../design-system";
import { InputForm } from "../Form/InputForm";
import {
  ReferenceField,
  ButtonScan,
  ScanArea,
} from "./styles";
import { QrCode } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { SelectCustomers } from "../Form/SelectCustomers";
import { Customer, Device } from "../../types/data";
import { defaultCustomer } from "../../utils/dafaultValues";
import API from "../../services/API";
import { ScannerQR } from "../ScannerQR";
import { extractEquipmentReference, extractFixarEquipmentToken } from "@fixar/qr-contract";
import { resolveQrForRegistration } from "../../services/API";
import { ChoiceChips, CollapsibleSection } from "../TechnicalMaintenance";
import { brazilianDateToIso, isoDateToBrazilian, todayInBrazilianFormat } from "../../utils/brazilianDate";

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  dataEdit: Device;
}

interface DeviceForm {
  reference: string;
  model?: string;
  brand?: string;
  location: string;
  equipmentType?: string;
  serialNumber?: string;
  capacityBtu?: string;
  refrigerant?: string;
  installedAt?: string;
}

const schema = Yup.object().shape({
  reference: Yup.string().required("O número da referência é obrigatório"),
  location: Yup.string().required(
    "Informe o local de instalação do equipamento"
  ),
  installedAt: Yup.string().test(
    "valid-date",
    "Informe uma data válida no formato DD/MM/AAAA",
    (value) => !value || Boolean(brazilianDateToIso(value))
  ),
});

export const AddDevice = ({ closeModal, dataEdit }: ModalProps) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<Customer>(defaultCustomer);
  const [QRcode, setQRCode] = useState(false);
  const [voltage, setVoltage] = useState<number | undefined>(dataEdit.voltage ?? undefined);
  const [phase, setPhase] = useState<Device["phase"]>(dataEdit.phase ?? undefined);

  const handleQRcode = async (data: string): Promise<void> => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_FIXAR_WEB_URL ?? "";
      const token = extractFixarEquipmentToken(data, baseUrl);
      const parsedReference = token ? await resolveQrForRegistration(token) : extractEquipmentReference(data);
      setValue("reference", parsedReference);
      clearErrors("reference");
    } catch {
      Alert.alert("QR Code inválido", "Este QR Code não está disponível para a empresa ativa.");
    }
  };

  useEffect(() => {
    if (dataEdit.Customer.id !== "") {
      setSelected(dataEdit.Customer);
    }
  }, []);

  const handleRegister = async (form: DeviceForm) => {
    if (selected.id === "") {
      Alert.alert(
        "Dados Incompletos:",
        "Selecione o cliente ao qual esse equipamento pertence!"
      );
      return;
    }
    const newDevice = {
      customerId: selected.id,
      reference: form.reference.trim(),
      model: form.model,
      brand: form.brand,
      location: form.location,
      equipmentType: form.equipmentType,
      serialNumber: form.serialNumber,
      capacityBtu: form.capacityBtu ? Number(form.capacityBtu) : null,
      voltage: voltage ?? null,
      phase: phase ?? null,
      refrigerant: form.refrigerant,
      installedAt: brazilianDateToIso(form.installedAt),
    };
    try {
      if (dataEdit.id !== "") {
        await API.put(`/devices/${dataEdit.id}`, newDevice);
      } else {
        const response = await API.post("/devices/add", newDevice);
        if (response.data === false) {
          Alert.alert(
            "Informação do Sistema",
            "Equipamento já encontra-se cadastrado!"
          );
          return;
        }
      }
      reset();
      closeModal(false);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Informação do Sistema",
        "Não foi possível salvar, tente novamente."
      );
    }
  };

  const handleButtonCancel = () => {
    closeModal(false);
  };
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<DeviceForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      reference: dataEdit.reference,
      model: dataEdit.model,
      brand: dataEdit.brand,
      location: dataEdit.location,
      equipmentType: dataEdit.equipmentType,
      serialNumber: dataEdit.serialNumber,
      capacityBtu: dataEdit.capacityBtu ? String(dataEdit.capacityBtu) : "",
      refrigerant: dataEdit.refrigerant,
      installedAt: dataEdit.id ? isoDateToBrazilian(dataEdit.installedAt) : todayInBrazilianFormat(),
    },
  });
  return (
    <>
      <FormModal title={dataEdit.id ? "Editar equipamento" : "Novo equipamento"} description="Cadastre os dados de identificação e o local de instalação." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Salvar" onPress={handleSubmit(handleRegister)} /></>}>
            <SelectCustomers selected={selected} setSelected={setSelected} />
            <ScanArea>
              <ReferenceField><InputForm control={control} name="reference" label="Código do QR Code *" placeholder="Leia ou digite o código" autoCapitalize="characters" autoCorrect={false} error={errors.reference?.message} type={"custom"} options={{ mask: "*********************************" }} /></ReferenceField>
              <ButtonScan accessibilityLabel="Ler QR Code" onPress={() => setQRCode(true)}><QrCode size={22} color={theme.colors.primary} /></ButtonScan>
            </ScanArea>
            <InputForm control={control} name="model" label="Modelo" placeholder="Ex.: Split Inverter 12.000 BTU" autoCapitalize="words" error={errors.model?.message} type={"custom"} options={{ mask: "*********************************" }} />
            <InputForm control={control} name="brand" label="Marca" placeholder="Ex.: LG" autoCapitalize="words" error={errors.brand?.message} type={"custom"} options={{ mask: "*********************************" }} />
            <InputForm control={control} name="location" label="Ambiente *" placeholder="Ex.: Sala principal" autoCapitalize="words" error={errors.location?.message} type={"custom"} options={{ mask: "*********************************" }} />
            <CollapsibleSection title="Características técnicas" state={dataEdit.equipmentType || dataEdit.serialNumber || dataEdit.capacityBtu ? "complete" : "pending"}>
              <InputForm control={control} name="equipmentType" label="Tipo" placeholder="Ex.: Ar-condicionado split" autoCapitalize="words" type={"custom"} options={{ mask: "*********************************" }} />
              <InputForm control={control} name="serialNumber" label="Número de série" placeholder="Opcional" autoCapitalize="characters" type={"custom"} options={{ mask: "*********************************" }} />
              <InputForm control={control} name="capacityBtu" label="Capacidade (BTU/h)" placeholder="Ex.: 18000" keyboardType="number-pad" type={"custom"} options={{ mask: "999999" }} />
              <ChoiceChips value={voltage ? String(voltage) : undefined} onChange={(value) => setVoltage(Number(value))} options={[{ value: "127", label: "127 V" }, { value: "220", label: "220 V" }, { value: "380", label: "380 V" }]} />
              <ChoiceChips value={phase ?? undefined} onChange={setPhase} options={[{ value: "single", label: "Monofásico" }, { value: "two", label: "Bifásico" }, { value: "three", label: "Trifásico" }, { value: "other", label: "Outro" }]} />
              <InputForm control={control} name="refrigerant" label="Refrigerante" placeholder="Ex.: R-410A" autoCapitalize="characters" type={"custom"} options={{ mask: "****************" }} />
              <InputForm control={control} name="installedAt" label="Data de instalação" placeholder="DD/MM/AAAA" keyboardType="number-pad" error={errors.installedAt?.message} type={"custom"} options={{ mask: "99/99/9999" }} />
            </CollapsibleSection>
      </FormModal>
      {QRcode && <Modal visible animationType="slide"><ScannerQR closeModal={setQRCode} handleQRcode={handleQRcode} /></Modal>}
    </>
  );
};
