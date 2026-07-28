import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, GripVertical, Eye, EyeOff, Palette,
  Layers, Maximize2, Minus, Plus, RotateCcw,
  Sun, Moon, RefreshCw, Layout, Grid3X3, Zap,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../components/ui/Toast'

const SECTION_DEFS = [
  { id: 'hero-banner', label: 'Hero Banner', icon: Sun, description: 'Greeting banner with date and stats' },
  { id: 'dashboard-widgets', label: 'Dashboard Widgets', icon: Layout, description: 'Stats cards for videos, anime, favorites' },
  { id: 'filter-bar', label: 'Filter Bar', icon: Layers, description: 'Search, filter, and sort controls' },
  { id: 'series-grid', label: 'Series Grid', icon: Grid3X3, description: 'Main series cards grid' },
]

const LAYOUT_MODES = [
  { value: 'compact', label: 'Compact', icon: Minus },
  { value: 'comfortable', label: 'Comfortable', icon: Maximize2 },
  { value: 'spacious', label: 'Spacious', icon: Plus },
]

const ANIMATION_SPEEDS = [
  { value: 'fast', label: 'Fast', icon: Zap },
  { value: 'normal', label: 'Normal', icon: RefreshCw },
  { value: 'slow', label: 'Slow', icon: RefreshCw },
]

