# PiBench — C++ Algorithm Benchmarking Platform

A web-based C++ benchmarking environment designed to execute code, run multiple test cases, and analyse search algorithm performance against a large dataset of Pi digits.

PiBench combines a **React frontend**, **FastAPI backend**, and **C++ search implementations** to provide an interactive environment for experimenting with algorithm performance.

---

## Overview

Benchmarking algorithms against large datasets can be inconvenient when you have to repeatedly compile programs, execute them manually, and collect timing information.

PiBench simplifies this workflow by providing a browser-based interface where you can:

- Write and edit C++ code using the Monaco Editor.
- Submit and execute C++ programs through a local backend.
- Run multiple test cases in one execution workflow.
- Measure compilation and execution time.
- Search through a large Pi digit dataset using C++.
- Experiment with search algorithms such as Naive String Matching and Knuth–Morris–Pratt (KMP).

The project is designed as a local development and experimentation environment.

## Features

### 1. Interactive C++ Code Editor

- Monaco Editor integration.
- C++ syntax highlighting.
- Editable code directly in the browser.
- Execute code through the backend.

### 2. Multi-Test-Case Execution

- Run multiple test cases through one interface.
- Compile the submitted C++ program once and execute it against individual test cases.
- Display individual execution results.
- Track completed test cases and execution status.

### 3. Performance Metrics

PiBench collects execution information such as:

| Metric | Description |
|---|---|
| Compilation Time | Time required to compile the submitted C++ program |
| Execution Time | Time taken by the program to process a test case |
| Total Execution Time | Overall execution duration |
| Test Cases Completed | Number of successfully executed test cases |
| Test Case Status | Whether the program completed execution successfully |

### 4. Large-Scale Pi Digit Search

The project uses a local Pi digit dataset for searching numerical sequences.

The C++ search implementation:

- Reads the dataset in chunks rather than loading the entire file into memory.
- Searches for a user-provided numerical sequence.
- Preserves matching state across chunk boundaries.
- Reports the first matching position.
- Supports targets that are not present in the dataset.

### 5. Search Algorithms

**Naive String Matching**

A straightforward pattern-matching algorithm that checks possible starting positions against the target sequence.

**Knuth–Morris–Pratt (KMP)**

An efficient pattern-matching algorithm that uses a prefix/LPS table to avoid unnecessary character comparisons.

Both approaches are useful for understanding how algorithmic complexity and implementation choices affect performance on large datasets.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Code Editor | Monaco Editor |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| C++ Compiler | GCC / g++ |
| Algorithms | C++17 |
| API Communication | HTTP / REST |

---

## Project Architecture

```text
                    PiBench
                       |
          +------------+------------+
          |                         |
     React Frontend            FastAPI Backend
          |                         |
     Monaco Editor             Python API
          |                         |
     Test Cases              C++ Compilation
          |                         |
     Run / Results            Program Execution
                                    |
                              C++ Algorithms
                                    |
                           Pi Digit Dataset
```

### Directory Structure

```text
PiBench/
│
├── backend/
│   └── app.py
│
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── ...
│
├── src/
│   ├── main.cpp
│   ├── search.cpp
│   ├── benchmark.cpp
│   │
│   └── algorithms/
│       └── kmp.cpp
│
├── dataset/
│   └── pi.txt                 # Local dataset; not tracked by Git
│
├── .gitignore
└── README.md
```

*The compiled executables and local dependencies are generated during setup and are not included in the repository.*

---

## Getting Started

### Prerequisites

Install the following software before running PiBench:

1. **Node.js and npm** — for the React frontend.
2. **Python 3.10 or later** — for the backend.
3. **GCC / g++ with C++17 support** — for compiling C++ programs.
4. **Git** — for cloning the repository.

Verify your installations:

```powershell
node --version
npm --version
python --version
g++ --version
git --version
```

### 1. Clone the Repository

