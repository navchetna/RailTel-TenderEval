"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, FileText, Play, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import ReactJson from "react-json-view"
import { API_BASE_URL } from "@/lib/constants"

// --- Configuration ---

// --- Type Definitions ---
interface ProjectFile {
  id: string
  name: string
  type: "tender" | "bid"
  bidderName?: string
  uploadDate: string
}

interface ProcessingStage {
  id: number
  title: string
  description: string
  status: "pending" | "processing" | "completed" | "needs_verification"
}

interface ProcessingViewProps {
  files: ProjectFile[]
  onProcessingComplete: () => void
  projectId: string
}

interface StageResponse {
  [stageId: number]: string
}

const initialStages: ProcessingStage[] = [
  {
    id: 1,
    title: "Parsing document and creating fast lookup",
    description: "",
    status: "completed", // Stage 1 is always completed after upload
  },
  {
    id: 2,
    title: "Finding technical and price compliance from TOC",
    description: "",
    status: "pending",
  },
  {
    id: 3,
    title: "Finding compliance requirements from the fast lookup",
    description: "",
    status: "pending",
  },
  // {
  //   id: 4,
  //   title: "Populating excel sheets",
  //   description: "",
  //   status: "pending",
  // },
  // {
  //   id: 5,
  //   title: "Preparing data for scoring",
  //   description: "",
  //   status: "pending",
  // },
]

