import re
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Tuple


class CodingAgent:
    def __init__(self, working_directory: str = ".", authorized: bool = True):
        self.working_directory = Path(working_directory).resolve()
        self.authorized = authorized

    def repo_inventory(self) -> List[str]:
        root = self.working_directory
        files: List[str] = []
        for path in sorted(root.rglob("*")):
            if not path.is_file():
                continue
            if any(part in {".git", "__pycache__", ".venv", "venv"} for part in path.parts):
                continue
            files.append(str(path.relative_to(root)))
        return files

    def _tokenize(self, text: str) -> set[str]:
        return {token.lower() for token in re.findall(r"[A-Za-z0-9_./-]+", text)}

    def identify_relevant_files(self, task: str, file_list: List[str]) -> List[str]:
        tokens = self._tokenize(task)
        scored: List[Tuple[int, str]] = []

        for rel_path in file_list:
            lowered = rel_path.lower()
            score = sum(1 for token in tokens if token in lowered)
            if score > 0:
                scored.append((score, rel_path))

        if not scored:
            return file_list[:20]

        scored.sort(key=lambda item: (-item[0], item[1]))
        return [rel for _, rel in scored[:10]]

    def read_candidates(self, relevant_files: List[str]) -> List[Dict[str, str]]:
        results: List[Dict[str, str]] = []
        for rel_path in relevant_files:
            full_path = self.working_directory / rel_path
            if not full_path.exists() or not full_path.is_file():
                continue
            try:
                content = full_path.read_text(encoding="utf-8")
                if len(content) > 8000:
                    content = content[:8000] + "\n... [truncated]"
                results.append({"path": rel_path, "content": content})
            except Exception:
                continue
        return results

    def run_verification(self) -> Dict[str, Any]:
        if not self.authorized:
            return {"success": False, "message": "Verification not allowed because execution is unauthorized."}

        py_files = list(self.working_directory.rglob("*.py"))
        if not py_files:
            return {"success": True, "message": "No Python files detected; nothing to verify with compile checks.", "data": {"returncode": 0}}

        completed = subprocess.run(
            "python -m compileall .",
            cwd=str(self.working_directory),
            shell=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return {
            "success": completed.returncode == 0,
            "message": f"Compile verification exited with code {completed.returncode}",
            "data": {
                "stdout": completed.stdout,
                "stderr": completed.stderr,
                "returncode": completed.returncode,
            },
        }

    def solve(self, task: str) -> Dict[str, Any]:
        if not task.strip():
            return {"success": False, "message": "No task provided to the coding agent."}

        file_list = self.repo_inventory()
        relevant_files = self.identify_relevant_files(task, file_list)
        readings = self.read_candidates(relevant_files)
        verification = self.run_verification()

        summary_lines = [
            f"Coding agent task: {task}",
            f"Relevant files inspected: {len(relevant_files)}",
        ]
        if relevant_files:
            summary_lines.append("Likely files:")
            for rel in relevant_files:
                summary_lines.append(f"- {rel}")
        if verification.get("success"):
            summary_lines.append("Verification status: pass")
        else:
            summary_lines.append("Verification status: failed or unavailable")

        return {
            "success": bool(verification.get("success", False)) or bool(readings),
            "task": task,
            "relevant_files": relevant_files,
            "readings": readings,
            "verification": verification,
            "summary": "\n".join(summary_lines),
        }
