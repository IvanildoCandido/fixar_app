import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { invalidateQueries } from "../../services/queryCache";
import { EquipmentQr } from "../../components/PublicEquipmentQr";

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
  const listRef = useRef<any>(null);
  const [devicesModal, setDevicesModal] = useState(false);
  const [publicQrDevice, setPublicQrDevice] = useState<DeviceProps | null>(null);
  const [devices, setDevices] = useState<DeviceProps[]>([]);
  const [dataEdit, setDataEdit] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleModalOpen = () => {
    setDevicesModal(true);
    setDataEdit(defaultData);
  };

  const loadDevices = async () => {
    setError("");
    try {
      const { data } = await API.get("/devices/list");
      setDevices(data);
    } catch (error) {
      console.log(error);
      setError("Não foi possível carregar a lista de equipamentos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      loadDevices();
      return () => {};
    }, [devicesModal])
  );
  const refreshDevices = () => {
    invalidateQueries("devices:");
    setRefreshing(true);
    loadDevices();
  };
  const filtered = useMemo(() => devices.filter((item) => !query.trim() || `${item.reference} ${item.model} ${item.brand} ${item.location} ${item.Customer.name}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))), [devices, query]);

  return (
    <Container>
      <Header title="Equipamentos" onPress={handleModalOpen} />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar equipamentos" />
      {loading ? (
        <Loading />
      ) : error ? <ErrorState description={error} /> : (
        <DevicesList
          ref={listRef}
          data={filtered}
          refreshing={refreshing}
          onRefresh={refreshDevices}
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
              onPublicQr={() => setPublicQrDevice(item)}
            />
          )}
          keyExtractor={(item: DeviceProps) => item.id}
          ListEmptyComponent={<EmptyState title={query ? "Equipamento não encontrado" : "Nenhum equipamento cadastrado"} />}
        />
      )}
      <Modal visible={devicesModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDevicesModal(false)}>
        <AddDevice closeModal={setDevicesModal} dataEdit={dataEdit} />
      </Modal>
      <Modal visible={Boolean(publicQrDevice)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPublicQrDevice(null)}>
        {publicQrDevice ? <EquipmentQr device={publicQrDevice} onClose={() => setPublicQrDevice(null)} /> : null}
      </Modal>
    </Container>
  );
};
