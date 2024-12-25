import { Meta, StoryObj } from '@storybook/vue3'
import UiInput from './UiInput.vue'

const meta = {
  title: 'Input',
  component: UiInput,
  tags: ['autodocs'],
  parameters: {},
} satisfies Meta<typeof UiInput>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    placeholder: 'Input Primary',
  },
}

meta.parameters = {
  docs: {
    description: {
      component: `Использования компонента UiInput:
- ./src/components/HelloWorld.vue
- ./src/components/HelloWrapper.vue`,
    },
  },
}
