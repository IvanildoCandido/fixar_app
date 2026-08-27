import React, { useCallback, useMemo, useRef, useState } from "react";
import { Header } from "../../components/Header";
import { Modal } from "react-native";

import { Container, ServicesList } from "./styles";

import { ServiceItem } from "../../components/ServiceItem";
import { AddService } from "../../components/AddService";
import { Service } from "../../types/data";
import { defaultService } from "../../utils/dafaultValues";
import API from "../../services/API";
import { Loading } from "../../components/Loading";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState, ErrorState, SearchInput } from "../../design-system";
import { invalidateQueries } from "../../services/queryCache";

export const Services = () => {
  const listRef = useRef<any>(null);
  const [servicesModal, setServicesModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [dataEdit, setDataEdit] = useState(defaultService);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleModalOpen = () => {
    setServicesModal(true);
    setDataEdit(defaultService);
  };

  const loadServices = async () => {
    setError("");
    try {
      const { data } = await API.get("/services/list");
      setServices(data);
    } catch (error) {
      console.log(error);
      setError("Não foi possível carregar a lista de serviços.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      loadServices();
      return () => {};
    }, [servicesModal])
  );
  const refreshServices = () => {
    invalidateQueries("catalog:service:");
    setRefreshing(true);
    loadServices();
  };
  const filtered = useMemo(() => services.filter((item) => !query.trim() || `${item.name} ${item.description}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))), [services, query]);

  return (
    <Container>
      <Header title="Serviços" onPress={handleModalOpen} />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar serviços" />
      {loading ? (
        <Loading />
      ) : error ? <ErrorState description={error} /> : (
        <ServicesList
          ref={listRef}
          data={filtered}
          refreshing={refreshing}
          onRefresh={refreshServices}
          renderItem={({ item }: { item: Service }) => (
            <ServiceItem
              id={item.id}
              name={item.name}
              price={item.price}
              setServices={setServices}
              setServicesModal={setServicesModal}
              setDataEdit={setDataEdit}
              setLoading={setLoading}
            />
          )}
          keyExtractor={(item: Service) => item.id}
          ListEmptyComponent={<EmptyState title={query ? "Serviço não encontrado" : "Nenhum serviço cadastrado"} />}
        />
      )}
      <Modal visible={servicesModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setServicesModal(false)}>
        <AddService closeModal={setServicesModal} dataEdit={dataEdit} />
      </Modal>
    </Container>
  );
};
