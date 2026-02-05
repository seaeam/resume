import type { ORDERType, VisibilityItemsType } from '@/lib/schema'
import parser from 'html-react-parser'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import useAge from '@/hooks/useAge'
import { DEFAULT_VISIBILITY } from '@/lib/schema'

// 简历数据结构（从 Supabase 获取）
interface ResumeData {
  type?: string
  basics?: any
  jobIntent?: any
  eduBackground?: any
  workExperience?: any
  internshipExperience?: any
  campusExperience?: any
  projectExperience?: any
  skillSpecialty?: any
  honorsCertificates?: any
  selfEvaluation?: any
  hobbies?: any
  applicationInfo?: any
  order?: ORDERType[]
  visibility?: Record<VisibilityItemsType, boolean>
}

interface ResumePreviewThumbnailProps {
  data: ResumeData
}

// 默认样式配置
const defaultTheme = {
  primaryColor: '#1a1a1a',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMuted: '#888888',
}

const defaultFont = {
  nameSize: '24px',
  jobIntentSize: '14px',
  sectionTitleSize: '16px',
  contentSize: '12px',
  smallSize: '10px',
  boldWeight: 700,
  mediumWeight: 500,
}

const defaultSpacing = {
  sectionMargin: '16px',
  sectionTitleMargin: '8px',
  itemSpacing: '6px',
  lineHeight: '1.5',
}

// 简化的简历预览组件
export function ResumePreviewThumbnail({ data }: ResumePreviewThumbnailProps) {
  const visibility = data.visibility || DEFAULT_VISIBILITY
  const order = data.order || ['basics', 'eduBackground', 'workExperience', 'projectExperience', 'skillSpecialty', 'selfEvaluation']
  const age = useAge(data.basics?.birthMonth)

  const getVisibility = (id: VisibilityItemsType) => visibility[id] ?? false

  // A4 尺寸：210mm x 297mm，使用 px 单位方便计算
  // 1mm ≈ 3.78px，210mm ≈ 794px，297mm ≈ 1123px
  const a4Width = 794
  const a4Height = 1123

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        padding: '8px',
      }}
    >
      {/* A4 纸张容器 */}
      <div
        style={{
          width: `${a4Width}px`,
          height: `${a4Height}px`,
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transform: 'scale(0.35)',
          transformOrigin: 'top center',
          flexShrink: 0,
        }}
      >
        {order.map((moduleType: ORDERType) => {
          if (moduleType !== 'basics' && getVisibility(moduleType))
            return null

          switch (moduleType) {
            case 'basics':
              return <BasicsSection key={moduleType} data={data} age={age} />
            case 'eduBackground':
              return data.eduBackground?.items?.length > 0
                ? <EduSection key={moduleType} data={data.eduBackground} />
                : null
            case 'workExperience':
              return data.workExperience?.items?.length > 0
                ? <WorkSection key={moduleType} data={data.workExperience} />
                : null
            case 'internshipExperience':
              return data.internshipExperience?.items?.length > 0
                ? <InternshipSection key={moduleType} data={data.internshipExperience} />
                : null
            case 'projectExperience':
              return data.projectExperience?.items?.length > 0
                ? <ProjectSection key={moduleType} data={data.projectExperience} />
                : null
            case 'campusExperience':
              return data.campusExperience?.items?.length > 0
                ? <CampusSection key={moduleType} data={data.campusExperience} />
                : null
            case 'skillSpecialty':
              return (data.skillSpecialty?.description || data.skillSpecialty?.skills?.length > 0)
                ? <SkillSection key={moduleType} data={data.skillSpecialty} />
                : null
            case 'honorsCertificates':
              return (data.honorsCertificates?.description || data.honorsCertificates?.certificates?.length > 0)
                ? <HonorsSection key={moduleType} data={data.honorsCertificates} />
                : null
            case 'selfEvaluation':
              return data.selfEvaluation?.content
                ? <SelfEvalSection key={moduleType} data={data.selfEvaluation} />
                : null
            case 'hobbies':
              return (data.hobbies?.description || data.hobbies?.hobbies?.length > 0)
                ? <HobbiesSection key={moduleType} data={data.hobbies} />
                : null
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

// Section 组件
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: defaultSpacing.sectionMargin }}>
      <h2
        style={{
          margin: 0,
          fontSize: defaultFont.sectionTitleSize,
          fontWeight: defaultFont.boldWeight,
          color: defaultTheme.primaryColor,
          marginBottom: defaultSpacing.sectionTitleMargin,
          paddingBottom: '4px',
          borderBottom: `2px solid ${defaultTheme.primaryColor}`,
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: defaultSpacing.itemSpacing }}>
        {children}
      </div>
    </section>
  )
}

// Entry 组件
function Entry({ title, subtitle, duration, content }: {
  title: string
  subtitle?: string
  duration?: string
  content?: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: defaultFont.contentSize,
              fontWeight: defaultFont.boldWeight,
              color: defaultTheme.textPrimary,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <span style={{ fontSize: defaultFont.contentSize, color: defaultTheme.textSecondary }}>
              {subtitle}
            </span>
          )}
        </div>
        {duration && (
          <div style={{ fontSize: defaultFont.smallSize, color: defaultTheme.textMuted, whiteSpace: 'nowrap' }}>
            {duration}
          </div>
        )}
      </div>
      {content && <div style={{ fontSize: defaultFont.contentSize, lineHeight: defaultSpacing.lineHeight }}>{parser(content)}</div>}
    </div>
  )
}

