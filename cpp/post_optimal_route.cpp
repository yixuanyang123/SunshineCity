/**
 * C++ example: POST optimal route to FastAPI; FastAPI stores it in PostgreSQL (Supabase).
 * Build: g++ -o post_optimal_route post_optimal_route.cpp -lcurl
 * Run: ./post_optimal_route [base_url]
 * Default base_url = https://sunlight-city-blush.vercel.app (path /api/optimal-route is appended).
 */

#include <curl/curl.h>
#include <string>
#include <vector>
#include <cstdio>
#include <cstring>

struct LatLng { double lat; double lng; };

static size_t write_cb(char* ptr, size_t size, size_t nmemb, void* userdata) {
    (void)userdata;
    size_t total = size * nmemb;
    fwrite(ptr, size, nmemb, stdout);
    return total;
}

// Build JSON body for OptimalRouteCreate.
static std::string build_json(
    const LatLng& origin,
    const LatLng& dest,
    const std::vector<LatLng>& waypoints,
    double total_km,
    double total_min,
    const std::string& anonymous_id
) {
    std::string s = "{\"origin\":{\"lat\":";
    s += std::to_string(origin.lat); s += ",\"lng\":";
    s += std::to_string(origin.lng); s += "},\"destination\":{\"lat\":";
    s += std::to_string(dest.lat);   s += ",\"lng\":";
    s += std::to_string(dest.lng);   s += "},\"waypoints\":[";
    for (size_t i = 0; i < waypoints.size(); ++i) {
        if (i) s += ",";
        s += "{\"lat\":"; s += std::to_string(waypoints[i].lat);
        s += ",\"lng\":"; s += std::to_string(waypoints[i].lng); s += "}";
    }
    s += "],\"total_distance_km\":";
    s += std::to_string(total_km);
    s += ",\"total_time_minutes\":";
    s += std::to_string(total_min);
    if (!anonymous_id.empty()) {
        s += ",\"anonymous_id\":\""; s += anonymous_id; s += "\"";
    }
    s += "}";
    return s;
}

int main(int argc, char* argv[]) {
    // Default: Vercel (path includes /api). For local uvicorn use: ./post_optimal_route http://localhost:8000 /optimal-route
    const char* base_url = (argc > 1) ? argv[1] : "https://sunlight-city-blush.vercel.app";
    const char* path    = (argc > 2) ? argv[2] : "/api/optimal-route";
    std::string url = std::string(base_url) + path;

    // Example: route from A to B with two waypoints
    LatLng origin   = {39.9042, 116.4074};
    LatLng dest     = {39.9163, 116.3972};
    std::vector<LatLng> waypoints = {
        {39.9080, 116.4040},
        {39.9120, 116.4000}
    };
    double total_km   = 2.5;
    double total_min  = 8.0;
    std::string anonymous_id = "unity-session-123";  // optional; match trip's anonymous_id if needed

    std::string body = build_json(origin, dest, waypoints, total_km, total_min, anonymous_id);

    CURL* curl = curl_easy_init();
    if (!curl) {
        fprintf(stderr, "curl_easy_init failed\n");
        return 1;
    }

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_cb);

    CURLcode res = curl_easy_perform(curl);
    long code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &code);

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        fprintf(stderr, "curl_easy_perform failed: %s\n", curl_easy_strerror(res));
        return 1;
    }
    fprintf(stderr, "\nHTTP %ld\n", code);
    return (code >= 200 && code < 300) ? 0 : 1;
}
