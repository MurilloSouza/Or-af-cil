import React, { useState, ReactNode, useEffect } from 'react';
import { Tab, BudgetItem, CalculatedItem, CalculoInputState, FormulaItem, FormulaVariable, CalculationGroup, ChatMessage, AiCalcItem, AiBudgetItem, AiParsedResponse, PricingItem, SavedBudget, PdfSettings, ImportCandidate } from './types';
import TabButton from './components/TabButton';
import DashboardTab from './components/tabs/DashboardTab';
import BudgetsTab from './components/tabs/BudgetsTab';
import CalculoTab from './components/tabs/CalculoTab';
import SettingsTab from './components/tabs/SettingsTab';
import PricingTab from './components/tabs/PricingTab';
import SubscriptionsTab from './components/tabs/SubscriptionsTab';
import ChatPopup from './components/ChatPopup';
import FormulaImporter from './components/FormulaImporter';
import { runCalculationEngine } from './utils';
import { useLocalization } from './LanguageContext';
import { useSubscription } from './SubscriptionContext';

const DEFAULT_API_KEY = '';

const initialCalculationGroups: CalculationGroup[] = [
  {
    id: 'group-1',
    name: 'Iluminação',
    variables: [
      { id: 'var-1', code: 'LG', description: 'Luminárias Grandes' },
      { id: 'var-2', code: 'LP', description: 'Luminárias Pequenas' },
      { id: 'var-3', code: 'LE', description: 'Luminárias de Emergência' },
      { id: 'var-f1', code: 'PROLONGADOR_CINZA', description: 'Prolongador Cinza', isFormulaResult: true, formulaId: 'formula-1' },
      { id: 'var-f2', code: 'PROLONGADOR_VERMELHO', description: 'Prolongador Vermelho', isFormulaResult: true, formulaId: 'formula-2' },
      { id: 'var-f3', code: 'PLUG', description: 'Plug', isFormulaResult: true, formulaId: 'formula-3' },
      { id: 'var-f4', code: 'CABO', description: 'Cabo', isFormulaResult: true, formulaId: 'formula-4' },
      { id: 'var-f5', code: 'PRENSA_CABO', description: 'Prensa Cabo', isFormulaResult: true, formulaId: 'formula-5' },
    ],
    formulas: [
      { id: 'formula-1', name: 'Prolongador Cinza', value: '[LG]', unit: 'un' },
      { id: 'formula-2', name: 'Prolongador Vermelho', value: '[LE]', unit: 'un' },
      { id: 'formula-3', name: 'Plug', value: '[LG]', unit: 'un' },
      { id: 'formula-4', name: 'Cabo', value: '([LG] * 3.5) + ([LP] * 3.5) + ([LE] * 3.5)', unit: 'metros' },
      { id: 'formula-5', name: 'Prensa Cabo', value: '[LG] + [LP] + [LE]', unit: 'un' },
    ]
  },
  {
    id: 'group-2',
    name: 'Perfilados',
    variables: [
      { id: 'var-p12', code: 'TIPO_PERFIL', description: 'Liso ou Perfurado', isInfo: true },
      { id: 'var-p9', code: 'MEDIDA_PERFILADO', description: 'Medida do Perfilado', isInfo: true },
      { id: 'var-p10', code: 'TAMANHO_FIXADORES', description: 'Tamanho (Fixadores)', isInfo: true },
      { id: 'var-p11', code: 'TAMANHO_SAIDA_J', description: 'Tamanho (Saída J)', isInfo: true },
      { id: 'var-p8', code: 'CHAPA', description: 'Chapa', isInfo: true },
      { id: 'var-p1', code: 'PERFIL_METROS', description: 'Perfil', infoDependencies: ['MEDIDA_PERFILADO', 'TIPO_PERFIL', 'CHAPA'], unit: 'metros' },
      { id: 'var-p2', code: 'EMENDA_T', description: 'Emenda T' },
      { id: 'var-p3', code: 'EMENDA_L', description: 'Emenda L' },
      { id: 'var-p4', code: 'EMENDA_X', description: 'Emenda X' },
      { id: 'var-p5', code: 'CURVA_VERTICAL_EXTERNA', description: 'Curva Vertical Externa' },
      { id: 'var-p6', code: 'ADAPTADOR_ELETROCALHA', description: 'Adaptador de eletrocalha p/ Perfil' },
      { id: 'var-p7', code: 'SAIDA_J', description: 'Saída J de perfilado p/ Eletroduto' },
      { id: 'var-pf1', code: 'EMENDA_I', description: 'Emenda I', isFormulaResult: true, formulaId: 'formula-p1' },
      { id: 'var-pf2', code: 'GANCHO_CURTO_VERGALHAO', description: 'Gancho Curto vergalhão', isFormulaResult: true, formulaId: 'formula-p2' },
      { id: 'var-pf6', code: 'CHUMBADOR', description: 'Chumbador', isFormulaResult: true, formulaId: 'formula-p6' },
      { id: 'var-pf3', code: 'PARAFUSO_C_TRAVA', description: 'Parafuso c/ Trava', isFormulaResult: true, formulaId: 'formula-p3' },
      { id: 'var-pf4', code: 'PORCA', description: 'Porca', isFormulaResult: true, formulaId: 'formula-p4' },
      { id: 'var-pf5', code: 'ARRUELA', description: 'Arruela', isFormulaResult: true, formulaId: 'formula-p5' },
      { id: 'var-pf7', code: 'VERGALHAO', description: 'Vergalhão', isFormulaResult: true, formulaId: 'formula-p7' },
      { id: 'var-pf8', code: 'BOX_RETO', description: 'Box reto', isFormulaResult: true, formulaId: 'formula-p8'},
      { id: 'var-pf9', code: 'CONDUITE_REFORCADO', description: 'Conduite Reforçado', isFormulaResult: true, formulaId: 'formula-p9'},
      { id: 'var-pf10', code: 'ABRACADEIRA_TIPO_D', description: 'Abraçadeira tipo D', isFormulaResult: true, formulaId: 'formula-p10'}
    ],
    formulas: [
      { id: 'formula-p1', name: 'Emenda I', value: 'Math.ceil([PERFIL_METROS] / 3) * 2', unit: 'un' },
      { id: 'formula-p2', name: 'Gancho Curto vergalhão', value: 'Math.ceil([PERFIL_METROS] / 1.5)', unit: 'un' },
      { id: 'formula-p6', name: 'Chumbador', value: 'Math.ceil([PERFIL_METROS] / 1.5)', unit: 'un' },
      { id: 'formula-p3', name: 'Parafuso c/ Trava', value: '([EMENDA_I] * 4) + ([EMENDA_T] * 12) + ([EMENDA_L] * 4) + ([EMENDA_X] * 8) + ([ADAPTADOR_ELETROCALHA] * 2) + ([CURVA_VERTICAL_EXTERNA] * 4) + ([SAIDA_J] * 1) + ([GANCHO_CURTO_VERGALHAO] * 1)', unit: 'un' },
      { id: 'formula-p4', name: 'Porca', value: '([EMENDA_I] * 4) + ([EMENDA_T] * 12) + ([EMENDA_L] * 4) + ([EMENDA_X] * 8) + ([ADAPTADOR_ELETROCALHA] * 2) + ([CURVA_VERTICAL_EXTERNA] * 4) + ([SAIDA_J] * 1) + ([GANCHO_CURTO_VERGALHAO] * 1) + ([CHUMBADOR] * 3)', unit: 'un' },
      { id: 'formula-p5', name: 'Arruela', value: '([EMENDA_I] * 4) + ([EMENDA_T] * 12) + ([EMENDA_L] * 4) + ([EMENDA_X] * 8) + ([ADAPTADOR_ELETROCALHA] * 2) + ([CURVA_VERTICAL_EXTERNA] * 4) + ([SAIDA_J] * 1) + ([GANCHO_CURTO_VERGALHAO] * 1) + ([CHUMBADOR] * 3)', unit: 'un' },
      { id: 'formula-p7', name: 'Vergalhão', value: 'Math.ceil((([GANCHO_CURTO_VERGALHAO]) * 0.75) / 3)', unit: 'metros' },
      { id: 'formula-p8', name: 'Box reto', value: '[SAIDA_J]', unit: 'un' },
      { id: 'formula-p9', name: 'Conduite Reforçado', value: '[BOX_RETO] * 4', unit: 'metros' },
      { id: 'formula-p10', name: 'Abraçadeira tipo D', value: '[BOX_RETO]', unit: 'un' }
    ]
  },
  {
    id: 'group-3',
    name: 'Rede Estruturada',
    variables: [
      // Informações Gerais
      { id: 'var-l1', code: 'CATEGORIA', description: 'Categoria', isInfo: true },
      { id: 'var-l2', code: 'MARCA', description: 'Marca', isInfo: true },
      // Informações Rack
      { id: 'var-l3', code: 'RACK_TIPO', description: 'Aberto ou fechado?', isInfo: true },
      { id: 'var-l4', code: 'RACK_ALTURA', description: 'Altura (em Us)?', isInfo: true },
      { id: 'var-l5', code: 'RACK_ORG_LATERAIS', description: 'Organizadores Laterais?', isInfo: true },
      { id: 'var-l6', code: 'RACK_COR', description: 'Cor', isInfo: true },
      { id: 'var-l7', code: 'RACK_MARCA', description: 'Marca', isInfo: true },
      // Parâmetros (assumed per rack)
      { id: 'var-l-rack-qty', code: 'QUANTIDADE_RACKS', description: 'Quantidade de Racks' },
      { id: 'var-l8', code: 'CABO_UTP', description: 'Cabo UTP' },
      { id: 'var-l9', code: 'CONECTOR_CM8V', description: 'Conector CM8V' },
      { id: 'var-l10', code: 'PATCH_PANEL', description: 'Patch Panel' },
      { id: 'var-l11', code: 'PATCH_CORD_1_5MM', description: 'Patch Cord 1,5mm' },
      { id: 'var-l12', code: 'PATCH_CORD_2_5MM', description: 'Patch Cord 2,5mm' },
      { id: 'var-l13', code: 'REGUA_TOMADAS', description: 'Régua de Tomadas' },
      { id: 'var-l14', code: 'BANDEJA_FIXA', description: 'Bandeja Fixa' },
      { id: 'var-l15', code: 'VELCRO_3M', description: 'Velcro 3 Metros' },
      { id: 'var-l16', code: 'PLUG_RJ45', description: 'PLug RJ-45' },
      { id: 'var-l17', code: 'CABO_OTICO_OM3_4V', description: 'Cabo ótico OM3 4 vias' },
      { id: 'var-l18', code: 'PIG_TAIL_OM3_LC', description: 'Pig Tail ótico oM3 LC' },
      { id: 'var-l19', code: 'PROTETOR_EMENDA_OTICA', description: 'Protetor de emenda ótica' },
      { id: 'var-l20', code: 'ACOPLADOR_LC_DUPLEX', description: 'Acoplador LC duplex' },
      { id: 'var-l21', code: 'CORDAO_OTICO_LC_DUPLEX_1_5M', description: 'Cordão ótico LC Duplex 1,5m' },
      { id: 'var-l22', code: 'DIO_MINI_12FO', description: 'Dio mini 12 FO' },
      // Fórmulas Variables
      { id: 'var-lf1', code: 'GUIA_DE_CABO', description: 'Guia de cabo', isFormulaResult: true, formulaId: 'formula-l1' },
      { id: 'var-lf2', code: 'PAINEL_FECHAMENTO', description: 'Painel de Fechamento', isFormulaResult: true, formulaId: 'formula-l2' },
      { id: 'var-lf3', code: 'PORCA_GAIOLA', description: 'Porca Gaiola', isFormulaResult: true, formulaId: 'formula-l3' },
      { id: 'var-lf4', code: 'ETIQUETAS', description: 'Etiquetas', isFormulaResult: true, formulaId: 'formula-l4' },
    ],
    formulas: [
      { id: 'formula-l1', name: 'Guia de cabo', value: '[PATCH_PANEL] * 2', unit: 'un' },
      { id: 'formula-l2', name: 'Painel de Fechamento', value: '[GUIA_DE_CABO] * 2', unit: 'un' },
      { id: 'formula-l3', name: 'Porca Gaiola', value: '((([PATCH_PANEL] * 4) + (([PATCH_PANEL] * 2) * 4) + ([REGUA_TOMADAS] * 4)) * 2)', unit: 'un' },
      { id: 'formula-l4', name: 'Etiquetas', value: '[CONECTOR_CM8V]', unit: 'un' },
    ]
  },
  {
    id: 'group-4',
    name: 'CFTV',
    variables: [
      // Informações Gerais
      { id: 'var-cftv1', code: 'CATEGORIA', description: 'Categoria', isInfo: true },
      { id: 'var-cftv2', code: 'MARCA', description: 'Marca', isInfo: true },
      // Informações Rack
      { id: 'var-cftv3', code: 'RACK_TIPO', description: 'Aberto ou fechado?', isInfo: true },
      { id: 'var-cftv4', code: 'RACK_ALTURA', description: 'Altura (em Us)?', isInfo: true },
      { id: 'var-cftv5', code: 'RACK_ORG_LATERAIS', description: 'Organizadores Laterais?', isInfo: true },
      { id: 'var-cftv6', code: 'RACK_COR', description: 'Cor', isInfo: true },
      { id: 'var-cftv7', code: 'RACK_MARCA', description: 'Marca', isInfo: true },
      { id: 'var-cftv17-s1', code: 'CAMERA_HDCVI_SPEC1', description: 'Especificação 1 (Câmera HDCVI)', isInfo: true },
      { id: 'var-cftv17-s2', code: 'CAMERA_HDCVI_SPEC2', description: 'Especificação 2 (Câmera HDCVI)', isInfo: true },
      { id: 'var-cftv18-s1', code: 'GRAVADOR_HD_SPEC1', description: 'Especificação 1 (Gravador HD)', isInfo: true },
      { id: 'var-cftv18-s2', code: 'GRAVADOR_HD_SPEC2', description: 'Especificação 2 (Gravador HD)', isInfo: true },
      { id: 'var-cftv19-s1', code: 'POWER_BALUN_SPEC1', description: 'Especificação 1 (Power Balun)', isInfo: true },
      { id: 'var-cftv19-s2', code: 'POWER_BALUN_SPEC2', description: 'Especificação 2 (Power Balun)', isInfo: true },
      { id: 'var-cftv20-s1', code: 'CAMERA_IP_SPEC1', description: 'Especificação 1 (Câmera IP)', isInfo: true },
      { id: 'var-cftv20-s2', code: 'CAMERA_IP_SPEC2', description: 'Especificação 2 (Câmera IP)', isInfo: true },
      { id: 'var-cftv21-s1', code: 'GRAVADOR_NVR_SPEC1', description: 'Especificação 1 (Gravador NVR)', isInfo: true },
      { id: 'var-cftv21-s2', code: 'GRAVADOR_NVR_SPEC2', description: 'Especificação 2 (Gravador NVR)', isInfo: true },
      // Parâmetros
      { id: 'var-cftv-rack-qty', code: 'QUANTIDADE_RACKS', description: 'Quantidade de Racks' },
      { id: 'var-cftv8', code: 'CABO_UTP', description: 'Cabo UTP' },
      { id: 'var-cftv9', code: 'CONECTOR_CM8V', description: 'Conector CM8V' },
      { id: 'var-cftv10', code: 'PATCH_PANEL', description: 'Patch Panel' },
      { id: 'var-cftv11', code: 'PATCH_CORD_1_5MM', description: 'Patch Cord 1,5mm' },
      { id: 'var-cftv12', code: 'PATCH_CORD_2_5MM', description: 'Patch Cord 2,5mm' },
      { id: 'var-cftv13', code: 'REGUA_TOMADAS', description: 'Régua de Tomadas' },
      { id: 'var-cftv14', code: 'BANDEJA_FIXA', description: 'Bandeja Fixa' },
      { id: 'var-cftv15', code: 'VELCRO_3M', description: 'Velcro 3 Metros' },
      { id: 'var-cftv16', code: 'PLUG_RJ45', description: 'PLug RJ-45' },
      { id: 'var-cftv17', code: 'CAMERA_HDCVI', description: 'Câmera HDCVI 2MPX 2,8mm (Dome ou bullet)' },
      { id: 'var-cftv18', code: 'GRAVADOR_HD', description: 'Gravador c/ HD 4 TB' },
      { id: 'var-cftv19', code: 'POWER_BALUN', description: 'Power Balun 16 Canais Full HD' },
      { id: 'var-cftv20', code: 'CAMERA_IP', description: 'Câmera IP' },
      { id: 'var-cftv21', code: 'GRAVADOR_NVR', description: 'Gravador NVR' },
      { id: 'var-cftv22', code: 'SWITCH_POE', description: 'Switch POE' },
      // Fórmulas Variables
      { id: 'var-cftv-f1', code: 'GUIA_DE_CABO', description: 'Guia de cabo', isFormulaResult: true, formulaId: 'formula-cftv1' },
      { id: 'var-cftv-f3', 'code': 'PORCA_GAIOLA', description: 'Porca Gaiola', isFormulaResult: true, formulaId: 'formula-cftv3' },
      { id: 'var-cftv-f4', code: 'ETIQUETAS', description: 'Etiquetas', isFormulaResult: true, formulaId: 'formula-cftv4' },
    ],
    formulas: [
      { id: 'formula-cftv1', name: 'Guia de cabo', value: '[PATCH_PANEL]', unit: 'un' },
      { id: 'formula-cftv3', name: 'Porca Gaiola', value: '([PATCH_PANEL] * 4) + ([GUIA_DE_CABO] * 4) + ([REGUA_TOMADAS] * 4) * 1.1', unit: 'un' },
      { id: 'formula-cftv4', name: 'Etiquetas', value: '[CONECTOR_CM8V]', unit: 'un' },
    ]
  },
  {
    id: 'group-5',
    name: 'Eletrocalha Elétrica',
    variables: [
      // Informações
      { id: 'var-e1', code: 'CHAPA_ELETROCALHA', description: 'Chapa', isInfo: true },
      { id: 'var-e2', code: 'MEDIDA_ELETROCALHA', description: 'Medida Eletrocalha (ex: 100x50)', isInfo: true },
      { id: 'var-e3', code: 'TIPO_ELETROCALHA', description: 'Liso ou Perfurado', isInfo: true },
      { id: 'var-e4', code: 'SAIDAS_LATERAIS_SIZE', description: 'Saídas laterais (tamanho)', isInfo: true },
      { id: 'var-e5', code: 'PARAFUSOS_SIZE', description: 'Parafusos, porcas, arruela (tamanho)', isInfo: true },
      // Parâmetros
      { id: 'var-e6', code: 'ELETROCALHA_METROS', description: 'Eletrocalha (Metros)' },
      { id: 'var-e7', code: 'TE_HORIZONTAL', description: 'Te Horizontal' },
      { id: 'var-e8', code: 'CURVA_HORIZONTAL', description: 'Curva Horizontal' },
      { id: 'var-e9', code: 'CURVA_VERTICAL_EXTERNA', description: 'Curva Vertical Externa' },
      { id: 'var-e10', code: 'CURVA_VERTICAL_INTERNA', description: 'Curva Vertical Interna' },
      { id: 'var-e11', code: 'REDUCAO', description: 'Redução' },
      { id: 'var-e12', code: 'FLANGE_PAINEL', description: 'Flange para Painel' },
      { id: 'var-e13', code: 'SAIDA_LATERAL_3_4', description: 'Saída Lateral de Eletroc/ Eletroduto 3/4"' },
      { id: 'var-e14', code: 'SAIDA_LATERAL_1', description: 'Saída Lateral de Eletroc/ Eletroduto 1"' },
      { id: 'var-e15', code: 'SEPTO_DIVISOR', description: 'Septo Divisor' },
      { id: 'var-e16', code: 'TAMPA_ELETROCALHA', description: 'Tampa de Eletrocalha' },
      { id: 'var-e17', code: 'CRUZETA', description: 'Cruzeta' },
      { id: 'var-e18', code: 'SAIDA_LATERAL_PRENSA_CABO', description: 'Saída Lateral para prensa cabo' },
      // Fórmulas
      { id: 'var-ef1', code: 'SUPORTE_SUSPENSAO', description: 'Suporte de Suspensão', isFormulaResult: true, formulaId: 'formula-e1' },
      { id: 'var-ef2', code: 'PARAFUSO_TRAVA', description: 'Parafuso c/ Trava', isFormulaResult: true, formulaId: 'formula-e2' },
      { id: 'var-ef3', code: 'PORCA', description: 'Porca', isFormulaResult: true, formulaId: 'formula-e3' },
      { id: 'var-ef4', code: 'ARRUELA', description: 'Arruela', isFormulaResult: true, formulaId: 'formula-e4' },
      { id: 'var-ef5', code: 'CHUMBADOR', description: 'Chumbador', isFormulaResult: true, formulaId: 'formula-e5' },
      { id: 'var-ef6', code: 'VERGALHAO', description: 'Vergalhão', isFormulaResult: true, formulaId: 'formula-e6' },
    ],
    formulas: [
      { id: 'formula-e1', name: 'Suporte de Suspensão', value: 'Math.ceil([ELETROCALHA_METROS] / 2)', unit: 'un' },
      { id: 'formula-e2', name: 'Parafuso c/ Trava', value: '(Math.ceil([ELETROCALHA_METROS]/3)*2*4) + ([TE_HORIZONTAL] * 12) + ([FLANGE_PAINEL] * 4) + ([CURVA_HORIZONTAL] * 8) + ([CURVA_VERTICAL_EXTERNA] * 8) + ([CURVA_VERTICAL_INTERNA] * 8) + ([REDUCAO] * 8)', unit: 'un' },
      { id: 'formula-e3', name: 'Porca', value: '[PARAFUSO_TRAVA] + ([SUPORTE_SUSPENSAO] * 3) + ([FLANGE_PAINEL] * 4) + ([CURVA_VERTICAL_INTERNA] * 8) + ([CURVA_VERTICAL_EXTERNA] * 8) + ([CURVA_HORIZONTAL] * 8) + ([TE_HORIZONTAL] * 12) + ([SAIDA_LATERAL_3_4] * 2) + ([SAIDA_LATERAL_1] * 2)', unit: 'un' },
      { id: 'formula-e4', name: 'Arruela', value: '[PARAFUSO_TRAVA] + ([SUPORTE_SUSPENSAO] * 3) + ([FLANGE_PAINEL] * 4) + ([CURVA_VERTICAL_INTERNA] * 8) + ([CURVA_VERTICAL_EXTERNA] * 8) + ([CURVA_HORIZONTAL] * 8) + ([TE_HORIZONTAL] * 12) + ([SAIDA_LATERAL_3_4] * 2) + ([SAIDA_LATERAL_1] * 2)', unit: 'un' },
      { id: 'formula-e5', name: 'Chumbador', value: 'Math.ceil([ELETROCALHA_METROS] / 2)', unit: 'un' },
      { id: 'formula-e6', name: 'Vergalhão', value: 'Math.ceil(([SUPORTE_SUSPENSAO] * 0.75) / 3)', unit: 'metros' },
    ]
  },
  {
    id: 'group-6',
    name: 'Eletrocalha de Rede',
    variables: [
      // Informações
      { id: 'var-el1', code: 'CHAPA_ELETROCALHA_REDE', description: 'Chapa', isInfo: true },
      { id: 'var-el2', code: 'MEDIDA_ELETROCALHA_REDE', description: 'Medida Eletrocalha (ex: 100x50)', isInfo: true },
      { id: 'var-el3', code: 'TIPO_ELETROCALHA_REDE', description: 'Liso ou Perfurado', isInfo: true },
      { id: 'var-el4', code: 'SAIDAS_LATERAIS_SIZE_REDE', description: 'Saídas laterais (tamanho)', isInfo: true },
      { id: 'var-el5', code: 'PARAFUSOS_SIZE_REDE', description: 'Parafusos, porcas, arruela (tamanho)', isInfo: true },
      // Parâmetros
      { id: 'var-el6', code: 'ELETROCALHA_METROS_REDE', description: 'Eletrocalha (Metros)' },
      { id: 'var-el7', code: 'TE_HORIZONTAL_REDE', description: 'Te Horizontal' },
      { id: 'var-el8', code: 'CURVA_HORIZONTAL_REDE', description: 'Curva Horizontal' },
      { id: 'var-el9', code: 'CURVA_VERTICAL_EXTERNA_REDE', description: 'Curva Vertical Externa' },
      { id: 'var-el10', code: 'CURVA_VERTICAL_INTERNA_REDE', description: 'Curva Vertical Interna' },
      { id: 'var-el11', code: 'REDUCAO_REDE', description: 'Redução' },
      { id: 'var-el12', code: 'FLANGE_PAINEL_REDE', description: 'Flange para Painel' },
      { id: 'var-el13', code: 'SAIDA_LATERAL_A_REDE', description: 'Saída Lateral de Eletroc/ Eletroduto' },
      { id: 'var-el14', code: 'SAIDA_LATERAL_B_REDE', description: 'Saída Lateral de Eletroc/ Eletroduto' },
      { id: 'var-el15', code: 'TAMPA_ELETROCALHA_REDE', description: 'Tampa de Eletrocalha' },
      // Fórmulas
      { id: 'var-elf1', code: 'SUPORTE_SUSPENSAO_REDE', description: 'Suporte de Suspensão', isFormulaResult: true, formulaId: 'formula-el1' },
      { id: 'var-elf2', code: 'PARAFUSO_TRAVA_REDE', description: 'Parafuso c/ Trava', isFormulaResult: true, formulaId: 'formula-el2' },
      { id: 'var-elf3', code: 'PORCA_REDE', description: 'Porca', isFormulaResult: true, formulaId: 'formula-el3' },
      { id: 'var-elf4', code: 'ARRUELA_REDE', description: 'Arruela', isFormulaResult: true, formulaId: 'formula-el4' },
      { id: 'var-elf5', code: 'CHUMBADOR_REDE', description: 'Chumbador', isFormulaResult: true, formulaId: 'formula-el5' },
      { id: 'var-elf6', code: 'VERGALHAO_REDE', description: 'Vergalhão', isFormulaResult: true, formulaId: 'formula-el6' },
    ],
    formulas: [
      { id: 'formula-el1', name: 'Suporte de Suspensão', value: 'Math.ceil([ELETROCALHA_METROS_REDE] / 2)', unit: 'un' },
      { id: 'formula-el2', name: 'Parafuso c/ Trava', value: '(Math.ceil([ELETROCALHA_METROS_REDE]/3)*2*4) + ([TE_HORIZONTAL_REDE] * 12) + ([FLANGE_PAINEL_REDE] * 4) + ([CURVA_HORIZONTAL_REDE] * 8) + ([CURVA_VERTICAL_EXTERNA_REDE] * 8) + ([CURVA_VERTICAL_INTERNA_REDE] * 8) + ([REDUCAO_REDE] * 8)', unit: 'un' },
      { id: 'formula-el3', name: 'Porca', value: '[PARAFUSO_TRAVA_REDE] + ([SUPORTE_SUSPENSAO_REDE] * 3) + ([FLANGE_PAINEL_REDE] * 4) + ([CURVA_VERTICAL_INTERNA_REDE] * 8) + ([CURVA_VERTICAL_EXTERNA_REDE] * 8) + ([CURVA_HORIZONTAL_REDE] * 8) + ([TE_HORIZONTAL_REDE] * 12) + ([SAIDA_LATERAL_A_REDE] * 2) + ([SAIDA_LATERAL_B_REDE] * 2)', unit: 'un' },
      { id: 'formula-el4', name: 'Arruela', value: '[PARAFUSO_TRAVA_REDE] + ([SUPORTE_SUSPENSAO_REDE] * 3) + ([FLANGE_PAINEL_REDE] * 4) + ([CURVA_VERTICAL_INTERNA_REDE] * 8) + ([CURVA_VERTICAL_EXTERNA_REDE] * 8) + ([CURVA_HORIZONTAL_REDE] * 8) + ([TE_HORIZONTAL_REDE] * 12) + ([SAIDA_LATERAL_A_REDE] * 2) + ([SAIDA_LATERAL_B_REDE] * 2)', unit: 'un' },
      { id: 'formula-el5', name: 'Chumbador', value: 'Math.ceil([ELETROCALHA_METROS_REDE] / 2)', unit: 'un' },
      { id: 'formula-el6', name: 'Vergalhão', value: 'Math.ceil(([SUPORTE_SUSPENSAO_REDE] * 0.75) / 3)', unit: 'metros' },
    ]
  },
  {
    id: 'group-7',
    name: 'Eletroduto',
    variables: [
      // Informações
      { id: 'var-ed1', code: 'ELETRODUTOS_SIZE', description: 'Eletrodutos (polegadas)', isInfo: true },
      { id: 'var-ed2', code: 'CONDULETE_SIZE', description: 'Condulete Múltiplo (polegadas)', isInfo: true },
      { id: 'var-ed3', code: 'FIXADORES_SIZE', description: 'Chumbadores e Parafusos (polegadas)', isInfo: true },
      // Parâmetros
      { id: 'var-ed4', code: 'ELETRODUTO', description: 'Eletroduto' },
      { id: 'var-ed5', code: 'CURVA', description: 'Curva' },
      { id: 'var-ed6', code: 'CONDULETE_MULTIPLO', description: 'Condulete Múltiplo' },
      { id: 'var-ed7', code: 'TAMPA_1RJ45', description: 'Tampa para 1 RJ-45' },
      { id: 'var-ed8', code: 'TAMPA_2RJ45', description: 'Tampa para 2 RJ-45' },
      { id: 'var-ed9', code: 'TAMPA_2P_TOMADA_SIMPLES', description: 'Tampa p/ Condulete 2 Postos (Tomada Simples)' },
      { id: 'var-ed10', code: 'TAMPA_3P_H_2TOMADAS', description: 'Tampa p/ Condulete 3 Postos Horizontais (2 Tomadas)' },
      { id: 'var-ed11', code: 'TAMPA_1P_V_1INTERRUPTOR', description: 'Tampa p/ Condulete 1 Posto Vertical (1 Interruptor)' },
      { id: 'var-ed12', code: 'TAMPA_2P_H_2INTERRUPTOR', description: 'Tampa p/ Condulete 2 Postos Horizontais (2 Interruptores)' },
      { id: 'var-ed13', code: 'TAMPA_3P_H_3INTERRUPTOR', description: 'Tampa p/ Condulete 3 Postos Horizontais (3 Interruptores)' },
      { id: 'var-ed14', code: 'TOMADA_1P_10A', description: 'Tomada 1 Posto 10A para Condulete' },
      { id: 'var-ed15', code: 'TOMADA_1P_20A', description: 'Tomada 1 Posto 20A para Condulete' },
      // Fórmulas
      { id: 'var-edf1', code: 'LUVAS', description: 'Luvas', isFormulaResult: true, formulaId: 'formula-ed1' },
      { id: 'var-edf2', code: 'ABRACADEIRA', description: 'Abraçadeira', isFormulaResult: true, formulaId: 'formula-ed2' },
      { id: 'var-edf3', code: 'TAMPAO', description: 'Tampão', isFormulaResult: true, formulaId: 'formula-ed3' },
      { id: 'var-edf4', code: 'CONECTOR_P_CONDULETE', description: 'Conector p/ Condulete', isFormulaResult: true, formulaId: 'formula-ed4' },
      { id: 'var-edf5', code: 'TAMPA_CEGA_P_CONDULETE', description: 'Tampa Cega p/ Condulete', isFormulaResult: true, formulaId: 'formula-ed5' },
      { id: 'var-edf6', code: 'CHUMBADOR', description: 'Chumbador', isFormulaResult: true, formulaId: 'formula-ed6' },
      { id: 'var-edf7', code: 'VERGALHAO', description: 'Vergalhão', isFormulaResult: true, formulaId: 'formula-ed7' },
      { id: 'var-edf8', code: 'PORCA_SEXTAVADA', description: 'Porca Sextavada', isFormulaResult: true, formulaId: 'formula-ed8' },
      { id: 'var-edf9', code: 'ARRUELA_LISA', description: 'Arruela Lisa', isFormulaResult: true, formulaId: 'formula-ed9' },
      { id: 'var-edf10', code: 'CONDUITE_REFORCADO', description: 'Conduite Reforçado', isFormulaResult: true, formulaId: 'formula-ed10' },
    ],
    formulas: [
      { id: 'formula-ed1', name: 'Luvas', value: 'Math.ceil([ELETRODUTO] / 3) + ([CURVA] * 2)', unit: 'un' },
      { id: 'formula-ed2', name: 'Abraçadeira', value: 'Math.ceil(([ELETRODUTO] * 3) / 2)', unit: 'un' },
      { id: 'formula-ed3', name: 'Tampão', value: '[ELETRODUTO] * 3', unit: 'un' },
      { id: 'formula-ed4', name: 'Conector p/ Condulete', value: '[CONDULETE_MULTIPLO] * 2', unit: 'un' },
      { id: 'formula-ed5', name: 'Tampa Cega p/ Condulete', value: '[CONDULETE_MULTIPLO] - [TAMPA_1RJ45] - [TAMPA_2RJ45] - [TAMPA_2P_TOMADA_SIMPLES] - [TAMPA_3P_H_2TOMADAS] - [TAMPA_1P_V_1INTERRUPTOR] - [TAMPA_2P_H_2INTERRUPTOR] - [TAMPA_3P_H_3INTERRUPTOR] - [TOMADA_1P_10A] - [TOMADA_1P_20A]', unit: 'un' },
      { id: 'formula-ed6', name: 'Chumbador', value: 'Math.ceil(([ELETRODUTO] * 3) / 2)', unit: 'un' },
      { id: 'formula-ed7', name: 'Vergalhão', value: 'Math.ceil(([CHUMBADOR] * 1.5) / 3)', unit: 'metros' },
      { id: 'formula-ed8', name: 'Porca Sextavada', value: '[CHUMBADOR] * 3', unit: 'un' },
      { id: 'formula-ed9', name: 'Arruela Lisa', value: '[CHUMBADOR] * 3', unit: 'un' },
      { id: 'formula-ed10', name: 'Conduite Reforçado', value: '[ABRACADEIRA]', unit: 'metros' },
    ]
  },
  {
    id: 'group-8',
    name: 'Audio e Video',
    variables: [
      { id: 'var-av1', code: 'CABO_PT_VM_2X1_5MM', description: 'Cabo PT/VM - 2x1,5mm' },
      { id: 'var-av2', code: 'RECEIVER', description: 'Receiver' },
      { id: 'var-av3', code: 'ARANDELA_6', description: 'Arandela 6\'' },
      { id: 'var-av4', code: 'CAIXA_DE_SOM', description: 'Caixa de Som' },
      { id: 'var-av5', code: 'CABO_HDMI_10M', description: 'Cabo HDMI 10 Metros' },
      { id: 'var-av6', code: 'HDMI_KEYSTONE', description: 'HDMI Keystone' },
      { id: 'var-av7', code: 'CABO_HDMI_1_5M', description: 'Cabo HDMI 1,5 Metros' },
    ],
    formulas: []
  }
];

