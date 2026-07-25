const ANILIST_API = 'https://graphql.anilist.co'

const SEARCH_QUERY = `
query ($search: String, $page: Int) {
  Page(page: $page, perPage: 20) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      title { romaji english native }
      episodes
      status
      format
      coverImage { large medium }
      siteUrl
      nextAiringEpisode {
        airingAt
        episode
      }
      startDate { year month day }
    }
  }
}
`

export async function searchAnime(query, page = 1) {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, page },
    }),
  })
  if (!response.ok) throw new Error(`AniList API error: ${response.status}`)
  const json = await response.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data.Page.media
}
