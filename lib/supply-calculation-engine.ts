import type {
  SupplyContractChargeInput,
  SupplyContractChargeType,
  SupplyContractCustomTimeOfUse,
  SupplyContractLosses,
  SupplyContractRateUnit,
  SupplyContractTimeOfUse,
  SupplyContractUnitOfMeasurement,
  SupplyDetailsInput,
  SupplyVoltage
} from "@/types/project";

export type SupplyNormalisedChargeSource =
  | "Transmission"
  | "Distribution"
  | "Supply Contract";

export type SupplyRecoveryTreatment = "Fixed Recovery" | "Pass Through";

export type SupplyNormalisedChargeType =
  | "Consumption"
  | "Fixed"
  | "Capacity"
  | "Demand";

export type SupplyNormalisationStatus =
  | "Normalised"
  | "Needs business rule"
  | "Needs volume data"
  | "Invalid"
  | "Excluded";

export type NormalisedSupplyChargeLine = {
  id: string;
  projectId: string;
  mpan: string;
  supplyDetailId: string;
  source: SupplyNormalisedChargeSource;
  sourceChargeId: string | null;
  chargeName: string;
  recoveryTreatment: SupplyRecoveryTreatment;
  chargeType: SupplyNormalisedChargeType;
  voltage: SupplyVoltage;
  losses: SupplyContractLosses | null;
  unitOfMeasurement: SupplyContractUnitOfMeasurement | "per kW" | "Not applicable";
  timeOfUse: SupplyContractTimeOfUse | null;
  customTimeOfUse: SupplyContractCustomTimeOfUse | null;
  ratePounds: number;
  quantity: number | null;
  annualAmount: number | null;
  status: SupplyNormalisationStatus;
  messages: string[];
};

export type SupplyCalculationInput = {
  projectId: string;
  supplyDetails: SupplyDetailsInput[];
};

export type SupplyCalculationResult = {
  projectId: string;
  chargeLines: NormalisedSupplyChargeLine[];
  messages: string[];
};

type SupplyDetailValidation = {
  detailMessages: string[];
  fieldMessages: Partial<Record<SupplyDetailRateField, string[]>>;
};

type SupplyDetailRateField =
  | "tnuosNonLocationalChargePerDay"
  | "tnuosTriadChargePerKw"
  | "duosFixedChargePerDay"
  | "duosImportCapacityPencePerKvaPerDay"
  | "duosRedUnitPencePerKwh"
  | "duosAmberUnitPencePerKwh"
  | "duosGreenUnitPencePerKwh"
  | "duosSuperRedUnitPencePerKwh";

const consumptionUnits: SupplyContractUnitOfMeasurement[] = ["per kWh", "per MWh"];
const fixedUnits: SupplyContractUnitOfMeasurement[] = ["per day", "per Month", "per year"];
const capacityUnits: SupplyContractUnitOfMeasurement[] = [
  "per kVA per day",
  "per kVA per Month"
];

type AnnualAmountCalculation = {
  quantity: number | null;
  annualAmount: number | null;
};

export function normaliseSupplyRate(rate: number, rateUnit: SupplyContractRateUnit) {
  return rateUnit === "p" ? rate / 100 : rate;
}

export function normaliseSupplyCharges(input: SupplyCalculationInput): SupplyCalculationResult {
  const chargeLines = input.supplyDetails.flatMap((supplyDetail) => {
    const validation = validateSupplyDetailRow(supplyDetail);

    return [
      ...buildTransmissionChargeLines(input.projectId, supplyDetail, validation),
      ...buildDistributionChargeLines(input.projectId, supplyDetail, validation),
      ...buildSupplyContractChargeLines(input.projectId, supplyDetail, validation)
    ];
  });

  return {
    projectId: input.projectId,
    chargeLines,
    messages: chargeLines.flatMap((line) => line.messages)
  };
}

