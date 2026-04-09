/**
 * Dados estáticos de setores, tipos de ensaio e ensaios disponíveis.
 * A estrutura é: Setor → Tipo de Ensaio → lista de listas de Ensaios.
 */

/** Mapa de tipos de ensaio para grupos de ensaios */
export type TestTypeMap = Record<string, string[][]>;

/** Estrutura para definição de disponibilidade de ensaios */
export interface TestAvailability {
  name: string;
  enabled: boolean;
}

/** Estrutura completa de setores */
export type SectorData = Record<string, Record<string, TestAvailability[][]>>;

export const SECTOR_DATA: SectorData = {
  P3: {
    EMC: [[{ name: "ENSAIOS DE EMC", enabled: false }]],
    RF: [[
      { name: "Bluetooth Low Energy", enabled: false },
      { name: "Wi-Fi 2.4Ghz", enabled: false },
      { name: "Wi-Fi 5Ghz", enabled: false },
      { name: "DFS/TPC", enabled: false }
    ]],
    INF: [[{ name: "ENSAIOS DE INF", enabled: false }]],
    LITE: [[{ name: "ENSAIOS DE LITE", enabled: false }]],
    AEX: [[{ name: "ENSAIOS DE AEX", enabled: false }]],
  },
  P4: {
    DPC: [[{ name: "ENSAIOS DE DPC", enabled: false }]],
    CABL: [[{ name: "ENSAIOS DE CABL", enabled: false }]],
  },
  P5: {
    MED: [[{ name: "ENSAIOS DE MED", enabled: false }]],
    ASE: [
      [
        { name: "AGULHA HIPODÉRMICA", enabled: true },
        { name: "AGULHA GENVIAL", enabled: false },
        { name: "SERINGA HIPODÉRMICA", enabled: false },
        { name: "SERINGA DE USO EM BOMBA", enabled: false },
        { name: "SERINGA DE INSULINA", enabled: false },
        { name: "EQUIPAMENTO GRAVITACIONAL", enabled: false },
        { name: "EQUIPAMENTO COM BOMBA DE INFUSÃO", enabled: false },
        { name: "EQUIPAMENTO DE TRANSFUSÃO", enabled: false },
        { name: "MONTAGEM CÔNICA", enabled: false },
        { name: "EQUIPAMENTO DE BURETA", enabled: false },
        { name: "SIRINGA DE DOSE FIXA PARA IMUNIZAÇÃO", enabled: false },
        { name: "EQUIPAMENTO DE TRANSFUSÃO PARA USO EM BOMBA", enabled: false },
      ]
    ],
  },
};

/** Mapeamento de nome de ensaio para Layout ID em Base64 */
export const LAYOUT_MAPPING: Record<string, string> = {
  "Bluetooth Low Energy": btoa("P3/BLE_layout.docx"),
  "Wi-Fi 2.4Ghz": btoa("P3/Wi-Fi2.4_layout.docx"),
  "Wi-Fi 5Ghz": btoa("P3/Wi-Fi5_layout.docx"),
  "DFS/TPC": btoa("P3/DFS_TPC_layout.docx"),
  "ENSAIOS DE EMC": btoa("P3/EMC_layout.docx"),
  "ENSAIOS DE INF": btoa("P3/INF_layout.docx"),
  "ENSAIOS DE LITE": btoa("P3/LITE_layout.docx"),
  "ENSAIOS DE AEX": btoa("P3/AEX_layout.docx"),
  "ENSAIOS DE DPC": btoa("P4/DPC_layout.docx"),
  "ENSAIOS DE CABL": btoa("P4/CABL_layout.docx"),
  "ENSAIOS DE MED": btoa("P5/MED_layout.docx"),
  "SERINGA HIPODÉRMICA": btoa("P5/ASE_SH_layout.docx"),
  "AGULHA HIPODÉRMICA": btoa("P5/ASE_SH_layout.docx"),
  "AGULHA GENVIAL": btoa("P5/ASE_SH_layout.docx"),
  "SERINGA DE USO EM BOMBA": btoa("P5/ASE_SB_layout.docx"),
  "SERINGA DE INSULINA": btoa("P5/ASE_SI_layout.docx"),
  "EQUIPAMENTO GRAVITACIONAL": btoa("P5/ASE_EG_layout.docx"),
  "EQUIPAMENTO COM BOMBA DE INFUSÃO": btoa("P5/ASE_EBI_layout.docx"),
  "EQUIPAMENTO DE TRANSFUSÃO": btoa("P5/ASE_ET_layout.docx"),
  "MONTAGEM CÔNICA": btoa("P5/ASE_MC_layout.docx"),
  "EQUIPAMENTO DE BURETA": btoa("P5/ASE_EB_layout.docx"),
  "SIRINGA DE DOSE FIXA PARA IMUNIZAÇÃO": btoa("P5/ASE_SDFI_layout.docx"),
  "EQUIPAMENTO DE TRANSFUSÃO PARA USO EM BOMBA": btoa("P5/ASE_ETB_layout.docx"),
};

