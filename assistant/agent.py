from __future__ import annotations

import importlib.util
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .coding_agent import CodingAgent
from .execution import (
    inspect_zip,
    list_directory,
    read_file,
    run_shell_command,
    search_files,
    write_file,
)


@dataclass
class ToolResult:
    name: str
    success: bool
    message: str
    data: Any = None


@dataclass
class TaskContext:
    prompt: str
    authorized: bool = True
    working_directory: str = "."
    notes: List[str] = field(default_factory=list)


class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, Callable[..., Any]] = {}

    def register(self, name: str, func: Callable[..., Any], description: str = "") -> None:
        self.tools[name] = func

    def discover_plugins(self, plugins_dir: str | os.PathLike[str]) -> List[str]:
        discovered: List[str] = []
        base = Path(plugins_dir)
        if not base.exists():
            return discovered
        for plugin_path in sorted(base.glob("*.py")):
            if plugin_path.name.startswith("__"):
                continue
            module_name = f"tools.{plugin_path.stem}"
            spec = importlib.util.spec_from_file_location(module_name, plugin_path)
            if spec is None or spec.loader is None:
                continue
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            for attribute_name in dir(module):
                obj = getattr(module, attribute_name)
                if callable(obj) and getattr(obj, "__tool__", False):
                    tool_name = getattr(obj, "__tool_name__", attribute_name)
                    self.register(tool_name, obj, getattr(obj, "__tool_description__", ""))
                    discovered.append(tool_name)
        return discovered


