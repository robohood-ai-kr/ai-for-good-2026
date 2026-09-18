#!/usr/bin/env python3
"""Validate and merge the four user-supplied Stitch archives without executing HTML."""
import argparse
import hashlib
import json
import re
import stat
import struct
import unicodedata
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "design" / "stitch" / "v1"
EXPECTED = {"manufacturing": ("mf", 21), "small-business": ("sb", 20)}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archives", nargs=4, type=Path)
    args = parser.parse_args()
    planned = {}
    provenance = []
    warnings = []
    sectors = {key: set() for key in EXPECTED}
    for archive in sorted(args.archives):
        archive_name = unicodedata.normalize("NFC", archive.name)
        sector = "manufacturing" if "제조중심" in archive_name else "small-business" if "소상공인" in archive_name else None
        if not sector:
            raise ValueError(f"Unknown archive: {archive_name}")
        prefix, maximum = EXPECTED[sector]
        contents = archive.read_bytes()
        source = {"archive": archive_name, "sha256": sha256(contents), "sector": sector, "screens": []}
        with zipfile.ZipFile(archive) as bundle:
            if sum(entry.file_size for entry in bundle.infolist()) > 100_000_000:
                raise ValueError("Archive exceeds the import size limit")
            for entry in bundle.infolist():
                path = PurePosixPath(entry.filename)
                mode = entry.external_attr >> 16
                if path.is_absolute() or ".." in path.parts or "\\" in entry.filename or stat.S_ISLNK(mode):
                    raise ValueError(f"Unsafe ZIP entry: {entry.filename}")
                if entry.is_dir():
                    continue
                if len(path.parts) != 3 or path.parts[0] != "stitch_robohood_v1":
                    raise ValueError(f"Unexpected ZIP entry: {entry.filename}")
                screen_match = re.fullmatch(rf"{prefix}_(\d{{2}})", path.parts[1])
                if screen_match and path.name in {"code.html", "screen.png"}:
                    number = int(screen_match[1])
                    if not 1 <= number <= maximum:
                        raise ValueError(f"Unexpected screen: {entry.filename}")
                    screen = f"{prefix}-{number:02d}"
                    dest = Path(sector) / screen / path.name
                    sectors[sector].add(screen)
                    if screen not in source["screens"]:
                        source["screens"].append(screen)
                elif path.name == "DESIGN.md" and path.parts[1] in {"physical_ai_operations", "merchant_dashboard_system"}:
                    dest = Path(sector) / "STITCH_DESIGN.md"
                else:
                    raise ValueError(f"Unexpected ZIP file: {entry.filename}")
                data = bundle.read(entry)
                if dest in planned and planned[dest] != data:
                    raise ValueError(f"Conflicting export contents: {dest}")
                if path.name == "screen.png":
                    if len(data) < 33 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
                        warnings.append({"file": dest.as_posix(), "issue": "Invalid PNG; original preserved. Build uses code.html."})
                    else:
                        width, height = struct.unpack(">II", data[16:24])
                        if width == 0 or height == 0:
                            raise ValueError(f"Invalid PNG dimensions: {dest}")
                planned[dest] = data
        source["screens"].sort()
        provenance.append(source)

    for sector, (prefix, count) in EXPECTED.items():
        expected = {f"{prefix}-{number:02d}" for number in range(1, count + 1)}
        if sectors[sector] != expected:
            raise ValueError(f"Incomplete {sector}: {sorted(expected - sectors[sector])}")
        for screen in expected:
            for name in ("code.html", "screen.png"):
                if Path(sector) / screen / name not in planned:
                    raise ValueError(f"Missing file: {sector}/{screen}/{name}")

    manifest = {
        "version": "v1", "sources": provenance,
        "counts": {sector: len(screens) for sector, screens in sectors.items()},
        "warnings": warnings,
        "files": [{"path": path.as_posix(), "sha256": sha256(data), "bytes": len(data)} for path, data in sorted(planned.items())],
    }
    planned[Path("manifest.json")] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
    # Validate every destination before writing anything. Never overwrite changed originals.
    for path, data in planned.items():
        target = TARGET / path
        if target.exists() and target.read_bytes() != data:
            raise ValueError(f"Existing file differs; refusing overwrite: {target}")
    for path, data in planned.items():
        target = TARGET / path
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            target.write_bytes(data)
    print(json.dumps({"imported": manifest["counts"], "warnings": warnings, "destination": str(TARGET)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
