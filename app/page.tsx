'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
  FiSearch,
  FiCheck,
  FiX,
  FiLoader,
  FiBriefcase,
  FiBuilding,
  FiClock,
  FiAward,
  FiMapPin,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiTrendingUp,
  FiTarget,
  FiInfo,
  FiAlertCircle,
  FiRefreshCw,
  FiExternalLink,
} from 'react-icons/fi'

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────
const AGENT_ID = '69a143a9356416effea7c01c'
const STORAGE_KEY = 'networth-estimator-history'

// ──────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────
interface EstimationData {
  profile_name: string
  current_title: string
  current_company: string
  industry: string
  location: string
  net_worth_low: number
  net_worth_high: number
  currency: string
  percentile_ranking: string
  percentile_number: number
  industry_comparison: string
  confidence_level: string
  confidence_score: number
  factor_job_title_weight: number
  factor_company_weight: number
  factor_work_history_weight: number
  factor_education_weight: number
  factor_industry_location_weight: number
  factor_network_weight: number
  factor_job_title_detail: string
  factor_company_detail: string
  factor_work_history_detail: string
  factor_education_detail: string
  factor_industry_location_detail: string
  factor_network_detail: string
  estimation_methodology: string
  key_assumptions: string
  analysis_summary: string
}

interface HistoryItem {
  id: string
  url: string
  data: EstimationData
  timestamp: string
}

// ──────────────────────────────────────────
// Sample Data
// ──────────────────────────────────────────
const SAMPLE_DATA: EstimationData = {
  profile_name: 'Sarah Chen',
  current_title: 'VP of Engineering',
  current_company: 'Stripe',
  industry: 'Financial Technology',
  location: 'San Francisco, CA',
  net_worth_low: 4200000,
  net_worth_high: 7800000,
  currency: 'USD',
  percentile_ranking: 'Top 5% in Financial Technology',
  percentile_number: 5,
  industry_comparison: 'Significantly above median for VP-level engineers in FinTech. Stripe equity appreciation and competitive base compensation place this individual well above industry benchmarks.',
  confidence_level: 'High',
  confidence_score: 82,
  factor_job_title_weight: 28,
  factor_company_weight: 25,
  factor_work_history_weight: 18,
  factor_education_weight: 10,
  factor_industry_location_weight: 12,
  factor_network_weight: 7,
  factor_job_title_detail: 'VP of Engineering is a senior leadership role typically commanding $350K-$500K base salary plus substantial equity grants. At Stripe, this level carries significant RSU packages with strong vesting schedules.',
  factor_company_detail: 'Stripe is a privately-held payments infrastructure company valued at $50B+. Senior leadership equity grants have appreciated significantly, contributing a substantial portion of estimated net worth.',
  factor_work_history_detail: 'Over 15 years in software engineering with progressive advancement through senior IC and management tracks. Previous roles at Google and a YC-backed startup suggest strong compensation trajectory.',
  factor_education_detail: 'MS Computer Science from Stanford University. Elite educational background correlates with higher earning potential and access to premium career opportunities in Silicon Valley.',
  factor_industry_location_detail: 'San Francisco Bay Area commands the highest tech compensation globally. FinTech sector continues to see strong compensation growth, particularly at infrastructure-level companies like Stripe.',
  factor_network_detail: 'Extensive network of 2,800+ connections including prominent VCs, CTOs, and founders. Board advisor role at two early-stage startups suggests additional equity holdings.',
  estimation_methodology: 'This estimate combines publicly available compensation benchmark data, industry salary surveys (Levels.fyi, Glassdoor, Blind), SEC filings for comparable public companies, and statistical modeling based on career trajectory analysis. The range accounts for variance in equity vesting schedules and market conditions.',
  key_assumptions: 'Assumes standard vesting schedule for Stripe equity, no major liquidity events or secondary sales, moderate personal savings rate (25-35% of gross income), and current market valuations for private company equity. Housing wealth is included based on Bay Area median for this income level.',
  analysis_summary: 'Sarah Chen represents a high-earning senior technology leader whose net worth is primarily driven by a combination of accumulated Stripe equity, competitive cash compensation, and prudent career trajectory through top-tier companies. The estimate reflects strong upside potential tied to Stripe IPO or secondary market events.',
}

