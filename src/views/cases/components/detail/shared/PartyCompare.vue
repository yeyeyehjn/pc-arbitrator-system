<template>
  <div class="party-compare">
    <!-- 申请人栏 -->
    <div class="party-column">
      <div class="column-title">申请人</div>
      <div v-for="party in applicants" :key="party.id" class="party-card">
        <div class="party-head" @click="openDetail(party)">
          <el-icon class="party-type-icon" :class="party.type">
            <component :is="party.type === 'enterprise' ? OfficeBuilding : User" />
          </el-icon>
          <span class="party-name">{{ party.name }}</span>
          <el-tag size="small" :type="party.type === 'enterprise' ? 'primary' : 'success'" class="party-tag">
            {{ party.type === 'enterprise' ? '企业' : '自然人' }}
          </el-tag>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
        <div class="party-body">
          <div class="field-row">
            <span class="field-label">联系方式</span>
            <span class="field-value">{{ party.phone || '—' }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">地址</span>
            <span class="field-value">{{ party.address || '—' }}</span>
          </div>
          <div v-if="party.agents && party.agents.length" class="agent-section">
            <div class="agent-title">代理人</div>
            <div v-for="agent in party.agents" :key="agent.id" class="agent-item" @click.stop="openDetail(agent)">
              <div class="agent-head">
                <el-icon class="agent-type-icon"><Avatar /></el-icon>
                <span class="agent-name">{{ agent.name }}</span>
                <el-tag size="small" type="warning" class="agent-tag">{{ agent.agentType }}</el-tag>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
              <div class="field-row">
                <span class="field-label">工作单位</span>
                <span class="field-value">{{ agent.firm }}</span>
              </div>
              <div class="field-row">
                <span class="field-label">联系方式</span>
                <span class="field-value">{{ agent.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 被申请人栏 -->
    <div class="party-column">
      <div class="column-title">被申请人</div>
      <div v-for="party in respondents" :key="party.id" class="party-card">
        <div class="party-head" @click="openDetail(party)">
          <el-icon class="party-type-icon" :class="party.type">
            <component :is="party.type === 'enterprise' ? OfficeBuilding : User" />
          </el-icon>
          <span class="party-name">{{ party.name }}</span>
          <el-tag size="small" :type="party.type === 'enterprise' ? 'primary' : 'success'" class="party-tag">
            {{ party.type === 'enterprise' ? '企业' : '自然人' }}
          </el-tag>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
        <div class="party-body">
          <div class="field-row">
            <span class="field-label">联系方式</span>
            <span class="field-value">{{ party.phone || '—' }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">地址</span>
            <span class="field-value">{{ party.address || '—' }}</span>
          </div>
          <div v-if="party.agents && party.agents.length" class="agent-section">
            <div class="agent-title">代理人</div>
            <div v-for="agent in party.agents" :key="agent.id" class="agent-item" @click.stop="openDetail(agent)">
              <div class="agent-head">
                <el-icon class="agent-type-icon"><Avatar /></el-icon>
                <span class="agent-name">{{ agent.name }}</span>
                <el-tag size="small" type="warning" class="agent-tag">{{ agent.agentType }}</el-tag>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
              <div class="field-row">
                <span class="field-label">工作单位</span>
                <span class="field-value">{{ agent.firm }}</span>
              </div>
              <div class="field-row">
                <span class="field-label">联系方式</span>
                <span class="field-value">{{ agent.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <PartyDetailDrawer v-model:visible="drawerVisible" :data="currentDetail" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { User, OfficeBuilding, Avatar, ArrowRight } from '@element-plus/icons-vue'
import PartyDetailDrawer from './PartyDetailDrawer.vue'

defineProps({
  applicants: {
    type: Array,
    default: () => [],
  },
  respondents: {
    type: Array,
    default: () => [],
  },
})

const drawerVisible = ref(false)
const currentDetail = ref({})

const openDetail = (data) => {
  currentDetail.value = data
  drawerVisible.value = true
}
</script>

<style scoped lang="scss">
.party-compare {
  display: flex;
  gap: 20px;

  .party-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .column-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-color-primary);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .party-card {
      background-color: #ffffff;
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      padding: 16px;

      .party-head {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding-bottom: 10px;
        margin-bottom: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        transition: color 0.2s;

        &:hover {
          color: var(--el-color-primary);

          .party-name {
            color: var(--el-color-primary);
          }
        }

        .party-type-icon {
          font-size: 18px;

          &.enterprise {
            color: var(--el-color-primary);
          }

          &.natural {
            color: #67c23a;
          }
        }

        .party-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-regular);
          flex: 1;
        }

        .party-tag {
          flex-shrink: 0;
        }

        .arrow-icon {
          font-size: 12px;
          color: #8a8e95;
        }
      }

      .party-body {
        .field-row {
          display: flex;
          margin-bottom: 8px;

          .field-label {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            width: 70px;
            flex-shrink: 0;
            text-align: left;
          }

          .field-value {
            font-size: 14px;
            color: var(--el-text-color-regular);
            flex: 1;
          }
        }

        .agent-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--el-border-color-lighter);

          .agent-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-regular);
            margin-bottom: 8px;
          }

          .agent-item {
            padding: 10px;
            margin-bottom: 8px;
            background-color: #f5f7fa;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
              background-color: #f2f5fa;
            }

            &:last-child {
              margin-bottom: 0;
            }

            .agent-head {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 8px;

              .agent-type-icon {
                font-size: 14px;
                color: #e6a23c;
              }

              .agent-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--el-text-color-regular);
                flex: 1;
              }

              .agent-tag {
                flex-shrink: 0;
              }

              .arrow-icon {
                font-size: 12px;
                color: #8a8e95;
              }
            }
          }
        }
      }
    }
  }
}
</style>