const ProcessingView = ({ files, onProcessingComplete, projectId }: ProcessingViewProps) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [currentStage, setCurrentStage] = useState(1) // Start from stage 2 (index 1)
  const [stages, setStages] = useState<ProcessingStage[]>(initialStages)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [stageResponses, setStageResponses] = useState<StageResponse>({})
  const [editableJson, setEditableJson] = useState<{ [stageId: number]: string }>({})

  const currentFile = files[currentFileIndex]
  const isFirstFile = currentFileIndex === 0
  const isLastFile = currentFileIndex === files.length - 1

  // Auto-start processing from stage 2 on component mount
  useEffect(() => {
    startProcessing()
  }, []) // Runs once on mount

  // Trigger processing when currentFileIndex changes (ensures new PDF ID is used)
  useEffect(() => {
    if (currentFileIndex < files.length && !isProcessing && !needsVerification) {
      setStages(initialStages) // Reset stages with stage 1 completed
      setCurrentStage(1) // Start from stage 2
      setStageResponses({}) // Reset responses
      setEditableJson({}) // Reset editable JSON
      setIsProcessing(true)
      setTimeout(() => processNextStage(1), 500) // Start from stage 2 with new PDF ID
    } else if (currentFileIndex >= files.length) {
      onProcessingComplete() // All files done
    }
  }, [currentFileIndex])

  const processNextStage = async (stageIndex: number) => {
    if (stageIndex < stages.length) {
      setStages((prev) =>
        prev.map((stage, index) => (index === stageIndex ? { ...stage, status: "processing" } : stage)),
      )
      // Prepare body if needed (e.g., edited JSON from previous stage)
      let requestBody = undefined
      if (stages[stageIndex].id === 3 && editableJson[2]) {
        try {
          requestBody = JSON.parse(editableJson[2])
        } catch (err) {
          alert("Invalid JSON in stage 2 output. Please correct it before continuing.")
          setStages((prev) =>
            prev.map((stage, index) => (index === stageIndex ? { ...stage, status: "pending" } : stage)),
          )
          setIsProcessing(false)
          return
        }
      } else if (stages[stageIndex].id === 4 && editableJson[3]) {
        try {
          requestBody = JSON.parse(editableJson[3])
        } catch (err) {
          alert("Invalid JSON in stage 3 output. Please correct it before continuing.")
          setStages((prev) =>
            prev.map((stage, index) => (index === stageIndex ? { ...stage, status: "pending" } : stage)),
          )
          setIsProcessing(false)
          return
        }
      }

      // Call backend API
      try {
        const response = await fetch(
          `${API_BASE_URL}/projects/${projectId}/pdfs/${currentFile.id}/stage/${stages[stageIndex].id}`,
          {
            method: "POST",
            headers: requestBody ? { "Content-Type": "application/json" } : undefined,
            body: requestBody ? JSON.stringify({ compliance_sections: requestBody }) : undefined, // Assuming stage 3/4 expect 'compliance_sections' or similar
          },
        )
        if (!response.ok) throw new Error("Failed to process stage")
        const data = await response.json()

        // Format JSON neatly
        const formattedResponse = JSON.stringify(data, null, 2)

        setStageResponses((prev) => ({
          ...prev,
          [stages[stageIndex].id]: formattedResponse, // Display formatted response
        }))

        // Set editable JSON for stages 2 and 3
        if (stages[stageIndex].id === 2 || stages[stageIndex].id === 3) {
          setEditableJson((prev) => ({
            ...prev,
            [stages[stageIndex].id]: formattedResponse,
          }))
        }

        // Set to needs_verification for stages >1
        setStages((prev) =>
          prev.map((stage, index) => (index === stageIndex ? { ...stage, status: "needs_verification" } : stage)),
        )
        setNeedsVerification(true)
        setIsProcessing(false)
      } catch (err: any) {
        const errorMsg = `Error: ${err.message}`
        setStageResponses((prev) => ({
          ...prev,
          [stages[stageIndex].id]: errorMsg,
        }))
        setStages((prev) =>
          prev.map((stage, index) =>
            index === stageIndex
              ? { ...stage, status: "needs_verification" } // Allow verification even on error
              : stage,
          ),
        )
        setNeedsVerification(true)
        setIsProcessing(false)
      }
    }
  }

  // Update startProcessing to use the new signature
  const startProcessing = () => {
    setIsProcessing(true)
    setIsPaused(false)
    processNextStage(currentStage)
  }

  // Update verifyStage to use the new signature
  const verifyStage = () => {
    setStages((prev) =>
      prev.map((stage, index) => (index === currentStage ? { ...stage, status: "completed" } : stage)),
    )
    setNeedsVerification(false)
    if (currentStage < stages.length - 1) {
      setCurrentStage((prev) => prev + 1)
      setIsProcessing(true)
      setTimeout(() => processNextStage(currentStage + 1), 500)
    } else {
      // File processing complete
      if (isFirstFile && !isLastFile) {
        setShowContinueDialog(true)
      } else if (isLastFile) {
        onProcessingComplete()
      } else {
        setCurrentFileIndex((prev) => prev + 1) // Move to next file, triggering useEffect
      }
    }
  }

  const continueWithRemainingFiles = () => {
    setShowContinueDialog(false)
    setCurrentFileIndex((prev) => prev + 1) // Move to next file, triggering useEffect
  }

  const getStageIcon = (status: ProcessingStage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "processing":
        return <Clock className="h-4 w-4 text-primary animate-spin" />
      case "needs_verification":
        return <AlertCircle className="h-4 w-4 text-warning" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />
    }
  }

  const getFileStatusIcon = (index: number) => {
    if (index < currentFileIndex) {
      return <CheckCircle className="h-3 w-3 text-success" />
    } else if (index === currentFileIndex) {
      return <Clock className="h-3 w-3 text-primary animate-spin" />
    } else {
      return <FileText className="h-3 w-3 text-muted-foreground" />
    }
  }

  const handleJsonEdit = (stageId: number, value: string) => {
    setEditableJson((prev) => ({ ...prev, [stageId]: value }))
  }

  const truncateFileName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name
    const extension = name.split('.').pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
    const truncated = nameWithoutExt.substring(0, maxLength - 3 - (extension?.length || 0))
    return `${truncated}...${extension ? '.' + extension : ''}`
  }

  const progress =
    ((currentFileIndex * stages.length + currentStage + (currentStage < stages.length ? 1 : 0)) /
      (files.length * stages.length)) *
    100

  // Function to check if a file tab can be clicked
  const canClickFileTab = (index: number) => {
    // Can only click on current file or future files (not past ones)
    return index >= currentFileIndex
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="text-sm text-muted-foreground">
              Processing {currentFileIndex + 1} of {files.length} documents
            </div>
          </CardTitle>

        </CardHeader>
        <CardContent className="space-y-0.5">
          <div className="flex items-center justify-between text-sm">


          </div>
          <Progress value={progress} className="w-full" />
          {/* <div className="text-center text-sm text-muted-foreground">
            Processing {currentFileIndex + 1} of {files.length} documents
          </div> */}
        </CardContent>
      </Card>

      {/* Files Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex w-full">
            {files.map((file, index) => {
              // Determine background styling based on file state and type
              let bgClasses = ""
              if (index === currentFileIndex) {
                bgClasses = "bg-primary/10 border-b-2 border-b-primary"
              } else if (index < currentFileIndex) {
                // Completed files - use file type specific colors
                bgClasses = file.type === "tender" 
                  ? "bg-green-100 border-green-200" 
                  : "bg-orange-100 border-orange-200"
              } else {
                // Future files
                bgClasses = "bg-muted/30"
              }

              return (
                <div
                  key={file.id}
                  className={`
                    flex-1 relative
                    transition-all duration-200 ease-in-out
                    ${bgClasses}
                    ${index > 0 ? "border-l border-border/50" : ""}
                    ${canClickFileTab(index) ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-60"}
                    first:rounded-tl-lg last:rounded-tr-lg
                  `}
                  onClick={() => {
                    if (canClickFileTab(index)) {
                      setCurrentFileIndex(index)
                    }
                  }}
                >
                  <div className="flex items-center gap-2 p-3 pr-8">
                    {getFileStatusIcon(index)}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${
                        index < currentFileIndex 
                          ? file.type === "tender" 
                            ? "text-green-700" 
                            : "text-orange-700"
                          : ""
                      }`} title={file.name}>
                        {truncateFileName(file.name)}
                      </div>
                      {file.bidderName && (
                        <div className="text-xs text-muted-foreground truncate" title={file.bidderName}>
                          {file.bidderName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {/* Show DONE tag for completed files */}
                    {index < currentFileIndex && (
                      <Badge 
                        variant="outline"
                        className={`text-xs px-1.5 py-0.5 font-semibold ${
                          file.type === "tender"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-orange-100 text-orange-700 border-orange-300"
                        }`}
                      >
                        DONE
                      </Badge>
                    )}
                    <Badge 
                      variant="outline"
                      className={`text-xs px-1.5 py-0.5 ${
                        file.type === "tender" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }`}
                    >
                      {file.type}
                    </Badge>
                  </div>
                  {/* Tab curve effect (optional styling enhancement) */}
                  {index === currentFileIndex && (
                    <>
                      <div className="absolute -left-2 bottom-0 w-2 h-2 bg-primary/10 rounded-br-full" />
                      <div className="absolute -right-2 bottom-0 w-2 h-2 bg-primary/10 rounded-bl-full" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current File Processing */}
      {currentFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Processing :</span>
              <div className="flex items-center gap-2">
                {!isProcessing && !needsVerification && (
                  <Button onClick={startProcessing} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                )}
                {needsVerification && (
                  <Button onClick={verifyStage} size="sm" variant="secondary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify & Continue
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Accordion type="multiple" className="w-full">
                {stages.map((stage, index) => (
                  <AccordionItem key={stage.id} value={`stage-${stage.id}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4 w-full">
                        {getStageIcon(stage.status)}
                        <div className="flex-1 text-left">
                          <div
                            className={`font-medium ${stage.status === "completed"
                                ? "text-success"
                                : stage.status === "processing"
                                  ? "text-primary"
                                  : stage.status === "needs_verification"
                                    ? "text-warning"
                                    : "text-muted-foreground"
                              }`}
                          >
                            {stage.title.replace("{currently_processing_pdf}", currentFile.name)}
                          </div>
                          <div className="text-sm text-muted-foreground">{stage.description}</div>
                        </div>
                        {stage.status === "needs_verification" && (
                          <Badge variant="outline" className="text-warning">
                            Needs Verification
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
  <div className="p-2 bg-muted/40 rounded">
    {(stage.id === 2 || stage.id === 3) && stage.status === "needs_verification" ? (
      stage.id === 3 ? (
        // Stage 3 → ReactJson with scroll
        <div className="bg-white border border-gray-200 rounded p-2 max-h-96 overflow-auto">
          <ReactJson
            src={JSON.parse(editableJson[stage.id] || "{}")}
            onEdit={(edit) => {
              setEditableJson((prev) => ({ ...prev, [stage.id]: JSON.stringify(edit.updated_src) }))
              return true
            }}
            onAdd={(add) => {
              setEditableJson((prev) => ({ ...prev, [stage.id]: JSON.stringify(add.updated_src) }))
              return true
            }}
            onDelete={(del) => {
              setEditableJson((prev) => ({ ...prev, [stage.id]: JSON.stringify(del.updated_src) }))
              return true
            }}
            theme="rjv-default"
            style={{ backgroundColor: "white" }}
            collapseStringsAfterLength={50}
            displayDataTypes={false}
            enableClipboard={false}
          />
        </div>
      ) : (
        // Stage 2 → Editable JSON textarea with scroll
        <textarea
          className="mt-1 w-full h-48 p-2 text-sm font-mono bg-white border border-gray-200 rounded resize-y whitespace-pre-wrap overflow-auto"
          value={editableJson[stage.id] || ""}
          onChange={(e) => handleJsonEdit(stage.id, e.target.value)}
        />
      )
    ) : stage.id === 4 ? (
      // Stage 4 → Excel download links
      (() => {
        let excelFiles
        try {
          excelFiles = JSON.parse(stageResponses[stage.id]).excel_files
        } catch (e) {
          return (
            <pre className="mt-1 text-sm overflow-auto max-h-96 bg-white p-2 border border-gray-200 rounded whitespace-pre-wrap">
              Error parsing response: {stageResponses[stage.id]}
            </pre>
          )
        }
        return (
          <div className="space-y-2">
            {Object.entries(excelFiles).map(([key, file]: [string, any]) => (
              <a
                key={key}
                href={file.url}
                download={file.filename}
                className="flex items-center gap-2 p-2 border rounded hover:bg-gray-100 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>
                  {key.charAt(0).toUpperCase() + key.slice(1)} Compliance ({file.filename})
                </span>
              </a>
            ))}
          </div>
        )
      })()
    ) : stage.id === 5 ? (
      // Stage 5 → Final JSON download
      (() => {
        let downloadUrl
        try {
          downloadUrl = JSON.parse(stageResponses[stage.id]).download_url
        } catch (e) {
          return (
            <pre className="mt-1 text-sm overflow-auto max-h-96 bg-white p-2 border border-gray-200 rounded whitespace-pre-wrap">
              Error parsing response: {stageResponses[stage.id]}
            </pre>
          )
        }
        return (
          <div className="space-y-2">
            <a
              href={downloadUrl}
              download="final_compliance.json"
              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-100 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>Final Compliance (final_compliance.json)</span>
            </a>
          </div>
        )
      })()
    ) : (
      // Default (Stage 1 & others) → Preformatted JSON/text with scroll
      <pre className="mt-1 text-sm overflow-auto max-h-96 bg-white p-2 border border-gray-200 rounded whitespace-pre-wrap">
        {stageResponses[stage.id] || (
          <span className="italic text-muted-foreground">No output yet.</span>
        )}
      </pre>
    )}
  </div>
</AccordionContent>

                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Dialog */}
      <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>First Document Processed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              The first document has been successfully processed. Would you like to continue processing the remaining{" "}
              {files.length - 1} documents?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowContinueDialog(false)}>
                Review First
              </Button>
              <Button onClick={continueWithRemainingFiles}>Continue Processing</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProcessingView