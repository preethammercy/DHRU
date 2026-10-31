// No licensed option-chain provider is configured. Do not publish synthetic OI or PCR values.
export function getDerivativesOverview() {
  return {
    status: 'unavailable',
    source: null,
    asOf: null,
    message: 'Options-chain data is unavailable because no verified provider is configured.'
  };
}
