import { NextResponse } from 'next/server'

const WEATHER_API = 'https://ohikw6407l.execute-api.us-east-2.amazonaws.com/default/weather'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lat, lon } = body
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'lat and lon (numbers) required' }, { status: 400 })
    }

    const res = await fetch(WEATHER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data || { error: 'Weather API error' }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[API weather]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Request failed' },
      { status: 500 }
    )
  }
}
