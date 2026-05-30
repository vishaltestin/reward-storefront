import { type VideoSectionBlock } from "@/types/builder"

interface Props {
  block: VideoSectionBlock
}

export function VideoSection({ block }: Props) {
  const { content, styles, variant } = block

  const bgColor = styles.backgroundColor || "transparent"
  const captionColor = styles.captionColor || "var(--theme-text)"

  const getEmbedUrl = (url: string, autoPlay: boolean) => {
    if (!url) return null

    let embedUrl = ""
    const autoPlayParams = autoPlay ? "&autoplay=1&mute=1" : ""

    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("v=")
          ? new URL(url).searchParams.get("v")
          : url.split("/").pop()
        embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0${autoPlayParams}`
      } else if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop()
        embedUrl = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0${autoPlayParams}`
      }
    } catch (e) {
      console.log(e)
      return null
    }

    return embedUrl || null
  }

  const embedUrl = getEmbedUrl(content.videoUrl, content.autoPlay)

  return (
    <div style={{ backgroundColor: bgColor }} className={styles.padding}>
      <div
        className={`mx-auto ${variant === "full" ? "w-full px-0" : "max-w-5xl px-6"}`}
      >
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={content.caption || "Video player"}
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <p className="text-sm font-medium">
                {content.videoUrl
                  ? "Invalid video URL. Please use YouTube or Vimeo."
                  : "Please provide a video URL in the inspector"}
              </p>
            </div>
          )}
        </div>
        {content.caption && (
          <p
            className="mt-4 text-center text-sm italic"
            style={{ color: captionColor }}
          >
            {content.caption}
          </p>
        )}
      </div>
    </div>
  )
}
