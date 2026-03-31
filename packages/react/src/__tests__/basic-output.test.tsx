import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Markdown } from '../Markdown.tsx'

describe('Markdown', () => {
    it('renders basic markdown output', async () => {
        render(<Markdown markdown={'# Hola\n\n**mundo**'} />)

        await waitFor(() => {
            expect(screen.getByText('Hola')).toBeTruthy()
            expect(screen.getByText('mundo')).toBeTruthy()
        })
    })
})