export function validateSupplyDetailRow(row: SupplyDetailsInput): SupplyDetailValidation {
  const detailMessages: string[] = [];
  const fieldMessages: Partial<Record<SupplyDetailRateField, string[]>> = {};

  if (!/^\d{13}$/.test(row.mpan.trim())) {
    detailMessages.push("MPAN must be 13 digits.");
  }

  if (row.supplyCapacityKva < 0) {
    detailMessages.push("Supply capacity must not be negative.");
  }

  addNegativeRateMessage(
    row,
    fieldMessages,
    "tnuosNonLocationalChargePerDay",
    "TNUoS non-locational charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "tnuosTriadChargePerKw",
    "TNUoS triad charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "duosFixedChargePerDay",
    "DUoS fixed charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "duosImportCapacityPencePerKvaPerDay",
    "DUoS import capacity charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "duosRedUnitPencePerKwh",
    "DUoS red unit charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "duosAmberUnitPencePerKwh",
    "DUoS amber unit charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "duosGreenUnitPencePerKwh",
    "DUoS green unit charge must not be negative."
  );
  addNegativeRateMessage(
    row,
    fieldMessages,
    "duosSuperRedUnitPencePerKwh",
    "DUoS super red unit charge must not be negative."
  );

  return { detailMessages, fieldMessages };
}

export function validateSupplyContractCharge(charge: SupplyContractChargeInput) {
  const messages: string[] = [];

  if (!charge.chargeName.trim()) {
    messages.push("Supply contract charge name must not be blank.");
  }

  if (charge.rate < 0) {
    messages.push("Supply contract charge rate must not be negative.");
  }

  if (!isCompatibleSupplyContractUnit(charge.chargeType, charge.unitOfMeasurement)) {
    messages.push(
      `${charge.chargeType} charge cannot use ${charge.unitOfMeasurement} unit.`
    );
  }

  return messages;
}

export function buildTransmissionChargeLines(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation = validateSupplyDetailRow(supplyDetail)
): NormalisedSupplyChargeLine[] {
  if (supplyDetail.transmission === "Pass Through") {
    return [
      createSupplyLine({
        projectId,
        supplyDetail,
        idSuffix: "transmission-pass-through",
        source: "Transmission",
        sourceChargeId: null,
        chargeName: "Transmission pass-through",
        recoveryTreatment: "Pass Through",
        chargeType: "Fixed",
        unitOfMeasurement: "Not applicable",
        ratePounds: 0,
        status: "Excluded",
        messages: [
          ...validation.detailMessages,
          "Transmission is marked Pass Through and is excluded from fixed recovery."
        ]
      })
    ];
  }

  return [
    createSupplyLine({
      projectId,
      supplyDetail,
      idSuffix: "tnuos-non-locational",
      source: "Transmission",
      sourceChargeId: null,
      chargeName: "TNUoS non-locational charge",
      recoveryTreatment: "Fixed Recovery",
      chargeType: "Fixed",
      unitOfMeasurement: "per day",
      ratePounds: supplyDetail.tnuosNonLocationalChargePerDay,
      status: statusForMessages(
        [
          ...validation.detailMessages,
          ...(validation.fieldMessages.tnuosNonLocationalChargePerDay ?? [])
        ],
        "Normalised"
      ),
      messages: [
        ...validation.detailMessages,
        ...(validation.fieldMessages.tnuosNonLocationalChargePerDay ?? [])
      ]
    }),
    createSupplyLine({
      projectId,
      supplyDetail,
      idSuffix: "tnuos-triad",
      source: "Transmission",
      sourceChargeId: null,
      chargeName: "TNUoS triad charge",
      recoveryTreatment: "Fixed Recovery",
      chargeType: "Demand",
      unitOfMeasurement: "per kW",
      ratePounds: supplyDetail.tnuosTriadChargePerKw,
      status: statusForMessages(
        [
          ...validation.detailMessages,
          ...(validation.fieldMessages.tnuosTriadChargePerKw ?? [])
        ],
        "Needs business rule"
      ),
      messages: [
        ...validation.detailMessages,
        ...(validation.fieldMessages.tnuosTriadChargePerKw ?? []),
        "kVA to kW conversion for TNUoS triad charges needs a business rule."
      ]
    })
  ];
}

