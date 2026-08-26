import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
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
  ScanArea,
  ReferenceCode,
  Label,
  InfoArea,
  CustomerName,
} from "./styles";
import { Alert, Modal } from "react-native";
import { defaultCustomer, defaultDevice } from "../../utils/dafaultValues";
import API from "../../services/API";
import { ScannerQR } from "../../components/ScannerQR";
import { ButtonScan } from "../../components/AddDevice/styles";
import { QrCode } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { FormField } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { calculateReminderDueDate, scheduleMaintenanceReminder } from "../../services/maintenanceReminders";
import { RootParamList } from "../../routes/routes.types";

export const Repair = () => {
  const theme = useTheme();
  const route = useRoute<RouteProp<RootParamList, "Repair">>();
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(route.params?.customer ?? defaultCustomer);
  const [selectedDevice, setSelectedDevice] = useState<Device>(route.params?.device ?? defaultDevice);
  const [services, setServices] = useState<ItensProps[]>([]);
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
  const [modal, setModal] = useState(false);
  const { session } = useAuth();

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
        parseFloat(incrementRaw?.current.getRawValue()) -
        parseFloat(discountRaw?.current.getRawValue())
    );
  }, [parts, services, increment, discount]);

  const handlerRegister = async () => {
    const intervalDays = Number(reminderDays);
    if (notification && (!Number.isInteger(intervalDays) || intervalDays < 1)) {
      setReminderError("Informe um prazo válido, em dias.");
      return;
    }
    setReminderError("");
    const completedAt = new Date();
    const reminderDueAt = notification
      ? calculateReminderDueDate(intervalDays, completedAt)
      : null;
    const newRepair = {
      customerId: selectedCustomer.id,
      deviceId: selectedDevice.id,
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
              const { data: workOrder } = await API.post("/repairs/add", newRepair);
              if (notification && reminderDueAt) {
                try {
                  await scheduleMaintenanceReminder({
                    device: selectedDevice,
                    dueDate: reminderDueAt,
                    workOrderId: workOrder.id,
                  });
                } catch {
                  Alert.alert(
                    "Lembrete salvo",
                    "O lembrete aparecerá na tela inicial, mas a notificação do aparelho não pôde ser agendada. Verifique a permissão de notificações."
                  );
                }
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

  const handleQRcode = async (data: string): Promise<void> => {
    try {
      const { data: device } = await API.post("devices/reference", {
        reference: data,
      });
      setSelectedCustomer(device.Customer);
      setSelectedDevice(device);
    } catch (error) {
      Alert.alert(
        "Erro interno:",
        "Não foi possível encontrar o equipamento verifique se o mesmo encontra-se cadastrado!"
      );
    }
  };
  return (
    <Container>
      <Header title={"Cadastro de Manutenções"} icons={true} />
      <ContentArea automaticallyAdjustKeyboardInsets={true}>
        <ScanArea>
          <InfoArea>
            <Label>Referência do Equipamento:</Label>
            <ReferenceCode>{selectedDevice.reference || "Leia o código do equipamento"}</ReferenceCode>
            <Label>Cliente:</Label>
            <CustomerName>{selectedCustomer.name || "Nenhum cliente identificado"}</CustomerName>
          </InfoArea>
          <ButtonScan accessibilityRole="button" accessibilityLabel="Ler código do equipamento" onPress={() => setModal(true)}>
            <QrCode size={22} color={theme.colors.primary} />
          </ButtonScan>
        </ScanArea>
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
      <Modal visible={modal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setModal(false)}>
        <ScannerQR closeModal={setModal} handleQRcode={handleQRcode} />
      </Modal>
    </Container>
  );
};
