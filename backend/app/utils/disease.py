DISEASE_MAP = {
    # ALS
    "als": "ALS",
    "lou gehrig's disease": "ALS",
    "lou gehrigs disease": "ALS",
    "amyotrophic lateral sclerosis": "ALS",
    "amyotrophic lateral sclerosis (als)": "ALS",
    "motor neuron disease": "ALS",
    "mnd": "ALS",
    # Parkinson's
    "parkinson": "Parkinson's Disease",
    "parkinsons": "Parkinson's Disease",
    "parkinson's": "Parkinson's Disease",
    "parkinson disease": "Parkinson's Disease",
    "parkinson's disease": "Parkinson's Disease",
    "pd": "Parkinson's Disease",
    "parkinsons disease": "Parkinson's Disease",
    # Alzheimer's
    "alzheimer": "Alzheimer's Disease",
    "alzheimers": "Alzheimer's Disease",
    "alzheimer's": "Alzheimer's Disease",
    "alzheimer disease": "Alzheimer's Disease",
    "alzheimer's disease": "Alzheimer's Disease",
    "ad": "Alzheimer's Disease",
    "alzheimers disease": "Alzheimer's Disease",
    "dementia": "Alzheimer's Disease",
    # Huntington's
    "huntington": "Huntington's Disease",
    "huntingtons": "Huntington's Disease",
    "huntington's": "Huntington's Disease",
    "huntington disease": "Huntington's Disease",
    "huntington's disease": "Huntington's Disease",
    "hd": "Huntington's Disease",
    "huntingtons disease": "Huntington's Disease",
    "huntington chorea": "Huntington's Disease",
    # Glioblastoma
    "glioblastoma": "Glioblastoma",
    "gbm": "Glioblastoma",
    "glioblastoma multiforme": "Glioblastoma",
    "brain cancer": "Glioblastoma",
    "brain tumor": "Glioblastoma",
    "brain tumour": "Glioblastoma",
    # Breast Cancer
    "breast cancer": "Breast Cancer",
    "bc": "Breast Cancer",
    # Melanoma
    "melanoma": "Melanoma",
    "skin cancer": "Melanoma",
    "malignant melanoma": "Melanoma",
    # Lung Cancer
    "lung cancer": "Lung Cancer",
    "nsclc": "Lung Cancer",
    "non-small cell lung cancer": "Lung Cancer",
    "non small cell lung cancer": "Lung Cancer",
    "small cell lung cancer": "Lung Cancer",
    "sclc": "Lung Cancer",
    "lung carcinoma": "Lung Cancer",
    # Rheumatoid Arthritis
    "rheumatoid arthritis": "Rheumatoid Arthritis",
    "ra": "Rheumatoid Arthritis",
    "arthritis": "Rheumatoid Arthritis",
    "rheumatoid": "Rheumatoid Arthritis",
    # Multiple Sclerosis
    "multiple sclerosis": "Multiple Sclerosis",
    "ms": "Multiple Sclerosis",
    "ms disease": "Multiple Sclerosis",
    # Lupus
    "lupus": "Lupus",
    "sle": "Lupus",
    "systemic lupus erythematosus": "Lupus",
    "lupus erythematosus": "Lupus",
    # Type 2 Diabetes
    "type 2 diabetes": "Type 2 Diabetes",
    "type 2 diabetes mellitus": "Type 2 Diabetes",
    "t2d": "Type 2 Diabetes",
    "t2dm": "Type 2 Diabetes",
    "diabetes": "Type 2 Diabetes",
    "diabetes mellitus": "Type 2 Diabetes",
    "type ii diabetes": "Type 2 Diabetes",
    "diabeties": "Type 2 Diabetes",  # common misspelling
    # Heart Failure
    "heart failure": "Heart Failure",
    "hf": "Heart Failure",
    "congestive heart failure": "Heart Failure",
    "chf": "Heart Failure",
    "cardiac failure": "Heart Failure",
    # Tuberculosis
    "tuberculosis": "Tuberculosis",
    "tb": "Tuberculosis",
    "mycobacterium tuberculosis": "Tuberculosis",
    # COVID-19
    "covid-19": "COVID-19",
    "covid 19": "COVID-19",
    "covid": "COVID-19",
    "coronavirus": "COVID-19",
    "sars-cov-2": "COVID-19",
    "sars cov 2": "COVID-19",
    "coronavirus disease": "COVID-19",
    # AIDS
    "aids": "AIDS",
    "hiv": "AIDS",
    "acquired immunodeficiency syndrome": "AIDS",
    # Atopic Dermatitis
    "atopic dermatitis": "Atopic Dermatitis",
    "eczema": "Atopic Dermatitis",
    # Atrial Fibrillation
    "atrial fibrillation": "Atrial Fibrillation",
    "afib": "Atrial Fibrillation",
    # Chronic Kidney Disease
    "chronic kidney disease": "Chronic Kidney Disease",
    "ckd": "Chronic Kidney Disease",
    # Chronic Liver Disease
    "chronic liver disease": "Chronic Liver Disease",
    "cld": "Chronic Liver Disease",
    # Colorectal Cancer
    "colorectal cancer": "Colorectal Cancer",
    "colon cancer": "Colorectal Cancer",
    # Crohn's Disease
    "crohn's disease": "Crohn's Disease",
    "crohns disease": "Crohn's Disease",
    "crohns": "Crohn's Disease",
    # Dengue
    "dengue": "Dengue",
    "dengue fever": "Dengue",
    # Depression
    "depression": "Depression",
    "mdd": "Depression",
    "clinical depression": "Depression",
    # Endometriosis
    "endometriosis": "Endometriosis",
    # Epilepsy
    "epilepsy": "Epilepsy",
    "seizures": "Epilepsy",
    # Hepatitis A
    "hepatitis a": "Hepatitis A",
    "hav": "Hepatitis A",
    # Hepatitis B
    "hepatitis b": "Hepatitis B",
    "hbv": "Hepatitis B",
    # Hepatitis C
    "hepatitis c": "Hepatitis C",
    "hcv": "Hepatitis C",
    # Hypertension
    "hypertension": "Hypertension",
    "high blood pressure": "Hypertension",
    # Influenza
    "influenza": "Influenza",
    "flu": "Influenza",
    # Malaria
    "malaria": "Malaria",
    # Osteoarthritis
    "osteoarthritis": "Osteoarthritis",
    "oa": "Osteoarthritis",
    # Osteoporosis
    "osteoporosis": "Osteoporosis",
    # Ovarian Cancer
    "ovarian cancer": "Ovarian Cancer",
    # PCOS
    "pcos": "PCOS",
    "polycystic ovary syndrome": "PCOS",
    # Pancreatic Cancer
    "pancreatic cancer": "Pancreatic Cancer",
    # Prostate Cancer
    "prostate cancer": "Prostate Cancer",
    # Psoriasis
    "psoriasis": "Psoriasis",
    # Schizophrenia
    "schizophrenia": "Schizophrenia",
    # Sepsis
    "sepsis": "Sepsis",
    # Stroke
    "stroke": "Stroke",
    "ischemic stroke": "Stroke",
    # Ulcerative Colitis
    "ulcerative colitis": "Ulcerative Colitis",
    "uc": "Ulcerative Colitis",
    # Asthma
    "asthma": "Asthma",
    "reactive airways disease": "Asthma",
    # Migraine
    "migraine": "Migraine",
    "migraines": "Migraine",
    "migraine headache": "Migraine",
    # Gout
    "gout": "Gout",
    "gouty arthritis": "Gout",
    # Obesity
    "obesity": "Obesity",
    "overweight": "Obesity",
    # Celiac Disease
    "celiac disease": "Celiac Disease",
    "coeliac disease": "Celiac Disease",
    "celiac": "Celiac Disease",
}

