import { Meta, StoryObj } from '@storybook/vue3'
import UiTextarea from './UiTextarea.vue'

const meta = {
  title: 'Input',
  component: UiTextarea,
  tags: ['autodocs'],
  parameters: {},
} satisfies Meta<typeof UiTextarea>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    placeholder: 'Textarea Primary',
  },
}

meta.parameters = {
  docs: {
    description: {
      component: `Использования компонента UiTextarea:
- ./src/components/HelloWrapper.vue`,
    },
  },
}
