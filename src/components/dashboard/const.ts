import { IconHelp, IconSearch, IconSettings } from '@tabler/icons-react'
import { FileUser, HomeIcon, LayoutTemplate } from 'lucide-react'

export const Data = {
  modules: [
    {
      title: '首页',
      url: '/',
      icon: HomeIcon,
    },
    {
      title: '我的简历',
      url: '/resume',
      icon: FileUser,
    },
    {
      title: '简历模板',
      url: '/template',
      icon: LayoutTemplate,
    },
  ],
  navSecondary: [
    {
      title: '设置',
      url: '/settings',
      icon: IconSettings,
    },
    {
      title: '帮助',
      url: '/help',
      icon: IconHelp,
    },
    {
      title: '搜索',
      url: '/search',
      icon: IconSearch,
    },
  ],
}
