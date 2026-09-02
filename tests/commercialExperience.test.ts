import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canCreateResource, formatCommercialPrice, mapCommercialEntitlements, usageState } from "../src/domain/commercialPlans";

const migration=readFileSync("supabase/migrations/20260902100000_commercial_experience_controls.sql","utf8");
const myPlan=readFileSync("src/screens/MyPlan/index.tsx","utf8");
const plans=readFileSync("src/screens/Plans/index.tsx","utf8");
const prompt=readFileSync("src/commercial/CommercialContext.tsx","utf8");
const base:any={plan_code:"free",display_name:"Grátis",subscription_status:"active",offer_code:null,billing_cycle:"monthly",price_cents:0,limits:{users:1,customers:10,equipment:15,qr_codes:5,work_orders_monthly:5,quotes_monthly:3},features:{batch_orders:false,custom_branding:false,full_history:false},history_days:30};

test("Meu Plano distingue ilimitado, próximo, atingido e acima do limite",()=>{assert.equal(usageState(3,5),"normal");assert.equal(usageState(4,5),"near");assert.equal(usageState(5,5),"reached");assert.equal(usageState(87,5),"reached");assert.equal(usageState(3,null),"unlimited");assert.match(myPlan,/Ilimitado/);assert.match(myPlan,/Acima do limite atual/);});
test("pré-validação não inventa limite e preserva downgrade",()=>{const e=mapCommercialEntitlements(base);assert.equal(canCreateResource(e,{...base.limits,timezone:"UTC",customers:9},"customers"),true);assert.equal(canCreateResource(e,{...base.limits,timezone:"UTC",customers:10},"customers"),false);assert.equal(canCreateResource({...e,limits:{...e.limits,customers:null}},{...base.limits,timezone:"UTC"},"customers"),true);});
test("Founder permanece oferta Professional com preço real",()=>{const e=mapCommercialEntitlements({...base,plan_code:"professional",display_name:"Profissional",offer_code:"founder",price_cents:2990});assert.equal(e.planCode,"professional");assert.equal(e.offerCode,"founder");assert.equal(formatCommercialPrice(e.priceCents,e.billingCycle),"R$ 29,90/mês");assert.match(myPlan,/Oferta Founder/);});
test("Planos não simula pagamento",()=>{assert.match(plans,/Tenho interesse/);assert.match(plans,/Nenhuma cobrança foi realizada/);assert.doesNotMatch(plans,/Assinar agora|checkout|cartão/i);});
test("UpgradePrompt é único e contextual",()=>{assert.match(prompt,/showUpgrade/);assert.match(prompt,/Conhecer planos/);assert.match(prompt,/Agora não/);});
test("backend protege batch e histórico sem apagar dados",()=>{assert.match(migration,/assert_can_use_feature\(organization_id,'batch_orders'\)/);assert.match(migration,/can_access_work_order_history/);assert.doesNotMatch(migration,/delete from public\.work_orders/);});
test("branding e Global Admin usam entitlements e subscriptions auditadas",()=>{assert.match(migration,/custom_branding/);assert.match(migration,/platform_admin_update_commercial/);assert.match(migration,/insert into public\.organization_subscriptions/);assert.match(migration,/organization_plan_overrides/);});