export function buildDistributionChargeLines(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation = validateSupplyDetailRow(supplyDetail)
): NormalisedSupplyChargeLine[] {
  if (supplyDetail.distribution === "Pass Through") {
    return [
      createSupplyLine({
        projectId,
        supplyDetail,
        idSuffix: "distribution-pass-through",
        source: "Distribution",
        sourceChargeId: null,
        chargeName: "Distribution pass-through",
        recoveryTreatment: "Pass Through",
        chargeType: "Fixed",
        unitOfMeasurement: "Not applicable",
        ratePounds: 0,
        status: "Excluded",
        messages: [
          ...validation.detailMessages,
          "Distribution is marked Pass Through and is excluded from fixed recovery."
        ]
      })
    ];
  }

  return [
    createDuosFixedLine(projectId, supplyDetail, validation),
    createDuosCapacityLine(projectId, supplyDetail, validation),
    ...createDuosUnitLines(projectId, supplyDetail, validation)
  ];
}

export function buildSupplyContractChargeLines(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation = validateSupplyDetailRow(supplyDetail)
): NormalisedSupplyChargeLine[] {
  return supplyDetail.supplyContractCharges.map((charge) => {
    const chargeMessages = validateSupplyContractCharge(charge);
    const status = statusForMessages(
      [...validation.detailMessages, ...chargeMessages],
      statusForSupplyContractCharge(charge)
    );

    return createSupplyLine({
      projectId,
      supplyDetail,
      idSuffix: `supply-contract-${charge.id}`,
      source: "Supply Contract",
      sourceChargeId: charge.id,
      chargeName: charge.chargeName,
      recoveryTreatment: "Fixed Recovery",
      chargeType: charge.chargeType,
      losses: charge.losses,
      unitOfMeasurement: charge.unitOfMeasurement,
      timeOfUse: charge.timeOfUse,
      customTimeOfUse: charge.customTimeOfUse,
      ratePounds: normaliseSupplyRate(charge.rate, charge.rateUnit),
      status,
      messages: [...validation.detailMessages, ...chargeMessages]
    });
  });
}

function addNegativeRateMessage(
  row: SupplyDetailsInput,
  fieldMessages: Partial<Record<SupplyDetailRateField, string[]>>,
  field: SupplyDetailRateField,
  message: string
) {
  if (row[field] < 0) {
    fieldMessages[field] = [...(fieldMessages[field] ?? []), message];
  }
}

function isCompatibleSupplyContractUnit(
  chargeType: SupplyContractChargeType,
  unit: SupplyContractUnitOfMeasurement
) {
  if (chargeType === "Consumption") {
    return consumptionUnits.includes(unit);
  }

  if (chargeType === "Fixed") {
    return fixedUnits.includes(unit);
  }

  return capacityUnits.includes(unit);
}

function statusForMessages(
  messages: string[],
  fallbackStatus: Exclude<SupplyNormalisationStatus, "Invalid">
): SupplyNormalisationStatus {
  return messages.length > 0 ? "Invalid" : fallbackStatus;
}

function statusForSupplyContractCharge(
  charge: SupplyContractChargeInput
): Exclude<SupplyNormalisationStatus, "Invalid"> {
  if (charge.chargeType === "Consumption") {
    return "Needs volume data";
  }

  if (charge.unitOfMeasurement === "per year") {
    return "Normalised";
  }

  if (charge.chargeType === "Fixed" || charge.chargeType === "Capacity") {
    return "Normalised";
  }

  return "Needs business rule";
}