/**
 * Requisitos de nome de arquivo de imagem por ensaio.
 * Estrutura: { [NomeEnsaio]: string[] }
 */

// Agora cada requisito pode ser string ou objeto com sinônimos
export type ImageRequirement = string | { label: string, keywords: string[] };

const ASE_IMAGE_REQS: ImageRequirement[] = [
  { label: 'Logotipo do Fabricante', keywords: ['logotipo', 'logo', 'fabricante'] },
  { label: 'Foto da Embalagem', keywords: ['foto', 'embalagem'] },
  { label: 'Foto da Amostra', keywords: ['foto', 'amostra', 'Amostra', 'ensaio'] },
  { label: 'Foto do Lacre OCP', keywords: ['foto', 'lacre', 'ocp', 'Lacre'] },
  { label: 'Foto da Embalagem de Transporte', keywords: ['foto', 'embalagem', 'transporte', 'Embalagem'] },
  { label: 'Foto da Embalagem Secundária', keywords: ['foto', 'embalagem', 'secundaria'] },
  { label: 'Foto da Etiqueta da Amostra', keywords: ['foto', 'etiqueta', 'amostra', 'ADM'] },
];

export const REQUIRED_IMAGE_FILES: Record<string, ImageRequirement[]> = {
  "AGULHA HIPODÉRMICA": ASE_IMAGE_REQS,
};

/**
 * Retorna os tipos de ensaio disponíveis para um determinado setor.
 */
export const getTestTypesForSector = (sector: string): string[] => {
  if (!sector || !SECTOR_DATA[sector]) return [];
  return Object.keys(SECTOR_DATA[sector]);
};

/**
 * Retorna a lista de ensaios (disponibilidade) para um setor e tipo específicos.
 */
export const getTestsForType = (sector: string, testType: string): TestAvailability[] => {
  if (!sector || !testType || !SECTOR_DATA[sector]?.[testType]) return [];
  return SECTOR_DATA[sector][testType].flat();
};

/**
 * Retorna o ID do layout (Base64) para um determinado nome de ensaio.
 * Caso não encontre no mapeamento fixo, gera um fallback baseado no nome.
 */
export const getLayoutIdForTest = (testName: string): string => {
  if (!testName) return btoa("Padrao.docx");
  
  const mapped = LAYOUT_MAPPING[testName];
  if (mapped) return mapped;

  // Fallback robusto para nomes não mapeados explicitamente (ex: acentos)
  try {
    return btoa(encodeURIComponent(testName + ".docx").replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  } catch (e) {
    return btoa("Padrao.docx");
  }
};

/**
 * Valida se um setor existe na base de dados.
 */
export const isValidSector = (sector: string): boolean => {
  return sector in SECTOR_DATA;
};
