import os
import subprocess
import zipfile
from pathlib import Path
from typing import Any, Dict, List


def list_directory(path: str = ".", cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "Access denied: not authorized."}
    if not target.exists() or not target.is_dir():
        return {"success": False, "message": f"Directory not found: {target}"}

    entries = sorted(p.name for p in target.iterdir())
    return {
        "success": True,
        "message": f"Listed {len(entries)} entries in {target}",
        "data": entries,
    }


def read_file(path: str, cwd: str = ".", authorized: bool = True, max_chars: int = 6000) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "Access denied: not authorized."}
    if not target.exists() or not target.is_file():
        return {"success": False, "message": f"File not found: {target}"}

    try:
        content = target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        binary_preview = target.read_bytes()[:max_chars]
        return {
            "success": True,
            "message": f"Read binary content preview from {target}",
            "data": binary_preview.hex(),
        }

    if len(content) > max_chars:
        content = content[:max_chars] + "\n... [truncated for preview]"

    return {"success": True, "message": f"Read {target}", "data": content}


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
        for path in root.rglob("*"):
            relative = str(path.relative_to(root))
            if needle in path.name.lower() or needle in relative.lower():
                matches.append(relative)

    return {
        "success": True,
        "message": f"Found {len(matches)} matches for '{pattern}'",
        "data": matches[:200],
    }


def run_shell_command(command: str, cwd: str = ".", authorized: bool = True, timeout: int = 120) -> Dict[str, Any]:
    if not authorized:
        return {"success": False, "message": "Command execution denied: not authorized."}

    try:
        completed = subprocess.run(
            command,
            cwd=cwd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "success": completed.returncode == 0,
            "message": f"Command exited with code {completed.returncode}",
            "data": {
                "stdout": completed.stdout,
                "stderr": completed.stderr,
                "returncode": completed.returncode,
            },
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "message": "Command timed out.", "data": {"stdout": "", "stderr": "timeout"}}


def inspect_zip(path: str, cwd: str = ".", authorized: bool = True) -> Dict[str, Any]:
    target = Path(cwd) / path if not Path(path).is_absolute() else Path(path)
    if not authorized:
        return {"success": False, "message": "ZIP inspection denied: not authorized."}
    if not target.exists() or not target.is_file():
        return {"success": False, "message": f"ZIP file not found: {target}"}

    try:
        with zipfile.ZipFile(target, "r") as archive:
            members = archive.namelist()
            info = {
                "file_count": len(members),
                "total_size": sum(zinfo.file_size for zinfo in archive.infolist()),
                "members": members[:200],
            }
            return {"success": True, "message": f"Inspected archive {target}", "data": info}
    except zipfile.BadZipFile:
        return {"success": False, "message": f"Invalid ZIP archive: {target}"}


def is_android_or_termux() -> bool:
    env_checks = [
        os.environ.get("TERMUX_VERSION"),
        os.environ.get("ANDROID_ROOT"),
        os.environ.get("PREFIX", "").lower().startswith("/data/data")
    ]
    return any(check is not None and check != "" for check in env_checks) or (
        os.path.exists("/system/bin") and os.path.exists("/system/build.prop")
    )
