import React, { useState, ReactNode, useEffect } from 'react';
import { Tab, BudgetItem, CalculatedItem, CalculoInputState, FormulaItem, FormulaVariable, CalculationGroup, ChatMessage, AiCalcItem, AiBudgetItem, AiParsedResponse, PricingItem, SavedBudget, PdfSettings, ImportCandidate } from './types';
import TabButton from './components/TabButton';
import DashboardTab from './components/tabs/DashboardTab';
import BudgetsTab from './components/tabs/BudgetsTab';
import CalculoTab from './components/tabs/CalculoTab';
import SettingsTab from './components/tabs/SettingsTab';
import PricingTab from './components/tabs/PricingTab';
import ChatPopup from './components/ChatPopup';
import FormulaImporter from './components/FormulaImporter';
import { runCalculationEngine } from './utils';
import { useLocalization } from './LanguageContext';

const DEFAULT_API_KEY = '';

const initialCalculationGroups: CalculationGroup[] = [
  {
    id: 'group-1',
    name: 'Lighting',
    variables: [
      { id: 'var-1', code: 'LG', description: 'Large Luminaires' },
      { id: 'var-2', code: 'LP', description: 'Small Luminaires' },
      { id: 'var-3', code: 'LE', description: 'Emergency Luminaires' },
      { id: 'var-f1', code: 'GRAY_EXTENDER', description: 'Gray Extender', isFormulaResult: true, formulaId: 'formula-1' },
      { id: 'var-f2', code: 'RED_EXTENDER', description: 'Red Extender', isFormulaResult: true, formulaId: 'formula-2' },
      { id: 'var-f3', code: 'PLUG', description: 'Plug', isFormulaResult: true, formulaId: 'formula-3' },
      { id: 'var-f4', code: 'CABLE', description: 'Cable', isFormulaResult: true, formulaId: 'formula-4' },
      { id: 'var-f5', code: 'CABLE_GLAND', description: 'Cable Gland', isFormulaResult: true, formulaId: 'formula-5' },
    ],
    formulas: [
      { id: 'formula-1', name: 'Gray Extender', value: '[LG]', unit: 'pc' },
      { id: 'formula-2', name: 'Red Extender', value: '[LE]', unit: 'pc' },
      { id: 'formula-3', name: 'Plug', value: '[LG]', unit: 'pc' },
      { id: 'formula-4', name: 'Cable', value: '([LG] * 3.5) + ([LP] * 3.5) + ([LE] * 3.5)', unit: 'meters' },
      { id: 'formula-5', name: 'Cable Gland', value: '[LG] + [LP] + [LE]', unit: 'pc' },
    ]
  },
  {
    id: 'group-2',
    name: 'Channels',
    variables: [
      { id: 'var-p12', code: 'CHANNEL_TYPE', description: 'Smooth or Perforated', isInfo: true },
      { id: 'var-p9', code: 'CHANNEL_SIZE', description: 'Channel Size', isInfo: true },
      { id: 'var-p10', code: 'FASTENERS_SIZE', description: 'Size (Fasteners)', isInfo: true },
      { id: 'var-p11', code: 'J_OUTLET_SIZE', description: 'Size (J-Outlet)', isInfo: true },
      { id: 'var-p8', code: 'GAUGE', description: 'Gauge', isInfo: true },
      { id: 'var-p1', code: 'CHANNEL_METERS', description: 'Channel', infoDependencies: ['CHANNEL_SIZE', 'CHANNEL_TYPE', 'GAUGE'], unit: 'meters' },
      { id: 'var-p2', code: 'T_SPLICE', description: 'T-Splice' },
      { id: 'var-p3', code: 'L_SPLICE', description: 'L-Splice' },
      { id: 'var-p4', code: 'X_SPLICE', description: 'X-Splice' },
      { id: 'var-p5', code: 'EXTERNAL_VERTICAL_BEND', description: 'External Vertical Bend' },
      { id: 'var-p6', code: 'TRAY_TO_CHANNEL_ADAPTER', description: 'Cable Tray to Channel Adapter' },
      { id: 'var-p7', code: 'J_OUTLET', description: 'J-Outlet from Channel to Conduit' },
      { id: 'var-pf1', code: 'I_SPLICE', description: 'I-Splice', isFormulaResult: true, formulaId: 'formula-p1' },
      { id: 'var-pf2', code: 'SHORT_REBAR_HOOK', description: 'Short Rebar Hook', isFormulaResult: true, formulaId: 'formula-p2' },
      { id: 'var-pf6', code: 'ANCHOR_BOLT', description: 'Anchor Bolt', isFormulaResult: true, formulaId: 'formula-p6' },
      { id: 'var-pf3', code: 'LOCK_BOLT', description: 'Bolt with Lock', isFormulaResult: true, formulaId: 'formula-p3' },
      { id: 'var-pf4', code: 'NUT', description: 'Nut', isFormulaResult: true, formulaId: 'formula-p4' },
      { id: 'var-pf5', code: 'WASHER', description: 'Washer', isFormulaResult: true, formulaId: 'formula-p5' },
      { id: 'var-pf7', code: 'REBAR', description: 'Rebar', isFormulaResult: true, formulaId: 'formula-p7' },
      { id: 'var-pf8', code: 'STRAIGHT_BOX_CONNECTOR', description: 'Straight Box Connector', isFormulaResult: true, formulaId: 'formula-p8'},
      { id: 'var-pf9', code: 'REINFORCED_CONDUIT', description: 'Reinforced Conduit', isFormulaResult: true, formulaId: 'formula-p9'},
      { id: 'var-pf10', code: 'D_TYPE_CLAMP', description: 'D-type Clamp', isFormulaResult: true, formulaId: 'formula-p10'}
    ],
    formulas: [
      { id: 'formula-p1', name: 'I-Splice', value: 'Math.ceil([CHANNEL_METERS] / 3) * 2', unit: 'pc' },
      { id: 'formula-p2', name: 'Short Rebar Hook', value: 'Math.ceil([CHANNEL_METERS] / 1.5)', unit: 'pc' },
      { id: 'formula-p6', name: 'Anchor Bolt', value: 'Math.ceil([CHANNEL_METERS] / 1.5)', unit: 'pc' },
      { id: 'formula-p3', name: 'Bolt with Lock', value: '([I_SPLICE] * 4) + ([T_SPLICE] * 12) + ([L_SPLICE] * 4) + ([X_SPLICE] * 8) + ([TRAY_TO_CHANNEL_ADAPTER] * 2) + ([EXTERNAL_VERTICAL_BEND] * 4) + ([J_OUTLET] * 1) + ([SHORT_REBAR_HOOK] * 1)', unit: 'pc' },
      { id: 'formula-p4', name: 'Nut', value: '([I_SPLICE] * 4) + ([T_SPLICE] * 12) + ([L_SPLICE] * 4) + ([X_SPLICE] * 8) + ([TRAY_TO_CHANNEL_ADAPTER] * 2) + ([EXTERNAL_VERTICAL_BEND] * 4) + ([J_OUTLET] * 1) + ([SHORT_REBAR_HOOK] * 1) + ([ANCHOR_BOLT] * 3)', unit: 'pc' },
      { id: 'formula-p5', name: 'Washer', value: '([I_SPLICE] * 4) + ([T_SPLICE] * 12) + ([L_SPLICE] * 4) + ([X_SPLICE] * 8) + ([TRAY_TO_CHANNEL_ADAPTER] * 2) + ([EXTERNAL_VERTICAL_BEND] * 4) + ([J_OUTLET] * 1) + ([SHORT_REBAR_HOOK] * 1) + ([ANCHOR_BOLT] * 3)', unit: 'pc' },
      { id: 'formula-p7', name: 'Rebar', value: 'Math.ceil((([SHORT_REBAR_HOOK]) * 0.75) / 3)', unit: 'meters' },
      { id: 'formula-p8', name: 'Straight Box Connector', value: '[J_OUTLET]', unit: 'pc' },
      { id: 'formula-p9', name: 'Reinforced Conduit', value: '[STRAIGHT_BOX_CONNECTOR] * 4', unit: 'meters' },
      { id: 'formula-p10', name: 'D-type Clamp', value: '[STRAIGHT_BOX_CONNECTOR]', unit: 'pc' }
    ]
  },
  {
    id: 'group-3',
    name: 'Structured Cabling',
    variables: [
      { id: 'var-l1', code: 'CATEGORY', description: 'Category', isInfo: true },
      { id: 'var-l2', code: 'BRAND', description: 'Brand', isInfo: true },
      { id: 'var-l3', code: 'RACK_TYPE', description: 'Open or closed?', isInfo: true },
      { id: 'var-l4', code: 'RACK_HEIGHT', description: 'Height (in U)?', isInfo: true },
      { id: 'var-l5', code: 'RACK_SIDE_ORGANIZERS', description: 'Side Organizers?', isInfo: true },
      { id: 'var-l6', code: 'RACK_COLOR', description: 'Color', isInfo: true },
      { id: 'var-l7', code: 'RACK_BRAND', description: 'Brand', isInfo: true },
      { id: 'var-l-rack-qty', code: 'NUM_RACKS', description: 'Number of Racks' },
      { id: 'var-l8', code: 'UTP_CABLE', description: 'UTP Cable' },
      { id: 'var-l9', code: 'CM8V_CONNECTOR', description: 'CM8V Connector' },
      { id: 'var-l10', code: 'PATCH_PANEL', description: 'Patch Panel' },
      { id: 'var-l11', code: 'PATCH_CORD_1_5M', description: '1.5m Patch Cord' },
      { id: 'var-l12', code: 'PATCH_CORD_2_5M', description: '2.5m Patch Cord' },
      { id: 'var-l13', code: 'POWER_STRIP', description: 'Power Strip' },
      { id: 'var-l14', code: 'FIXED_SHELF', description: 'Fixed Shelf' },
      { id: 'var-l15', code: 'VELCRO_3M', description: '3 Meter Velcro' },
      { id: 'var-l16', code: 'RJ45_PLUG', description: 'RJ-45 Plug' },
      { id: 'var-l17', code: 'OM3_4FIBER_CABLE', description: 'OM3 4-fiber Optical Cable' },
      { id: 'var-l18', code: 'PIGTAIL_OM3_LC', description: 'OM3 LC Optical Pigtail' },
      { id: 'var-l19', code: 'OPTICAL_SPLICE_PROTECTOR', description: 'Optical Splice Protector' },
      { id: 'var-l20', code: 'LC_DUPLEX_COUPLER', description: 'LC Duplex Coupler' },
      { id: 'var-l21', code: 'OPTICAL_CORD_LC_DUPLEX_1_5M', description: '1.5m LC Duplex Optical Cord' },
      { id: 'var-l22', code: 'MINI_DIO_12FO', description: 'Mini 12 FO DIO' },
      { id: 'var-lf1', code: 'CABLE_GUIDE', description: 'Cable Guide', isFormulaResult: true, formulaId: 'formula-l1' },
      { id: 'var-lf2', code: 'BLANKING_PANEL', description: 'Blanking Panel', isFormulaResult: true, formulaId: 'formula-l2' },
      { id: 'var-lf3', code: 'CAGE_NUT', description: 'Cage Nut', isFormulaResult: true, formulaId: 'formula-l3' },
      { id: 'var-lf4', code: 'LABELS', description: 'Labels', isFormulaResult: true, formulaId: 'formula-l4' },
    ],
    formulas: [
      { id: 'formula-l1', name: 'Cable Guide', value: '[PATCH_PANEL] * 2', unit: 'pc' },
      { id: 'formula-l2', name: 'Blanking Panel', value: '[CABLE_GUIDE] * 2', unit: 'pc' },
      { id: 'formula-l3', name: 'Cage Nut', value: '((([PATCH_PANEL] * 4) + (([PATCH_PANEL] * 2) * 4) + ([POWER_STRIP] * 4)) * 2)', unit: 'pc' },
      { id: 'formula-l4', name: 'Labels', value: '[CM8V_CONNECTOR]', unit: 'pc' },
    ]
  },
  {
    id: 'group-4',
    name: 'CCTV',
    variables: [
      { id: 'var-cftv1', code: 'CATEGORY', description: 'Category', isInfo: true },
      { id: 'var-cftv2', code: 'BRAND', description: 'Brand', isInfo: true },
      { id: 'var-cftv3', code: 'RACK_TYPE', description: 'Open or closed?', isInfo: true },
      { id: 'var-cftv4', code: 'RACK_HEIGHT', description: 'Height (in U)?', isInfo: true },
      { id: 'var-cftv5', code: 'RACK_SIDE_ORGANIZERS', description: 'Side Organizers?', isInfo: true },
      { id: 'var-cftv6', code: 'RACK_COLOR', description: 'Color', isInfo: true },
      { id: 'var-cftv7', code: 'RACK_BRAND', description: 'Brand', isInfo: true },
      { id: 'var-cftv17-s1', code: 'HDCVI_CAM_SPEC1', description: 'Specification 1 (HDCVI Camera)', isInfo: true },
      { id: 'var-cftv17-s2', code: 'HDCVI_CAM_SPEC2', description: 'Specification 2 (HDCVI Camera)', isInfo: true },
      { id: 'var-cftv18-s1', code: 'HD_RECORDER_SPEC1', description: 'Specification 1 (HD Recorder)', isInfo: true },
      { id: 'var-cftv18-s2', code: 'HD_RECORDER_SPEC2', description: 'Specification 2 (HD Recorder)', isInfo: true },
      { id: 'var-cftv19-s1', code: 'POWER_BALUN_SPEC1', description: 'Specification 1 (Power Balun)', isInfo: true },
      { id: 'var-cftv19-s2', code: 'POWER_BALUN_SPEC2', description: 'Specification 2 (Power Balun)', isInfo: true },
      { id: 'var-cftv20-s1', code: 'IP_CAM_SPEC1', description: 'Specification 1 (IP Camera)', isInfo: true },
      { id: 'var-cftv20-s2', code: 'IP_CAM_SPEC2', description: 'Specification 2 (IP Camera)', isInfo: true },
      { id: 'var-cftv21-s1', code: 'NVR_RECORDER_SPEC1', description: 'Specification 1 (NVR Recorder)', isInfo: true },
      { id: 'var-cftv21-s2', code: 'NVR_RECORDER_SPEC2', description: 'Specification 2 (NVR Recorder)', isInfo: true },
      { id: 'var-cftv-rack-qty', code: 'NUM_RACKS', description: 'Number of Racks' },
      { id: 'var-cftv8', code: 'UTP_CABLE', description: 'UTP Cable' },
      { id: 'var-cftv9', code: 'CM8V_CONNECTOR', description: 'CM8V Connector' },
      { id: 'var-cftv10', code: 'PATCH_PANEL', description: 'Patch Panel' },
      { id: 'var-cftv11', code: 'PATCH_CORD_1_5M', description: '1.5m Patch Cord' },
      { id: 'var-cftv12', code: 'PATCH_CORD_2_5M', description: '2.5m Patch Cord' },
      { id: 'var-cftv13', code: 'POWER_STRIP', description: 'Power Strip' },
      { id: 'var-cftv14', code: 'FIXED_SHELF', description: 'Fixed Shelf' },
      { id: 'var-cftv15', code: 'VELCRO_3M', description: '3 Meter Velcro' },
      { id: 'var-cftv16', code: 'RJ45_PLUG', description: 'RJ-45 Plug' },
      { id: 'var-cftv17', code: 'HDCVI_CAMERA', description: 'HDCVI Camera 2MP 2.8mm (Dome or bullet)' },
      { id: 'var-cftv18', code: 'HD_RECORDER', description: 'Recorder with 4 TB HDD' },
      { id: 'var-cftv19', code: 'POWER_BALUN', description: '16 Channel Full HD Power Balun' },
      { id: 'var-cftv20', code: 'IP_CAMERA', description: 'IP Camera' },
      { id: 'var-cftv21', code: 'NVR_RECORDER', description: 'NVR Recorder' },
      { id: 'var-cftv22', code: 'POE_SWITCH', description: 'POE Switch' },
      { id: 'var-cftv-f1', code: 'CABLE_GUIDE', description: 'Cable Guide', isFormulaResult: true, formulaId: 'formula-cftv1' },
      { id: 'var-cftv-f3', 'code': 'CAGE_NUT', description: 'Cage Nut', isFormulaResult: true, formulaId: 'formula-cftv3' },
      { id: 'var-cftv-f4', code: 'LABELS', description: 'Labels', isFormulaResult: true, formulaId: 'formula-cftv4' },
    ],
    formulas: [
      { id: 'formula-cftv1', name: 'Cable Guide', value: '[PATCH_PANEL]', unit: 'pc' },
      { id: 'formula-cftv3', name: 'Cage Nut', value: '([PATCH_PANEL] * 4) + ([CABLE_GUIDE] * 4) + ([POWER_STRIP] * 4) * 1.1', unit: 'pc' },
      { id: 'formula-cftv4', name: 'Labels', value: '[CM8V_CONNECTOR]', unit: 'pc' },
    ]
  },
  {
    id: 'group-5',
    name: 'Electrical Cable Tray',
    variables: [
      { id: 'var-e1', code: 'TRAY_GAUGE', description: 'Gauge', isInfo: true },
      { id: 'var-e2', code: 'TRAY_SIZE', description: 'Cable Tray Size (e.g., 100x50)', isInfo: true },
      { id: 'var-e3', code: 'TRAY_TYPE', description: 'Smooth or Perforated', isInfo: true },
      { id: 'var-e4', code: 'SIDE_OUTLET_SIZE', description: 'Side outlets (size)', isInfo: true },
      { id: 'var-e5', code: 'BOLT_SIZE', description: 'Bolts, nuts, washer (size)', isInfo: true },
      { id: 'var-e6', code: 'TRAY_METERS', description: 'Cable Tray (Meters)' },
      { id: 'var-e7', code: 'HORIZONTAL_TEE', description: 'Horizontal Tee' },
      { id: 'var-e8', code: 'HORIZONTAL_BEND', description: 'Horizontal Bend' },
      { id: 'var-e9', code: 'EXTERNAL_VERTICAL_BEND', description: 'External Vertical Bend' },
      { id: 'var-e10', code: 'INTERNAL_VERTICAL_BEND', description: 'Internal Vertical Bend' },
      { id: 'var-e11', code: 'REDUCER', description: 'Reducer' },
      { id: 'var-e12', code: 'PANEL_FLANGE', description: 'Panel Flange' },
      { id: 'var-e13', code: 'SIDE_OUTLET_3_4', description: 'Side Outlet to 3/4" Conduit' },
      { id: 'var-e14', code: 'SIDE_OUTLET_1', description: 'Side Outlet to 1" Conduit' },
      { id: 'var-e15', code: 'DIVIDING_SEPTUM', description: 'Dividing Septum' },
      { id: 'var-e16', code: 'TRAY_COVER', description: 'Cable Tray Cover' },
      { id: 'var-e17', code: 'CROSS', description: 'Cross' },
      { id: 'var-e18', code: 'SIDE_OUTLET_GLAND', description: 'Side Outlet for Cable Gland' },
      { id: 'var-ef1', code: 'SUSPENSION_SUPPORT', description: 'Suspension Support', isFormulaResult: true, formulaId: 'formula-e1' },
      { id: 'var-ef2', code: 'LOCK_BOLT', description: 'Bolt with Lock', isFormulaResult: true, formulaId: 'formula-e2' },
      { id: 'var-ef3', code: 'NUT', description: 'Nut', isFormulaResult: true, formulaId: 'formula-e3' },
      { id: 'var-ef4', code: 'WASHER', description: 'Washer', isFormulaResult: true, formulaId: 'formula-e4' },
      { id: 'var-ef5', code: 'ANCHOR_BOLT', description: 'Anchor Bolt', isFormulaResult: true, formulaId: 'formula-e5' },
      { id: 'var-ef6', code: 'REBAR', description: 'Rebar', isFormulaResult: true, formulaId: 'formula-e6' },
    ],
    formulas: [
      { id: 'formula-e1', name: 'Suspension Support', value: 'Math.ceil([TRAY_METERS] / 2)', unit: 'pc' },
      { id: 'formula-e2', name: 'Bolt with Lock', value: '(Math.ceil([TRAY_METERS]/3)*2*4) + ([HORIZONTAL_TEE] * 12) + ([PANEL_FLANGE] * 4) + ([HORIZONTAL_BEND] * 8) + ([EXTERNAL_VERTICAL_BEND] * 8) + ([INTERNAL_VERTICAL_BEND] * 8) + ([REDUCER] * 8)', unit: 'pc' },
      { id: 'formula-e3', name: 'Nut', value: '[LOCK_BOLT] + ([SUSPENSION_SUPPORT] * 3) + ([PANEL_FLANGE] * 4) + ([INTERNAL_VERTICAL_BEND] * 8) + ([EXTERNAL_VERTICAL_BEND] * 8) + ([HORIZONTAL_BEND] * 8) + ([HORIZONTAL_TEE] * 12) + ([SIDE_OUTLET_3_4] * 2) + ([SIDE_OUTLET_1] * 2)', unit: 'pc' },
      { id: 'formula-e4', name: 'Washer', value: '[LOCK_BOLT] + ([SUSPENSION_SUPPORT] * 3) + ([PANEL_FLANGE] * 4) + ([INTERNAL_VERTICAL_BEND] * 8) + ([EXTERNAL_VERTICAL_BEND] * 8) + ([HORIZONTAL_BEND] * 8) + ([HORIZONTAL_TEE] * 12) + ([SIDE_OUTLET_3_4] * 2) + ([SIDE_OUTLET_1] * 2)', unit: 'pc' },
      { id: 'formula-e5', name: 'Anchor Bolt', value: 'Math.ceil([TRAY_METERS] / 2)', unit: 'pc' },
      { id: 'formula-e6', name: 'Rebar', value: 'Math.ceil(([SUSPENSION_SUPPORT] * 0.75) / 3)', unit: 'meters' },
    ]
  },
  {
    id: 'group-6',
    name: 'Network Cable Tray',
    variables: [
      { id: 'var-el1', code: 'NET_TRAY_GAUGE', description: 'Gauge', isInfo: true },
      { id: 'var-el2', code: 'NET_TRAY_SIZE', description: 'Cable Tray Size (e.g., 100x50)', isInfo: true },
      { id: 'var-el3', code: 'NET_TRAY_TYPE', description: 'Smooth or Perforated', isInfo: true },
      { id: 'var-el4', code: 'NET_SIDE_OUTLET_SIZE', description: 'Side outlets (size)', isInfo: true },
      { id: 'var-el5', code: 'NET_BOLT_SIZE', description: 'Bolts, nuts, washer (size)', isInfo: true },
      { id: 'var-el6', code: 'NET_TRAY_METERS', description: 'Cable Tray (Meters)' },
      { id: 'var-el7', code: 'NET_HORIZONTAL_TEE', description: 'Horizontal Tee' },
      { id: 'var-el8', code: 'NET_HORIZONTAL_BEND', description: 'Horizontal Bend' },
      { id: 'var-el9', code: 'NET_EXTERNAL_VERTICAL_BEND', description: 'External Vertical Bend' },
      { id: 'var-el10', code: 'NET_INTERNAL_VERTICAL_BEND', description: 'Internal Vertical Bend' },
      { id: 'var-el11', code: 'NET_REDUCER', description: 'Reducer' },
      { id: 'var-el12', code: 'NET_PANEL_FLANGE', description: 'Panel Flange' },
      { id: 'var-el13', code: 'NET_SIDE_OUTLET_A', description: 'Side Outlet to Conduit A' },
      { id: 'var-el14', code: 'NET_SIDE_OUTLET_B', description: 'Side Outlet to Conduit B' },
      { id: 'var-el15', code: 'NET_TRAY_COVER', description: 'Cable Tray Cover' },
      { id: 'var-elf1', code: 'NET_SUSPENSION_SUPPORT', description: 'Suspension Support', isFormulaResult: true, formulaId: 'formula-el1' },
      { id: 'var-elf2', code: 'NET_LOCK_BOLT', description: 'Bolt with Lock', isFormulaResult: true, formulaId: 'formula-el2' },
      { id: 'var-elf3', code: 'NET_NUT', description: 'Nut', isFormulaResult: true, formulaId: 'formula-el3' },
      { id: 'var-elf4', code: 'NET_WASHER', description: 'Washer', isFormulaResult: true, formulaId: 'formula-el4' },
      { id: 'var-elf5', code: 'NET_ANCHOR_BOLT', description: 'Anchor Bolt', isFormulaResult: true, formulaId: 'formula-el5' },
      { id: 'var-elf6', code: 'NET_REBAR', description: 'Rebar', isFormulaResult: true, formulaId: 'formula-el6' },
    ],
    formulas: [
      { id: 'formula-el1', name: 'Suspension Support', value: 'Math.ceil([NET_TRAY_METERS] / 2)', unit: 'pc' },
      { id: 'formula-el2', name: 'Bolt with Lock', value: '(Math.ceil([NET_TRAY_METERS]/3)*2*4) + ([NET_HORIZONTAL_TEE] * 12) + ([NET_PANEL_FLANGE] * 4) + ([NET_HORIZONTAL_BEND] * 8) + ([NET_EXTERNAL_VERTICAL_BEND] * 8) + ([NET_INTERNAL_VERTICAL_BEND] * 8) + ([NET_REDUCER] * 8)', unit: 'pc' },
      { id: 'formula-el3', name: 'Nut', value: '[NET_LOCK_BOLT] + ([NET_SUSPENSION_SUPPORT] * 3) + ([NET_PANEL_FLANGE] * 4) + ([NET_INTERNAL_VERTICAL_BEND] * 8) + ([NET_EXTERNAL_VERTICAL_BEND] * 8) + ([NET_HORIZONTAL_BEND] * 8) + ([NET_HORIZONTAL_TEE] * 12) + ([NET_SIDE_OUTLET_A] * 2) + ([NET_SIDE_OUTLET_B] * 2)', unit: 'pc' },
      { id: 'formula-el4', name: 'Washer', value: '[NET_LOCK_BOLT] + ([NET_SUSPENSION_SUPPORT] * 3) + ([NET_PANEL_FLANGE] * 4) + ([NET_INTERNAL_VERTICAL_BEND] * 8) + ([NET_EXTERNAL_VERTICAL_BEND] * 8) + ([NET_HORIZONTAL_BEND] * 8) + ([NET_HORIZONTAL_TEE] * 12) + ([NET_SIDE_OUTLET_A] * 2) + ([NET_SIDE_OUTLET_B] * 2)', unit: 'pc' },
      { id: 'formula-el5', name: 'Anchor Bolt', value: 'Math.ceil([NET_TRAY_METERS] / 2)', unit: 'pc' },
      { id: 'formula-el6', name: 'Rebar', value: 'Math.ceil(([NET_SUSPENSION_SUPPORT] * 0.75) / 3)', unit: 'meters' },
    ]
  },
  {
    id: 'group-7',
    name: 'Conduit',
    variables: [
      { id: 'var-ed1', code: 'CONDUIT_SIZE', description: 'Conduits (inches)', isInfo: true },
      { id: 'var-ed2', code: 'CONDULET_SIZE', description: 'Multiple Condulet (inches)', isInfo: true },
      { id: 'var-ed3', code: 'FASTENERS_SIZE', description: 'Anchors and Bolts (inches)', isInfo: true },
      { id: 'var-ed4', code: 'CONDUIT', description: 'Conduit' },
      { id: 'var-ed5', code: 'BEND', description: 'Bend' },
      { id: 'var-ed6', code: 'MULTIPLE_CONDULET', description: 'Multiple Condulet' },
      { id: 'var-ed7', code: 'COVER_1RJ45', description: 'Cover for 1 RJ-45' },
      { id: 'var-ed8', code: 'COVER_2RJ45', description: 'Cover for 2 RJ-45' },
      { id: 'var-ed9', code: 'COVER_2G_1S', description: '2-Gang Condulet Cover (Single Socket)' },
      { id: 'var-ed10', code: 'COVER_3GH_2S', description: '3-Gang Horizontal Condulet Cover (2 Sockets)' },
      { id: 'var-ed11', code: 'COVER_1GV_1SW', description: '1-Gang Vertical Condulet Cover (1 Switch)' },
      { id: 'var-ed12', code: 'COVER_2GH_2SW', description: '2-Gang Horizontal Condulet Cover (2 Switches)' },
      { id: 'var-ed13', code: 'COVER_3GH_3SW', description: '3-Gang Horizontal Condulet Cover (3 Switches)' },
      { id: 'var-ed14', code: 'SOCKET_1G_10A', description: '1-Gang 10A Socket for Condulet' },
      { id: 'var-ed15', code: 'SOCKET_1G_20A', description: '1-Gang 20A Socket for Condulet' },
      { id: 'var-edf1', code: 'COUPLINGS', description: 'Couplings', isFormulaResult: true, formulaId: 'formula-ed1' },
      { id: 'var-edf2', code: 'CLAMPS', description: 'Clamps', isFormulaResult: true, formulaId: 'formula-ed2' },
      { id: 'var-edf3', code: 'PLUGS', description: 'Plugs/Caps', isFormulaResult: true, formulaId: 'formula-ed3' },
      { id: 'var-edf4', code: 'CONDULET_CONNECTOR', description: 'Connector for Condulet', isFormulaResult: true, formulaId: 'formula-ed4' },
      { id: 'var-edf5', code: 'BLANK_COVER', description: 'Blank Cover for Condulet', isFormulaResult: true, formulaId: 'formula-ed5' },
      { id: 'var-edf6', code: 'ANCHOR_BOLT', description: 'Anchor Bolt', isFormulaResult: true, formulaId: 'formula-ed6' },
      { id: 'var-edf7', code: 'REBAR', description: 'Rebar', isFormulaResult: true, formulaId: 'formula-ed7' },
      { id: 'var-edf8', code: 'HEX_NUT', description: 'Hex Nut', isFormulaResult: true, formulaId: 'formula-ed8' },
      { id: 'var-edf9', code: 'PLAIN_WASHER', description: 'Plain Washer', isFormulaResult: true, formulaId: 'formula-ed9' },
      { id: 'var-edf10', code: 'REINFORCED_CONDUIT', description: 'Reinforced Conduit', isFormulaResult: true, formulaId: 'formula-ed10' },
    ],
    formulas: [
      { id: 'formula-ed1', name: 'Couplings', value: 'Math.ceil([CONDUIT] / 3) + ([BEND] * 2)', unit: 'pc' },
      { id: 'formula-ed2', name: 'Clamps', value: 'Math.ceil(([CONDUIT] * 3) / 2)', unit: 'pc' },
      { id: 'formula-ed3', name: 'Plugs/Caps', value: '[CONDUIT] * 3', unit: 'pc' },
      { id: 'formula-ed4', name: 'Connector for Condulet', value: '[MULTIPLE_CONDULET] * 2', unit: 'pc' },
      { id: 'formula-ed5', name: 'Blank Cover for Condulet', value: '[MULTIPLE_CONDULET] - [COVER_1RJ45] - [COVER_2RJ45] - [COVER_2G_1S] - [COVER_3GH_2S] - [COVER_1GV_1SW] - [COVER_2GH_2SW] - [COVER_3GH_3SW] - [SOCKET_1G_10A] - [SOCKET_1G_20A]', unit: 'pc' },
      { id: 'formula-ed6', name: 'Anchor Bolt', value: 'Math.ceil(([CONDUIT] * 3) / 2)', unit: 'pc' },
      { id: 'formula-ed7', name: 'Rebar', value: 'Math.ceil(([ANCHOR_BOLT] * 1.5) / 3)', unit: 'meters' },
      { id: 'formula-ed8', name: 'Hex Nut', value: '[ANCHOR_BOLT] * 3', unit: 'pc' },
      { id: 'formula-ed9', name: 'Plain Washer', value: '[ANCHOR_BOLT] * 3', unit: 'pc' },
      { id: 'formula-ed10', name: 'Reinforced Conduit', value: '[CLAMPS]', unit: 'meters' },
    ]
  },
  {
    id: 'group-8',
    name: 'Audio and Video',
    variables: [
      { id: 'var-av1', code: 'CABLE_BK_RD_2X1_5MM', description: 'Black/Red Cable - 2x1.5mm' },
      { id: 'var-av2', code: 'RECEIVER', description: 'Receiver' },
      { id: 'var-av3', code: 'CEILING_SPEAKER_6IN', description: '6" Ceiling Speaker' },
      { id: 'var-av4', code: 'SPEAKER_BOX', description: 'Speaker Box' },
      { id: 'var-av5', code: 'HDMI_CABLE_10M', description: '10 Meter HDMI Cable' },
      { id: 'var-av6', code: 'HDMI_KEYSTONE', description: 'HDMI Keystone' },
      { id: 'var-av7', code: 'HDMI_CABLE_1_5M', description: '1.5 Meter HDMI Cable' },
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
  
  const handleAddNewBudgetItem = () => {
    const newItem: BudgetItem = {
      id: Date.now() + Math.random(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      sector: '',
    };
    setBudgetItems(currentItems => [newItem, ...currentItems]);
  };
  
  const handleAiAddItemsToBudget = (parsedItems: AiBudgetItem[]) => {
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
            onAddItem={handleAddNewBudgetItem}
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
    { id: Tab.Precificacao, label: t('tabs.pricing') },
    { id: Tab.Settings, label: t('tabs.settings') }
  ];

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