const SAMPLE_HISTORY: HistoryItem[] = [
  {
    id: 'sample-1',
    url: 'https://linkedin.com/in/sarahchen',
    data: SAMPLE_DATA,
    timestamp: '2026-02-27T10:30:00Z',
  },
  {
    id: 'sample-2',
    url: 'https://linkedin.com/in/jamespark',
    data: {
      ...SAMPLE_DATA,
      profile_name: 'James Park',
      current_title: 'Senior Product Manager',
      current_company: 'Google',
      industry: 'Technology',
      location: 'Mountain View, CA',
      net_worth_low: 1800000,
      net_worth_high: 3200000,
      percentile_ranking: 'Top 15% in Technology',
      percentile_number: 15,
      confidence_score: 75,
      confidence_level: 'Medium-High',
    },
    timestamp: '2026-02-26T14:15:00Z',
  },
  {
    id: 'sample-3',
    url: 'https://linkedin.com/in/mariagarcia',
    data: {
      ...SAMPLE_DATA,
      profile_name: 'Maria Garcia',
      current_title: 'Managing Director',
      current_company: 'Goldman Sachs',
      industry: 'Investment Banking',
      location: 'New York, NY',
      net_worth_low: 8500000,
      net_worth_high: 15000000,
      percentile_ranking: 'Top 2% in Investment Banking',
      percentile_number: 2,
      confidence_score: 70,
      confidence_level: 'Medium',
    },
    timestamp: '2026-02-25T09:00:00Z',
  },
]

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function formatCurrency(value: number, currency?: string): string {
  const c = currency || 'USD'
  const symbol = c === 'USD' ? '$' : c === 'EUR' ? '\u20AC' : c === 'GBP' ? '\u00A3' : `${c} `
  if (value >= 1_000_000_000) {
    return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(0)}K`
  }
  return `${symbol}${value}`
}

function formatDate(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

function isValidLinkedInUrl(url: string): boolean {
  if (!url) return false
  return /linkedin\.com\/in\//i.test(url.trim())
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function parseAgentResponse(result: any): EstimationData | null {
  try {
    let data = result?.response?.result

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        data = parseLLMJson(data)
      }
    }

    if (data && typeof data === 'object' && 'result' in data && typeof data.result === 'object') {
      data = data.result
    }

    if (!data || typeof data !== 'object') return null

    return {
      profile_name: data.profile_name || 'Unknown',
      current_title: data.current_title || '',
      current_company: data.current_company || '',
      industry: data.industry || '',
      location: data.location || '',
      net_worth_low: Number(data.net_worth_low) || 0,
      net_worth_high: Number(data.net_worth_high) || 0,
      currency: data.currency || 'USD',
      percentile_ranking: data.percentile_ranking || '',
      percentile_number: Number(data.percentile_number) || 0,
      industry_comparison: data.industry_comparison || '',
      confidence_level: data.confidence_level || 'Medium',
      confidence_score: Number(data.confidence_score) || 50,
      factor_job_title_weight: Number(data.factor_job_title_weight) || 0,
      factor_company_weight: Number(data.factor_company_weight) || 0,
      factor_work_history_weight: Number(data.factor_work_history_weight) || 0,
      factor_education_weight: Number(data.factor_education_weight) || 0,
      factor_industry_location_weight: Number(data.factor_industry_location_weight) || 0,
      factor_network_weight: Number(data.factor_network_weight) || 0,
      factor_job_title_detail: data.factor_job_title_detail || '',
      factor_company_detail: data.factor_company_detail || '',
      factor_work_history_detail: data.factor_work_history_detail || '',
      factor_education_detail: data.factor_education_detail || '',
      factor_industry_location_detail: data.factor_industry_location_detail || '',
      factor_network_detail: data.factor_network_detail || '',
      estimation_methodology: data.estimation_methodology || '',
      key_assumptions: data.key_assumptions || '',
      analysis_summary: data.analysis_summary || '',
    }
  } catch {
    return null
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-medium text-sm mt-3 mb-1 tracking-wide">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-medium text-base mt-3 mb-1 tracking-wide">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-medium text-lg mt-4 mb-2 tracking-wide">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

// ──────────────────────────────────────────
// Loading Steps
// ──────────────────────────────────────────
const LOADING_STEPS = [
  'Researching profile...',
  'Gathering compensation data...',
  'Analyzing financial signals...',
  'Computing net worth estimate...',
]

// ──────────────────────────────────────────
// Factor Config
// ──────────────────────────────────────────
const FACTOR_CONFIG = [
  { key: 'job_title', label: 'Job Title & Seniority', icon: FiBriefcase, color: 'bg-amber-700' },
  { key: 'company', label: 'Company & Compensation', icon: FiBuilding, color: 'bg-amber-800' },
  { key: 'work_history', label: 'Work History & Tenure', icon: FiClock, color: 'bg-stone-600' },
  { key: 'education', label: 'Education & Credentials', icon: FiAward, color: 'bg-stone-500' },
  { key: 'industry_location', label: 'Industry & Location', icon: FiMapPin, color: 'bg-amber-600' },
  { key: 'network', label: 'Network & Influence', icon: FiUsers, color: 'bg-stone-400' },
] as const

// ──────────────────────────────────────────
// ErrorBoundary
// ──────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-medium mb-2 tracking-wide">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm tracking-wider uppercase"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ──────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────

function LoadingState({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-4">
          <FiLoader className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground font-light">
            {LOADING_STEPS[stepIndex % LOADING_STEPS.length]}
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
      <div className="w-16 h-16 border border-border flex items-center justify-center mb-8">
        <FiDollarSign className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-3 text-foreground">
        Estimate Net Worth
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm font-light">
        Paste a LinkedIn profile URL above to receive an AI-powered net worth estimation with detailed factor analysis and confidence scoring.
      </p>
    </div>
  )
}

function ConfidenceIndicator({ score, level }: { score: number; level: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-700'
    if (s >= 60) return 'text-amber-700'
    return 'text-stone-500'
  }
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeDasharray={`${(score / 100) * 125.6} 125.6`}
            strokeLinecap="square"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${getColor(score)}`}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Confidence</p>
        <p className="text-sm font-light">{level}</p>
      </div>
    </div>
  )
}

