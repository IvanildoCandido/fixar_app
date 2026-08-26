import { SetStateAction, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
} from "react-native";
import { Button, FormModal } from "../../design-system";
import { InputForm } from "../Form/InputForm";
import {
  TextArea,
  LabelDescription,
} from "./styles";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { TextInputMaskMethods } from "react-native-masked-text";
import { Service } from "../../types/data";
import API from "../../services/API";

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  dataEdit: Service;
}

const schema = Yup.object().shape({
  name: Yup.string().required("O nome do serviço é obrigatório"),
  price: Yup.string().required("Informe o valor do serviço!"),
});

export const AddService = ({ closeModal, dataEdit }: ModalProps) => {
  const priceRaw = useRef<TextInputMaskMethods | any>(null);
  const [description, setDescription] = useState(dataEdit.description);
  const handleRegister = async (form: Service) => {
    const newService = {
      name: form.name,
      description,
      price: priceRaw?.current.getRawValue(),
    };
    try {
      if (dataEdit.id !== "") {
        await API.put(`/services/${dataEdit.id}`, newService);
      } else {
        await API.post("/services/add", newService);
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
    formState: { errors },
  } = useForm<Service | any>({
    resolver: yupResolver(schema),
    defaultValues: dataEdit,
  });
  return (
    <FormModal title={dataEdit.id ? "Editar serviço" : "Novo serviço"} description="Defina o serviço, uma descrição objetiva e o valor padrão." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Salvar" onPress={handleSubmit(handleRegister)} /></>}>
          <InputForm
            control={control}
            name="name"
            label="Nome do serviço *"
            placeholder="Ex.: Instalação de ar-condicionado"
            autoCapitalize="words"
            autoCorrect={false}
            error={errors.name && errors.name.message}
            type={"custom"}
            options={{ mask: "*********************************" }}
          />
          <LabelDescription>Descrição</LabelDescription>
          <TextArea
            multiline={true}
            numberOfLines={6}
            onChangeText={setDescription}
            value={description}
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
