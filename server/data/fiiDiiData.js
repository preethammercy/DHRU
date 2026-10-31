// Institutional flow data is not supplied by a verified provider in this deployment.
export function getFiiDiiData() {
  return {
    status: 'unavailable',
    asOf: null,
    source: null,
    message: 'FII/DII flow data is unavailable because no verified provider is configured.'
  };
}
