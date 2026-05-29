const sensitivePatterns = [
  /\brut\b/i,
  /\bse\s+llama\b/i,
  /\bdon\b/i,
  /\bdoña\b/i,
  /\bdona\b/i,
  /\bpaciente\s+llamad[oa]\b/i,
  /\b\d{7,9}-?[\dkK]\b/,
  /\b\d{8,}\b/
];

export function hasSensitiveWarning(text: string) {
  return sensitivePatterns.some((pattern) => pattern.test(text));
}

export function sensitiveWarningReasons(text: string) {
  const reasons = new Set<string>();

  if (/\brut\b/i.test(text) || /\b\d{7,9}-?[\dkK]\b/.test(text) || /\b\d{8,}\b/.test(text)) {
    reasons.add("posible identificador o numero largo");
  }
  if (/\bse\s+llama\b/i.test(text) || /\bpaciente\s+llamad[oa]\b/i.test(text)) {
    reasons.add("posible nombre de paciente");
  }
  if (/\bdon\b/i.test(text) || /\bdoña\b/i.test(text) || /\bdona\b/i.test(text)) {
    reasons.add("tratamiento personal que podria anteceder un nombre");
  }

  return Array.from(reasons);
}
