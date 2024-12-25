import { Meta, StoryObj } from '@storybook/vue3'
import BaseHeader from './BaseHeader.vue'

const meta = {
  title: 'Base Header',
  component: BaseHeader,
  tags: ['autodocs'],
  parameters: {},
} satisfies Meta<typeof BaseHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

meta.parameters = {
  docs: {
    description: {
      component: `Использования компонента BaseHeader:
- ./src/App.vue`,
    },
  },
}
