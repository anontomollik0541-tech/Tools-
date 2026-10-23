from __future__ import annotations

import argparse

from assistant import AutonomousAssistant


def interactive_loop() -> None:
    assistant = AutonomousAssistant()
    print("Autonomous AI assistant ready. Type 'help' for examples, 'agent solve <task>' for coding-agent mode, or 'exit' to quit.")

    while True:
        try:
            prompt = input("assistant> ").strip()
        except EOFError:
            print("\nSession ended.")
            break

        if not prompt:
            continue
        if prompt.lower() in {"exit", "quit", "bye"}:
            print("Goodbye.")
            break
        if prompt.lower() == "help":
            print("Examples:")
            print("  - list the current directory")
            print("  - read README.md")
            print("  - search for Python files")
            print("  - run pwd")
            print("  - inspect archive.zip")
            print("  - create a file named notes.txt with content: hello world")
            print("  - agent solve inspect the project and verify Python code quality")
            continue

        result = assistant.execute(prompt, authorized=True)
        if isinstance(result.get("summary"), str):
            print(result["summary"])
        if isinstance(result.get("readings"), list):
            for item in result["readings"]:
                print(item["path"])
                print(item["content"][:2000])
        elif isinstance(result.get("results"), list):
            for item in result["results"]:
                if item.data is None:
                    continue
                if isinstance(item.data, str):
                    print(item.data[:2000])
                else:
                    print(str(item.data)[:2000])


def demo_run() -> None:
    assistant = AutonomousAssistant()
    result = assistant.execute("agent solve inspect the project and verify Python code quality.", authorized=True)
    print(result.get("summary", "No summary."))
    if isinstance(result.get("readings"), list):
        for item in result["readings"]:
            print(item["path"])
            print(item["content"][:1000])


def main() -> None:
    parser = argparse.ArgumentParser(description="Autonomous AI assistant")
    parser.add_argument("--demo", action="store_true", help="Run a built-in demo prompt")
    args = parser.parse_args()

    if args.demo:
        demo_run()
        return

    interactive_loop()


if __name__ == "__main__":
    main()