```powershell
git clone https://github.com/YOUR_USERNAME/PiBench.git
cd PiBench
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set Up the Pi Dataset

PiBench expects the dataset at:

```text
PiBench/dataset/pi.txt
```

Create the directory:

```powershell
mkdir dataset
```

Place your Pi digit text file inside this directory and name it:

```text
pi.txt
```

**Important:**

- The dataset is not included in this GitHub repository.
- Obtain or generate your own dataset.
- Ensure the file contains the expected continuous sequence of Pi digits.
- The current search implementation assumes the file contains digits without whitespace or separators.
- Keep the file in the exact location expected by the application.

### 3. Set Up the Backend

Open a terminal in the project root:

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
pip install fastapi uvicorn pydantic
```

Start the backend:

```powershell
uvicorn app:app --reload --port 8000
```

The backend should be accessible at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 4. Compile the C++ Benchmark Program

Open another terminal in the project root:

```powershell
g++ -O2 -std=c++17 src/benchmark.cpp -o PiBenchmark.exe
```

This generates:

```text
PiBench/PiBenchmark.exe
```

The executable is generated locally and should not be committed to GitHub.

### 5. Set Up the Frontend

Open another terminal:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

---

## Running PiBench

Once the backend and frontend are running:

1. Open the PiBench web interface.
2. Enter or modify the C++ code in the Monaco Editor.
3. Add the required test cases.
4. Execute the tests.
5. Review the compilation and execution metrics.
6. Inspect the individual test case results.

For Pi digit searching, ensure that the dataset exists at `dataset/pi.txt` before executing the search program.

### Example Search Targets

| Target | Expected Search Behaviour |
|---|---|
| `999999999` | Searches for the sequence and reports its first position |
| `123456789012345` | Reports whether the sequence exists |
| `314159265358979` | Reports whether the sequence exists |

Example previously observed with the dataset used during development:

```text
Target: 999999999
Result: FOUND
Position: 564665207
```

Positions are zero-based offsets into the dataset.

Actual results depend on the dataset being used.

---

## Benchmarking Considerations

Benchmark results can be influenced by several factors:

- CPU architecture and processor load.
- Compiler version and optimization flags.
- Operating system and file-system performance.
- Available RAM.
- Operating system file caching.
- Dataset size and target position.
- Whether the target exists in the dataset.

For meaningful comparisons:

- Use the same dataset for all algorithms.
- Use the same compiler and optimization flags.
- Run multiple iterations.
- Avoid running other CPU-intensive applications during testing.
- Consider disk caching when interpreting results.
- Verify that different algorithms return the same search result and position.

**Note:** Execution time measured by PiBench includes the work performed during each program execution. It should not automatically be interpreted as pure CPU computation time.

---

## API Overview

The FastAPI backend provides endpoints for frontend communication.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Backend root |
| `/health` | GET | Backend health check |
| `/run` | POST | Compile and execute submitted C++ code |
| `/benchmark` | POST | Compile once and execute multiple test cases |

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

## Current Limitations

- The application is designed for local development.
- The Pi dataset must be provided separately.
- C++ compilation and execution require a locally installed compiler.
- Performance results vary between machines.
- The current implementation is not designed as a publicly hosted code-execution service.
- Additional isolation and resource controls would be required before accepting untrusted code from external users.

---

## Future Improvements

Potential areas for further development:

- Additional string-search algorithms such as Boyer–Moore and Rabin–Karp.
- Side-by-side algorithm performance comparisons.
- Interactive execution-time visualizations.
- Memory usage measurement.
- Historical benchmark storage.
- Larger configurable datasets.
- Automated benchmark reporting.
- Docker-based execution isolation.
- Support for additional programming languages.

---

## Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your implementation locally.
5. Submit a pull request with a description of the changes.

---

## License

No open-source licence has been specified yet.

Until a licence is added, the repository should not be assumed to grant permission to reuse, modify, or redistribute its contents.

---

## Author

**PiBench**

A C++ algorithm benchmarking project exploring the practical performance of string-search algorithms against large-scale numerical datasets.

Built with React, FastAPI, Python, and C++17.