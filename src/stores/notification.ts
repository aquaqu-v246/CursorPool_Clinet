import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'

// 定义通知选项接口
interface NotificationOptions {
  title: string
  body?: string
  icon?: string
}

export const useNotificationStore = defineStore('notification', () => {
  // 通知权限状态
  const permissionGranted = ref<boolean | null>(null)

  // 是否正在请求权限
  const isRequesting = ref(false)

  // 检查通知权限
  const checkPermission = async (): Promise<boolean> => {
    try {
      permissionGranted.value = await isPermissionGranted()
      return permissionGranted.value
    } catch (error) {
      console.error('检查通知权限失败:', error)
      permissionGranted.value = false
      return false
    }
  }

  // 请求通知权限
  const requestNotificationPermission = async (): Promise<boolean> => {
    // 避免重复请求
    if (isRequesting.value) return permissionGranted.value || false

    try {
      isRequesting.value = true
      // 如果已经有权限，直接返回
      if (permissionGranted.value === true) return true

      // 请求权限
      const permission = await requestPermission()
      permissionGranted.value = permission === 'granted'
      return permissionGranted.value
    } catch (error) {
      console.error('请求通知权限失败:', error)
      permissionGranted.value = false
      return false
    } finally {
      isRequesting.value = false
    }
  }

  // 发送通知
  const notify = async (options: NotificationOptions): Promise<boolean> => {
    try {
      // 确保权限已授予
      if (!permissionGranted.value) {
        const granted = await requestNotificationPermission()
        if (!granted) return false
      }

      // 发送通知
      await sendNotification(options)
      return true
    } catch (error) {
      console.error('发送通知失败:', error)
      return false
    }
  }

  return {
    permissionGranted,
    isRequesting,
    checkPermission,
    requestNotificationPermission,
    notify,
  }
})
