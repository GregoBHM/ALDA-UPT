import os
import re
from abc import ABC, abstractmethod


DOCKER_BASE_CMD = [
    "docker", "run", "--rm", "-i",
    "--network=none", "--pids-limit=100", "--memory=512m", "--cpus=2.0",
    "--cap-drop=ALL", "--security-opt=no-new-privileges", "--read-only",
    "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=64m",
]


class ICompilerStrategy(ABC):

    @abstractmethod
    def build_run_command(self, code: str, tmpdir: str) -> list[str]:
        pass

    @abstractmethod
    def build_compile_command(self, code: str, tmpdir: str) -> list[str] | None:
        pass

    @abstractmethod
    def build_exec_command(self, code: str, tmpdir: str) -> list[str]:
        pass

    def needs_volume(self) -> bool:
        return False


class PythonCompiler(ICompilerStrategy):

    def build_run_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + ["python:3.10-alpine", "timeout", "28s", "python", "-u", "-c", code]

    def build_compile_command(self, code: str, tmpdir: str) -> list[str] | None:
        return None

    def build_exec_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + ["python:3.10-alpine", "timeout", "8s", "python", "-u", "-c", code]


class JavaScriptCompiler(ICompilerStrategy):

    def build_run_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + ["node:18-alpine", "timeout", "28s", "node", "-e", code]

    def build_compile_command(self, code: str, tmpdir: str) -> list[str] | None:
        return None

    def build_exec_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + ["node:18-alpine", "timeout", "8s", "node", "-e", code]


class JavaCompiler(ICompilerStrategy):

    def needs_volume(self) -> bool:
        return True

    def _get_class_name(self, code: str) -> str:
        match = re.search(r'public\s+class\s+(\w+)', code)
        return match.group(1) if match else "Main"

    def build_run_command(self, code: str, tmpdir: str) -> list[str]:
        class_name = self._get_class_name(code)
        src = os.path.join(tmpdir, f"{class_name}.java")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        return DOCKER_BASE_CMD + [
            "-v", f"{tmpdir}:/app", "-w", "/app",
            "eclipse-temurin:17-alpine", "sh", "-c", f"javac {class_name}.java && timeout 28s java {class_name}"
        ]

    def build_compile_command(self, code: str, tmpdir: str) -> list[str] | None:
        class_name = self._get_class_name(code)
        src = os.path.join(tmpdir, f"{class_name}.java")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        return DOCKER_BASE_CMD + [
            "-v", f"{tmpdir}:/app", "-w", "/app",
            "eclipse-temurin:17-alpine", "javac", f"{class_name}.java"
        ]

    def build_exec_command(self, code: str, tmpdir: str) -> list[str]:
        class_name = self._get_class_name(code)
        return DOCKER_BASE_CMD + [
            "-v", f"{tmpdir}:/app:ro", "-w", "/app",
            "eclipse-temurin:17-alpine", "timeout", "8s", "java", class_name
        ]


class CppCompiler(ICompilerStrategy):

    def needs_volume(self) -> bool:
        return True

    def build_run_command(self, code: str, tmpdir: str) -> list[str]:
        src = os.path.join(tmpdir, "main.cpp")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        return DOCKER_BASE_CMD + [
            "-v", f"{tmpdir}:/app", "-w", "/app",
            "gcc:12", "sh", "-c", "g++ main.cpp -o a.out && timeout 28s ./a.out"
        ]

    def build_compile_command(self, code: str, tmpdir: str) -> list[str] | None:
        src = os.path.join(tmpdir, "main.cpp")
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        return DOCKER_BASE_CMD + [
            "-v", f"{tmpdir}:/app", "-w", "/app",
            "gcc:12", "g++", "main.cpp", "-o", "a.out"
        ]

    def build_exec_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + [
            "-v", f"{tmpdir}:/app:ro", "-w", "/app",
            "gcc:12", "timeout", "8s", "./a.out"
        ]


class BashCompiler(ICompilerStrategy):

    def build_run_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + ["bash:5", "timeout", "28s", "bash", "-c", code]

    def build_compile_command(self, code: str, tmpdir: str) -> list[str] | None:
        return None

    def build_exec_command(self, code: str, tmpdir: str) -> list[str]:
        return DOCKER_BASE_CMD + ["bash:5", "timeout", "8s", "bash", "-c", code]


class CompilerStrategyFactory:

    _strategies = {
        "python": PythonCompiler,
        "javascript": JavaScriptCompiler,
        "java": JavaCompiler,
        "cpp": CppCompiler,
        "bash": BashCompiler,
    }

    @classmethod
    def create(cls, language: str) -> ICompilerStrategy:
        strategy_class = cls._strategies.get(language.lower())
        if not strategy_class:
            raise ValueError(f"Lenguaje no soportado: {language}")
        return strategy_class()
