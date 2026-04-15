export type DeidentifyResult = { result: string; log: string[]; timestamp: string };
function labelFor(n: number): string {
  let result = ""; let current = n;
  while (current > 0) { const remainder = (current - 1) % 26; result = String.fromCharCode(65 + remainder) + result; current = Math.floor((current - 1) / 26); }
  return `Patient ${result}`;
}
const SKIP_PHRASES = new Set<string>(["North York","General Hospital","University Toronto","Toronto Ontario","Mount Sinai","Sunnybrook Health","Sciences Centre","The Patient","Emergency Department","Internal Medicine","Mental Health","Public Health","Family Medicine","Social Work","Occupational Therapy","Physical Therapy","Informed Consent","Discharge Summary"]);
const SKIP_WORDS = new Set<string>(["North","York","General","Hospital","University","Toronto","Ontario","Mount","Sinai","Sunnybrook","Health","Sciences","Centre","Center","Medical","Clinical","Canada","Canadian","Emergency","Department","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday","January","February","March","April","May","June","July","August","September","October","November","December"]);
function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function isSkippable(phrase: string): boolean { if (SKIP_PHRASES.has(phrase)) return true; return phrase.split(/\s+/).some((part) => SKIP_WORDS.has(part)); }
function replaceAllWithCount(input: string, regex: RegExp, replacement: string) { let count = 0; const result = input.replace(regex, () => { count += 1; return replacement; }); return { result, count }; }
export function deidentifyText(text: string): DeidentifyResult {
  let result = text; const log: string[] = []; const nameMap = new Map<string, string>(); let nameCounter = 1;
  const labelPattern = /(?:Patient|Name|Pt|Mr\.|Ms\.|Mrs\.|Dr\.)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  for (const match of result.matchAll(labelPattern)) { const fullName = match[1]?.trim(); if (fullName && !isSkippable(fullName) && !nameMap.has(fullName)) { nameMap.set(fullName, labelFor(nameCounter)); nameCounter += 1; } }
  const bareNamePattern = /\b([A-Z][a-z]{1,20})\s+([A-Z][a-z]{1,20})\b/g;
  for (const match of result.matchAll(bareNamePattern)) { const fullName = match[0]; if (fullName && !isSkippable(fullName) && !nameMap.has(fullName)) { nameMap.set(fullName, labelFor(nameCounter)); nameCounter += 1; } }
  for (const original of Array.from(nameMap.keys()).sort((a, b) => b.length - a.length)) { const replacement = nameMap.get(original)!; const pattern = new RegExp(`\\b${escapeRegExp(original)}\\b`, "gi"); const replaced = replaceAllWithCount(result, pattern, replacement); if (replaced.count > 0) { log.push(`Name: "${original}" → "${replacement}" (${replaced.count}×)`); result = replaced.result; } }
  const regexReplacements: Array<[RegExp, string]> = [
    [/\b\d{4}[- ]?\d{3}[- ]?\d{3}[- ]?[A-Z]{2}\b/gi, "[HEALTH CARD]"],
    [/\bMRN[:\s#]*\d{5,10}\b/gi, "[MRN]"],
    [/\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, "[PHONE]"],
    [/(?:DOB|Date\s+of\s+Birth|D\.O\.B\.?)\s*[:\s]+[\d/.\-]+/gi, "[DOB]"],
    [/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, "[DATE]"],
    [/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g, "[DATE]"],
    [/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, "[DATE]"],
    [/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]"],
    [/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g, "[POSTAL CODE]"],
    [/\b\d{1,5}\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Boulevard|Blvd|Court|Ct|Lane|Ln|Way|Crescent|Cres)\b/g, "[ADDRESS]"],
    [/\b\d{3}[- ]\d{3}[- ]\d{3}\b/g, "[SIN]"],
    [/(?:Fax|FAX)[:\s]+\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[FAX]"]
  ];
  for (const [pattern, replacement] of regexReplacements) { const replaced = replaceAllWithCount(result, pattern, replacement); if (replaced.count > 0) { log.push(`Pattern ${replacement}: ${replaced.count} replacement(s)`); result = replaced.result; } }
  return { result, log, timestamp: new Date().toISOString() };
}