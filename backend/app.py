
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import subprocess
import tempfile
import time
import subprocess
import re

app = FastAPI(title="PiBench API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class BenchmarkRequest(BaseModel):
    code: str
    test_cases: list[str]


@app.get("/")
def home():
    return {"message": "PiBench Backend Running"}


@app.get("/health")
def health():
    return {"status": "online"}


@app.post("/benchmark")
def benchmark(request: BenchmarkRequest):

    if not request.code.strip():
        raise HTTPException(400, "Code cannot be empty")

    if len(request.code) > 50000:
        raise HTTPException(413, "Code is too large")

    if not request.test_cases or len(request.test_cases) > 50:
        raise HTTPException(400, "Provide between 1 and 50 test cases")

    with tempfile.TemporaryDirectory(
        dir=PROJECT_ROOT / "backend"
    ) as temp_dir:

        source = Path(temp_dir) / "solution.cpp"
        executable = Path(temp_dir) / "solution.exe"

        source.write_text(request.code, encoding="utf-8")

        # Compile exactly once
        compile_start = time.perf_counter()

        try:
            compilation = subprocess.run(
                [
                    "g++",
                    "-O2",
                    "-std=c++17",
                    str(source),
                    "-o",
                    str(executable)
                ],
                capture_output=True,
                text=True,
                timeout=20
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(408, "Compilation timed out")

        compile_time = (
            time.perf_counter() - compile_start
        ) * 1000

        if compilation.returncode != 0:
            return {
                "status": "COMPILE_ERROR",
                "error": compilation.stderr,
                "compile_time_ms": round(compile_time, 3),
                "cases": []
            }

        results = []
        total_execution = 0

        # Execute the same compiled program for every test case
        for index, test_input in enumerate(request.test_cases):

            start = time.perf_counter()

            try:
                execution = subprocess.run(
                    [str(executable)],
                    input=test_input + "\n",
                    capture_output=True,
                    text=True,
                    cwd=PROJECT_ROOT,
                    timeout=10
                )

                elapsed = (
                    time.perf_counter() - start
                ) * 1000

                total_execution += elapsed

                results.append({
                    "case": index + 1,
                    "input": test_input,
                    "status": (
                        "SUCCESS"
                        if execution.returncode == 0
                        else "RUNTIME_ERROR"
                    ),
                    "output": execution.stdout,
                    "error": execution.stderr,
                    "execution_time_ms": round(elapsed, 3),
                    "exit_code": execution.returncode
                })

            except subprocess.TimeoutExpired:
                results.append({
                    "case": index + 1,
                    "input": test_input,
                    "status": "TIME_LIMIT_EXCEEDED",
                    "output": "",
                    "error": "Execution exceeded 10 seconds",
                    "execution_time_ms": 10000
                })

                total_execution += 10000

        return {
            "status": "COMPLETED",
            "compile_time_ms": round(compile_time, 3),
            "total_execution_time_ms": round(total_execution, 3),
            "average_execution_time_ms": round(
                total_execution / len(request.test_cases), 3
            ),
            "cases": results
        }

class CompareRequest(BaseModel):
    target: str
    iterations: int = 3
    
@app.post("/compare")
def compare_algorithms(request: CompareRequest):

    if not re.fullmatch(r"[0-9]+", request.target):
        raise HTTPException(400, "Target must contain digits only")

    if not 1 <= request.iterations <= 20:
        raise HTTPException(400, "Iterations must be between 1 and 20")

    executable = PROJECT_ROOT / "PiBenchmark.exe"
    dataset = PROJECT_ROOT / "dataset" / "pi.txt"

    if not executable.exists():
        raise HTTPException(404, "PiBenchmark.exe not found")

    if not dataset.exists():
        raise HTTPException(404, "Pi dataset not found")

    try:
        process = subprocess.run(
            [
                str(executable),
                str(dataset),
                request.target,
                str(request.iterations)
            ],
            capture_output=True,
            text=True,
            timeout=180,
            cwd=PROJECT_ROOT
        )

        if process.returncode != 0:
            raise HTTPException(500, process.stderr)

        lines = process.stdout.strip().splitlines()

        if len(lines) < 3:
            raise HTTPException(500, "Invalid benchmark output")

        results = []

        for line in lines[1:]:
            values = line.split(",")

            if len(values) != 8:
                continue

            results.append({
                "algorithm": values[0],
                "found": values[1] == "YES",
                "position": int(values[2]),
                "bytes_processed": int(values[3]),
                "iterations": int(values[4]),
                "average_ms": float(values[5]),
                "min_ms": float(values[6]),
                "max_ms": float(values[7])
            })

        if len(results) != 2:
            raise HTTPException(500, "Expected Naive and KMP results")

        if results[0]["found"] != results[1]["found"] or (
            results[0]["position"] != results[1]["position"]
        ):
            raise HTTPException(500, "Algorithm results do not match")

        return {
            "status": "SUCCESS",
            "target": request.target,
            "iterations": request.iterations,
            "results": results
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(408, "Benchmark timed out")