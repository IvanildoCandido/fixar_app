import { SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { Button, FormModal } from "../../design-system";
import { InputForm } from "../Form/InputForm";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import uuid from "react-native-uuid";
import { Customer } from "../../types/data";
import API from "../../services/API";
import { commercialErrorMessage, parseCommercialError } from "../../services/commercialErrors";
import { useCommercial } from "../../commercial/CommercialContext";

interface ModalProps {
  closeModal: React.Dispatch<SetStateAction<boolean>>;
  dataEdit: Customer;
}

const schema = Yup.object().shape({
  name: Yup.string().required("O nome é obrigatório"),
  document: Yup.string().required("Informe o número do documento"),
});

export const AddCustomer = ({ closeModal, dataEdit }: ModalProps) => {
  const { showUpgrade } = useCommercial();
  const handleRegister = async (form: Customer) => {
    const newCustomer = {
      name: form.name,
      email: form.email,
      phone: form.phone.replace(/\D/g, ""),
      address: form.address,
      document: form.document.replace(/\D/g, ""),
    };
    try {
      if (dataEdit.id !== "") {
        await API.put(`/customers/${dataEdit.id}`, newCustomer);
      } else {
        await API.post("/customers/add", newCustomer);
      }
      reset();
      closeModal(false);
    } catch (error) {
      console.log(error);
      const commercial=parseCommercialError(error)??(error as any);if(commercial?.code==="PLAN_LIMIT_REACHED")showUpgrade({resource:"customers",usage:commercial.usage,limit:commercial.limit,message:commercialErrorMessage(error)??undefined});else alert("Não foi possível salvar, tente novamente.");
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
  } = useForm<Customer | any>({
    resolver: yupResolver(schema),
    defaultValues: dataEdit,
  });
  return (
    <FormModal title={dataEdit.id ? "Editar cliente" : "Novo cliente"} description="Cadastre os dados de contato e identificação do cliente." onClose={handleButtonCancel} footer={<><Button style={{ flex: 1 }} label="Cancelar" variant="secondary" onPress={handleButtonCancel} /><Button style={{ flex: 1 }} label="Salvar" onPress={handleSubmit(handleRegister)} /></>}>
          <InputForm
            control={control}
            name="name"
            label="Nome do cliente *"
            placeholder="Nome completo ou razão social"
            autoCapitalize="words"
            autoCorrect={false}
            error={errors.name && errors.name.message}
            type={"custom"}
            options={{ mask: "*********************************" }}
          />
          <InputForm
            control={control}
            name="email"
            label="E-mail"
            placeholder="email@dominio.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email && errors.email.message}
            type={"custom"}
            options={{ mask: "*********************************" }}
          />
          <InputForm
            control={control}
            name="phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
            keyboardType="numeric"
            error={errors.phone && errors.phone.message}
            type={"cel-phone"}
          />
          <InputForm
            control={control}
            name="address"
            label="Endereço"
            placeholder="nome da rua, av..."
            autoCapitalize="words"
            autoCorrect={false}
            error={errors.address && errors.address.message}
            type={"custom"}
            options={{ mask: "*********************************" }}
          />
          <InputForm
            control={control}
            name="document"
            label="CPF/CNPJ *"
            placeholder="apenas números"
            keyboardType="numeric"
            error={errors.document && errors.document.message}
            type="cnpj"
          />
    </FormModal>
  );
};
