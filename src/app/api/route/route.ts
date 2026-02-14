import { NextResponse } from 'next/server'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

type Profile = 'driving' | 'foot' | 'bike'

interface OSRMRoute {
  distance: number
  duration: number
  geometry?: { type: string; coordinates: [number, number][] }
}

interface OSRMResponse {
  code: string
  routes?: OSRMRoute[]
  message?: string
}

export interface RoutePoint {
  lat: number
  lng: number
}

export interface ApiRoute {
  id: string
  points: RoutePoint[]
  distance: number
  duration: number
  sunExposure: number
  color: string
}

function getProfilesToTry(mode: 'walking' | 'cycling'): Profile[] {
  // Prefer foot/bike when available. Public OSRM demo may only have 'driving'.
  return mode === 'walking' ? ['foot', 'driving'] : ['bike', 'driving']
}

function coordsToOsrm(coords: { lng: number; lat: number }[]): string {
  return coords.map((c) => `${c.lng},${c.lat}`).join(';')
}

function durationForMode(distanceMeters: number, mode: 'walking' | 'cycling'): number {
  const km = distanceMeters / 1000
  const speedKmh = mode === 'walking' ? 5 : 15
  return Math.round((km / speedKmh) * 60) // minutes
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      startLat,
      startLng,
      endLat,
      endLng,
      mode = 'walking',
    }: {
      startLat: number
      startLng: number
      endLat: number
      endLng: number
      mode?: 'walking' | 'cycling'
    } = body

    if (
      typeof startLat !== 'number' ||
      typeof startLng !== 'number' ||
      typeof endLat !== 'number' ||
      typeof endLng !== 'number'
    ) {
      return NextResponse.json(
        { error: 'startLat, startLng, endLat, endLng (numbers) required' },
        { status: 400 }
      )
    }

    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      alternatives: '3',
    })

    const fetchRoutes = async (coords: { lng: number; lat: number }[]): Promise<OSRMRoute[]> => {
      const coordStr = coordsToOsrm(coords)
      for (const profile of getProfilesToTry(mode)) {
        const url = `${OSRM_BASE}/${profile}/${coordStr}?${params.toString()}`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data: OSRMResponse = await res.json()
        if (data.code === 'Ok' && data.routes?.length) return data.routes
      }
      return []
    }

    let allRoutes: OSRMRoute[] = await fetchRoutes([
      { lng: startLng, lat: startLat },
      { lng: endLng, lat: endLat },
    ])

    if (allRoutes.length === 0) {
      return NextResponse.json({ error: 'No route found' }, { status: 400 })
    }

    // If we got fewer than 3 routes, try via-points to get alternative paths
    if (allRoutes.length < 3) {
      const midLat = (startLat + endLat) / 2
      const midLng = (startLng + endLng) / 2
      const offset = 0.008
      const viaCandidates = [
        [{ lng: midLng + offset, lat: midLat + offset }],
        [{ lng: midLng - offset, lat: midLat - offset }],
        [{ lng: midLng + offset, lat: midLat - offset }],
        [{ lng: midLng - offset, lat: midLat + offset }],
      ]
      const seenDist = new Set<number>()
      allRoutes.forEach((r) => seenDist.add(Math.round(r.distance / 50)))
      for (const [viaLng, viaLat] of viaCandidates.map((v) => [v[0].lng, v[0].lat])) {
        if (allRoutes.length >= 3) break
        const viaRoutes = await fetchRoutes(
          [
            { lng: startLng, lat: startLat },
            { lng: viaLng, lat: viaLat },
            { lng: endLng, lat: endLat },
          ]
        )
        for (const r of viaRoutes) {
          const key = Math.round(r.distance / 50)
          if (seenDist.has(key)) continue
          seenDist.add(key)
          allRoutes.push(r)
          if (allRoutes.length >= 3) break
        }
      }
    }

    const sunExposures = [85, 65, 45]
    const routes: ApiRoute[] = allRoutes.slice(0, 3).map((r, i) => {
      const coords = r.geometry?.coordinates ?? []
      const points: RoutePoint[] = coords.map(([lng, lat]) => ({ lat, lng }))
      const distanceKm = Math.round((r.distance / 1000) * 100) / 100
      const durationMin = durationForMode(r.distance, mode)
      const sunExposure = sunExposures[i] ?? 50
      const hue = 240 - (sunExposure / 100) * 240
      const isGreen = hue >= 85 && hue <= 155
      const color = `hsl(${hue}, 100%, ${isGreen ? 32 : 52}%)`

      return {
        id: `route-${i + 1}`,
        points: points.length > 0 ? points : [{ lat: startLat, lng: startLng }, { lat: endLat, lng: endLng }],
        distance: distanceKm,
        duration: durationMin,
        sunExposure,
        color,
      }
    })

    return NextResponse.json({ routes })
  } catch (e) {
    console.error('[API route]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Request failed' },
      { status: 500 }
    )
  }
}
