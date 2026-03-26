<template>

  <!-- qr code modal -->
  <div v-if="show" class="taco-modal-overlay" @click="closeModal">

    <!-- modal dialog -->
    <div class="taco-modal-dialog" @click.stop>

      <!-- modal header -->
      <div class="taco-modal-header">

        <!-- modal title -->
        <h3 class="taco-modal-title qr-title">
          <i class="fa fa-2x fa-qrcode me-3"></i>
          {{ title }}
        </h3>

        <!-- close button -->
        <button @click="closeModal"
                type="button"
                class="btn taco-modal-close">
          <i class="fa fa-times"></i>
        </button>

      </div>

      <!-- modal content -->
      <div class="taco-modal-body">

        <!-- qr code container -->
        <div class="qr-code-container">

          <!-- qr code canvas -->
          <canvas ref="qrCanvas"></canvas>

        </div>

        <!-- address section -->
        <div class="address-section">

          <!-- address label -->
          <div class="address-label">Address</div>

          <!-- address text -->
          <div class="address-text">{{ address }}</div>

        </div>

      </div>

      <!-- footer -->
      <div class="taco-modal-footer">

        <div class="d-flex justify-content-end flex-wrap w-100">

          <!-- cancel button -->
          <button @click="closeModal" class="btn" style="font-family: 'Space Mono';">

            <!-- icon -->
            <i class="fa fa-x-mark me-2"></i>
            
            <!-- text -->
            <span style="color: var(--black-to-white);">Cancel</span>
            
          </button>              

          <!-- copy address button -->
          <button @click="copyAddress" class="btn taco-btn taco-btn--green taco-btn--big mt-2">

            <!-- icon -->
            <i class="fa fa-copy me-2"></i>
            Copy Address
          </button>        

        </div>
        
      </div>      

    </div>

  </div>

</template>

<style scoped lang="scss">
.qr-title {
  color: var(--black-to-white);
  line-height: 1;
  font-family: 'Space Mono';
  font-size: 1.5rem;
  font-weight: 600;
}

.fa-qrcode {
  color: var(--dark-brown-to-white);
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;

  canvas {
    aspect-ratio: 1/1;
    width: 100% !important;
    height: 100% !important;
  }
}

.address-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;

  .address-label {
    font-family: 'Space Mono';
    font-size: 1.25rem;
    color: var(--black-to-white);
  }

  .address-text {
    word-break: break-all;
    font-family: monospace;
    font-size: 1rem;
    color: var(--black-to-white);
    margin-bottom: 0.25rem;
    font-family: 'Rubik';
  }

}

:deep(.taco-modal-footer) {
  padding: 0 0.75rem 0.75rem 0.75rem;

  button {
    width: fit-content;
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
const { copy } = useClipboard({ legacy: true })
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
        dark: '#512100',
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