class AutonomousAssistant:
    def __init__(self, working_directory: str = "."):
        self.working_directory = Path(working_directory).resolve()
        self.registry = ToolRegistry()
        self._register_builtin_tools()
        self._register_plugins()

    def _register_plugins(self) -> None:
        plugin_dir = Path(__file__).resolve().parent.parent / "tools"
        self.registry.discover_plugins(plugin_dir)

    def _register_builtin_tools(self) -> None:
        self.registry.register("list_directory", list_directory, "List directory contents")
        self.registry.register("read_file", read_file, "Read file contents")
        self.registry.register("write_file", write_file, "Create or update files")
        self.registry.register("search_files", search_files, "Search files or text")
        self.registry.register("run_shell", run_shell_command, "Run shell commands")
        self.registry.register("inspect_zip", inspect_zip, "Inspect ZIP archives")
        self.registry.register("recommend_tool", self.recommend_tool, "Recommend best tool")

    def recommend_tool(self, task: str, **kwargs: Any) -> Dict[str, Any]:
        lowered = task.lower()
        if any(word in lowered for word in ["zip", "archive", "apk", "jar"]):
            return {"success": True, "message": "ZIP inspection is the correct tool.", "data": {"tool": "inspect_zip"}}
        if any(word in lowered for word in ["run", "execute", "command", "terminal", "shell", "install", "deploy", "test"]):
            return {"success": True, "message": "Command execution is likely required.", "data": {"tool": "run_shell"}}
        if any(word in lowered for word in ["search", "find", "lookup", "locate"]):
            return {"success": True, "message": "Search is the best next step.", "data": {"tool": "search_files"}}
        if any(word in lowered for word in ["read", "view", "open", "analyze", "inspect"]):
            return {"success": True, "message": "Reading the target file is the best next action.", "data": {"tool": "read_file"}}
        return {"success": True, "message": "Listing the current directory gives context.", "data": {"tool": "list_directory"}}

    def plan_prompt(self, prompt: str) -> List[str]:
        text = prompt.lower()
        ordered: List[str] = []

        if any(word in text for word in ["zip", "archive", "apk", "jar"]):
            ordered.append("inspect_zip")
        if any(word in text for word in ["read", "open", "view", "inspect", "analyze"]):
            ordered.append("read_file")
        if any(word in text for word in ["search", "find", "locate", "lookup"]):
            ordered.append("search_files")
        if any(word in text for word in ["run", "execute", "command", "terminal", "shell", "test", "verify"]):
            ordered.append("run_shell")
        if any(word in text for word in ["write", "create", "save", "edit", "generate"]):
            ordered.append("write_file")

        if not ordered:
            ordered = ["list_directory", "search_files"]

        unique: List[str] = []
        seen = set()
        for step in ordered:
            if step not in seen:
                unique.append(step)
                seen.add(step)
        return unique

    def _extract_path(self, prompt: str) -> Optional[str]:
        for token in prompt.split():
            cleaned = token.strip("\"'`")
            if cleaned.startswith(("/", "./", "../", ".\\", "..\\")) or "/" in cleaned or "\\" in cleaned:
                return cleaned
        return None

    def _extract_command(self, prompt: str) -> str:
        for marker in ["run ", "execute ", "command ", "terminal "]:
            idx = prompt.lower().find(marker)
            if idx >= 0:
                return prompt[idx + len(marker):].strip()
        return prompt.strip()

    def _extract_write_content(self, prompt: str) -> str:
        keyword = "content:"
        idx = prompt.lower().find(keyword)
        if idx >= 0:
            return prompt[idx + len(keyword):].strip()
        return "Generated by the autonomous assistant."

    def _build_arguments(self, tool_name: str, prompt: str, context: TaskContext) -> Dict[str, Any]:
        args: Dict[str, Any] = {"cwd": context.working_directory, "authorized": context.authorized}

        if tool_name == "list_directory":
            args["path"] = self._extract_path(prompt) or context.working_directory
        elif tool_name == "read_file":
            args["path"] = self._extract_path(prompt) or "README.md"
        elif tool_name == "write_file":
            args["path"] = self._extract_path(prompt) or "output.txt"
            args["content"] = self._extract_write_content(prompt)
        elif tool_name == "search_files":
            args["pattern"] = prompt.strip() or "*"
        elif tool_name == "run_shell":
            args["command"] = self._extract_command(prompt) or "pwd"
        elif tool_name == "inspect_zip":
            args["path"] = self._extract_path(prompt) or "archive.zip"

        return args

    def solve_project_task(self, task: str, authorized: bool = True) -> Dict[str, Any]:
        coder = CodingAgent(self.working_directory, authorized)
        return coder.solve(task)

    def execute(self, prompt: str, authorized: bool = True) -> Dict[str, Any]:
        if prompt.lower().startswith("agent solve "):
            return self.solve_project_task(prompt[len("agent solve "):], authorized)

        context = TaskContext(prompt=prompt, authorized=authorized, working_directory=str(self.working_directory))
        steps = self.plan_prompt(prompt)
        results: List[ToolResult] = []

        for tool_name in steps:
            func = self.registry.tools.get(tool_name)
            if func is None:
                results.append(ToolResult(tool_name, False, f"Tool '{tool_name}' is unavailable."))
                continue

            try:
                args = self._build_arguments(tool_name, prompt, context)
                outcome = func(**args)
                if isinstance(outcome, dict) and "success" in outcome:
                    results.append(
                        ToolResult(
                            tool_name,
                            bool(outcome.get("success", False)),
                            str(outcome.get("message", "Executed.")),
                            outcome.get("data"),
                        )
                    )
                else:
                    results.append(ToolResult(tool_name, True, "Completed.", outcome))
            except Exception as exc:  # pragma: no cover
                results.append(ToolResult(tool_name, False, f"Execution failed: {exc}"))

        verified = bool(results) and all(item.success for item in results)
        summary = ["Task summary:"]
        for item in results:
            status = "ok" if item.success else "failed"
            summary.append(f"- {item.name}: {status} — {item.message}")
        summary.append("All requested steps succeeded." if verified else "Some steps failed or could not be verified.")

        return {
            "plan": steps,
            "results": results,
            "verified": verified,
            "summary": "\n".join(summary),
        }


__all__ = ["AutonomousAssistant", "TaskContext", "ToolRegistry", "ToolResult"]
