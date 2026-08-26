import { useNavigation } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { TextInputMaskMethods } from "react-native-masked-text";
import { Button } from "../../components/Form/Button";
import { CheckBox } from "../../components/Form/CheckBox";
import { Input } from "../../components/Form/Input";
import { ItensProps, SelectItens } from "../../components/Form/ItensSelector";
import { Customer, Device } from "../../types/data";
import { Header } from "../../components/Header";
import {
  Container,
  ContentArea,
  InfoText,
  TextArea,
  EntriesArea,
  Side,
  TotalArea,
  TotalLabel,
  TotalValue,
  ButtonsArea,
  SelectionArea,
} from "./styles";
import { Alert } from "react-native";
import { defaultCustomer } from "../../utils/dafaultValues";
import API from "../../services/API";
import { SelectCustomers } from "../../components/Form/SelectCustomers";
import { SelectMultiDevices } from "../../components/Form/SelectMultiDevices";
import { FormField } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { calculateReminderDueDate, scheduleMaintenanceReminder } from "../../services/maintenanceReminders";
import { maskedMoneyValue } from "../../domain/technicalMaintenance";

export const MultiRepair = () => {
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(defaultCustomer);
  const [services, setServices] = useState<ItensProps[]>([]);
  const [devices, setDevices] = useState<ItensProps[] | any>([]);
  const [parts, setParts] = useState<ItensProps[]>([]);
  const [notification, setNotification] = useState(false);
  const [reminderDays, setReminderDays] = useState("90");
  const [reminderError, setReminderError] = useState("");
  const [increment, setIncrement] = useState("0");
  const [discount, setDiscount] = useState("0");
  const incrementRaw = useRef<TextInputMaskMethods | any>(null);
  const discountRaw = useRef<TextInputMaskMethods | any>(null);
  const [comments, setComments] = useState("");
  const [total, setTotal] = useState(0);
  const navigation = useNavigation<any>();
  const { session } = useAuth();

  useEffect(() => {
    setDevices([]);
  }, [selectedCustomer]);

  useEffect(() => {
    const totalParts = parts.reduce((acc, value) => {
      return acc + parseFloat(value.price);
    }, 0);
    const totalServices = services.reduce((acc, value) => {
      return acc + parseFloat(value.price);
    }, 0);
    setTotal(
      totalServices +
        totalParts +
        maskedMoneyValue(incrementRaw, increment) -
        maskedMoneyValue(discountRaw, discount)
    );
  }, [parts, services, increment, discount]);

  const handlerRegister = async () => {
    const intervalDays = Number(reminderDays);
    if (notification && (!Number.isInteger(intervalDays) || intervalDays < 1)) {
      setReminderError("Informe um prazo válido, em dias.");
      return;
    }
    setReminderError("");
    Alert.alert(
      "Finalizar Manutenção:",
      "Você deseja finalizar essa manutenção? Após finalizada não será possível alterar os valores da mesma!",
      [
        {
          text: "Não",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            try {
              const notificationFailures: string[] = [];
              for (const device of devices as Device[]) {
                const reminderDevice: Device = {
                  ...device,
                  Customer: selectedCustomer,
                };
                const completedAt = new Date();
                const reminderDueAt = notification
                  ? calculateReminderDueDate(intervalDays, completedAt)
                  : null;
                const newRepair = {
                  customerId: selectedCustomer.id,
                  deviceId: device.id,
                  services,
                  parts,
                  comments,
                  total,
                  date: completedAt,
                  assignedTo: session?.user.id,
                  reminderEnabled: notification,
                  reminderIntervalDays: notification ? intervalDays : null,
                  reminderDueAt: reminderDueAt?.toISOString() ?? null,
                };
                const { data: workOrder } = await API.post("/repairs/add", newRepair);
                if (notification && reminderDueAt) {
                  try {
                    await scheduleMaintenanceReminder({
                      device: reminderDevice,
                      dueDate: reminderDueAt,
                      workOrderId: workOrder.id,
                    });
                  } catch {
                    notificationFailures.push(device.reference);
                  }
                }
              }
              if (notificationFailures.length) {
                Alert.alert(
                  "Lembretes salvos",
                  "Os lembretes aparecerão na tela inicial, mas algumas notificações do aparelho não puderam ser agendadas. Verifique a permissão de notificações."
                );
              }
              navigation.navigate("FinishedServices");
            } catch (error) {
              console.log(error);
              Alert.alert(
                "Informação do Sistema",
                "Não foi possível salvar, tente novamente."
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <Container>
      <Header title={"Gerar Manutenções"} icons={true} />
      <ContentArea automaticallyAdjustKeyboardInsets={true}>
        <SelectionArea>
          <SelectCustomers
            selected={selectedCustomer}
            setSelected={setSelectedCustomer}
          />
          <SelectMultiDevices
            customerId={selectedCustomer.id}
            itens={devices}
            setItens={setDevices}
            dataTable="devices"
            selectorLabel="Equipamentos selecionados:"
            modalTitle="Selecione os equipamentos"
          />
        </SelectionArea>
        <SelectItens
          itens={services}
          setItens={setServices}
          dataTable="services"
          selectorLabel="Serviços realizados:"
          modalTitle="Serviços"
        />
        <SelectItens
          itens={parts}
          setItens={setParts}
          dataTable="parts"
          selectorLabel="Peças substituídas:"
          modalTitle="Peças"
        />
        <InfoText>Observações</InfoText>
        <TextArea
          multiline={true}
          numberOfLines={4}
          onChangeText={setComments}
          value={comments}
        />
        <EntriesArea>
          <Side>
            <Input
              value={discount}
              label="Descontos:"
              placeholder="R$ 0,00"
              keyboardType="numeric"
              onChangeText={(value) => setDiscount(value)}
              type="money"
              rawValue={discountRaw}
            />
          </Side>
          <Side>
            <Input
              value={increment}
              label="Acréscimos"
              placeholder="R$ 0,00"
              keyboardType="numeric"
              onChangeText={(value) => setIncrement(value)}
              type="money"
              rawValue={incrementRaw}
            />
          </Side>
        </EntriesArea>
        <CheckBox
          title="Marcar para lembrete periódico"
          checked={notification}
          setChecked={setNotification}
        />
        {notification ? (
          <FormField
            label="Prazo para a próxima manutenção (dias)"
            value={reminderDays}
            onChangeText={(value) => {
              setReminderDays(value.replace(/\D/g, ""));
              setReminderError("");
            }}
            keyboardType="number-pad"
            placeholder="Ex.: 90"
            error={reminderError}
            required
          />
        ) : null}
        <TotalArea>
          <TotalLabel>TOTAL:</TotalLabel>
          <TotalValue>R$ {total.toFixed(2).replace(".", ",")}</TotalValue>
        </TotalArea>
        <ButtonsArea>
          <Button
            type="cancel"
            title={"Voltar"}
            onPress={() => navigation.navigate("Home")}
          />
          <Button
            type="save"
            title={"Salvar"}
            onPress={() => handlerRegister()}
          />
        </ButtonsArea>
      </ContentArea>
    </Container>
  );
};