const createInitialInputs = (variables: FormulaVariable[]): CalculoInputState => {
  return variables
    .filter(v => !v.isFormulaResult)
    .reduce((acc, v) => {
      acc[v.code] = '';
      return acc;
    }, {} as CalculoInputState);
};

const App: React.FC = () => {
  const { t, language } = useLocalization();
  const { plan, planDetails } = useSubscription();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Budget);
  
  // States for the active, working budget
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetTitle, setBudgetTitle] = useState<string>(t('budget.newBudget'));
  const [markupPercentage, setMarkupPercentage] = useState<number>(40);
  const [roundUpQuantity, setRoundUpQuantity] = useState<boolean>(false);
  
  // States for managing all saved budgets
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);

  // Global states (not saved per-budget)
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const [calculationGroups, setCalculationGroups] = useState<CalculationGroup[]>(initialCalculationGroups);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(initialCalculationGroups[0]?.id || null);
  const [calculoInputs, setCalculoInputs] = useState<CalculoInputState>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    primaryColor: '#8B5CF6',
    title: t('pdf.defaultTitle'),
    showSummaryPage: true,
    showDetailsPage: true,
    customHeaderText: t('pdf.defaultHeader'),
    customFooterText: t('pdf.defaultFooter'),
    font: 'helvetica',
  });
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [apiKey, setApiKey] = useState<string>(DEFAULT_API_KEY);
  
  const isUsingDefaultApiKey = apiKey === DEFAULT_API_KEY;

  // Formula Import/Export State
  const [isFormulaImporterOpen, setIsFormulaImporterOpen] = useState(false);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);

  useEffect(() => {
    // Update initial chat message and other UI elements when language changes
    setChatMessages([{ id: '1', text: t('chat.welcome'), sender: 'assistant' }]);
    setBudgetTitle(prev => prev === 'Novo Orçamento' || prev === 'New Budget' ? t('budget.newBudget') : prev);
  }, [language, t]);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Handle Stripe Redirects
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      showToast(t('toasts.paymentSuccess'), 'success');
      setActiveTab(Tab.Subscriptions);
    }
    if (query.get('cancel')) {
      showToast(t('toasts.paymentCancelled'), 'error');
    }
    // Clean up URL
    if (query.has('success') || query.has('cancel')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t]);


  // --- Budget Management Logic ---

  const createNewBudget = (setActive = true): string => {
      const newId = `budget-${Date.now()}`;
      const newBudget: SavedBudget = {
        id: newId,
        name: t('budget.newBudget'),
        budgetItems: [],
        markupPercentage: 40,
        roundUpQuantity: false,
      };
      setSavedBudgets(prev => [...prev, newBudget]);
      if (setActive) {
        handleLoadBudget(newId);
      }
      return newId;
  }

  const handleLoadBudget = (id: string) => {
      const budgetToLoad = savedBudgets.find(b => b.id === id);
      if (budgetToLoad) {
          setBudgetTitle(budgetToLoad.name);
          setBudgetItems(budgetToLoad.budgetItems);
          setMarkupPercentage(budgetToLoad.markupPercentage);
          setRoundUpQuantity(budgetToLoad.roundUpQuantity);
          setActiveBudgetId(id);
          setActiveTab(Tab.Budget);
          showToast(t('toasts.budgetLoaded', { name: budgetToLoad.name }), 'success');
      }
  };

  const handleNewBudget = () => {
      if (savedBudgets.length >= planDetails.maxBudgets) {
        showToast(t('subscription.limit.budgets', { max: planDetails.maxBudgets }), 'error');
        return;
      }
      const newId = createNewBudget(false);
      // Reset working state
      setBudgetTitle(t('budget.newBudget'));
      setBudgetItems([]);
      setMarkupPercentage(40);
      setRoundUpQuantity(false);
      setActiveBudgetId(newId);
      showToast(t('toasts.newBudget'), 'success');
  };

  const handleSaveOrUpdateBudget = () => {
    let budgetToSave: SavedBudget;
    let isUpdating = false;

    if (activeBudgetId) {
      const existingBudget = savedBudgets.find(b => b.id === activeBudgetId);
      if (existingBudget) {
        budgetToSave = {
          ...existingBudget,
          name: budgetTitle,
          budgetItems,
          markupPercentage,
          roundUpQuantity
        };
        isUpdating = true;
      } else { // Should not happen if logic is correct, but as a fallback
        budgetToSave = { id: `budget-${Date.now()}`, name: budgetTitle, budgetItems, markupPercentage, roundUpQuantity };
        setActiveBudgetId(budgetToSave.id);
      }
    } else {
      budgetToSave = { id: `budget-${Date.now()}`, name: budgetTitle, budgetItems, markupPercentage, roundUpQuantity };
      setActiveBudgetId(budgetToSave.id);
    }
    
    setSavedBudgets(prev => {
        const otherBudgets = prev.filter(b => b.id !== budgetToSave.id);
        return [...otherBudgets, budgetToSave];
    });

    showToast(isUpdating ? t('toasts.budgetUpdated') : t('toasts.budgetSaved'), 'success');
  };
  
  const handleDeleteBudget = (id: string) => {
    if(confirm(t('budget.deleteConfirmation'))) {
        setSavedBudgets(prev => prev.filter(b => b.id !== id));
        if(activeBudgetId === id) {
            handleNewBudget();
        }
        showToast(t('toasts.budgetDeleted'), 'success');
    }
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
        // Load API Key from session storage for security
        const storedApiKey = sessionStorage.getItem('gemini_api_key');
        if (storedApiKey) {
            setApiKey(storedApiKey);
        }

        const storedData = localStorage.getItem('orcamentos_app_data');
        if (storedData) {
            const { savedBudgets, activeBudgetId, pricingData, calculationGroups } = JSON.parse(storedData);
            if (savedBudgets && Array.isArray(savedBudgets) && savedBudgets.length > 0) {
                setSavedBudgets(savedBudgets);
                const budgetToLoad = savedBudgets.find((b: SavedBudget) => b.id === activeBudgetId) || savedBudgets[0];
                if (budgetToLoad) {
                    handleLoadBudget(budgetToLoad.id);
                } else {
                    createNewBudget();
                }
            } else {
                 createNewBudget();
            }
            if (pricingData) setPricingData(pricingData);
            if (calculationGroups) setCalculationGroups(calculationGroups);
        } else {
          createNewBudget(); // Create first budget on first load
        }
    } catch (e) {
        console.error("Failed to parse localStorage data:", e);
        createNewBudget();
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
      try {
        const appData = {
            savedBudgets,
            activeBudgetId,
            pricingData,
            calculationGroups
        };
        localStorage.setItem('orcamentos_app_data', JSON.stringify(appData));
      } catch(e) {
        console.error("Failed to save to localStorage:", e);
      }
  }, [savedBudgets, activeBudgetId, pricingData, calculationGroups]);
  
  // Auto-update the current working budget in the saved list
  useEffect(() => {
    if (!activeBudgetId) return;
    setSavedBudgets(prev => prev.map(b => b.id === activeBudgetId ? { id: activeBudgetId, name: budgetTitle, budgetItems, markupPercentage, roundUpQuantity } : b));
  }, [budgetTitle, budgetItems, markupPercentage, roundUpQuantity, activeBudgetId]);


  // --- Other Logic ---

  const handleApiKeyChange = (key: string) => {
      setApiKey(key);
      if (key) {
          sessionStorage.setItem('gemini_api_key', key);
          showToast(t('toasts.apiKeySaved'), 'success');
      } else {
          sessionStorage.removeItem('gemini_api_key');
          showToast(t('toasts.apiKeyRemoved'), 'success');
      }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const activeGroup = calculationGroups.find(g => g.id === activeGroupId);
    if (activeGroup) {
      setCalculoInputs(createInitialInputs(activeGroup.variables));
    } else {
      setCalculoInputs({});
    }
  }, [activeGroupId, calculationGroups]);

  const addItemsToBudget = (itemsToAdd: CalculatedItem[], sector: string) => {
    if (budgetItems.length + itemsToAdd.length > planDetails.maxItemsPerBudget) {
        showToast(t('subscription.limit.items', { max: planDetails.maxItemsPerBudget }), 'error');
        return;
    }
    setBudgetItems(currentItems => {
      const updatedItems = [...currentItems];
      itemsToAdd.forEach(itemToAdd => {
        const quantityToAdd = Number(itemToAdd.quantidade);
        if (isNaN(quantityToAdd) || quantityToAdd <= 0) return;
        const existingItemIndex = updatedItems.findIndex(item => item.description === itemToAdd.nome && item.sector === sector);
        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += quantityToAdd;
        } else {
          updatedItems.push({
            id: Date.now() + Math.random(),
            description: itemToAdd.nome,
            quantity: quantityToAdd,
            unitPrice: 0,
            sector: sector,
          });
        }
      });
      return updatedItems;
    });
  };
  
  const handleAiAddItemsToBudget = (parsedItems: AiBudgetItem[]) => {
    if (budgetItems.length + parsedItems.length > planDetails.maxItemsPerBudget) {
        showToast(t('subscription.limit.items', { max: planDetails.maxItemsPerBudget }), 'error');
        return;
    }
    setBudgetItems(currentItems => {
        const updatedItems = [...currentItems];
        parsedItems.forEach(itemToAdd => {
            if (itemToAdd.quantity <= 0) return;
            const existingItemIndex = updatedItems.findIndex(
                item => item.description.toLowerCase() === itemToAdd.description.toLowerCase() && item.sector === itemToAdd.sector
            );
            if (existingItemIndex > -1) {
                updatedItems[existingItemIndex].quantity += itemToAdd.quantity;
            } else {
                updatedItems.push({
                    id: Date.now() + Math.random(),
                    description: itemToAdd.description,
                    quantity: itemToAdd.quantity,
                    unitPrice: 0,
                    sector: itemToAdd.sector,
                });
            }
        });
        return updatedItems;
    });
  };

  const handleAiResponse = (response: AiParsedResponse): string => {
    const textParts: string[] = [];

    if (response.calculate && response.calculate.length > 0) {
        let calculatedCount = 0;
        response.calculate.forEach(itemToCalc => {
            const group = calculationGroups.find(g => g.name.toLowerCase() === itemToCalc.groupName.toLowerCase());
            if (group) {
                const calculationInputs: CalculoInputState = {};
                itemToCalc.variables.forEach(v => {
                    calculationInputs[v.code] = v.value;
                });
                
                const results = runCalculationEngine(group, calculationInputs);

                if (results.length > 0) {
                    addItemsToBudget(results, group.name);
                    calculatedCount += results.length;
                }
            }
        });
        if (calculatedCount > 0) {
            textParts.push(t('ai.calculatedItemsAdded', { count: calculatedCount }));
        }
    }

    if (response.budget && response.budget.length > 0) {
        handleAiAddItemsToBudget(response.budget);
        textParts.push(t('ai.budgetItemsAdded', { count: response.budget.length }));
    }

    if (response.answer) {
        textParts.push(response.answer);
    }
    
    let feedback = textParts.join(' ');
    if (!feedback.trim()) {
      feedback = t('ai.noActionTaken');
    }

    return feedback;
  };

  const handleAutoPriceBudget = () => {
    if (!planDetails.features.pricing) {
        showToast(t('subscription.upgradeRequired.message', { plan: plan }), 'error');
        return;
    }
    if (pricingData.length === 0) {
        showToast(t('toasts.emptyPricingData'), "error");
        return;
    }
    let itemsUpdated = 0;
    const updatedBudgetItems = budgetItems.map(budgetItem => {
        let bestMatch: PricingItem | null = null;
        for (const priceItem of pricingData) {
            const budgetDesc = budgetItem.description.toLowerCase().trim();
            const priceDesc = priceItem.description.toLowerCase().trim();
            if (budgetDesc.includes(priceDesc)) {
                if (!bestMatch || priceDesc.length > bestMatch.description.length) {
                    bestMatch = priceItem;
                }
            }
        }
        if (bestMatch) {
            itemsUpdated++;
            return { ...budgetItem, unitPrice: bestMatch.unitPrice };
        }
        return budgetItem;
    });
    setBudgetItems(updatedBudgetItems);
    showToast(t('toasts.autoPriceSuccess', { updated: itemsUpdated, total: budgetItems.length }), 'success');
  };


  const handleUpdateBudgetItem = (id: number, field: keyof Omit<BudgetItem, 'id'>, value: string | number) => {
    setBudgetItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDeleteBudgetItem = (id: number) => {
    setBudgetItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const handleGroupAction = (groupId: string | null, updateFn: (group: CalculationGroup) => CalculationGroup) => {
    if (!groupId) return;
    setCalculationGroups(prev => prev.map(g => g.id === groupId ? updateFn(g) : g));
  };

  const handleAddGroup = (name?: string) => {
    if (!planDetails.features.addGroups) {
        showToast(t('subscription.upgradeRequired.message', { plan: plan }), 'error');
        return;
    }
    if (planDetails.maxGroups !== Infinity && calculationGroups.length >= planDetails.maxGroups) {
        showToast(t('subscription.limit.groups', { max: planDetails.maxGroups, plan: t(`subscription.plan.${plan}`) }), 'error');
        return;
    }
    const newId = `group-${Date.now()}`;
    const newName = name?.trim() ? name.trim() : t('calculator.newGroup');
    const newGroup: CalculationGroup = { id: newId, name: newName, variables: [], formulas: [] };
    setCalculationGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newId);
  };
  
  const handleDeleteGroup = (groupId: string | null) => {
    if (!groupId || calculationGroups.length <= 1) {
        alert(t('calculator.cannotDeleteGroup'));
        return;
    }
    const remainingGroups = calculationGroups.filter(g => g.id !== groupId);
    setCalculationGroups(remainingGroups);
    setActiveGroupId(remainingGroups[0]?.id || null);
  };
  
  const handleUpdateGroupName = (groupId: string | null, name: string) => handleGroupAction(groupId, group => ({ ...group, name }));
  
  const handleAddFormula = (groupId: string | null) => {
    handleGroupAction(groupId, group => {
      const newFormulaId = `f-${Date.now()}`;
      const newFormulaName = t('calculator.newItem');
      const newFormula: FormulaItem = { id: newFormulaId, name: newFormulaName, value: '', unit: 'un' };
      const sanitize = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      let baseCode = sanitize(newFormulaName);
      let newCode = baseCode;
      let counter = 1;
      while(group.variables.some(v => v.code === newCode)) {
        newCode = `${baseCode}_${counter++}`;
      }
      const newVariable: FormulaVariable = { id: `v-${Date.now()}`, code: newCode, description: newFormulaName, isFormulaResult: true, formulaId: newFormulaId };
      return { ...group, formulas: [...group.formulas, newFormula], variables: [...group.variables, newVariable] };
    });
  };
  
  const handleUpdateFormula = (groupId: string | null, id: string, field: keyof Omit<FormulaItem, 'id'>, value: string) => {
    handleGroupAction(groupId, group => {
      let updatedFormulas = group.formulas.map(f => f.id === id ? { ...f, [field]: value } : f);
      let updatedVariables = group.variables;
      if (field === 'name') {
          updatedVariables = updatedVariables.map(v => v.formulaId === id ? { ...v, description: value } : v);
      }
      return { ...group, formulas: updatedFormulas, variables: updatedVariables };
    });
  };
  
  const handleDeleteFormula = (groupId: string | null, id: string) => {
    handleGroupAction(groupId, group => ({
      ...group,
      formulas: group.formulas.filter(f => f.id !== id),
      variables: group.variables.filter(v => v.formulaId !== id)
    }));
  };
  
  const handleAddVariable = (groupId: string | null, isInfo: boolean) => {
    handleGroupAction(groupId, group => {
        let newCode = `VAR${group.variables.length + 1}`;
        let counter = group.variables.length + 2;
        while(group.variables.some(v => v.code === newCode)) {
          newCode = `VAR${counter++}`;
        }
        const newVariable: FormulaVariable = { 
          id: `v-${Date.now()}`, 
          code: newCode, 
          description: isInfo ? t('calculator.newInfo') : t('calculator.newVariable'), 
          isInfo: isInfo 
        };
        setCalculoInputs(prev => ({ ...prev, [newCode]: '' }));
        return { ...group, variables: [...group.variables, newVariable] };
    });
  };

  const handleUpdateVariable = (groupId: string | null, id: string, field: keyof Omit<FormulaVariable, 'id'>, value: string | string[]) => {
    handleGroupAction(groupId, group => ({
      ...group,
      variables: group.variables.map(v => (v.id === id ? { ...v, [field]: value } : v))
    }));
  };

  const handleDeleteVariable = (groupId: string | null, id: string) => {
    handleGroupAction(groupId, group => ({
      ...group,
      variables: group.variables.filter(v => v.id !== id)
    }));
  };

  const handleInitiateFormulaImport = (fileContent: string) => {
    try {
        // FIX: Provide a type for the parsed JSON data to guide TypeScript's inference, preventing downstream 'unknown' type errors.
        const importedGroups = JSON.parse(fileContent) as CalculationGroup[];
        if (!Array.isArray(importedGroups) || !importedGroups.every(g => g && g.id && g.name)) {
            throw new Error(t('import.invalidFile'));
        }

        const existingGroupsMap = new Map(calculationGroups.map(g => [g.name.toLowerCase().trim(), g]));
        const candidates: ImportCandidate[] = [];

        for (const importedGroup of importedGroups) {
            const groupNameKey = importedGroup.name.toLowerCase().trim();
            const existingGroup = existingGroupsMap.get(groupNameKey);

            if (!existingGroup) {
                candidates.push({ group: importedGroup, status: 'new' });
            } else {
                if (JSON.stringify(importedGroup) !== JSON.stringify(existingGroup)) {
                    candidates.push({ group: importedGroup, status: 'updated' });
                }
            }
        }
        
        if (candidates.length === 0) {
            showToast(t('toasts.nothingToImport'), "success");
            return;
        }

        setImportCandidates(candidates);
        setIsFormulaImporterOpen(true);
    } catch (e: any) {
        showToast(t('toasts.importError', { message: e.message }), "error");
        console.error(e);
    }
  };

  const handleConfirmFormulaImport = (selection: Record<string, Record<string, boolean>>) => {
    setCalculationGroups(prevGroups => {
        const newGroups: CalculationGroup[] = JSON.parse(JSON.stringify(prevGroups));
        const importedGroupsById = new Map<string, CalculationGroup>(importCandidates.map(c => [c.group.id, c.group]));

        for (const groupId in selection) {
            const selectedFormulaIds = Object.keys(selection[groupId]).filter(id => selection[groupId][id]);
            if (selectedFormulaIds.length === 0) continue;

            const importedGroup = importedGroupsById.get(groupId);
            if (!importedGroup) continue;

            let targetGroup = newGroups.find(g => g.name.toLowerCase().trim() === importedGroup.name.toLowerCase().trim());
            
            if (!targetGroup) {
                targetGroup = { id: importedGroup.id, name: importedGroup.name, variables: [], formulas: [] };
                newGroups.push(targetGroup);
            }

            const importedFormulasById = new Map<string, FormulaItem>(importedGroup.formulas.map(f => [f.id, f]));
            const importedVariablesByCode = new Map<string, FormulaVariable>(importedGroup.variables.map(v => [v.code, v]));
            const targetVariablesByCode = new Map<string, FormulaVariable>(targetGroup.variables.map(v => [v.code, v]));

            selectedFormulaIds.forEach(formulaId => {
                const importedFormula = importedFormulasById.get(formulaId);
                if (!importedFormula) return;

                // 1. Add/Update formula
                const existingFormulaIndex = targetGroup!.formulas.findIndex(f => f.name === importedFormula.name);
                if (existingFormulaIndex > -1) {
                    targetGroup!.formulas[existingFormulaIndex] = importedFormula;
                } else {
                    targetGroup!.formulas.push(importedFormula);
                }

                // 2. Add/Update its result variable
                const importedResultVar = importedGroup.variables.find(v => v.formulaId === formulaId);
                if (importedResultVar) {
                    const existingResultVarIndex = targetGroup!.variables.findIndex(v => v.description === importedResultVar.description && v.isFormulaResult);
                    if (existingResultVarIndex > -1) {
                        targetGroup!.variables[existingResultVarIndex] = importedResultVar;
                    } else {
                        targetGroup!.variables.push(importedResultVar);
                    }
                }
                
                // 3. Add any missing input variables this formula depends on
                const dependencies = importedFormula.value.match(/\[([^\]]+)\]/g)?.map(match => match.slice(1, -1)) || [];
                dependencies.forEach(depCode => {
                    const importedVar = importedVariablesByCode.get(depCode);
                    const formulaResultVar = importedGroup.variables.find(v => v.code === depCode && v.isFormulaResult);

                    // Check if it's an input var and doesn't exist in the target group yet
                    if (importedVar && !formulaResultVar && !targetVariablesByCode.has(depCode)) {
                        targetGroup!.variables.push(importedVar);
                        targetVariablesByCode.set(depCode, importedVar); // Add to map to avoid duplicates in the same run
                    }
                });
            });
        }
        return newGroups;
    });

    setIsFormulaImporterOpen(false);
    setImportCandidates([]);
    showToast(t('toasts.importSuccess'), 'success');
  };

  const renderContent = (): ReactNode => {
    switch (activeTab) {
      case Tab.Dashboard:
        return <DashboardTab 
            items={budgetItems} 
            markupPercentage={markupPercentage} 
            roundUpQuantity={roundUpQuantity}
        />;
      case Tab.Budget:
        return (
          <BudgetsTab
            items={budgetItems}
            markupPercentage={markupPercentage}
            onUpdateItem={handleUpdateBudgetItem}
            onDeleteItem={handleDeleteBudgetItem}
            onAutoPrice={handleAutoPriceBudget}
            budgetTitle={budgetTitle}
            roundUpQuantity={roundUpQuantity}
            showToast={showToast}
            // Budget Management
            savedBudgets={savedBudgets}
            activeBudgetId={activeBudgetId}
            onLoadBudget={handleLoadBudget}
            onSaveOrUpdate={handleSaveOrUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
            onNewBudget={handleNewBudget}
            // PDF Customization
            pdfSettings={pdfSettings}
            setPdfSettings={setPdfSettings}
          />
        );
      case Tab.Calculo:
        return (
          <CalculoTab
            groups={calculationGroups}
            activeGroupId={activeGroupId}
            setActiveGroupId={setActiveGroupId}
            inputs={calculoInputs}
            setInputs={setCalculoInputs}
            onAddToBudget={addItemsToBudget}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onUpdateGroupName={handleUpdateGroupName}
            onAddFormula={handleAddFormula}
            onUpdateFormula={handleUpdateFormula}
            onDeleteFormula={handleDeleteFormula}
            onAddVariable={handleAddVariable}
            onUpdateVariable={handleUpdateVariable}
            onDeleteVariable={handleDeleteVariable}
            showToast={showToast}
          />
        );
       case Tab.Precificacao:
        return <PricingTab data={pricingData} setData={setPricingData} showToast={showToast} />;
       case Tab.Subscriptions:
        return <SubscriptionsTab />;
      case Tab.Settings:
        return <SettingsTab 
                  markup={markupPercentage} 
                  onMarkupChange={setMarkupPercentage}
                  roundUp={roundUpQuantity}
                  onRoundUpChange={setRoundUpQuantity}
                  apiKey={apiKey}
                  onApiKeyChange={handleApiKeyChange}
                  isUsingDefaultApiKey={isUsingDefaultApiKey}
                  calculationGroups={calculationGroups}
                  onInitiateFormulaImport={handleInitiateFormulaImport}
                  showToast={showToast}
                />;
      default:
        return null;
    }
  };
  
  const availableTabs = [
    { id: Tab.Dashboard, label: t('tabs.dashboard') },
    { id: Tab.Budget, label: t('tabs.budget') },
    { id: Tab.Calculo, label: t('tabs.calculator') },
    planDetails.features.pricing ? { id: Tab.Precificacao, label: t('tabs.pricing') } : null,
    { id: Tab.Subscriptions, label: t('tabs.subscriptions') },
    { id: Tab.Settings, label: t('tabs.settings') }
  ].filter(Boolean) as { id: Tab, label: string }[];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-surface dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
             <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-primary dark:text-primary-light tracking-tight">{t('app.title')}</h1>
                {activeTab === Tab.Budget && (
                    <input
                        type="text"
                        value={budgetTitle}
                        onChange={(e) => setBudgetTitle(e.target.value)}
                        className="text-xl font-bold text-text dark:text-gray-100 bg-transparent border-b-2 border-transparent focus:border-primary dark:focus:border-primary-light focus:outline-none w-full transition-colors ml-4"
                        placeholder={t('budget.titlePlaceholder')}
                    />
                )}
             </div>
             <div className="flex items-center space-x-4">
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-subtle dark:text-gray-400 hover:text-primary-dark dark:hover:text-primary-light p-2 rounded-full transition-colors">
                    {isDarkMode ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a3 3 0 100-6 3 3 0 000 6z" /></svg> : 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    }
                 </button>
             </div>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {availableTabs.map(tab => (
                  <TabButton key={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <ChatPopup 
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        messages={chatMessages}
        setMessages={setChatMessages}
        onAiResponse={handleAiResponse}
        calculationGroups={calculationGroups}
        budgetItems={budgetItems}
        showToast={showToast}
        apiKey={apiKey}
      />
      <FormulaImporter 
        isOpen={isFormulaImporterOpen}
        onClose={() => setIsFormulaImporterOpen(false)}
        candidates={importCandidates}
        onConfirm={handleConfirmFormulaImport}
        existingGroups={calculationGroups}
      />
      {toast && (
        <div className={`fixed bottom-5 right-5 px-4 py-2 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} shadow-lg animate-fade-in z-[100]`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;