SUPPORTED_DISEASES = [
    "AIDS",
    "ALS",
    "Alzheimer's Disease",
    "Asthma",
    "Atopic Dermatitis",
    "Atrial Fibrillation",
    "Breast Cancer",
    "COVID-19",
    "Celiac Disease",
    "Chronic Kidney Disease",
    "Chronic Liver Disease",
    "Colorectal Cancer",
    "Crohn's Disease",
    "Dengue",
    "Depression",
    "Endometriosis",
    "Epilepsy",
    "Glioblastoma",
    "Gout",
    "Heart Failure",
    "Hepatitis A",
    "Hepatitis B",
    "Hepatitis C",
    "Huntington's Disease",
    "Hypertension",
    "Influenza",
    "Lung Cancer",
    "Lupus",
    "Malaria",
    "Melanoma",
    "Migraine",
    "Multiple Sclerosis",
    "Obesity",
    "Osteoarthritis",
    "Osteoporosis",
    "Ovarian Cancer",
    "PCOS",
    "Pancreatic Cancer",
    "Parkinson's Disease",
    "Prostate Cancer",
    "Psoriasis",
    "Rheumatoid Arthritis",
    "Schizophrenia",
    "Sepsis",
    "Stroke",
    "Tuberculosis",
    "Type 2 Diabetes",
    "Ulcerative Colitis"
]


def normalize_disease(disease: str) -> str:
    if not disease:
        return None
    # Normalize inputs (lowercase, strip whitespace, remove extra quotes/periods if any)
    cleaned = disease.strip().lower().strip(".\"'")
    return DISEASE_MAP.get(cleaned, None)

