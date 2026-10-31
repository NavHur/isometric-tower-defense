import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { useGameStore } from '../game/state/useGameStore'
import { GameHud } from './GameHud'

describe('GameHud', () => {
  beforeEach(() => useGameStore.getState().restart())
  it('renders the initial run resources', () => {
    render(<GameHud />)
    expect(
      screen.getByRole('heading', { name: 'Hold the Line' }),
    ).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
  })
  it('selects and cancels the tower build tool', () => {
    render(<GameHud />)
    fireEvent.click(screen.getByRole('button', { name: 'Build tower' }))
    expect(screen.getByRole('button', { name: 'Building…' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      screen.getByRole('button', { name: 'Build tower' }),
    ).toBeInTheDocument()
  })
  it('starts and pauses a wave', () => {
    render(<GameHud />)
    fireEvent.click(screen.getByRole('button', { name: 'Start wave 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByText('Simulation paused')).toBeInTheDocument()
  })
})
