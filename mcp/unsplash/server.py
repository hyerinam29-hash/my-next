import os
from typing import Any, Dict, List

import httpx


# 간단한 FastMCP 서버 구현 (Unsplash 검색 전용)
# 실행: fastmcp run server.py

try:
    from fastmcp import FastMCP
except Exception as e:  # pragma: no cover
    raise RuntimeError(
        "fastmcp 패키지가 필요합니다. `uv run --with fastmcp fastmcp run server.py` 로 실행하세요."
    ) from e


UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY")
if not UNSPLASH_ACCESS_KEY:
    raise RuntimeError("UNSPLASH_ACCESS_KEY 환경 변수가 설정되지 않았습니다.")


app = FastMCP("unsplash")


def _unsplash_headers() -> Dict[str, str]:
    return {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}


@app.tool()
async def unsplash_search_photos(query: str, per_page: int = 10, page: int = 1) -> Dict[str, Any]:
    """
    Unsplash 사진 검색

    - query: 검색어 (예: "vitamin", "senior" 등)
    - per_page: 페이지당 개수 (1~30 권장)
    - page: 페이지 번호 (1부터)

    반환: { total, total_pages, results: [ { id, description, alt, width, height, color, urls:{raw,full,regular,small,thumb}, user:{name,username,profile_image} } ] }
    """
    if not query or not isinstance(query, str):
        return {"error": "query는 문자열이어야 합니다."}

    per_page = max(1, min(30, int(per_page)))
    page = max(1, int(page))

    url = "https://api.unsplash.com/search/photos"
    params = {"query": query, "per_page": per_page, "page": page}

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, params=params, headers=_unsplash_headers())
        if resp.status_code != 200:
            try:
                data = resp.json()
            except Exception:
                data = {"message": resp.text}
            return {
                "error": "Unsplash API 요청 실패",
                "status": resp.status_code,
                "details": data,
            }

        payload = resp.json()
        results: List[Dict[str, Any]] = []
        for item in payload.get("results", []):
            results.append(
                {
                    "id": item.get("id"),
                    "description": item.get("description"),
                    "alt": item.get("alt_description"),
                    "width": item.get("width"),
                    "height": item.get("height"),
                    "color": item.get("color"),
                    "urls": item.get("urls", {}),
                    "user": {
                        "name": (item.get("user", {}) or {}).get("name"),
                        "username": (item.get("user", {}) or {}).get("username"),
                        "profile_image": (item.get("user", {}) or {}).get(
                            "profile_image", {}
                        ),
                    },
                }
            )

        return {
            "total": payload.get("total"),
            "total_pages": payload.get("total_pages"),
            "results": results,
        }


if __name__ == "__main__":  # pragma: no cover
    # 로컬 직접 실행 디버깅용
    app.run()


