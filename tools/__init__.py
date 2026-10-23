def recommend_tool(task: str):
    lower = task.lower()
    if any(word in lower for word in ["zip", "archive", "jar", "apk"]):
        return {"tool": "inspect_zip", "reason": "ZIP inspection is necessary to inspect the archive."}
    if any(word in lower for word in ["run", "execute", "command", "terminal", "shell"]):
        return {"tool": "run_shell", "reason": "The task requires shell execution."}
    if any(word in lower for word in ["find", "search", "locate", "lookup"]):
        return {"tool": "search_files", "reason": "The task requires searching the workspace."}
    if any(word in lower for word in ["read", "open", "analyze", "inspect"]):
        return {"tool": "read_file", "reason": "Reading the file will provide the evidence needed for the task."}
    return {"tool": "list_directory", "reason": "Listing the project layout gives the best starting context."}


recommend_tool.__tool__ = True
recommend_tool.__tool_name__ = "recommend_tool"
recommend_tool.__tool_description__ = "Recommend the best tool for a user request."
