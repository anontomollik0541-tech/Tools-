import os
import zipfile
from pathlib import Path
from typing import Any, Dict, List


def list_directory(path: str = ".", cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "Access denied: not authorized."}
    if not target.exists() or not target.is_dir():
        return {"success": False, "message": f"Directory not found: {target}"}
    entries = sorted(entry.name for entry in target.iterdir())
    return {"success": True, "message": f"Listed {len(entries)} entries.", "data": entries}


def read_file(path: str, cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "Access denied: not authorized."}
    if not target.exists() or not target.is_file():
        return {"success": False, "message": f"File not found: {target}"}
    try:
        return {"success": True, "message": f"Read {target}", "data": target.read_text(encoding="utf-8")}
    except UnicodeDecodeError:
        return {"success": True, "message": f"Read binary content from {target}", "data": target.read_bytes()[:2000].hex()}


def write_file(path: str, content: str = "", cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "Write denied: not authorized."}
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return {"success": True, "message": f"Created file {target}", "data": {"size": len(content)}}


def search_files(pattern: str = "*", cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    root = Path(cwd)
    if not authorized:
        return {"success": False, "message": "Search denied: not authorized."}
    matches: List[str] = []
    if pattern == "*":
        matches = [str(p.relative_to(root)) for p in root.rglob("*")]
    else:
        needle = pattern.lower()
        for p in root.rglob("*"):
            if needle in p.name.lower() or needle in str(p.relative_to(root)).lower():
                matches.append(str(p.relative_to(root)))
    return {"success": True, "message": f"Found {len(matches)} matches.", "data": matches[:200]}


def inspect_zip(path: str, cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "ZIP inspection denied: not authorized."}
    if not target.exists() or not target.is_file():
        return {"success": False, "message": f"ZIP file not found: {target}"}
    try:
        with zipfile.ZipFile(target, "r") as archive:
            file_names = archive.namelist()
            return {"success": True, "message": f"Inspected ZIP {target}", "data": {"count": len(file_names), "members": file_names[:200]}}
    except zipfile.BadZipFile:
        return {"success": False, "message": f"Invalid ZIP file: {target}"}
