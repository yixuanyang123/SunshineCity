# C++: Post Optimal Route to FastAPI (stored in PostgreSQL/Supabase)

The C++ algorithm computes the optimal route, then POSTs it to the Web API. FastAPI saves it to the `optimal_routes` table in Supabase.

## Build (libcurl required)

```bash
# Ubuntu/Debian: sudo apt install libcurl4-openssl-dev
# macOS: brew install curl (usually already present)
g++ -o post_optimal_route post_optimal_route.cpp -lcurl
```

## Run

```bash
# Default: POST to https://sunlight-city-blush.vercel.app/api/optimal-route
./post_optimal_route

# Custom base URL (e.g. local)
./post_optimal_route http://localhost:8000
```

Note: local server uses path `/optimal-route` (no `/api` prefix). For local you may need to change the code to append `/optimal-route` instead of `/api/optimal-route`, or run behind a proxy that adds `/api`.

## Request body (JSON)

Matches FastAPI `OptimalRouteCreate`:

- `origin`: `{ "lat": number, "lng": number }`
- `destination`: `{ "lat", "lng" }`
- `waypoints`: array of `{ "lat", "lng" }`
- `total_distance_km`: optional float
- `total_time_minutes`: optional float
- `anonymous_id`: optional string (associate with Unity/trip)
- `user_email`: optional string

## Integration with your algorithm

Replace the example `origin`, `dest`, `waypoints`, `total_km`, `total_min` (and optionally `anonymous_id`) with the output of your pathfinding. Then call the same POST logic (e.g. extract into a function that takes your route struct and base URL).
