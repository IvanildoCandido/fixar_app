import { SetStateAction, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
} from "react-native";
import { Button, FormModal } from "../../design-system";
import { InputForm } from "../Form/InputForm";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextInputMaskMethods } from "react-native-masked-text";
import { Part } from "../../types/data";
import API from "../../services/API";

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  dataEdit: Part;
}

const schema = Yup.object().shape({
  name: Yup.string().required("O nome da peça é obrigatório"),
  price: Yup.string().required("Informe o valor da peça"),
});

export const AddPart = ({ closeModal, dataEdit }: ModalProps) => {
  const priceRaw = useRef<TextInputMaskMethods | any>(null);
  const handleRegister = async (form: Part) => {
    const newPart = {
      name: form.name,
      price: priceRaw?.current.getRawValue(),
    };

    try {
      if (dataEdit.id !== "") {
        await API.put(`/parts/${dataEdit.id}`, newPart);
      } else {
        await API.post("/parts/add", newPart);
      }
      reset();
      closeModal(false);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Informção do Sistema",
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
    formState: { errors },
  } = useForm<Part | any>({
    resolver: yupResolver(schema),
    defaultValues: dataEdit,
  });
  return (
    <FormModal title={dataEdit.id ? "Editar peça" : "Nova peça"} description="Informe o nome e o valor praticado no catálogo." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Salvar" onPress={handleSubmit(handleRegister)} /></>}>
          <InputForm
            control={control}
            name="name"
            label="Nome da peça *"
            placeholder="Ex.: Capacitor 30 µF"
            autoCapitalize="words"
            autoCorrect={false}
            error={errors.name && errors.name.message}
            type={"custom"}
            options={{ mask: "*********************************" }}
          />
          <InputForm
            control={control}
            name="price"
            label="Preço *"
            placeholder="R$ 0,00"
            keyboardType="numeric"
            autoCapitalize="none"
            error={errors.price && errors.price.message}
            type={"money"}
            rawValue={priceRaw}
          />
    </FormModal>
  );
};
