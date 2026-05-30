export type ThemeTokens = Record<string, string>

export interface BaseBlock {
  id: string
  isVisible: boolean
}

export interface HeroBannerBlock extends BaseBlock {
  type: "HeroBanner"
  variant: "centered" | "split"
  content: {
    heading: string
    subtext: string
    buttonText: string
    buttonLink: string
  }
  styles: {
    backgroundImage: string
    overlayOpacity: number
    backgroundColor: string
    headingColor: string
    subtextColor: string
    buttonBgColor: string
    buttonTextColor: string
  }
}

export interface VideoSectionBlock extends BaseBlock {
  type: "VideoSection"
  variant: "full" | "contained"
  content: {
    videoUrl: string
    caption: string
    autoPlay: boolean
  }
  styles: {
    backgroundColor: string
    playButtonColor: string
    captionColor: string
    padding: string
  }
}

export interface CallToActionBlock extends BaseBlock {
  type: "CallToAction"
  variant: "standard" | "card"
  content: {
    heading: string
    buttonText: string
    buttonLink: string
  }
  styles: {
    backgroundColor: string
    headingColor: string
    buttonBgColor: string
    buttonTextColor: string
  }
}

export interface RewardSelectorBlock extends BaseBlock {
  type: "RewardSelector"
  variant: "grid" | "list"
  content: {
    heading: string
    subtext: string
  }
  styles: {
    backgroundColor: string
    headingColor: string
    cardBackgroundColor: string
  }
}

export type PageBlock =
  | HeroBannerBlock
  | VideoSectionBlock
  | CallToActionBlock
  | RewardSelectorBlock

export type BlockType = PageBlock["type"]
