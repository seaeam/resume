import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTemplateWorkbenchStore } from '../../store'
import { CommunityTemplateSection } from './community-template-section'
import { OfficialTemplateSection } from './official-template-section'
import { UserTemplateSection } from './user-template-section'

function TemplateWorkbench() {
  const { activeTab, setTab } = useTemplateWorkbenchStore()

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>简历模板</CardTitle>
        <CardDescription>选择模板直接创建简历，或进入自定义后按需保存为我的模板。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={value => setTab(value as 'official' | 'community' | 'mine')} className="gap-4">
          <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto">
            <TabsTrigger value="official">官方模板</TabsTrigger>
            <TabsTrigger value="community">社区模板</TabsTrigger>
            <TabsTrigger value="mine">我的模板</TabsTrigger>
          </TabsList>

          <TabsContent value="official">
            <OfficialTemplateSection />
          </TabsContent>

          <TabsContent value="community">
            <CommunityTemplateSection />
          </TabsContent>

          <TabsContent value="mine">
            <UserTemplateSection />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default TemplateWorkbench
