import { HeroBanner } from "./HeroBanner"
import { VideoSection } from "./VideoSection"
import { CallToAction } from "./CallToAction"
import { StorefrontRewardSelector } from "./StorefrontRewardSelector"
import type { PageBlock } from "@/types/builder"

interface Props {
  block: PageBlock
}

export function StorefrontBlockRenderer({ block }: Props) {
  if (!block.isVisible) return null

  switch (block.type) {
    case "HeroBanner":
      return <HeroBanner block={block} />
    case "VideoSection":
      return <VideoSection block={block} />
    case "CallToAction":
      return <CallToAction block={block} />
    case "RewardSelector":
      return <StorefrontRewardSelector block={block} />
    default:
      return null
  }
}
