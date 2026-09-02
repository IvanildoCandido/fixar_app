import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState, Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";
import { BackendCommercialPlan, CommercialEntitlements, CommercialFeature, CommercialResource, CommercialUsage } from "../domain/commercialPlans";
import { loadCommercialState } from "../services/commercial";
import { Button } from "../design-system";

type Prompt = { resource?: CommercialResource; feature?: CommercialFeature; usage?: number; limit?: number | null; message?: string };
type State = { entitlements: CommercialEntitlements | null; usage: CommercialUsage | null; plans: Array<BackendCommercialPlan & { price_cents: number; billing_cycle: string }>; loading: boolean; error: string; refresh: () => Promise<void>; showUpgrade: (prompt: Prompt) => void };
const Context = createContext<State>({} as State);
export const useCommercial = () => useContext(Context);

export function CommercialProvider({ children }: React.PropsWithChildren) {
  const { session } = useAuth(); const theme = useTheme(); const navigation = useNavigation<any>();
  const [data, setData] = useState<Omit<State,"refresh"|"showUpgrade">>({ entitlements:null,usage:null,plans:[],loading:true,error:"" });
  const [prompt,setPrompt]=useState<Prompt|null>(null);
  const refresh=useCallback(async()=>{ if(!session)return; setData(d=>({...d,loading:true,error:""})); try{const next=await loadCommercialState(session.organization.id);setData({...next,loading:false,error:""});}catch(e){setData(d=>({...d,loading:false,error:e instanceof Error?e.message:"Não foi possível carregar seu plano."}));}},[session]);
  useEffect(()=>{void refresh();const sub=AppState.addEventListener("change",s=>{if(s==="active")void refresh();});return()=>sub.remove();},[refresh]);
  const value=useMemo(()=>({...data,refresh,showUpgrade:setPrompt}),[data,refresh]);
  return <Context.Provider value={value}>{children}<Modal visible={Boolean(prompt)} transparent animationType="fade" onRequestClose={()=>setPrompt(null)}><View style={{flex:1,backgroundColor:"rgba(0,0,0,.42)",justifyContent:"center",padding:24}}><View style={{backgroundColor:theme.colors.surface,borderRadius:theme.radii.lg,padding:24,gap:12}}><Text style={{fontFamily:theme.fonts.semibold,fontSize:theme.typography.sectionTitle.size,color:theme.colors.foreground}}>Conheça os planos do FIXAR</Text><Text style={{fontFamily:theme.fonts.regular,fontSize:theme.typography.body.size,lineHeight:theme.typography.body.lineHeight,color:theme.colors.muted}}>{prompt?.message ?? (prompt?.limit != null ? `Você utilizou ${prompt.usage ?? prompt.limit} de ${prompt.limit} disponíveis no seu plano.` : "Este recurso está disponível em um plano superior.")}</Text><Button label="Conhecer planos" onPress={()=>{setPrompt(null);navigation.navigate("Plans");}}/><Button label="Agora não" variant="ghost" onPress={()=>setPrompt(null)}/></View></View></Modal></Context.Provider>;
}
