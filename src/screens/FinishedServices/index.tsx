import React, { useCallback, useEffect, useState } from "react";
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
import { Period, Repair, RepairFilters } from "../../types/data";
import {
  defaultCustomer,
  defaultDevice,
  defaultPeriod,
} from "../../utils/dafaultValues";
import { SetFilter } from "../../components/SetFilter";
import { listRepairDetailsForReport, listRepairSummaries } from "../../services/API";
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
  const [filters, setFilters] = useState<RepairFilters>({});
  const [page, setPage] = useState(0); const [hasMore, setHasMore] = useState(false); const [total, setTotal] = useState(0); const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(defaultPeriod);
  const [filterApplied, setFilterApplied] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleModalOpen = () => {
    setDevicesModal(true);
  };
  const loadRepairs = useCallback(async (nextPage = 0, replace = true) => {
    replace ? setLoading(true) : setLoadingMore(true);
    try {
      const result = await listRepairSummaries(nextPage, 20, filters);
      setRepairs((current) => replace ? result.items : [...current, ...result.items]); setPage(nextPage); setHasMore(result.hasMore); setTotal(result.total);
    } catch (error) {
      console.log(error);
      alert("Não foi possível carregar a lista de manutenções.");
    } finally { setLoading(false); setLoadingMore(false); }
  }, [filters]);
  useEffect(() => { loadRepairs(0, true); }, [loadRepairs, reload]);

  const printToFile = async (html: string) => {
    const { uri } = await Print.printToFileAsync({
      html,
    });
    await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };

  const handlerReport = async () => {
    if (!repairs.length || generatingReport) return;

    try {
      setGeneratingReport(true);
      if (!session) throw new Error("Empresa ativa não encontrada.");
      const company = await loadReportCompany(session.organization);
      const reportRepairs = await listRepairDetailsForReport(filters);
      const html = generateMultipleHtml(reportRepairs, selectedPeriod, company);
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
                  {total} {total === 1 ? "serviço encontrado" : "serviços encontrados"}
                </ReportActionText>
              </ReportActionContent>
              <Button
                label={generatingReport ? "Gerando PDF…" : "Gerar PDF"}
                loading={generatingReport}
                disabled={repairs.length === 0}
                onPress={handlerReport}
              />
            </ReportAction>
          )}
          {filterApplied && repairs.length === 0 ? (
            <EmptyState title="Nenhum serviço encontrado" description="Altere os filtros para gerar um relatório." />
          ) : (
            <DevicesList
              data={repairs}
              onEndReached={() => { if (hasMore && !loadingMore) loadRepairs(page + 1, false); }}
              onEndReachedThreshold={0.35}
              initialNumToRender={12}
              maxToRenderPerBatch={16}
              windowSize={7}
              removeClippedSubviews
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
                  onDeleted={(deletedId) => { setRepairs((current) => current.filter((item) => item.id !== deletedId)); setTotal((current) => Math.max(0, current - 1)); }}
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
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          onFiltersApplied={(nextFilters) => { setFilters(nextFilters); setFilterApplied(true); }}
        />
      </Modal>
    </Container>
  );
};
