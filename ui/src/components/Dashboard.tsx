"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Eye,
  BarChart3,
  CheckCircle,
  Clock,
  FolderOpen,
  FileText,
  AlertCircle,
  ClipboardList,
  Upload,
  Target,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react"
import ProjectSidebar from "./ProjectSidebar"
import ComparisonView from "./ComparisonView"
import ProcessingView from "./ProcessingView"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/constants"

// Recharts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts"

// --- Type Definitions to match the backend API ---
interface ProjectFile {
  id: string
  name: string
  type: "tender" | "bid"
  bidderName?: string
  uploadDate: string
}

interface Project {
  id: string
  name: string
  tenderFile?: ProjectFile
  bidFiles: ProjectFile[]
  createdAt: string
  status: "draft" | "processing" | "completed"
}

// Custom tooltip components
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium text-lg">{data.value}</span> projects
        </p>
        <p className="text-xs text-gray-500">
          {((data.value / 282) * 100).toFixed(1)}% of total
        </p>
      </div>
    )
  }
  return null
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Welcome Content Component
const DashboardWelcome = ({
  onCreateProject,
  onBrowseProjects,
}: {
  onCreateProject: () => void
  onBrowseProjects: () => void
}) => {
  // Enhanced sample data for charts with better colors and values
  const pieData = [
    { name: "Completed", value: 247, color: "#10B981", lightColor: "#D1FAE5" },
    { name: "In Progress", value: 23, color: "#3B82F6", lightColor: "#DBEAFE" },
    { name: "Draft", value: 12, color: "#F59E0B", lightColor: "#FEF3C7" },
  ]

  const monthlyData = [
    { 
      month: "Jan", 
      evaluations: 35, 
      projects: 8,
      completionRate: 92,
      avgTime: 4.2 
    },
    { 
      month: "Feb", 
      evaluations: 42, 
      projects: 12,
      completionRate: 89,
      avgTime: 3.8 
    },
    { 
      month: "Mar", 
      evaluations: 38, 
      projects: 9,
      completionRate: 94,
      avgTime: 4.1 
    },
    { 
      month: "Apr", 
      evaluations: 51, 
      projects: 15,
      completionRate: 91,
      avgTime: 3.5 
    },
    { 
      month: "May", 
      evaluations: 47, 
      projects: 11,
      completionRate: 96,
      avgTime: 3.2 
    },
    { 
      month: "Jun", 
      evaluations: 34, 
      projects: 7,
      completionRate: 88,
      avgTime: 4.0 
    },
  ]

  const performanceData = [
    { month: "Jan", accuracy: 94.2, speed: 87.5 },
    { month: "Feb", accuracy: 95.1, speed: 89.2 },
    { month: "Mar", accuracy: 93.8, speed: 91.1 },
    { month: "Apr", accuracy: 96.2, speed: 88.7 },
    { month: "May", accuracy: 97.1, speed: 92.3 },
    { month: "Jun", accuracy: 95.8, speed: 90.8 },
  ]

  const documentTypes = [
    { category: "Technical Bids", count: 789, percentage: 58.8, color: "#8B5CF6" },
    { category: "Financial Bids", count: 553, percentage: 41.2, color: "#F97316" },
  ]

  return (
    <div className="flex-1 flex flex-col justify-start min-h-[calc(100vh-4rem)] pt-8">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {/* Hero Section - Smaller */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-balance mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Evaluate bids against tenders with accuracy and clarity
          </h2>
          <p className="text-base text-muted-foreground text-balance max-w-xl mx-auto">
            Upload tender documents, add bids, and let our AI system ensure compliance and accuracy for faster, more confident decisions.
          </p>
        </div>

        {/* Analytics Dashboard */}
        <div className="mb-8">

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Evaluations Completed */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 rounded-xl border border-green-200 bg-gradient-to-b from-green-50 to-transparent hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 mb-1">247</h3>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Evaluations Completed</h4>
                <p className="text-xs text-green-600 text-center">+12% this month</p>
              </div>
            </div>

            {/* Ongoing Projects */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50 to-transparent hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-700 mb-1">23</h3>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Ongoing Projects</h4>
                <p className="text-xs text-blue-600 text-center">Currently active</p>
              </div>
            </div>

            {/* Bids Uploaded */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 rounded-xl border border-orange-200 bg-gradient-to-b from-orange-50 to-transparent hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 mb-2">
                  <FolderOpen className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-orange-700 mb-1">1,342</h3>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Bids Uploaded</h4>
                <p className="text-xs text-orange-600 text-center">+18 today</p>
              </div>
            </div>

            {/* Tenders Uploaded */}
            <div className="relative group">
              <div className="flex flex-col items-center p-4 rounded-xl border border-purple-200 bg-gradient-to-b from-purple-50 to-transparent hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-purple-700 mb-1">89</h3>
                <h4 className="font-semibold text-foreground mb-1 text-sm">Tenders Uploaded</h4>
                <p className="text-xs text-purple-600 text-center">+3 this week</p>
              </div>
            </div>
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Enhanced Project Status Pie Chart */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={entry.color}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Monthly Activity Chart */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Monthly Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar 
                        dataKey="evaluations" 
                        name="Evaluations"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar 
                        dataKey="projects" 
                        name="New Projects"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics Area Chart */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 xl:col-span-1 lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        domain={[80, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#accuracyGradient)"
                        name="Accuracy %"
                      />
                      <Area
                        type="monotone"
                        dataKey="speed"
                        stroke="#06B6D4"
                        strokeWidth={2}
                        fill="url(#speedGradient)"
                        name="Processing Speed %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          
          </div>
        </div>

        
      </div>
    
  )
}

// Document Card Component with integrated processing stages
const DocumentCard = ({
  file,
  onOpenPdf,
  stages,
}: {
  file: ProjectFile
  onOpenPdf: (id: string) => void
  stages: Array<{ id: number; title: string; status: "completed" | "pending" | "running" }>
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main document info - clickable for PDF */}
        <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onOpenPdf(file.id)}>
          <div className="flex items-center gap-3">
            <FileText className={`h-5 w-5 ${file.type === "tender" ? "text-green-600" : "text-orange-600"}`} />
            <div className="flex-1">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground">
                {file.bidderName ? `${file.bidderName} • ` : ""}
                Uploaded on {new Date(file.uploadDate).toLocaleDateString()}
              </div>
            </div>
            <Badge variant={file.type === "tender" ? "secondary" : "outline"}>
              {file.type === "tender" ? "Tender" : "Bid"}
            </Badge>
          </div>
        </div>

        {/* Processing stages toggle */}
        <div className="border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded((v) => !v)
            }}
            className="w-full p-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium"></span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Expandable processing stages */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-2 bg-gray-50/50">
              {stages.map((stage) => (
                <div key={stage.id} className="p-2 bg-white rounded flex items-center text-sm">
                  {stage.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  ) : stage.status === "running" ? (
                    <Clock className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 animate-pulse" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{stage.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{stage.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const Dashboard = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("documents")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const stages = [
    { id: 1, title: "Parsing document and creating fast lookup", status: "completed" as const },
    { id: 2, title: "Finding technical and price compliance from TOC", status: "pending" as const },
    { id: 3, title: "Finding compliance requirements from the fast lookup", status: "pending" as const },
    { id: 4, title: "Populating excel sheets", status: "pending" as const },
    { id: 5, title: "Preparing data for scoring", status: "pending" as const },
  ]

  // Fetch project details when activeProjectId changes
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!activeProjectId) {
        setCurrentProject(null)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/projects/${activeProjectId}/details`)
        if (!response.ok) throw new Error("Failed to fetch project details")
        const data = await response.json()
        setCurrentProject(data)
      } catch (err: any) {
        setError(err.message)
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectDetails()
  }, [activeProjectId, refreshTick])

  const handleProcess = () => setActiveTab("processing")
  const handleProcessingComplete = () => setActiveTab("results")
  const handleGenerateReport = () => {
    console.log("Generating final report")
  }

  const handleCreateProject = () => {
    console.log("Creating new project")
    // TODO: Add project creation logic
  }

  const handleBrowseProjects = () => {
    console.log("Browsing existing projects")
    // TODO: Implement navigation / focus sidebar
  }

  // Function to open PDF in new tab
  const openPdfInNewTab = async (pdfId: string) => {
    if (!activeProjectId) return

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${activeProjectId}/pdfs/${pdfId}/view`)
      if (!response.ok) throw new Error("Failed to fetch PDF")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (err) {
      console.error("Error opening PDF:", err)
      alert("Failed to open PDF")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width fixed header with subtle Intel-blue accent and blur */}
      <header className="fixed top-0 inset-x-0 z-50 h-20 border-b border-primary/15 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" aria-hidden="true" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">TenderEval</h1>
              <p className="text-sm text-muted-foreground">
                {currentProject ? `Project: ${currentProject.name}` : "AI-Powered Tender & Bid Evaluation Platform"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Layout: Sidebar + Content */}
      <div className="flex pt-20 min-h-screen">
        {/* Project Sidebar */}
        <ProjectSidebar onProjectSelect={setActiveProjectId} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Loading and Error States */}
          {isLoading && <p className="p-4 text-muted-foreground">Loading project details...</p>}
          {error && (
            <div className="mx-6 mt-4 flex items-center justify-between rounded-md border border-blue-600/15 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
              <span className="truncate">Couldn't reach API. Check NEXT_PUBLIC_API_BASE_URL and retry.</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-blue-600/15 hover:border-blue-600/25 bg-transparent"
                onClick={() => setRefreshTick((v) => v + 1)}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Project Content - Tabs */}
          {currentProject && (
            <div className="px-6 py-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="documents" className="space-y-6">
                  {/* Improved Header Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                          <FolderOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">Project Documents</h2>
                          <p className="text-sm text-muted-foreground"></p>
                        </div>
                      </div>
                      {currentProject.tenderFile && currentProject.bidFiles.length > 0 && (
                        <Button
                          onClick={handleProcess}
                          className="shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-primary to-primary/90"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Resume Process
                        </Button>
                      )}
                    </div>

                    {/* Version Selector - Now below the title */}
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm font-medium text-muted-foreground">Version:</span>
                      <Select defaultValue="latest">
                        <SelectTrigger className="w-40 h-9 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-200">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Latest
                            </div>
                          </SelectItem>
                          <SelectItem value="v1">Version 1</SelectItem>
                          <SelectItem value="v2">Version 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Document Cards with integrated processing stages */}
                  <div className="space-y-4 mt-6">
                    {currentProject.tenderFile && (
                      <DocumentCard file={currentProject.tenderFile} onOpenPdf={openPdfInNewTab} stages={stages} />
                    )}

                    {currentProject.bidFiles.map((file) => (
                      <DocumentCard key={file.id} file={file} onOpenPdf={openPdfInNewTab} stages={stages} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="processing" className="space-y-6">
                  <ProcessingView
                    files={[...(currentProject.tenderFile ? [currentProject.tenderFile] : []), ...currentProject.bidFiles]}
                    onProcessingComplete={handleProcessingComplete}
                    projectId={activeProjectId}
                  />
                </TabsContent>

                <TabsContent value="results" className="space-y-6">
                  <ComparisonView 
                    projectId={activeProjectId || undefined}
                    tenderPdfId={currentProject?.tenderFile?.id}
                    bidPdfId={currentProject?.bidFiles[0]?.id}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Welcome Content - Shows when no project is selected */}
          {!currentProject && !isLoading && (
            <DashboardWelcome onCreateProject={handleCreateProject} onBrowseProjects={handleBrowseProjects} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard