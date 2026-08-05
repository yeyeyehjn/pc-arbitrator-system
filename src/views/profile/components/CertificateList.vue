<template>
  <div class="certificate-list">
    <template v-if="certificates.length">
      <div
        v-for="(cert, index) in certificates"
        :key="cert.id"
        class="section-card cert-card"
      >
        <header class="cert-header">
          <div class="cert-title-group">
            <el-icon class="cert-emblem"><Medal /></el-icon>
            <h3 class="cert-title">
              <span class="cert-title-label">仲裁员聘书</span>
              <span class="cert-title-sep">·</span>
              <span class="cert-title-term">{{ cert.term }}</span>
            </h3>
          </div>
          <el-tag :type="getStatusType(cert)" size="small">
            {{ getStatusType(cert) === 'success' ? '有效' : '已过期' }}
          </el-tag>
        </header>

        <div class="cert-body">
          <dl class="cert-meta">
            <div class="meta-row meta-row--featured">
              <dt>聘任编号</dt>
              <dd class="cert-no">{{ cert.certNo }}</dd>
            </div>
            <div class="meta-row">
              <dt>聘任期限</dt>
              <dd>{{ cert.startDate }} ~ {{ cert.endDate }}</dd>
            </div>
            <div class="meta-row">
              <dt>专业领域</dt>
              <dd>{{ cert.field }}</dd>
            </div>
          </dl>

          <figure class="cert-scan">
            <el-image
              :src="cert.scanUrl"
              :preview-src-list="[cert.scanUrl]"
              :preview-teleported="true"
              fit="cover"
              class="cert-scan-img"
            >
              <template #error>
                <div class="scan-error">
                  <el-icon class="scan-error-icon"><Picture /></el-icon>
                  <span class="scan-error-text">图片加载失败</span>
                </div>
              </template>
            </el-image>
            <figcaption class="cert-scan-caption">聘书扫描件</figcaption>
          </figure>
        </div>

        <footer class="cert-actions">
          <el-button
            type="primary"
            link
            size="small"
            :icon="ZoomIn"
            @click="handlePreview(cert, index)"
          >
            查看大图
          </el-button>
          <el-button
            type="primary"
            link
            size="small"
            :icon="Download"
            @click="handleDownload"
          >
            下载 PDF
          </el-button>
        </footer>
      </div>
    </template>
    <ProfileEmptyState v-else text="暂无聘书记录" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Medal, ZoomIn, Download } from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import ProfileEmptyState from './shared/ProfileEmptyState.vue'

const profileStore = useProfileStore()

const certificates = computed(() => profileStore.certificates)

const getStatusType = (cert) => {
  return profileStore.getCertificateStatus(cert) === 'valid' ? 'success' : 'info'
}

const handlePreview = (cert, index) => {
  // el-image preview-src-list 已配置，点击缩略图即可预览
  const imgEl = document.querySelector(
    `.cert-card:nth-child(${index + 1}) .cert-scan-img img`
  )
  if (imgEl) {
    imgEl.click()
  } else {
    ElMessage.info('暂无扫描件可预览')
  }
}

const handleDownload = () => {
  ElMessage.info('下载功能开发中')
}
</script>

<style scoped lang="scss">
.certificate-list {
  .cert-card {
    position: relative;
  }

  .cert-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .cert-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .cert-emblem {
    font-size: 22px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .cert-title {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
    color: var(--el-text-color-regular);
    font-weight: 500;
    min-width: 0;
  }

  .cert-title-sep {
    color: var(--el-text-color-placeholder);
    font-weight: 400;
  }

  .cert-title-term {
    font-weight: 700;
    color: var(--el-color-primary);
    letter-spacing: 0.02em;
  }

  .cert-body {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 24px;
    align-items: start;
  }

  .cert-meta {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .meta-row {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 12px;
    align-items: baseline;

    dt {
      margin: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }

    dd {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
      line-height: 1.5;
    }
  }

  .meta-row--featured {
    .cert-no {
      font-weight: 600;
      color: var(--el-color-primary);
      letter-spacing: 0.02em;
    }
  }

  .cert-scan {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .cert-scan-img {
    width: 120px;
    height: 160px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-light);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    :deep(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(5, 61, 153, 0.12);
    }
  }

  .scan-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    gap: 6px;

    .scan-error-icon {
      font-size: 22px;
      color: var(--el-color-primary-light-5);
    }

    .scan-error-text {
      font-size: 12px;
    }
  }

  .cert-scan-caption {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .cert-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

@media (max-width: 768px) {
  .certificate-list {
    .cert-body {
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .cert-scan {
      align-items: flex-start;
    }

    .meta-row {
      grid-template-columns: 64px 1fr;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .certificate-list .cert-scan-img {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
