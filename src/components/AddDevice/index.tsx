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

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  dataEdit: Device;
}

interface DeviceForm {
  reference: string;
  model?: string;
  brand?: string;
  location: string;
}

const schema = Yup.object().shape({
  reference: Yup.string().required("O número da referência é obrigatório"),
  location: Yup.string().required(
    "Informe o local de instalação do equipamento"
  ),
});

export const AddDevice = ({ closeModal, dataEdit }: ModalProps) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<Customer>(defaultCustomer);
  const [QRcode, setQRCode] = useState(false);
  const [reference, setReference] = useState("");

  const handleQRcode = (data: string): void => {
    setReference(data);
    setValue("reference", data);
    clearErrors("reference");
  };

  useEffect(() => {
    if (dataEdit.Customer.id !== "") {
      setSelected(dataEdit.Customer);
      setReference(dataEdit.reference);
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
      reference,
      model: form.model,
      brand: form.brand,
      location: form.location,
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
    },
  });
  return (
    <>
      <FormModal title={dataEdit.id ? "Editar equipamento" : "Novo equipamento"} description="Cadastre os dados de identificação e o local de instalação." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Salvar" onPress={handleSubmit(handleRegister)} /></>}>
            <SelectCustomers selected={selected} setSelected={setSelected} />
            <ScanArea>
              <ReferenceField><InputForm editable={false} control={control} name="reference" label="Referência *" placeholder="Leia ou informe o QR Code" autoCapitalize="characters" autoCorrect={false} value={reference} error={errors.reference?.message} type={"custom"} options={{ mask: "*********************************" }} /></ReferenceField>
              <ButtonScan accessibilityLabel="Ler QR Code" onPress={() => setQRCode(true)}><QrCode size={22} color={theme.colors.primary} /></ButtonScan>
            </ScanArea>
            <InputForm control={control} name="model" label="Modelo" placeholder="Ex.: Split Inverter 12.000 BTU" autoCapitalize="words" error={errors.model?.message} type={"custom"} options={{ mask: "*********************************" }} />
            <InputForm control={control} name="brand" label="Marca" placeholder="Ex.: LG" autoCapitalize="words" error={errors.brand?.message} type={"custom"} options={{ mask: "*********************************" }} />
            <InputForm control={control} name="location" label="Ambiente *" placeholder="Ex.: Sala principal" autoCapitalize="words" error={errors.location?.message} type={"custom"} options={{ mask: "*********************************" }} />
      </FormModal>
      {QRcode && <Modal visible animationType="slide"><ScannerQR closeModal={setQRCode} handleQRcode={handleQRcode} /></Modal>}
    </>
  );
};
