import React, { useCallback, useMemo, useState } from "react";
import { Header } from "../../components/Header";
import { Modal } from "react-native";

import { Container, DevicesList } from "./styles";

import { DeviceItem } from "../../components/DeviceItem";
import { AddDevice } from "../../components/AddDevice";
import { Customer } from "../../types/data";
import { defaultCustomer } from "../../utils/dafaultValues";
import API from "../../services/API";
import { Loading } from "../../components/Loading";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState, ErrorState, SearchInput } from "../../design-system";

export interface DeviceProps {
  Customer: Customer;
  id: string;
  reference: string;
  model: string;
  brand: string;
  location: string;
  equipmentType?: string;
  serialNumber?: string;
  capacityBtu?: number | null;
  voltage?: number | null;
  phase?: "single" | "two" | "three" | "other" | null;
  refrigerant?: string;
  installedAt?: string | null;
}
export const defaultData: DeviceProps = {
  Customer: defaultCustomer,
  id: "",
  reference: "",
  model: "",
  brand: "",
  location: "",
};

export const Devices = () => {
  const [devicesModal, setDevicesModal] = useState(false);
  const [devices, setDevices] = useState<DeviceProps[]>([]);
  const [dataEdit, setDataEdit] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [query, setQuery] = useState("");

  const handleModalOpen = () => {
    setDevicesModal(true);
    setDataEdit(defaultData);
  };

  const loadDevices = async () => {
    setError("");
    try {
      const { data } = await API.get("/devices/list");
      setDevices(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError("Não foi possível carregar a lista de equipamentos."); setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDevices();
      return () => {};
    }, [devicesModal])
  );
  const filtered = useMemo(() => devices.filter((item) => !query.trim() || `${item.reference} ${item.model} ${item.brand} ${item.location} ${item.Customer.name}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))), [devices, query]);

  return (
    <Container>
      <Header title="Equipamentos" onPress={handleModalOpen} />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar equipamentos" />
      {loading ? (
        <Loading />
      ) : error ? <ErrorState description={error} /> : (
        <DevicesList
          data={filtered}
          renderItem={({ item }: { item: DeviceProps }) => (
            <DeviceItem
              id={item.id}
              Customer={item.Customer}
              reference={item.reference}
              location={item.location}
              setDevices={setDevices}
              setDevicesModal={setDevicesModal}
              setDataEdit={setDataEdit}
              setLoading={setLoading}
            />
          )}
          keyExtractor={(item: DeviceProps) => item.id}
          ListEmptyComponent={<EmptyState title={query ? "Equipamento não encontrado" : "Nenhum equipamento cadastrado"} />}
        />
      )}
      <Modal visible={devicesModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDevicesModal(false)}>
        <AddDevice closeModal={setDevicesModal} dataEdit={dataEdit} />
      </Modal>
    </Container>
  );
};
