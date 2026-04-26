#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path
from urllib import request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inspect /scan output: raw extracted text vs filled medical record structure."
    )
    parser.add_argument("file", help="Path to input file (fixture/document) to scan.")
    parser.add_argument(
        "--api-base-url",
        default="http://127.0.0.1:8000",
        help="Backend API base URL (default: http://127.0.0.1:8000).",
    )
    parser.add_argument(
        "--raw-text-limit",
        type=int,
        default=1200,
        help="Max number of raw text characters to print (default: 1200).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    file_path = Path(args.file).expanduser().resolve()
    if not file_path.exists() or not file_path.is_file():
        print(f"[error] File not found: {file_path}")
        return 1

    scan_url = f"{args.api_base_url.rstrip('/')}/api/v1/documents/scan"
    boundary = "----inspect-scan-" + uuid.uuid4().hex
    file_bytes = file_path.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
        "Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = request.Request(
        scan_url,
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    try:
        with request.urlopen(req, timeout=120) as resp:
            status_code = resp.getcode()
            response_text = resp.read().decode("utf-8", errors="replace")
    except Exception as error:
        print(f"[error] Request failed: {error}")
        return 1

    try:
        payload = json.loads(response_text)
    except json.JSONDecodeError:
        print(f"[error] Non-JSON response ({status_code}):")
        print(response_text[:2000])
        return 1

    if status_code != 200:
        print(f"[error] Scan failed with status {status_code}")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 1

    medical_record = payload.get("medical_record", {})
    source_documents = medical_record.get("source_documents", [])
    raw_text = source_documents[0].get("raw_text", "") if source_documents else ""
    timeline = medical_record.get("timeline", [])

    report = {
        "file": str(file_path),
        "parsing_metadata": payload.get("parsing_metadata"),
        "raw_text_excerpt": raw_text[: max(0, args.raw_text_limit)],
        "model_structure": {
            "patient": medical_record.get("patient"),
            "owner": medical_record.get("owner"),
            "timeline_count": len(timeline),
            "first_timeline_event": timeline[0] if timeline else None,
        },
    }

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
