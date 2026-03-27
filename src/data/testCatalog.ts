export type TestItem = {
  name: string;
  price: number;
};

export type TestCategory = {
  category: string;
  tests: TestItem[];
};

export const TEST_CATALOG: TestCategory[] = [
  {
    category: "LIVER FUNCTION",
    tests: [
      { name: "Liver Function Enzymes Test", price: 18000 },
      { name: "Hepatitis B Panel Test", price: 25000 },
      { name: "Anti HCV Test", price: 5000 },
      { name: "Serum Albumin Test", price: 10000 },
      { name: "Alpha Feto Protein Test", price: 25000 },
      { name: "ESR Test", price: 5000 },
      { name: "Liver Study USS Test", price: 15000 },
    ],
  },
  {
    category: "KIDNEY",
    tests: [
      { name: "Urine Dipstick Analysis Test", price: 5000 },
      { name: "Urine M/C/S Test", price: 6000 },
      { name: "Serum E/U/Cr Test", price: 12000 },
      { name: "Serum Calcium/Phosphate Test", price: 18000 },
      { name: "Renal Ultrasound Test", price: 22000 },
    ],
  },
  {
    category: "CARDIOVASCULAR SYSTEM",
    tests: [
      { name: "Full Blood Count Test", price: 8000 },
      { name: "Lipid Profile Test", price: 12000 },
      { name: "D-Dimer Test", price: 12000 },
      { name: "C-Reactive Protein Test", price: 20000 },
      { name: "Serum E/U/Cr Test", price: 12000 },
      { name: "Clotting Profile Test", price: 22000 },
    ],
  },
  {
    category: "GASTROINTESTINAL TRACT",
    tests: [
      { name: "Complete Blood Count Test", price: 12000 },
      { name: "ESR Test", price: 6000 },
      { name: "Ferritin Test", price: 20000 },
      { name: "Fecal Occult Blood Test", price: 8000 },
      { name: "Stool Analysis Test", price: 8000 },
      { name: "Serum Iron Test", price: 20000 },
      { name: "Helicobacter Pylori Test", price: 6000 },
      { name: "Abdominal Ultrasound Test", price: 6000 },
    ],
  },
  {
    category: "MUSCULOSKELETAL FUNCTION",
    tests: [
      { name: "Full Blood Count Test", price: 12000 },
      { name: "ESR Test", price: 6000 },
      { name: "C-Reactive Protein Test", price: 20000 },
      { name: "Rheumatoid Factor Test", price: 7000 },
      { name: "Serum Uric Acid Test", price: 8000 },
      { name: "Serum Calcium Test", price: 8000 },
      { name: "Urine Analysis Test", price: 5000 },
    ],
  },
  {
    category: "TUMOUR MARKERS",
    tests: [
      { name: "Total PSA Test", price: 10000 },
      { name: "Free PSA Test", price: 10000 },
      { name: "CA-125 Test", price: 20000 },
      { name: "CA-19-9 Test", price: 55000 },
      { name: "CA-15-3 Test", price: 50000 },
      { name: "CEA Test", price: 35000 },
      { name: "Beta HCG Test", price: 35000 },
      { name: "LDH Test", price: 35000 },
    ],
  },
  {
    category: "METABOLIC DISORDERS",
    tests: [
      { name: "Glycosylated Hb Test", price: 20000 },
      { name: "Fasting Lipid Profile Test", price: 12000 },
      { name: "Fasting Plasma Glucose Test", price: 6000 },
      { name: "Thyroid Function Test", price: 35000 },
      { name: "Electrolytes Panel Test", price: 40000 },
    ],
  },
  {
    category: "HEMATOLOGY",
    tests: [
      { name: "Full Blood Count (5 Parts Indices) Test", price: 10000 },
      { name: "Hematocrit Volume Test", price: 5000 },
      { name: "ESR (Erythrocyte Sedimentation Rate) Test", price: 5000 },
      { name: "Blood Group Test", price: 4000 },
      { name: "Hemoglobin Genotype Test", price: 4000 },
      { name: "Direct/Indirect Coombs Test", price: 5000 },
      { name: "Platelet Count Test", price: 10000 },
      { name: "PT (Prothrombin Time) Test", price: 10000 },
      { name: "Activated Partial Thromboplastin Time (APTT) Test", price: 10000 },
      { name: "INR Test", price: 10000 },
      { name: "Thromboplastin Time Test", price: 10000 },
      { name: "Serum Iron Test", price: 18000 },
      { name: "Vitamin D Test", price: 20000 },
      { name: "HbA1c Test", price: 20000 },
    ],
  },
  {
    category: "GENERAL TESTS",
    tests: [
      { name: "Malaria Test", price: 3000 },
      { name: "Widal Antibody Test", price: 5000 },
      { name: "Serum HCG / Pregnancy Test", price: 4000 },
    ],
  },
  {
    category: "MICROBIOLOGY",
    tests: [
      { name: "Urinalysis", price: 5000 },
      { name: "Urine MCS", price: 6000 },
      { name: "Wound Swab MCS", price: 15000 },
      { name: "Semen MCS", price: 8000 },
      { name: "Eye Swab MCS", price: 6000 },
      { name: "Ear Swab MCS", price: 6000 },
      { name: "HVS MCS", price: 6000 },
      { name: "Sputum AFB", price: 15000 },
      { name: "Sputum MCS", price: 10000 },
      { name: "Nasopharyngeal Swab MCS", price: 8000 },
      { name: "Blood MCS", price: 40000 },
      { name: "CSF MCS", price: 10000 },
      { name: "Stool Analysis (MCS)", price: 10000 },
      { name: "Skin Snip", price: 8000 },
      { name: "Skin Scraping MCS", price: 15000 },
      { name: "ECs MCS", price: 8000 },
    ],
  },
  {
    category: "SEROLOGY & IMMUNOLOGY",
    tests: [
      { name: "Malaria Parasite", price: 4000 },
      { name: "Microfilaria", price: 8000 },
      { name: "VDRL", price: 4000 },
      { name: "Widal Test", price: 4000 },
      { name: "HIV 1 & 2", price: 6000 },
      { name: "Hepatitis B Surface Antigen", price: 4000 },
      { name: "Hepatitis C Virus", price: 4000 },
      { name: "H. Pylori Antibody", price: 6000 },
      { name: "Rheumatoid Factor", price: 8000 },
      { name: "ASO Titre", price: 8000 },
      { name: "Serum HCG (Pregnancy Test)", price: 4000 },
      { name: "CD4 Count", price: 103000 },
      { name: "Viral Load", price: 80000 },
      { name: "Chlamydia Test", price: 9000 },
    ],
  },
  {
    category: "HEMATOLOGY & COAGULATION",
    tests: [
      { name: "Full Blood Count", price: 10000 },
      { name: "Hemoglobin", price: 5000 },
      { name: "Packed Cell Volume", price: 5000 },
      { name: "Erythrocyte Sedimentation Rate", price: 5000 },
      { name: "Hemoglobin Genotype", price: 4000 },
      { name: "Blood Group", price: 4000 },
      { name: "Coombs Test", price: 7000 },
      { name: "Bleeding Time", price: 7000 },
      { name: "Clotting Time", price: 7000 },
      { name: "Sickling Test", price: 21000 },
      { name: "Blood Film", price: 10000 },
      { name: "Clotting Profile", price: 35000 },
      { name: "Platelet Count", price: 9000 },
      { name: "Reticulocyte Count", price: 0 },
    ],
  },
];

export const formatPrice = (price: number) =>
  `₦${price.toLocaleString("en-NG")}`;

export const getAllTests = () =>
  TEST_CATALOG.flatMap((cat) =>
    cat.tests.map((t) => ({ ...t, category: cat.category }))
  );