function createDuosFixedLine(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation
) {
  const messages = [
    ...validation.detailMessages,
    ...(validation.fieldMessages.duosFixedChargePerDay ?? [])
  ];

  return createSupplyLine({
    projectId,
    supplyDetail,
    idSuffix: "duos-fixed",
    source: "Distribution",
    sourceChargeId: null,
    chargeName: "DUoS fixed charge",
    recoveryTreatment: "Fixed Recovery",
    chargeType: "Fixed",
    unitOfMeasurement: "per day",
    ratePounds: normaliseSupplyRate(supplyDetail.duosFixedChargePerDay, "p"),
    status: statusForMessages(
      [
        ...validation.detailMessages,
        ...(validation.fieldMessages.duosFixedChargePerDay ?? [])
      ],
      "Normalised"
    ),
    messages
  });
}

function createDuosCapacityLine(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation
) {
  const messages = [
    ...validation.detailMessages,
    ...(validation.fieldMessages.duosImportCapacityPencePerKvaPerDay ?? [])
  ];

  return createSupplyLine({
    projectId,
    supplyDetail,
    idSuffix: "duos-import-capacity",
    source: "Distribution",
    sourceChargeId: null,
    chargeName: "DUoS import capacity charge",
    recoveryTreatment: "Fixed Recovery",
    chargeType: "Capacity",
    unitOfMeasurement: "per kVA per day",
    ratePounds: normaliseSupplyRate(
      supplyDetail.duosImportCapacityPencePerKvaPerDay,
      "p"
    ),
    status: statusForMessages(
      [
        ...validation.detailMessages,
        ...(validation.fieldMessages.duosImportCapacityPencePerKvaPerDay ?? [])
      ],
      "Normalised"
    ),
    messages
  });
}

function calculateAnnualAmount(input: {
  status: SupplyNormalisationStatus;
  chargeType: SupplyNormalisedChargeType;
  unitOfMeasurement: NormalisedSupplyChargeLine["unitOfMeasurement"];
  ratePounds: number;
  supplyCapacityKva: number;
}): AnnualAmountCalculation {
  if (input.status !== "Normalised") {
    return { quantity: null, annualAmount: null };
  }

  if (input.chargeType === "Fixed") {
    return calculateFixedAnnualAmount(input.ratePounds, input.unitOfMeasurement);
  }

  if (input.chargeType === "Capacity") {
    return calculateCapacityAnnualAmount(
      input.ratePounds,
      input.unitOfMeasurement,
      input.supplyCapacityKva
    );
  }

  return { quantity: null, annualAmount: null };
}

function calculateFixedAnnualAmount(
  ratePounds: number,
  unitOfMeasurement: NormalisedSupplyChargeLine["unitOfMeasurement"]
): AnnualAmountCalculation {
  if (unitOfMeasurement === "per day") {
    return { quantity: 365, annualAmount: ratePounds * 365 };
  }

  if (unitOfMeasurement === "per Month") {
    return { quantity: 12, annualAmount: ratePounds * 12 };
  }

  if (unitOfMeasurement === "per year") {
    return { quantity: 1, annualAmount: ratePounds };
  }

  return { quantity: null, annualAmount: null };
}

function calculateCapacityAnnualAmount(
  ratePounds: number,
  unitOfMeasurement: NormalisedSupplyChargeLine["unitOfMeasurement"],
  supplyCapacityKva: number
): AnnualAmountCalculation {
  if (unitOfMeasurement === "per kVA per day") {
    const quantity = supplyCapacityKva * 365;
    return { quantity, annualAmount: ratePounds * quantity };
  }

  if (unitOfMeasurement === "per kVA per Month") {
    const quantity = supplyCapacityKva * 12;
    return { quantity, annualAmount: ratePounds * quantity };
  }

  return { quantity: null, annualAmount: null };
}

