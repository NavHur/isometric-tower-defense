import { defineConfig } from 'react-doctor/api'

// https://react.doctor/docs
// No score API, share URL, or Socket.dev checks; the `doctor` script's
// --no-score also turns off telemetry. Errors outside tests and stories fail.
export default defineConfig({
  noScore: true,
  share: false,
  supplyChain: { enabled: false },
  scope: 'full',
  blocking: 'error',
})
