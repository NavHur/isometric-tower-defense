import { Data, Effect } from 'effect'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { preloadKenneyModels } from './scene/assets/useKenneyModel'
import './styles/global.css'

class MissingRoot extends Data.TaggedError('MissingRoot') {
  override get message() {
    return 'index.html has no #root element'
  }
}

const mount = Effect.gen(function* mountApp() {
  const root = yield* Effect.fromNullishOr(
    document.querySelector('#root'),
  ).pipe(Effect.mapError(() => new MissingRoot()))

  preloadKenneyModels()
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
Effect.runSync(mount)
