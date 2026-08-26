import AsyncStorage from "@react-native-async-storage/async-storage";
import { SetStateAction, useState } from "react";
import moment from "moment";
import { shareAsync } from "expo-sharing";
import * as Print from "expo-print";
import { generateHtml } from "../../components/ReportModels/SinglePDF";

import {
  Container,
  ReferenceName,
  IconsArea,
  InfoArea,
  TouchAction,
  LocationName,
  CustomerName,
  Label,
  Title,
  DateService,
} from "./styles";
import { FileText, Trash2 } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { Customer, Device, Part, Service } from "../../types/data";
import { Alert } from "react-native";
import API from "../../services/API";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthContext";
import { loadReportCompany } from "../../services/reportCompany";

interface Props {
  reload: boolean;
  setReload: React.Dispatch<SetStateAction<boolean>>;
  id: string;
  device: Device;
  customer: Customer;
  comments: string;
  parts: Part[];
  services: Service[];
  date: string;
  total: string;
  setDevicesModal: React.Dispatch<SetStateAction<boolean>>;
}

export const RepairItem = ({
  reload,
  setReload,
  id,
  device,
  customer,
  date,
  parts,
  services,
  comments,
  total,
  setDevicesModal,
}: Props) => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [selectedPrinter, setSelectedPrinter] = useState();

  const printToFile = async (html: string) => {
    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };

  const handlerDelete = () => {
    Alert.alert(
      "Excluir Manutenção:",
      "Você deseja excluir essa manutenção? Após excluída não será possível gerar um relatório da mesma!",
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
              await API.delete(`/repairs/${id}`);
              setReload(!reload);
            } catch (error) {
              console.log(error);
              Alert.alert(
                "Informação do Sistema",
                "Não foi possível excluir, tente novamente."
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handlerReport = async () => {
    try {
      if (!session) throw new Error("Empresa ativa não encontrada.");
      const company = await loadReportCompany(session.organization);
      const html = generateHtml(customer, device, parts, services, comments, total, date, company, session.user.name);
      await printToFile(html);
    } catch (error) {
      Alert.alert("Relatório não gerado", error instanceof Error ? error.message : "Tente novamente.");
    }
  };

  return (
    <Container>
      <InfoArea>
        <Label>
          <Title>Referência:</Title>
          <ReferenceName>{device.reference}</ReferenceName>
        </Label>
        <Label>
          <Title>Ambiente:</Title>
          <LocationName>{device.location}</LocationName>
        </Label>
        <Label>
          <Title>Cliente:</Title>
          <CustomerName>{customer.name}</CustomerName>
        </Label>
        <Label>
          <Title>Data do Serviço:</Title>
          <DateService>{moment(date).format("DD/MM/YYYY")}</DateService>
        </Label>
      </InfoArea>
      <IconsArea>
        <TouchAction accessibilityLabel="Excluir ordem" onPress={handlerDelete}>
          <Trash2 size={18} color={theme.colors.danger} />
        </TouchAction>
        <TouchAction accessibilityLabel="Gerar relatório" onPress={handlerReport}>
          <FileText size={18} color={theme.colors.muted} />
        </TouchAction>
      </IconsArea>
    </Container>
  );
};
