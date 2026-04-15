/**
 * Calculate savings value with simple interest (Vietnamese bank style).
 * @param principal - Initial deposit amount
 * @param annualRate - Annual interest rate in percent (e.g. 5.5 for 5.5%)
 * @param termMonths - Savings term in months
 * @param startDate - Date of deposit
 * @returns Current value including accrued interest
 */
export function calculateSavingsValue(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date,
): number {
  const now = new Date();
  const elapsedMs = now.getTime() - startDate.getTime();
  const elapsedDays = Math.max(0, elapsedMs / (1000 * 60 * 60 * 24));
  const termDays = termMonths * 30;

  // Number of completed terms
  const completedTerms = termDays > 0 ? Math.floor(elapsedDays / termDays) : 0;
  const remainingDays = termDays > 0 ? elapsedDays % termDays : elapsedDays;

  // Compound per completed term (interest reinvested each term)
  let value = principal;
  const termRate = (annualRate / 100) * (termMonths / 12);
  for (let i = 0; i < completedTerms; i++) {
    value += value * termRate;
  }

  // Partial interest for current incomplete term (pro-rata)
  if (remainingDays > 0 && termDays > 0) {
    value += value * (annualRate / 100) * (remainingDays / 365);
  }

  return value;
}