function formatDuration(duration?: string[]) {
  return duration?.[0] ? `${duration[0]} - ${duration[1] || '至今'}` : undefined
}

// Basics Section
function BasicsSection({ data, age }: { data: ResumeData, age?: string | number }) {
  const { basics, jobIntent } = data
  if (!basics)
    return null

  return (
    <header style={{ textAlign: 'center', marginBottom: defaultSpacing.sectionMargin, paddingBottom: defaultSpacing.itemSpacing }}>
      <h1
        style={{
          margin: 0,
          fontSize: defaultFont.nameSize,
          fontWeight: defaultFont.boldWeight,
          color: defaultTheme.primaryColor,
          marginBottom: '8px',
        }}
      >
        {basics.name || '姓名'}
      </h1>
      {jobIntent?.jobIntent && (
        <div style={{ fontSize: defaultFont.jobIntentSize, color: defaultTheme.textSecondary, marginBottom: '8px' }}>
          求职意向：
          {jobIntent.jobIntent}
          {jobIntent.intentionalCity && ` | ${jobIntent.intentionalCity}`}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: defaultFont.contentSize, flexWrap: 'wrap' }}>
        {age && (
          <span>
            {age}
            岁
          </span>
        )}
        {basics.phone && <span>{basics.phone}</span>}
        {basics.email && <span>{basics.email}</span>}
      </div>
    </header>
  )
}

// Education Section
function EduSection({ data }: { data: any }) {
  return (
    <Section title="教育背景">
      {data.items?.map((item: any, i: number) => (
        <Entry
          key={`edu-${i}`}
          title={item.schoolName}
          subtitle={item.degree !== '不填' ? `${item.professional}（${item.degree}）` : item.professional}
          duration={formatDuration(item.duration)}
          content={item.eduInfo}
        />
      ))}
    </Section>
  )
}

// Work Section
function WorkSection({ data }: { data: any }) {
  return (
    <Section title="工作经历">
      {data.items?.map((item: any, i: number) => (
        <Entry
          key={`work-${i}`}
          title={item.companyName}
          subtitle={item.position}
          duration={formatDuration(item.workDuration)}
          content={item.workInfo}
        />
      ))}
    </Section>
  )
}

// Internship Section
function InternshipSection({ data }: { data: any }) {
  return (
    <Section title="实习经验">
      {data.items?.map((item: any, i: number) => (
        <Entry
          key={`intern-${i}`}
          title={item.companyName}
          subtitle={item.position}
          duration={formatDuration(item.internshipDuration)}
          content={item.internshipInfo}
        />
      ))}
    </Section>
  )
}

// Project Section
function ProjectSection({ data }: { data: any }) {
  return (
    <Section title="项目经验">
      {data.items?.map((item: any, i: number) => (
        <Entry
          key={`project-${i}`}
          title={item.projectName}
          subtitle={item.participantRole}
          duration={formatDuration(item.projectDuration)}
          content={item.projectInfo}
        />
      ))}
    </Section>
  )
}

// Campus Section
function CampusSection({ data }: { data: any }) {
  return (
    <Section title="校园经历">
      {data.items?.map((item: any, i: number) => (
        <Entry
          key={`campus-${i}`}
          title={item.experienceName}
          subtitle={item.role}
          duration={formatDuration(item.duration)}
          content={item.campusInfo}
        />
      ))}
    </Section>
  )
}

// Skill Section
function SkillSection({ data }: { data: any }) {
  return (
    <Section title="技能特长">
      {data.description && <div style={{ fontSize: defaultFont.contentSize, lineHeight: defaultSpacing.lineHeight }}>{parser(data.description)}</div>}
    </Section>
  )
}

// Honors Section
function HonorsSection({ data }: { data: any }) {
  return (
    <Section title="荣誉证书">
      {data.description && <div style={{ fontSize: defaultFont.contentSize, lineHeight: defaultSpacing.lineHeight }}>{parser(data.description)}</div>}
      {data.certificates?.length > 0 && (
        <div style={{ fontSize: defaultFont.contentSize }}>
          {data.certificates.map((cert: any, i: number) => (
            <span key={`cert-${i}`}>
              {i > 0 && '、'}
              {cert.name}
            </span>
          ))}
        </div>
      )}
    </Section>
  )
}

// Self Evaluation Section
function SelfEvalSection({ data }: { data: any }) {
  return (
    <Section title="自我评价">
      <div style={{ fontSize: defaultFont.contentSize, lineHeight: defaultSpacing.lineHeight }}>{parser(data.content)}</div>
    </Section>
  )
}

// Hobbies Section
function HobbiesSection({ data }: { data: any }) {
  return (
    <Section title="兴趣爱好">
      {data.description && <div style={{ fontSize: defaultFont.contentSize, lineHeight: defaultSpacing.lineHeight }}>{parser(data.description)}</div>}
      {data.hobbies?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {data.hobbies.map((hobby: any, i: number) => (
            <Badge variant="outline" key={`hobby-${i}`} style={{ fontSize: defaultFont.smallSize }}>
              {hobby.name}
            </Badge>
          ))}
        </div>
      )}
    </Section>
  )
}