function createDuosUnitLines(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation
) {
  if (supplyDetail.voltage === "EHV") {
    return [
      createDuosUnitLine(
        projectId,
        supplyDetail,
        validation,
        "super-red",
        "DUoS super red unit charge",
        "Super Red",
        "duosSuperRedUnitPencePerKwh",
        supplyDetail.duosSuperRedUnitPencePerKwh
      )
    ];
  }

  return [
    createDuosUnitLine(
      projectId,
      supplyDetail,
      validation,
      "red",
      "DUoS red unit charge",
      "Red",
      "duosRedUnitPencePerKwh",
      supplyDetail.duosRedUnitPencePerKwh
    ),
    createDuosUnitLine(
      projectId,
      supplyDetail,
      validation,
      "amber",
      "DUoS amber unit charge",
      "Amber",
      "duosAmberUnitPencePerKwh",
      supplyDetail.duosAmberUnitPencePerKwh
    ),
    createDuosUnitLine(
      projectId,
      supplyDetail,
      validation,
      "green",
      "DUoS green unit charge",
      "Green",
      "duosGreenUnitPencePerKwh",
      supplyDetail.duosGreenUnitPencePerKwh
    )
  ];
}

function createDuosUnitLine(
  projectId: string,
  supplyDetail: SupplyDetailsInput,
  validation: SupplyDetailValidation,
  idSuffix: string,
  chargeName: string,
  timeOfUse: SupplyContractTimeOfUse,
  rateField: SupplyDetailRateField,
  ratePence: number
) {
  const messages = [
    ...validation.detailMessages,
    ...(validation.fieldMessages[rateField] ?? []),
    "DUoS time-band volume mapping needs volume data."
  ];

  return createSupplyLine({
    projectId,
    supplyDetail,
    idSuffix: `duos-${idSuffix}-unit`,
    source: "Distribution",
    sourceChargeId: null,
    chargeName,
    recoveryTreatment: "Fixed Recovery",
    chargeType: "Consumption",
    unitOfMeasurement: "per kWh",
    timeOfUse,
    ratePounds: normaliseSupplyRate(ratePence, "p"),
    status: statusForMessages(
      [...validation.detailMessages, ...(validation.fieldMessages[rateField] ?? [])],
      "Needs volume data"
    ),
    messages
  });
}

function createSupplyLine(input: {
  projectId: string;
  supplyDetail: SupplyDetailsInput;
  idSuffix: string;
  source: SupplyNormalisedChargeSource;
  sourceChargeId: string | null;
  chargeName: string;
  recoveryTreatment: SupplyRecoveryTreatment;
  chargeType: SupplyNormalisedChargeType;
  losses?: SupplyContractLosses | null;
  unitOfMeasurement: NormalisedSupplyChargeLine["unitOfMeasurement"];
  timeOfUse?: SupplyContractTimeOfUse | null;
  customTimeOfUse?: SupplyContractCustomTimeOfUse | null;
  ratePounds: number;
  status: SupplyNormalisationStatus;
  messages: string[];
}): NormalisedSupplyChargeLine {
  const annualAmountCalculation = calculateAnnualAmount({
    status: input.status,
    chargeType: input.chargeType,
    unitOfMeasurement: input.unitOfMeasurement,
    ratePounds: input.ratePounds,
    supplyCapacityKva: input.supplyDetail.supplyCapacityKva
  });

  return {
    id: `${input.supplyDetail.id}:${input.idSuffix}`,
    projectId: input.projectId,
    mpan: input.supplyDetail.mpan,
    supplyDetailId: input.supplyDetail.id,
    source: input.source,
    sourceChargeId: input.sourceChargeId,
    chargeName: input.chargeName,
    recoveryTreatment: input.recoveryTreatment,
    chargeType: input.chargeType,
    voltage: input.supplyDetail.voltage,
    losses: input.losses ?? null,
    unitOfMeasurement: input.unitOfMeasurement,
    timeOfUse: input.timeOfUse ?? null,
    customTimeOfUse: input.customTimeOfUse ?? null,
    ratePounds: input.ratePounds,
    quantity: annualAmountCalculation.quantity,
    annualAmount: annualAmountCalculation.annualAmount,
    status: input.status,
    messages: input.messages
  };
}