function DraggableSection({ section, index, onToggle, onMoveUp, onMoveDown, isFirst, isLast }) {
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const def = SECTION_DEFS.find((d) => d.id === section.id)
  if (!def) return null
  const Icon = def.icon

  const handleDragStart = (e) => {
    setDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (fromIndex !== index) {
      onMoveUp(fromIndex, index)
    }
  }

  const handleDragEnd = () => {
    setDragging(false)
  }

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${
        dragging
          ? 'border-red-500/40 bg-red-500/5 scale-[1.02] shadow-lg'
          : 'bg-dark-850/80 backdrop-blur-md border-dark-700/50 hover:border-dark-600/50'
      }`}
    >
      <div className="flex flex-col gap-0.5 text-dark-500">
        <button
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className="p-0.5 hover:text-dark-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className="p-0.5 hover:text-dark-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <GripVertical className="w-4 h-4 text-dark-500 flex-shrink-0" />
      <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-dark-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-100">{def.label}</p>
        <p className="text-xs text-dark-400 truncate">{def.description}</p>
      </div>
      <button
        onClick={() => onToggle(index)}
        className={`p-2 rounded-xl transition-all ${
          section.enabled
            ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
            : 'bg-dark-800/50 text-dark-500 hover:text-dark-300'
        }`}
      >
        {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function DashboardCustomization() {
  const navigate = useNavigate()
  const { settings, update } = useSettings()
  const toast = useToast()
  const layout = settings.dashboardLayout || {
    sections: [
      { id: 'hero-banner', enabled: true },
      { id: 'dashboard-widgets', enabled: true },
      { id: 'filter-bar', enabled: true },
      { id: 'series-grid', enabled: true },
    ],
    layoutMode: 'comfortable',
    cardRadius: 16,
    cardSpacing: 24,
    gridDensity: 'normal',
    accentColor: '#ef4444',
    animationSpeed: 'normal',
  }

  const [sections, setSections] = useState(layout.sections)

  const handleToggle = (index) => {
    const updated = sections.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s)
    setSections(updated)
  }

  const handleMoveUp = (from, to) => {
    const updated = [...sections]
    const [removed] = updated.splice(from, 1)
    updated.splice(to, 0, removed)
    setSections(updated)
  }

  const handleMoveDown = (index) => {
    if (index < sections.length - 1) {
      handleMoveUp(index, index + 1)
    }
  }

  const handleMoveArrowUp = (index) => {
    if (index > 0) {
      const updated = [...sections]
      const [removed] = updated.splice(index, 1)
      updated.splice(index - 1, 0, removed)
      setSections(updated)
    }
  }

  const handleMoveArrowDown = (index) => {
    if (index < sections.length - 1) {
      const updated = [...sections]
      const [removed] = updated.splice(index, 1)
      updated.splice(index + 1, 0, removed)
      setSections(updated)
    }
  }

  const handleSave = async () => {
    await update({
      dashboardLayout: {
        ...layout,
        sections,
      },
    })
    toast('Dashboard layout saved!', 'success')
  }

  const handleRestoreDefaults = async () => {
    const defaults = {
      sections: [
        { id: 'hero-banner', enabled: true },
        { id: 'dashboard-widgets', enabled: true },
        { id: 'filter-bar', enabled: true },
        { id: 'series-grid', enabled: true },
      ],
      layoutMode: 'comfortable',
      cardRadius: 16,
      cardSpacing: 24,
      gridDensity: 'normal',
      accentColor: '#ef4444',
      animationSpeed: 'normal',
    }
    setSections(defaults.sections)
    await update({ dashboardLayout: defaults })
    toast('Default layout restored', 'success')
  }

  const handleLayoutChange = async (key, value) => {
    await update({
      dashboardLayout: { ...layout, [key]: value },
    })
  }

  const radiusValue = layout.cardRadius || 16
  const spacingValue = layout.cardSpacing || 24

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-dark-400 hover:text-dark-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Palette className="w-6 h-6 text-dark-300" />
          <h1 className="text-2xl font-bold text-dark-100">Customize Dashboard</h1>
        </div>
        <button
          onClick={handleRestoreDefaults}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-800/50 border border-dark-700/30 text-dark-400 hover:text-dark-200 text-xs transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">
              <Layers className="w-5 h-5 text-dark-300" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-100">Dashboard Sections</h3>
              <p className="text-sm text-dark-400">Drag to reorder, toggle visibility</p>
            </div>
          </div>
          <div className="space-y-2">
            {sections.map((section, i) => (
              <DraggableSection
                key={section.id}
                section={section}
                index={i}
                onToggle={handleToggle}
                onMoveUp={handleMoveArrowUp}
                onMoveDown={handleMoveArrowDown}
                isFirst={i === 0}
                isLast={i === sections.length - 1}
              />
            ))}
          </div>
          <button
            onClick={handleSave}
            className="mt-4 w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            Save Layout
          </button>
        </div>

        <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">
              <Layout className="w-5 h-5 text-dark-300" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-100">Layout Mode</h3>
              <p className="text-sm text-dark-400">Choose how content is spaced</p>
            </div>
          </div>
          <div className="flex gap-2">
            {LAYOUT_MODES.map((mode) => {
              const ModeIcon = mode.icon
              const isActive = layout.layoutMode === mode.value
              return (
                <button
                  key={mode.value}
                  onClick={() => handleLayoutChange('layoutMode', mode.value)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-600/50'
                  }`}
                >
                  <ModeIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-dark-850/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center">
              <Palette className="w-5 h-5 text-dark-300" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-100">Appearance</h3>
              <p className="text-sm text-dark-400">Customize card styling and colors</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-400">Card Corner Radius</span>
                <span className="text-xs text-dark-300 font-mono">{radiusValue}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="24"
                value={radiusValue}
                onChange={(e) => handleLayoutChange('cardRadius', parseInt(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-dark-500 mt-0.5">
                <span>8px</span>
                <span>24px</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-400">Card Spacing</span>
                <span className="text-xs text-dark-300 font-mono">{spacingValue}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="40"
                value={spacingValue}
                onChange={(e) => handleLayoutChange('cardSpacing', parseInt(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-dark-500 mt-0.5">
                <span>12px</span>
                <span>40px</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-400">Grid Density</span>
              </div>
              <div className="flex gap-2">
                {['compact', 'normal', 'spacious'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleLayoutChange('gridDensity', d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                      layout.gridDensity === d
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-600/50'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-400">Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={layout.accentColor || '#ef4444'}
                    onChange={(e) => handleLayoutChange('accentColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs text-dark-300 font-mono">{layout.accentColor || '#ef4444'}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-400">Animation Speed</span>
              </div>
              <div className="flex gap-2">
                {ANIMATION_SPEEDS.map((speed) => {
                  const SpeedIcon = speed.icon
                  const isActive = layout.animationSpeed === speed.value
                  return (
                    <button
                      key={speed.value}
                      onClick={() => handleLayoutChange('animationSpeed', speed.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                        isActive
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : 'bg-dark-800/50 border-dark-700/30 text-dark-400 hover:border-dark-600/50'
                      }`}
                    >
                      <SpeedIcon className="w-3.5 h-3.5" />
                      {speed.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 rounded-2xl bg-dark-850/40 border border-dashed border-dark-700/30">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-800/50 flex items-center justify-center mx-auto mb-3">
              <Palette className="w-6 h-6 text-dark-500" />
            </div>
            <p className="text-sm text-dark-400">Changes are automatically synced across devices</p>
          </div>
        </div>
      </div>
    </div>
  )
}