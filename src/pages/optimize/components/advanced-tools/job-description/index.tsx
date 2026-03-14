import type { ResumeToolContext } from '../shared/types'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { getSectionScoreClassName } from '../shared/helpers'
import { ToolEmptyState, ToolPanelBody, ToolPanelCard, ToolPanelHeader, ToolStatCard } from '../shared/primitives'
import { buildJobDescriptionComparison } from './utils'

interface JobDescriptionToolProps {
  resumeContext: ResumeToolContext
}

function JobDescriptionTool({ resumeContext }: JobDescriptionToolProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<ReturnType<typeof buildJobDescriptionComparison> | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleCompare = () => {
    if (!jobDescription.trim()) {
      return
    }

    setAnalyzing(true)

    try {
      setResult(buildJobDescriptionComparison(resumeContext.resume, jobDescription))
    }
    finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      <ToolPanelCard>
        <ToolPanelHeader
          action={(
            <Button onClick={handleCompare} disabled={analyzing || !jobDescription.trim()}>
              开始比对
            </Button>
          )}
          title="岗位描述输入"
          description="粘贴职位描述、职责和任职要求，工具会对照当前简历找出匹配和缺口。"
        />
        <ToolPanelBody>
          <Textarea
            value={jobDescription}
            onChange={event => setJobDescription(event.target.value)}
            className="min-h-44 resize-y border-border/60 bg-background"
            placeholder="粘贴职位描述、岗位职责、任职要求或加分项。"
          />
        </ToolPanelBody>
      </ToolPanelCard>

      {result
        ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                <ToolPanelCard>
                  <ToolPanelBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    <ToolStatCard
                      label="岗位匹配度"
                      value={`${result.matchScore}%`}
                      hint={`命中 ${result.matchedKeywords.length} / ${result.extractedKeywords.length} 个关键词`}
                    />
                    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">匹配进度</p>
                        <Badge className={cn('border', getSectionScoreClassName(result.matchScore))}>
                          {result.matchScore}
                          %
                        </Badge>
                      </div>
                      <Progress value={result.matchScore} className="h-2 bg-muted" />
                      <p className="text-xs leading-5 text-muted-foreground">
                        这个分数只衡量关键词承接情况，不代表内容质量已经足够。
                      </p>
                    </div>
                  </ToolPanelBody>
                </ToolPanelCard>

                <div className="grid gap-4 md:grid-cols-2">
                  <ToolPanelCard>
                    <ToolPanelHeader title="已覆盖关键词" />
                    <ToolPanelBody>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedKeywords.length > 0
                          ? result.matchedKeywords.map(keyword => (
                              <Badge key={keyword} className="border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300">
                                {keyword}
                              </Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">还没有命中明显关键词</span>}
                      </div>
                    </ToolPanelBody>
                  </ToolPanelCard>

                  <ToolPanelCard>
                    <ToolPanelHeader title="待补关键词" />
                    <ToolPanelBody>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.length > 0
                          ? result.missingKeywords.map(keyword => (
                              <Badge key={keyword} className="border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                {keyword}
                              </Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">当前关键词覆盖已经比较完整</span>}
                      </div>
                    </ToolPanelBody>
                  </ToolPanelCard>
                </div>
              </div>

              <Tabs defaultValue="sections" className="gap-4">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="sections">按板块查看</TabsTrigger>
                  <TabsTrigger value="advice">优化建议</TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="space-y-3">
                  {result.sectionMatches.map(section => (
                    <ToolPanelCard key={section.sectionKey}>
                      <ToolPanelBody>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{section.sectionLabel}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              命中
                              {' '}
                              {section.matchedCount}
                              {' '}
                              个关键词
                            </p>
                          </div>
                          <Badge className={cn('border', getSectionScoreClassName(section.coverage))}>
                            {section.coverage}
                            %
                          </Badge>
                        </div>
                        <Progress value={section.coverage} className="mt-4 h-2 bg-muted" />
                        <div className="mt-4 flex flex-wrap gap-2">
                          {section.matchedKeywords.length > 0
                            ? section.matchedKeywords.map(keyword => (
                                <Badge key={`${section.sectionKey}-${keyword}`} variant="secondary">
                                  {keyword}
                                </Badge>
                              ))
                            : <span className="text-sm text-muted-foreground">这个板块还没有承接到 JD 关键词</span>}
                        </div>
                      </ToolPanelBody>
                    </ToolPanelCard>
                  ))}
                </TabsContent>

                <TabsContent value="advice" className="grid gap-3 md:grid-cols-2">
                  {(result.recommendations.length > 0
                    ? result.recommendations
                    : ['当前 JD 命中情况已经比较完整，下一步更值得打磨的是量化结果和经历排序。']).map(item => (
                    <ToolPanelCard key={item}>
                      <ToolPanelBody>
                        <p className="text-sm leading-6 text-foreground/90">{item}</p>
                      </ToolPanelBody>
                    </ToolPanelCard>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )
        : (
            <ToolEmptyState
              title="还没有生成比对结果"
              description="把岗位描述贴进上面的输入框，然后点击“开始比对”。"
            />
          )}
    </div>
  )
}

export default JobDescriptionTool
