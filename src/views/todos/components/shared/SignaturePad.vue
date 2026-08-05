<template>
  <div class="signature-pad-wrapper">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="signature-canvas"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="endDraw"
      @mouseleave="endDraw"
      @touchstart.prevent="startDraw"
      @touchmove.prevent="draw"
      @touchend.prevent="endDraw"
    ></canvas>
    <div v-if="isEmpty" class="placeholder-tip">请在此区域手写签名</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 400,
  },
})

const canvasRef = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const isEmpty = ref(true)

onMounted(() => {
  const canvas = canvasRef.value
  ctx.value = canvas.getContext('2d')
  ctx.value.lineWidth = 2
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.strokeStyle = '#00296b'
})

const getPoint = (e) => {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

const startDraw = (e) => {
  isDrawing.value = true
  isEmpty.value = false
  const point = getPoint(e)
  ctx.value.beginPath()
  ctx.value.moveTo(point.x, point.y)
}

const draw = (e) => {
  if (!isDrawing.value) return
  const point = getPoint(e)
  ctx.value.lineTo(point.x, point.y)
  ctx.value.stroke()
}

const endDraw = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    ctx.value.closePath()
  }
}

const clear = () => {
  ctx.value.clearRect(0, 0, props.width, props.height)
  isEmpty.value = true
}

const getSignature = () => {
  if (isEmpty.value) return null
  return canvasRef.value.toDataURL('image/png')
}

defineExpose({ clear, getSignature, isEmpty })
</script>

<style scoped lang="scss">
.signature-pad-wrapper {
  position: relative;
  width: 100%;
  background-color: #ffffff;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;

  .signature-canvas {
    display: block;
    width: 100%;
    height: auto;
    cursor: crosshair;
    touch-action: none;
  }

  .placeholder-tip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    pointer-events: none;
  }
}
</style>
