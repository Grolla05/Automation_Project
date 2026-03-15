export const SECTOR_DATA = {
  P3: {
    EMC: [["ENSAIOS DE EMC"]],
    RF: [["Bluetooth Low Energy", "Wi-Fi 2.4Ghz", "Wi-Fi 5Ghz", "DFS/TPC"]],
    INF: [["ENSAIOS DE INF"]],
    LITE: [["ENSAIOS DE LITE"]],
    AEX: [["ENSAIOS DE AEX"]],
  },
  P4: {
    DPC: [["ENSAIOS DE DPC"]],
    CABL: [["ENSAIOS DE CABL"]],
  },
  P5: {
    MED: [["ENSAIOS DE MED"]],
    ASE: [["TESTE"]],
  },
  TESTE: {
    Geral: [["TESTE1", "TESTE2"]],
  },
};

export const LAYOUT_MAPPING = {
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
  TESTE: btoa("P5/ASE_layout.docx"),
  TESTE1: btoa("TESTE/TESTE1_layout.docx"),
  TESTE2: btoa("TESTE/TESTE2_layout.docx"),
};
