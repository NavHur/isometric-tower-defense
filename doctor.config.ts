import { defineConfig } from 'react-doctor/api'

// https://react.doctor/docs
// Everything stays on this machine: no score API, no share URL, no Socket.dev
// dependency checks. A full scan fails the `doctor` script on any error.
export default defineConfig({
  noScore: true,
  share: false,
  supplyChain: { enabled: false },
  scope: 'full',
  blocking: 'error',
})
