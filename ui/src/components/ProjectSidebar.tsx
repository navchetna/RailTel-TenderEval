"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, File, FolderOpen, FolderClosed, Upload, Loader2, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { API_BASE_URL } from "@/lib/constants"

// --- Configuration ---

// --- Type Definitions to match the Python API ---
interface PDFMetadata {
  id: string
  filename: string
  pdf_type?: "tender" | "bid" // Add pdf_type to track document type
}

interface ProjectType {
  id: string
  name: string
  description?: string | null
}

interface ProjectSidebarProps {
  onProjectSelect: (projectId: string | null) => void
}

export function ProjectSidebar({ onProjectSelect }: ProjectSidebarProps) {
  // --- State Management ---
  const [projects, setProjects] = useState<ProjectType[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectPdfs, setProjectPdfs] = useState<PDFMetadata[]>([])
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null)
  const [uploadingFilename, setUploadingFilename] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedPdfType, setSelectedPdfType] = useState<"tender" | "bid">("bid")
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- API Call Functions ---

  const fetchProjects = async () => {
    setIsLoading(true)
    setError(null)

    // If running in preview (not localhost) and API_BASE_URL is localhost, skip the fetch and show a quiet hint.
    if (
      typeof window !== "undefined" &&
      API_BASE_URL.includes("localhost") &&
      window.location.hostname !== "localhost"
    ) {
      setIsLoading(false)
      setError("Backend not connected. Set NEXT_PUBLIC_API_BASE_URL and Retry.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects`)
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewProject = async () => {
    const newProjectName = prompt("Enter new project name:", "New Tender Project")
    if (!newProjectName) return

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: "" }),
      })
      if (!response.ok) throw new Error("Failed to create project")
      await fetchProjects() // Refresh the list
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project and all its data? This cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete project")

      // Clear selections if the deleted project was selected
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null)
        setSelectedPdfId(null)
        setProjectPdfs([])
        onProjectSelect(null) // Notify parent
      }
      await fetchProjects() // Refresh the list
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  const fetchPdfsForProject = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pdfs`)
      if (!response.ok) throw new Error("Failed to fetch PDFs")
      const data = await response.json()
      setProjectPdfs(data)
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !uploadProjectId) return

    setUploadingFilename(file.name) // Show processing indicator with filename
    setIsUploadModalOpen(false) // Close modal

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${uploadProjectId}/pdfs?pdf_type=${selectedPdfType}`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Failed to upload PDF")
      await fetchPdfsForProject(uploadProjectId) // Refresh PDF list
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    } finally {
      setUploadingFilename(null) // Hide processing indicator
      setUploadProjectId(null)
      setSelectedPdfType("bid") // Reset to default
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeletePdf = async (pdfId: string) => {
    if (!selectedProjectId || !window.confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/pdfs/${pdfId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete PDF")

      if (selectedPdfId === pdfId) {
        setSelectedPdfId(null)
      }
      await fetchPdfsForProject(selectedProjectId) // Refresh PDF list
    } catch (err: any) {
      setError(err.message)
      console.error(err)
    }
  }

  // --- Effects ---

  // Initial fetch of projects when component mounts
  useEffect(() => {
    fetchProjects()
  }, [])

  // --- Event Handlers ---

  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId) {
      // If clicking the same project, collapse it
      setSelectedProjectId(null)
      setSelectedPdfId(null)
      setProjectPdfs([])
      onProjectSelect(null) // Notify parent
    } else {
      setSelectedProjectId(projectId)
      setSelectedPdfId(null) // Reset PDF selection
      fetchPdfsForProject(projectId)
      onProjectSelect(projectId) // Notify parent
    }
  }

  const handlePdfSelect = (pdfId: string) => {
    if (selectedPdfId === pdfId) {
      // If clicking the same PDF, collapse it
      setSelectedPdfId(null)
    } else {
      setSelectedPdfId(pdfId)
    }
  }

  const triggerUploadForProject = (projectId: string) => {
    setUploadProjectId(projectId)
    setIsUploadModalOpen(true)
  }

  const confirmUpload = () => {
    fileInputRef.current?.click()
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Function to render document type indicator
  const renderDocTypeIndicator = (pdfType: "tender" | "bid" | undefined) => {
    if (!pdfType) return null
    
    const isT = pdfType === "tender"
    return (
      <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white mr-2 ${
        isT ? 'bg-green-600' : 'bg-orange-500'
      }`}>
        {isT ? 'T' : 'B'}
      </div>
    )
  }

  return (
    <div 
      className={`relative flex flex-col h-[calc(100vh-4rem)] bg-muted/20 border-r border-primary/15 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-15' : 'w-80'
      }`}
    >
      {/* Collapse/Expand Button */}
      {/* Collapse/Expand Button */}
      {/* Collapse/Expand Button */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10">
        <Button
          onClick={toggleSidebar}
          size="icon"
          variant="secondary"
        >
          {isCollapsed ? (
            <ChevronRight className="h-6 w-6" />
          ) : (
            <ChevronLeft className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Header */}
      <div className={`px-2 pt-3 pb-2 border-b border-primary/5 ${isCollapsed ? 'px-1' : ''}`}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <Button
              onClick={handleNewProject}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent border-primary/20 hover:border-primary/30 hover:bg-primary/5"
              title="New Project"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleNewProject}
            variant="outline"
            className="w-full justify-start text-sm bg-transparent border-primary/20 hover:border-primary/30 hover:bg-primary/5"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Loading and Error States */}
      {!isCollapsed && (
        <>
          {isLoading && <p className="p-4 text-muted-foreground text-sm">Loading projects...</p>}
          {error && (
            <div className="mx-2 my-2 flex items-center justify-between rounded-md border border-blue-600/15 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
              <span className="truncate">Couldn't reach API. Set NEXT_PUBLIC_API_BASE_URL and retry.</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-blue-600/15 hover:border-blue-600/25 bg-transparent"
                onClick={fetchProjects}
              >
                Retry
              </Button>
            </div>
          )}
        </>
      )}

      {/* Projects List */}
      <nav className={`flex-1 py-2 space-y-1 overflow-y-auto ${isCollapsed ? 'px-1' : 'px-2'}`}>
        {projects.map((project) => (
          <div key={project.id}>
            {isCollapsed ? (
              // Collapsed view - just folder icons
              <div
                onClick={() => handleProjectSelect(project.id)}
                className="flex items-center justify-center p-2 text-sm font-medium text-foreground/80 rounded-md hover:bg-accent cursor-pointer transition-colors"
                title={project.name}
              >
                {selectedProjectId === project.id ? (
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <FolderClosed className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            ) : (
              // Expanded view - full project info
              <>
                <div
                  onClick={() => handleProjectSelect(project.id)}
                  className="flex items-center p-2 text-sm font-medium text-foreground/80 rounded-md hover:bg-accent cursor-pointer group transition-colors"
                >
                  {selectedProjectId === project.id ? (
                    <FolderOpen className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <FolderClosed className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate">{project.name}</span>
                  <Upload
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerUploadForProject(project.id)
                    }}
                    className="h-4 w-4 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                  />
                  <Trash2
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    className="h-4 w-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* Project files - only show when expanded and project is selected */}
                {selectedProjectId === project.id && (
                  <div className="pl-6 mt-1 space-y-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
                    {uploadingFilename && (
                      <div className="flex items-center p-2 text-xs font-medium text-muted-foreground rounded-md">
                        <Loader2 className="mr-3 h-4 w-4 flex-shrink-0 animate-spin" />
                        <span className="flex-1 truncate">Processing {uploadingFilename}...</span>
                      </div>
                    )}
                    {projectPdfs.map((pdf) => (
                      <div key={pdf.id}>
                        <div
                          onClick={() => handlePdfSelect(pdf.id)}
                          className="flex items-center p-2 text-xs font-medium text-foreground/70 rounded-md hover:bg-accent cursor-pointer group transition-colors"
                        >
                          {renderDocTypeIndicator(pdf.pdf_type)}
                          <File className="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{pdf.filename}</span>
                          <Trash2
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePdf(pdf.id)
                            }}
                            className="h-3 w-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Upload Type Selection Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Document Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup defaultValue="bid" onValueChange={(value: "tender" | "bid") => setSelectedPdfType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tender" id="tender" />
                <Label htmlFor="tender">Tender Document</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bid" id="bid" />
                <Label htmlFor="bid">Bid Document</Label>
              </div>
            </RadioGroup>
          </div>
          <Button onClick={confirmUpload}>Select File</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default ProjectSidebar