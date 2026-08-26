import React, { useEffect, useState } from "react";
import { Alert, Modal } from "react-native";

import {
  Container,
  DevicesList,
  FilterStatus,
  ReportAction,
  ReportActionContent,
  ReportActionText,
  ReportActionTitle,
} from "./styles";

import { HeaderFilter } from "../../components/HeaderFilter";
import { RepairItem } from "../../components/RepairItem";
import { Period, Repair } from "../../types/data";
import {
  defaultCustomer,
  defaultDevice,
  defaultPeriod,
} from "../../utils/dafaultValues";
import { SetFilter } from "../../components/SetFilter";
import API from "../../services/API";
import { Loading } from "../../components/Loading";
import { Button, EmptyState } from "../../design-system";

import { shareAsync } from "expo-sharing";
import * as Print from "expo-print";
import { generateMultipleHtml } from "../../components/ReportModels/MultiplePDF";
import { useAuth } from "../../auth/AuthContext";
import { loadReportCompany } from "../../services/reportCompany";

export const defaultData: Repair = {
  id: "",
  Customer: defaultCustomer,
  Device: defaultDevice,
  comments: "",
  parts: [],
  services: [],
  total: "",
  date: "",
};

export const FinishedServices = () => {
  const { session } = useAuth();
  const [reload, setReload] = useState(false);
  const [devicesModal, setDevicesModal] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState<Repair[]>([] as Repair[]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(defaultPeriod);
  const [filterApplied, setFilterApplied] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleModalOpen = () => {
    setDevicesModal(true);
  };
  useEffect(() => {
    setLoading(true);
    loadRepairs().then(() => setLoading(false));
  }, [reload]);

  const loadRepairs = async () => {
    try {
      const { data } = await API.get("/repairs/list");
      setRepairs(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      alert("Não foi possível carregar a lista de manutenções.");
    }
  };
  useEffect(() => {
    if (filterApplied) setRepairs(filtered);
  }, [filterApplied, filtered]);

  const printToFile = async (html: string) => {
    const { uri } = await Print.printToFileAsync({
      html,
    });
    await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };

  const handlerReport = async () => {
    if (!filtered.length || generatingReport) return;

    try {
      setGeneratingReport(true);
      if (!session) throw new Error("Empresa ativa não encontrada.");
      const company = await loadReportCompany(session.organization);
      const html = generateMultipleHtml(filtered, selectedPeriod, company);
      await printToFile(html);
    } catch (error) {
      console.error("Não foi possível gerar o relatório", error);
      Alert.alert(
        "Relatório não gerado",
        "Não foi possível criar ou compartilhar o PDF. Tente novamente."
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <Container>
      <HeaderFilter title={"Serviços Realizados"} onPress={handleModalOpen} />
      {loading ? (
        <Loading />
      ) : (
        <>
          {!filterApplied ? (
            <FilterStatus>Nenhum filtro aplicado</FilterStatus>
          ) : (
            <ReportAction>
              <ReportActionContent>
                <ReportActionTitle>Relatório filtrado</ReportActionTitle>
                <ReportActionText>
                  {filtered.length} {filtered.length === 1 ? "serviço encontrado" : "serviços encontrados"}
                </ReportActionText>
              </ReportActionContent>
              <Button
                label={generatingReport ? "Gerando PDF…" : "Gerar PDF"}
                loading={generatingReport}
                disabled={filtered.length === 0}
                onPress={handlerReport}
              />
            </ReportAction>
          )}
          {filterApplied && repairs.length === 0 ? (
            <EmptyState title="Nenhum serviço encontrado" description="Altere os filtros para gerar um relatório." />
          ) : (
            <DevicesList
              data={repairs}
              renderItem={({ item }: { item: Repair }) => (
                <RepairItem
                  repair={item}
                  reload={reload}
                  setReload={setReload}
                  id={item.id}
                  customer={item.Customer}
                  device={item.Device}
                  date={item.date}
                  comments={item.comments}
                  parts={item.parts}
                  total={item.total}
                  key={item.id}
                  services={item.services}
                  setDevicesModal={setDevicesModal}
                />
              )}
              keyExtractor={(item: Repair) => item.id}
            />
          )}
        </>
      )}
      <Modal visible={devicesModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setDevicesModal(false)}>
        <SetFilter
          closeModal={setDevicesModal}
          setFiltered={setFiltered}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          onFiltersApplied={() => setFilterApplied(true)}
        />
      </Modal>
    </Container>
  );
};
