import { layer as nodeSpawner } from '@effect/platform-node-shared/NodeChildProcessSpawner'
import { layer as nodeFileSystem } from '@effect/platform-node-shared/NodeFileSystem'
import { layer as nodePath } from '@effect/platform-node-shared/NodePath'
import { Layer } from 'effect'

const platform = Layer.merge(nodeFileSystem, nodePath)
export const nodePlatform = nodeSpawner.pipe(Layer.provideMerge(platform))
