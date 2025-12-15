"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import type { MapFeature, DrawingMode } from "@/components/map-drawing-tools"
import {
  AlertTriangle,
  Mountain,
  Landmark,
  Building,
  Compass,
  FileText,
  ImageIcon,
  File,
  Globe,
  MapPinned,
  Eye,
} from "lucide-react"
import type { MapLayer, HazardZone, MapAsset, DriveFolder, DriveFile, GoogleOpenMap } from "@shared/schema"

const GOOGLE_OPEN_MAPS: GoogleOpenMap[] = [
  {
    id: "evac-centers",
    name: "Evacuation Centers",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1mjXfpYAmLEhG2U2Gu9VWjRdcuI9H4kw&ehbc=2E312F",
  },
  {
    id: "hazard-zones",
    name: "Hazard Zones",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=17JUWx271jjwJNBN2yVStmAPY_Y_iQOg&ehbc=2E312F",
  },
  {
    id: "response-routes",
    name: "Response Routes",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1WqlvA465RCv29U-MyWi-1qU1MljXgAU&ehbc=2E312F",
  },
  {
    id: "land-use",
    name: "Land Use Area",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1udNHLgYpnawV9IhZS3X88RPKDmAJ0Qw&ehbc=2E312F&noprof=1",
  },
  {
    id: "fault-lines",
    name: "Active Fault Lines",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1KQLOjRjG89a4yP5KINXIcrvvEzJIPSM&ehbc=2E312F&noprof=1",
  },
  {
    id: "general-map",
    name: "General Map",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1BmibV2upcL5kwmEKIJPLfit7VNQAqk0&ehbc=2E312F&noprof=1",
  },
]

const MAP_LAYERS: MapLayer[] = [
  { id: "interactive", name: "Interactive Map", type: "interactive", active: true },
  { id: "administrative", name: "Administrative Map", type: "administrative", active: false },
  { id: "topographic", name: "Topographic Map", type: "topographic", active: false },
  { id: "land-use", name: "Land Use Map", type: "land-use", active: false },
  { id: "hazards", name: "Hazards Maps", type: "hazards", active: false },
  { id: "other", name: "Other Map", type: "other", active: false },
  { id: "panorama", name: "Panorama Map", type: "panorama", active: false },
  { id: "google-open", name: "Google Open Map", type: "google-open", active: false },
]

const layerIcons: Record<string, any> = {
  interactive: Compass,
  administrative: Building,
  topographic: Mountain,
  "land-use": Landmark,
  hazards: AlertTriangle,
  other: MapPinned,
  panorama: Eye,
  "google-open": Globe,
}

const getLayerApiEndpoint = (type: string): string | null => {
  switch (type) {
    case "administrative":
      return "/api/maps/administrative"
    case "topographic":
      return "/api/maps/topographic"
    case "land-use":
      return "/api/maps/land-use"
    case "hazards":
      return "/api/maps/hazards-files"
    case "other":
      return "/api/maps/other"
    case "panorama":
      return `/api/maps/drive-folder/1tsbcsTEfg5RLHLJLYXR41avy9SrajsqM`
    default:
      return null
  }
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("image")) return ImageIcon
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText
  return File
}