function FactorBar({
  label,
  weight,
  detail,
  icon: Icon,
  colorClass,
}: {
  label: string
  weight: number
  detail: string
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full text-left group">
          <div className="flex items-center gap-3 mb-1.5">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs uppercase tracking-[0.1em] text-foreground font-light flex-1">{label}</span>
            <span className="text-xs text-muted-foreground font-light tabular-nums">{weight}%</span>
            {open ? (
              <FiChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <FiChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="w-full h-1.5 bg-secondary overflow-hidden">
            <div
              className={`h-full ${colorClass} transition-all duration-500`}
              style={{ width: `${Math.min(weight, 100)}%` }}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 pl-7 pr-4 pb-2">
          <p className="text-xs text-muted-foreground leading-relaxed font-light">{detail}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function EstimationResult({ data }: { data: EstimationData }) {
  return (
    <div className="space-y-8 py-8">
      {/* Profile Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-light tracking-[0.1em]">{data.profile_name}</h2>
        <p className="text-sm text-muted-foreground font-light">
          {data.current_title}{data.current_company ? ` at ${data.current_company}` : ''}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-light">
          {data.industry && (
            <span className="flex items-center gap-1">
              <FiBriefcase className="w-3 h-3" />
              {data.industry}
            </span>
          )}
          {data.location && (
            <span className="flex items-center gap-1">
              <FiMapPin className="w-3 h-3" />
              {data.location}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Net Worth Range */}
      <div className="text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light">Estimated Net Worth</p>
        <div className="flex items-baseline justify-center gap-3">
          <span className="text-3xl font-light tracking-wide text-foreground">
            {formatCurrency(data.net_worth_low, data.currency)}
          </span>
          <span className="text-lg text-muted-foreground font-light">&mdash;</span>
          <span className="text-3xl font-light tracking-wide text-foreground">
            {formatCurrency(data.net_worth_high, data.currency)}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          {data.percentile_ranking && (
            <Badge variant="outline" className="text-xs font-light tracking-wider uppercase border-primary/30 text-primary px-3 py-1">
              {data.percentile_ranking}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Confidence + Industry Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-none">
          <CardContent className="p-5">
            <ConfidenceIndicator score={data.confidence_score} level={data.confidence_level} />
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground mb-2">Industry Comparison</p>
            <p className="text-sm font-light leading-relaxed text-foreground">{data.industry_comparison || 'No comparison data available.'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Factor Breakdown */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xs uppercase tracking-[0.2em] font-light text-muted-foreground">Factor Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {FACTOR_CONFIG.map((f) => {
            const weightKey = `factor_${f.key}_weight` as keyof EstimationData
            const detailKey = `factor_${f.key}_detail` as keyof EstimationData
            return (
              <FactorBar
                key={f.key}
                label={f.label}
                weight={Number(data[weightKey]) || 0}
                detail={String(data[detailKey] || '')}
                icon={f.icon}
                colorClass={f.color}
              />
            )
          })}
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      {data.analysis_summary && (
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-[0.2em] font-light text-muted-foreground">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-light leading-relaxed text-foreground">
              {renderMarkdown(data.analysis_summary)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodology + Assumptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.estimation_methodology && (
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] font-light text-muted-foreground flex items-center gap-2">
                <FiInfo className="w-3.5 h-3.5" />
                Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-light leading-relaxed text-muted-foreground">
                {renderMarkdown(data.estimation_methodology)}
              </div>
            </CardContent>
          </Card>
        )}
        {data.key_assumptions && (
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] font-light text-muted-foreground flex items-center gap-2">
                <FiTarget className="w-3.5 h-3.5" />
                Key Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-light leading-relaxed text-muted-foreground">
                {renderMarkdown(data.key_assumptions)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function HistorySidebarItem({
  item,
  isActive,
  onSelect,
  onDelete,
}: {
  item: HistoryItem
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`group p-3 border-b border-border cursor-pointer transition-colors ${isActive ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light truncate">{item.data.profile_name}</p>
          <p className="text-xs text-muted-foreground font-light truncate mt-0.5">
            {formatCurrency(item.data.net_worth_low, item.data.currency)} &mdash; {formatCurrency(item.data.net_worth_high, item.data.currency)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground font-light">{formatDate(item.timestamp)}</span>
            {item.data.industry && (
              <Badge variant="outline" className="text-[10px] font-light px-1.5 py-0 h-4 border-border">
                {item.data.industry}
              </Badge>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
          aria-label="Delete"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
export default function Page() {
  // State
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [estimation, setEstimation] = useState<EstimationData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save history to localStorage
  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [])

  // Loading step animation
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [loading])

  // Sample mode
  useEffect(() => {
    if (sampleMode) {
      setEstimation(SAMPLE_DATA)
      setUrl('https://linkedin.com/in/sarahchen')
      setHistory(SAMPLE_HISTORY)
      setActiveHistoryId('sample-1')
      setError(null)
    } else {
      setEstimation(null)
      setUrl('')
      setActiveHistoryId(null)
      // Restore real history from storage
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setHistory(parsed)
          } else {
            setHistory([])
          }
        } else {
          setHistory([])
        }
      } catch {
        setHistory([])
      }
    }
  }, [sampleMode])

  // Validation
  const urlValid = isValidLinkedInUrl(url)
  const urlTouched = url.length > 0

  // Estimate handler
  const handleEstimate = useCallback(async () => {
    if (!urlValid || loading) return
    setLoading(true)
    setError(null)
    setEstimation(null)
    setActiveHistoryId(null)
    setLoadingStep(0)
    setActiveAgentId(AGENT_ID)

    try {
      const result = await callAIAgent(
        `Analyze this LinkedIn profile and estimate net worth: ${url.trim()}`,
        AGENT_ID
      )
      setActiveAgentId(null)

      if (result.success) {
        const parsed = parseAgentResponse(result)
        if (parsed) {
          setEstimation(parsed)
          const newItem: HistoryItem = {
            id: generateId(),
            url: url.trim(),
            data: parsed,
            timestamp: new Date().toISOString(),
          }
          const updated = [newItem, ...history.filter((h) => !h.id.startsWith('sample-'))]
          saveHistory(updated)
          setActiveHistoryId(newItem.id)
        } else {
          setError('Unable to parse the estimation response. Please try again.')
        }
      } else {
        setError(result?.error || 'Agent request failed. Please try again.')
      }
    } catch (e) {
      setActiveAgentId(null)
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [url, urlValid, loading, history, saveHistory])

  // Select history item
  const handleSelectHistory = useCallback((item: HistoryItem) => {
    setEstimation(item.data)
    setUrl(item.url)
    setActiveHistoryId(item.id)
    setError(null)
  }, [])

  // Delete history item
  const handleDeleteHistory = useCallback(
    (id: string) => {
      const updated = history.filter((h) => h.id !== id)
      saveHistory(updated)
      if (activeHistoryId === id) {
        setEstimation(null)
        setActiveHistoryId(null)
      }
    },
    [history, activeHistoryId, saveHistory]
  )

  // New estimation
  const handleNew = useCallback(() => {
    setEstimation(null)
    setUrl('')
    setActiveHistoryId(null)
    setError(null)
  }, [])

  // Filtered history
  const filteredHistory = sidebarSearch
    ? history.filter(
        (h) =>
          h.data.profile_name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          h.data.industry.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          h.data.current_company.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : history

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-primary/40 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-sm font-light tracking-[0.2em] uppercase font-serif">
              NetWorth Estimator
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="sample-toggle" className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-light cursor-pointer">
              Sample Data
            </Label>
            <Switch
              id="sample-toggle"
              checked={sampleMode}
              onCheckedChange={setSampleMode}
            />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`border-r border-border bg-card flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'}`}
          >
            {sidebarOpen && (
              <>
                <div className="p-4 border-b border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-light">History</p>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Collapse sidebar"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs uppercase tracking-[0.1em] font-light"
                    onClick={handleNew}
                  >
                    <FiPlus className="w-3.5 h-3.5 mr-2" />
                    New Estimation
                  </Button>
                  <div className="relative">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search history..."
                      className="pl-8 h-8 text-xs font-light"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {filteredHistory.length === 0 ? (
                    <div className="p-6 text-center">
                      <FiClock className="w-6 h-6 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground font-light">
                        {sidebarSearch ? 'No matching estimations' : 'No estimations yet'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 font-light">
                        {sidebarSearch ? 'Try a different search term' : 'Your estimation history will appear here'}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <HistorySidebarItem
                        key={item.id}
                        item={item}
                        isActive={activeHistoryId === item.id}
                        onSelect={() => handleSelectHistory(item)}
                        onDelete={() => handleDeleteHistory(item.id)}
                      />
                    ))
                  )}
                </ScrollArea>
              </>
            )}
          </aside>

          {/* Sidebar Toggle (when collapsed) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-card border border-l-0 border-border px-1.5 py-3 hover:bg-secondary transition-colors"
              aria-label="Expand sidebar"
            >
              <FiChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* URL Input */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-light block">
                  LinkedIn Profile URL
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <FiExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Paste LinkedIn profile URL..."
                      className="pl-10 pr-10 h-11 text-sm font-light tracking-wide"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && urlValid && !loading) {
                          handleEstimate()
                        }
                      }}
                      disabled={loading}
                    />
                    {urlTouched && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {urlValid ? (
                          <FiCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FiX className="w-4 h-4 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleEstimate}
                    disabled={!urlValid || loading}
                    className="h-11 px-6 text-xs uppercase tracking-[0.15em] font-light"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing
                      </>
                    ) : (
                      <>
                        <FiTrendingUp className="w-4 h-4 mr-2" />
                        Estimate
                      </>
                    )}
                  </Button>
                </div>
                {urlTouched && !urlValid && (
                  <p className="text-xs text-destructive font-light flex items-center gap-1.5">
                    <FiAlertCircle className="w-3 h-3" />
                    Please enter a valid LinkedIn URL (e.g., linkedin.com/in/username)
                  </p>
                )}
              </div>

              {/* Error State */}
              {error && !loading && (
                <Card className="mt-6 border-destructive/30 shadow-none">
                  <CardContent className="p-5 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-light text-foreground">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs uppercase tracking-[0.1em] font-light"
                        onClick={handleEstimate}
                        disabled={!urlValid}
                      >
                        <FiRefreshCw className="w-3.5 h-3.5 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {loading && <LoadingState stepIndex={loadingStep} />}

              {/* Results */}
              {!loading && estimation && <EstimationResult data={estimation} />}

              {/* Empty State */}
              {!loading && !estimation && !error && <EmptyState />}
            </div>

            {/* Agent Info Footer */}
            <div className="border-t border-border px-6 py-4 mt-auto">
              <div className="max-w-3xl mx-auto">
                <Card className="border-border shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-light mb-1">Powered By</p>
                        <p className="text-xs font-light text-foreground">Estimation Coordinator</p>
                        <p className="text-[10px] text-muted-foreground font-light mt-0.5">
                          Manager agent coordinating Profile Research and Net Worth Analysis sub-agents
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${activeAgentId ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                        <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-light">
                          {activeAgentId ? 'Processing' : 'Ready'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
