<template>
  <div v-if="show" class="qr-modal-overlay" @click="closeModal">
    <div class="qr-modal" @click.stop>
      <div class="qr-modal__header">
        <h3>{{ title }}</h3>
        <button @click="closeModal" class="btn btn-sm taco-btn taco-btn--green">
          <i class="fa fa-times"></i>
        </button>
      </div>

      <div class="qr-modal__content">
        <div class="qr-code-container">
          <canvas ref="qrCanvas"></canvas>
        </div>

        <div class="address-section">
          <div class="address-label">Address:</div>
          <div class="address-text">{{ address }}</div>
          <button @click="copyAddress" class="btn taco-btn taco-btn--green mt-2">
            <i class="fa fa-copy me-2"></i>
            Copy Address
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.qr-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.qr-modal {
  background-color: var(--orange-to-dark-brown);
  border: 2px solid var(--dark-orange-to-dark-brown);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  max-height: 90%;
  overflow-y: auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
      margin: 0;
      color: var(--black-to-white);
      font-family: 'Space Mono', monospace;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
}

.qr-code-container {
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--dark-orange-to-dark-brown);
  display: flex;
  justify-content: center;
  align-items: center;
}

.address-section {
  text-align: center;
  width: 100%;

  .address-label {
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: var(--black-to-white);
  }

  .address-text {
    background-color: var(--light-orange-to-dark-brown);
    padding: 0.75rem;
    border-radius: 0.25rem;
    border: 1px solid var(--dark-orange-to-dark-brown);
    word-break: break-all;
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--black-to-white);
    margin-bottom: 0.5rem;
  }
}
</style>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useTacoStore } from '../../stores/taco.store'
import QRCode from 'qrcode'

interface QRCodeModalProps {
  show: boolean
  address: string
  title?: string
}

const props = withDefaults(defineProps<QRCodeModalProps>(), {
  title: 'QR Code'
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const { copy } = useClipboard()
const tacoStore = useTacoStore()

const closeModal = () => {
  emit('close')
}

const copyAddress = async () => {
  try {
    await copy(props.address)
    tacoStore.addToast({
      id: Date.now(),
      code: 'copy-success',
      title: 'Copied!',
      icon: 'fa-solid fa-check',
      message: 'Address copied to clipboard'
    })
  } catch (error) {
    tacoStore.addToast({
      id: Date.now(),
      code: 'copy-error',
      title: 'Copy Failed',
      icon: 'fa-solid fa-exclamation-triangle',
      message: 'Failed to copy address'
    })
  }
}

const generateQRCode = async (text: string, canvas: HTMLCanvasElement) => {
  try {
    await QRCode.toCanvas(canvas, text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (error) {
    console.error('Error generating QR code:', error)

    // Fallback
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000000'
      ctx.font = '16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('QR Generation Failed', canvas.width / 2, canvas.height / 2)
    }
  }
}

// Generate QR code when address changes
watch(() => props.address, async (newAddress) => {
  if (newAddress && props.show) {
    await nextTick()
    if (qrCanvas.value) {
      await generateQRCode(newAddress, qrCanvas.value)
    }
  }
}, { immediate: true })

// Generate QR code when modal opens
watch(() => props.show, async (show) => {
  if (show && props.address) {
    await nextTick()
    if (qrCanvas.value) {
      await generateQRCode(props.address, qrCanvas.value)
    }
  }
})
</script>