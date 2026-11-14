import { useEffect, useState } from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Progress slider (shadcn/ui Slider styling) that only commits when the learner
 * releases it (pointer up or a keyboard step), so dragging does not fire a request
 * for every step.
 */
export function ProgressSlider({
  value,
  onCommit,
  label = "Progress",
  disabled,
}: {
  value: number
  onCommit: (value: number) => void
  label?: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = (next: number) => {
    if (next !== value) onCommit(next)
  }

  return (
    <div className="flex items-center gap-3">
      <SliderPrimitive.Root
        data-slot="slider"
        min={0}
        max={100}
        step={5}
        value={[draft]}
        disabled={disabled}
        onValueChange={([next]) => setDraft(next)}
        onValueCommit={([next]) => commit(next)}
        className={cn(
          "relative flex h-5 w-full min-w-0 cursor-pointer touch-none items-center select-none pointer-coarse:h-11",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        )}
      >
        <SliderPrimitive.Track data-slot="slider-track" className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          aria-label={label}
          aria-valuetext={`${draft}%`}
          className="block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden pointer-coarse:size-6"
        />
      </SliderPrimitive.Root>
      <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">{draft}%</span>
    </div>
  )
}
