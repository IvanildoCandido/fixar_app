import { useNavigation } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { TextInputMaskMethods } from "react-native-masked-text";
import { Button } from "../../components/Form/Button";
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
import { defaultCustomer, defaultDevice } from "../../utils/dafaultValues";
import API from "../../services/API";
import * as Notifications from "expo-notifications";
import { SelectCustomers } from "../../components/Form/SelectCustomers";
import { SelectMultiDevices } from "../../components/Form/SelectMultiDevices";
import { QtdItensSelector } from "../../components/Form/QtdItensSelector";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { generateBudgetsHtml } from "../../components/ReportModels/Budgets";
import { useAuth } from "../../auth/AuthContext";
import { loadReportCompany } from "../../services/reportCompany";
import { maskedMoneyValue } from "../../domain/technicalMaintenance";
export interface servicesTotal {
  id: string;
  qtd: number;
  name: string;
  description?: string;
  price: number;
  total: number;
}
export const Budgets = () => {
  const { session } = useAuth();
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(defaultCustomer);

  const [services, setServices] = useState<ItensProps[]>([]);

  const [parts, setParts] = useState<ItensProps[]>([]);
  const [servicesSelected, setServicesSelected] = useState<servicesTotal[]>([]);
  const [partsSelected, setPartsSelected] = useState<servicesTotal[]>([]);
  const [notification, setNotification] = useState(false);
  const [increment, setIncrement] = useState("0");
  const [discount, setDiscount] = useState("0");
  const incrementRaw = useRef<TextInputMaskMethods | any>(null);
  const discountRaw = useRef<TextInputMaskMethods | any>(null);
  const [comments, setComments] = useState("");
  const [total, setTotal] = useState(0);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const totalParts = partsSelected.reduce((acc, value) => {
      return acc + value.total;
    }, 0);
    const totalServices = servicesSelected.reduce((acc, value) => {
      return acc + value.total;
    }, 0);
    setTotal(
      totalServices +
        totalParts +
        maskedMoneyValue(incrementRaw, increment) -
        maskedMoneyValue(discountRaw, discount)
    );
  }, [servicesSelected, partsSelected, increment, discount]);

  const setScheduleNotification = async (device: Device) => {
    if (notification) {
      const trigger = new Date(Date.now() + 7776000000);
      const notificationRequest: Notifications.NotificationRequestInput = {
        content: {
          title: "Aviso de Manutenção Programada",
          body: `Equipamento: ${device.reference} Cliente: ${device.Customer.name} (90 dias)!`,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        },
      };
      Notifications.scheduleNotificationAsync(notificationRequest);
    }
  };
  const printToFile = async (html: string) => {
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };
  const handlerShare = async () => {
    if (!selectedCustomer.id) {
      Alert.alert("Mensagem do Sistema:", "Selecione o cliente do orçamento.");
    } else if (servicesSelected.length === 0) {
      Alert.alert(
        "Mensagem do Sistema:",
        "Não é possível gerar um orçamento sem selecionar nenhum serviço!"
      );
    } else {
      try {
        const discountValue = maskedMoneyValue(discountRaw, discount);
        const surchargeValue = maskedMoneyValue(incrementRaw, increment);
        await API.post("/quotes/add", {
          customerId: selectedCustomer.id,
          services: servicesSelected,
          parts: partsSelected,
          comments,
          discount: discountValue,
          surcharge: surchargeValue,
          total,
        });
        if (!session) throw new Error("Empresa ativa não encontrada.");
        const company = await loadReportCompany(session.organization);
        const html = generateBudgetsHtml(servicesSelected, partsSelected, total, company, selectedCustomer, comments, { discount: discountValue, surcharge: surchargeValue });
        await printToFile(html);
      } catch (error) {
        Alert.alert("Mensagem do Sistema:", error instanceof Error ? error.message : "Não foi possível salvar o orçamento.");
      }
    }
  };

  return (
    <Container>
      <Header title={"Gerar Orçamentos"} icons={true} />
      <ContentArea automaticallyAdjustKeyboardInsets={true}>
        <SelectionArea>
          <SelectCustomers selected={selectedCustomer} setSelected={setSelectedCustomer} />
        </SelectionArea>
        <QtdItensSelector
          itens={services}
          setItens={setServices}
          dataTable="services"
          selectorLabel="Serviços:"
          modalTitle="Serviços"
          itensSelected={servicesSelected}
          setItensSelected={setServicesSelected}
        />
        <QtdItensSelector
          itens={parts}
          setItens={setParts}
          dataTable="parts"
          selectorLabel="Materiais:"
          modalTitle="Materiais"
          itensSelected={partsSelected}
          setItensSelected={setPartsSelected}
        />

        <InfoText>Observações do orçamento</InfoText>
        <TextArea multiline numberOfLines={4} value={comments} onChangeText={setComments} placeholder="Condições, prazo de validade, forma de pagamento ou informações para o cliente" />

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
            title={"Encaminhar"}
            onPress={() => handlerShare()}
          />
        </ButtonsArea>
      </ContentArea>
    </Container>
  );
};
