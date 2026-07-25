export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = url.searchParams.get('url')
    if (!target) {
      return new Response('Missing "url" query parameter', { status: 400 })
    }
    try {
      const response = await fetch(target)
      const body = await response.text()
      return new Response(body, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': response.headers.get('Content-Type') || 'text/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      })
    } catch (err) {
      return new Response(err.message, { status: 500 })
    }
  },
}
