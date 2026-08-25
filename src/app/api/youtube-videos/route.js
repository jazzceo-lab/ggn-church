const CHANNEL_HANDLE = "길가는교회";

export const revalidate = 3600;

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YouTube API 키가 설정되지 않았어요." }, { status: 500 });
  }

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(CHANNEL_HANDLE)}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const channelData = await channelRes.json();

    if (!channelRes.ok) {
      return Response.json(
        { error: channelData.error?.message ?? "채널 정보를 불러오지 못했어요." },
        { status: channelRes.status }
      );
    }

    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return Response.json({ error: "채널을 찾을 수 없어요." }, { status: 404 });
    }

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=8&playlistId=${uploadsPlaylistId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const videosData = await videosRes.json();

    if (!videosRes.ok) {
      return Response.json(
        { error: videosData.error?.message ?? "영상 목록을 불러오지 못했어요." },
        { status: videosRes.status }
      );
    }

    const videos = (videosData.items ?? [])
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
      }));

    return Response.json({ videos });
  } catch {
    return Response.json({ error: "유튜브 영상을 불러오지 못했어요." }, { status: 500 });
  }
}