const PANORAMA_VIEW_TYPES = [
  { value: "360-degree", label: "360-Degree" },
  { value: "spherical", label: "Spherical" },
  { value: "cylindrical", label: "Cylindrical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "wide-angle", label: "Wide-Angle" },
  { value: "planar", label: "Planar" },
]

export default function Maps() {
  const [layers, setLayers] = useState<MapLayer[]>(MAP_LAYERS)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedGoogleMap, setSelectedGoogleMap] = useState<GoogleOpenMap | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [mouseCoords, setMouseCoords] = useState({ lat: 13.0752, lng: 123.5298 })
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
  const [subfolderContents, setSubfolderContents] = useState<Record<string, DriveFolder>>({})
  const [loadingSubfolder, setLoadingSubfolder] = useState<string | null>(null)

  // Drawing state
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([])
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null)
  const [tempCoordinates, setTempCoordinates] = useState<{ lat: number; lng: number }[]>([])
  const [selectedColor, setSelectedColor] = useState("#FF0000")
  const [selectedFillColor, setSelectedFillColor] = useState("#FF000040")
  const [selectedWeight, setSelectedWeight] = useState(3)
  const [featureTitle, setFeatureTitle] = useState("")
  const [featureDescription, setFeatureDescription] = useState("")
  const [showLegend, setShowLegend] = useState(true)

  // Modal state
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState("")
  const [modalImageName, setModalImageName] = useState("")

  // Panorama state
  const [panoramaImages, setPanoramaImages] = useState<DriveFile[]>([])
  const [selectedPanorama, setSelectedPanorama] = useState<DriveFile | null>(null)
  const [selectedPanoramaFolder, setSelectedPanoramaFolder] = useState<string | null>(null)
  const [panoramaViewerReady, setPanoramaViewerReady] = useState(false)
  const [panoramaViewType, setPanoramaViewType] = useState<string>("360-degree")
  const [panoramaSettings, setPanoramaSettings] = useState({
    yaw: 0,
    pitch: 0,
    zoom: 1,
    fov: 90,
  })
  const panoramaViewerRef = useRef<HTMLDivElement>(null)
  const viewerInstanceRef = useRef<any>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const planarImageRef = useRef<HTMLImageElement>(null)
  const threeSixtyRef = useRef<any>(null)

  const saveFeatureToDb = useCallback(async (feature: MapFeature) => {
    // Feature saving logic - can be expanded for persistence
    console.log("Feature saved:", feature)
  }, [])

  const deleteFeatureFromDb = useCallback(async (id: string) => {
    console.log("Feature deleted:", id)
  }, [])

  const clearAllFeaturesFromDb = useCallback(async () => {
    console.log("All features cleared")
  }, [])

  const deleteFeature = useCallback(
    (id: string) => {
      setMapFeatures((prev) => prev.filter((feature) => feature.id !== id))
      deleteFeatureFromDb(id)
    },
    [deleteFeatureFromDb],
  )

  const clearAllFeatures = useCallback(() => {
    setMapFeatures([])
    clearAllFeaturesFromDb()
  }, [clearAllFeaturesFromDb])

  const { data: hazardZones = [] } = useQuery<HazardZone[]>({
    queryKey: ["/api/maps/hazards"],
  })

  const { data: assets = [] } = useQuery<MapAsset[]>({
    queryKey: ["/api/maps/assets"],
  })

  const activeLayer = useMemo(() => layers.find((l) => l.active), [layers])
  const layerEndpoint = activeLayer ? getLayerApiEndpoint(activeLayer.type) : null

  const { data: layerFolders = [], isLoading: foldersLoading } = useQuery<DriveFolder[]>({
    queryKey: [layerEndpoint],
    enabled: !!layerEndpoint,
  })

  const { data: panoramaData, isLoading: panoramaLoading } = useQuery<{
    folders: DriveFolder[]
    allImages: Array<{
      id: string
      name: string
      thumbnailLink?: string
      webViewLink?: string
      webContentLink?: string
      folder: string
    }>
  }>({
    queryKey: ["/api/panorama"],
    enabled: activeLayer?.type === "panorama",
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (panoramaData?.allImages) {
      const images = panoramaData.allImages.map((img) => ({
        id: img.id,
        name: img.name,
        mimeType: "image/jpeg",
        thumbnailLink: img.thumbnailLink,
        webViewLink: img.webViewLink,
        webContentLink: img.webContentLink,
        folder: img.folder,
      }))
      setPanoramaImages(images as DriveFile[])
    }
  }, [panoramaData])

  useEffect(() => {
    if (!selectedPanorama || !panoramaViewerRef.current) return

    const initViewer = async () => {
      try {
        // Clean up previous viewer
        if (viewerInstanceRef.current) {
          viewerInstanceRef.current.destroy()
          viewerInstanceRef.current = null
        }

        const panoramaUrl = `/api/panorama/image/${selectedPanorama.id}`

        // Handle different panorama types
        switch (panoramaViewType) {
          case "planar":
          case "wide-angle":
            // For planar/wide-angle, we just show the image normally
            setPanoramaViewerReady(true)
            break

          case "360-degree":
          case "spherical":
            // Full spherical panorama
            const { Viewer } = await import("@photo-sphere-viewer/core")
            await import("@photo-sphere-viewer/core/index.css")

            viewerInstanceRef.current = new Viewer({
              container: panoramaViewerRef.current!,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading 360° panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
            })
            setPanoramaViewerReady(true)
            break

          case "cylindrical":
            // Cylindrical panorama (360° horizontal, limited vertical)
            const { Viewer: CylindricalViewer } = await import("@photo-sphere-viewer/core")
            await import("@photo-sphere-viewer/core/index.css")

            viewerInstanceRef.current = new CylindricalViewer({
              container: panoramaViewerRef.current!,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading cylindrical panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
              sphereCorrection: { pan: 0, tilt: 0, roll: 0 },
              fisheye: false,
            })
            setPanoramaViewerReady(true)
            break

          case "horizontal":
            // Horizontal panorama (wide field of view horizontally)
            const { Viewer: HorizontalViewer } = await import("@photo-sphere-viewer/core")
            await import("@photo-sphere-viewer/core/index.css")

            viewerInstanceRef.current = new HorizontalViewer({
              container: panoramaViewerRef.current!,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading horizontal panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
            })
            setPanoramaViewerReady(true)
            break

          case "vertical":
            // Vertical panorama (tall field of view vertically)
            const { Viewer: VerticalViewer } = await import("@photo-sphere-viewer/core")
            await import("@photo-sphere-viewer/core/index.css")

            viewerInstanceRef.current = new VerticalViewer({
              container: panoramaViewerRef.current!,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading vertical panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
            })
            setPanoramaViewerReady(true)
            break

          default:
            setPanoramaViewerReady(true)
        }
      } catch (error) {
        console.error("Failed to initialize panorama viewer:", error)
        setPanoramaViewerReady(false)
      }
    }

    initViewer()

    return () => {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy()
        viewerInstanceRef.current = null
      }
      setPanoramaViewerReady(false)
    }
  }, [selectedPanorama, panoramaViewType])

  const loadSubfolderContents = useCallback(
    async (folderId: string) => {
      if (subfolderContents[folderId]) return

      setLoadingSubfolder(folderId)
      try {
        const response = await fetch(`/api/maps/subfolder/${folderId}`)
        if (response.ok) {
          const data = await response.json()
          setSubfolderContents((prev) => ({ ...prev, [folderId]: data }))
        }
      } catch (error) {
        console.error("Failed to load subfolder:", error)
      } finally {
        setLoadingSubfolder(null)
      }
    },
    [subfolderContents],
  )

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.map((l) => ({ ...l, active: l.id === layerId })))
    setExpandedFolders(new Set())
    setSelectedFile(null)
    // Auto-select first Google map when switching to google-open layer
    if (layerId === "google-open") {
      setSelectedGoogleMap(GOOGLE_OPEN_MAPS[0])
    } else {
      setSelectedGoogleMap(null)
    }
    setSubfolderContents({})
    setSelectedPanorama(null)
    setPanoramaViewType("360-degree")
  }, [])

  const toggleFolder = useCallback(
    (folderId: string, hasSubfolders?: boolean) => {
      setExpandedFolders((prev) => {
        const next = new Set(prev)
        if (next.has(folderId)) {
          next.delete(folderId)
        } else {
          next.add(folderId)
          if (hasSubfolders) {
            loadSubfolderContents(folderId)
          }
        }
        return next
      })
    },
    [loadSubfolderContents],
  )

  const openImageModal = useCallback((imageUrl: string, imageName: string) => {
    setModalImageUrl(imageUrl)
    setModalImageName(imageName)
    setImageModalOpen(true)
  }, [])

  const handleMouseMove = useCallback((lat: number, lng: number) => {
    setMouseCoords({ lat, lng })
  }, [])

  return <div>Maps content here</div>
}

export { Maps }
