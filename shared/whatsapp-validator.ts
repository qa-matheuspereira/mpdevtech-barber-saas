/**
 * Validador de números WhatsApp
 * Suporta números brasileiros e internacionais
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  countryCode: string;
  nationalNumber: string;
  error?: string;
}

/**
 * Valida e formata número de telefone para WhatsApp
 * Suporta:
 * - Brasil: (11) 98765-4321, 11 98765-4321, 5511987654321
 * - Internacional: +55 11 98765-4321
 */
export function validateWhatsAppNumber(
  phone: string
): PhoneValidationResult {
  if (!phone || typeof phone !== "string") {
    return {
      isValid: false,
      formatted: "",
      countryCode: "",
      nationalNumber: "",
      error: "Número de telefone inválido",
    };
  }

  // Remove espaços, hífens, parênteses e caracteres especiais
  let cleaned = phone
    .replace(/\s/g, "")
    .replace(/[-()]/g, "")
    .replace(/\D/g, "");

  // Detecta país e formata
  if (cleaned.startsWith("55")) {
    // Número com código do Brasil
    return validateBrazilianNumber(cleaned);
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // Número brasileiro sem código de país
    return validateBrazilianNumber("55" + cleaned);
  } else if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    // Número brasileiro com 10 dígitos (sem 9º dígito)
    return {
      isValid: false,
      formatted: "",
      countryCode: "",
      nationalNumber: "",
      error: "Número brasileiro deve ter 11 dígitos (incluindo o 9)",
    };
  } else if (cleaned.length >= 10) {
    // Tenta validar como número internacional
    return validateInternationalNumber(cleaned);
  } else {
    return {
      isValid: false,
      formatted: "",
      countryCode: "",
      nationalNumber: "",
      error: "Número de telefone muito curto",
    };
  }
}

/**
 * Valida número brasileiro
 */
function validateBrazilianNumber(
  phone: string
): PhoneValidationResult {
  // Remove código do país se presente
  let number = phone.startsWith("55") ? phone.slice(2) : phone;

  // Valida comprimento
  if (number.length !== 11) {
    return {
      isValid: false,
      formatted: "",
      countryCode: "55",
      nationalNumber: number,
      error: `Número brasileiro deve ter 11 dígitos, recebido ${number.length}`,
    };
  }

  // Valida DDD (primeiros 2 dígitos)
  const ddd = number.slice(0, 2);
  const validDDDs = [
    "11", "12", "13", "14", "15", "16", "17", "18", "19", // SP
    "21", "22", "24", // RJ
    "27", "28", // ES
    "31", "32", "33", "34", "35", "37", "38", // MG
    "41", "42", "43", "44", "45", "46", // PR
    "47", "48", "49", // SC
    "51", "53", "54", "55", // RS
    "61", // DF
    "62", "64", // GO
    "63", // TO
    "65", "66", // MT
    "67", // MS
    "68", // AC
    "69", // RO
    "71", "73", "74", "75", "77", // BA
    "79", // SE
    "81", "87", // PE
    "82", // AL
    "83", // PB
    "84", // RN
    "85", "88", // CE
    "86", "89", // PI
    "91", "92", "93", "94", "97", // AM
    "95", // RR
    "96", // AP
    "98", "99", // MA
  ];

  if (!validDDDs.includes(ddd)) {
    return {
      isValid: false,
      formatted: "",
      countryCode: "55",
      nationalNumber: number,
      error: `DDD ${ddd} inválido para Brasil`,
    };
  }

  // Valida se o 9º dígito é 9 (obrigatório para celular)
  const ninthDigit = number[4];
  if (ninthDigit !== "9") {
    return {
      isValid: false,
      formatted: "",
      countryCode: "55",
      nationalNumber: number,
      error: "Número deve ser de celular (9º dígito deve ser 9)",
    };
  }

  // Valida se não começa com 0 ou 1
  const firstDigit = number[2];
  if (firstDigit === "0" || firstDigit === "1") {
    return {
      isValid: false,
      formatted: "",
      countryCode: "55",
      nationalNumber: number,
      error: "Número inválido",
    };
  }

  // Formata o número
  const formatted = `+55${number}`;

  return {
    isValid: true,
    formatted,
    countryCode: "55",
    nationalNumber: number,
  };
}

/**
 * Valida número internacional
 */
function validateInternationalNumber(
  phone: string
): PhoneValidationResult {
  // Extrai código do país (primeiros 1-3 dígitos)
  let countryCode = "";
  let nationalNumber = "";

  // Tenta detectar código do país
  const countryCodeMap: { [key: string]: number } = {
    "1": 10, // EUA/Canadá
    "7": 10, // Rússia
    "20": 10, // Egito
    "27": 10, // África do Sul
    "30": 10, // Grécia
    "31": 10, // Holanda
    "32": 10, // Bélgica
    "33": 10, // França
    "34": 10, // Espanha
    "36": 10, // Hungria
    "39": 10, // Itália
    "40": 10, // Romênia
    "41": 10, // Suíça
    "43": 10, // Áustria
    "44": 10, // Reino Unido
    "45": 10, // Dinamarca
    "46": 10, // Suécia
    "47": 10, // Noruega
    "48": 10, // Polônia
    "49": 10, // Alemanha
    "51": 10, // Peru
    "52": 10, // México
    "55": 11, // Brasil
    "56": 10, // Chile
    "57": 10, // Colômbia
    "58": 10, // Venezuela
    "60": 10, // Malásia
    "61": 10, // Austrália
    "62": 10, // Indonésia
    "63": 10, // Filipinas
    "64": 10, // Nova Zelândia
    "65": 10, // Singapura
    "66": 10, // Tailândia
    "81": 10, // Japão
    "82": 10, // Coreia do Sul
    "84": 10, // Vietnã
    "86": 10, // China
    "90": 10, // Turquia
    "91": 10, // Índia
    "92": 10, // Paquistão
    "93": 10, // Afeganistão
    "94": 10, // Sri Lanka
    "95": 10, // Mianmar
    "98": 10, // Irã
  };

  // Tenta encontrar o código do país
  for (let len = 3; len >= 1; len--) {
    const code = phone.slice(0, len);
    if (countryCodeMap[code]) {
      countryCode = code;
      nationalNumber = phone.slice(len);
      break;
    }
  }

  if (!countryCode) {
    return {
      isValid: false,
      formatted: "",
      countryCode: "",
      nationalNumber: phone,
      error: "Código de país não identificado",
    };
  }

  // Valida comprimento do número nacional
  const minLength = countryCodeMap[countryCode];
  if (nationalNumber.length < minLength - 1 || nationalNumber.length > minLength + 2) {
    return {
      isValid: false,
      formatted: "",
      countryCode,
      nationalNumber,
      error: `Número inválido para o país ${countryCode}`,
    };
  }

  const formatted = `+${countryCode}${nationalNumber}`;

  return {
    isValid: true,
    formatted,
    countryCode,
    nationalNumber,
  };
}

/**
 * Formata número para exibição
 */
export function formatPhoneForDisplay(phone: string): string {
  const result = validateWhatsAppNumber(phone);
  if (!result.isValid) return phone;

  if (result.countryCode === "55") {
    // Formata número brasileiro: (11) 98765-4321
    const number = result.nationalNumber;
    return `(${number.slice(0, 2)}) ${number.slice(2, 7)}-${number.slice(7)}`;
  }

  return result.formatted;
}

/**
 * Extrai apenas os dígitos do número
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
