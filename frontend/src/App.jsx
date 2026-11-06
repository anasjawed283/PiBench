
import { useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Play, RotateCcw, Terminal, Clock,
  Cpu, HardDrive, CheckCircle2, XCircle,
  Code2, Zap, Plus, Trash2, Loader2
} from 'lucide-react'

const initialCode = `#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    string target;

    // Read the test case input
    cin >> target;

    // Write your search algorithm here
    cout << "Searching for: " << target << endl;

    return 0;
}`

const initialCases = [
  { id: 1, input: '999999999', result: null },
  { id: 2, input: '123456789012345', result: null },
  { id: 3, input: '314159265358979', result: null }
]

export default function App() {
  const [code, setCode] = useState(initialCode)
  const [testCases, setTestCases] = useState(initialCases)
  const [running, setRunning] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)

  const completedCases = testCases.filter(tc => tc.result !== null)
  const totalExecution = completedCases.reduce(
    (sum, tc) => sum + (tc.result.executionTime || 0), 0
  )
  const totalCompilation = completedCases.reduce(
    (sum, tc) => sum + (tc.result.compileTime || 0), 0
  )

  const updateCaseInput = (id, value) => {
    setTestCases(cases =>
      cases.map(tc => tc.id === id ? { ...tc, input: value } : tc)
    )
  }

  const addTestCase = () => {
    setTestCases(cases => [
      ...cases,
      { id: Date.now(), input: '', result: null }
    ])
  }

  const removeTestCase = (id) => {
    setTestCases(cases => cases.filter(tc => tc.id !== id))
  }

  
  const runAll = async () => {
    if (running || testCases.length === 0) return

    setRunning(true)

    setTestCases(cases =>
      cases.map(tc => ({ ...tc, result: null }))
    )

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/benchmark',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            test_cases: testCases.map(tc => tc.input)
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Benchmark request failed')
      }

      setBackendConnected(true)

      if (data.status === 'COMPILE_ERROR') {
        setTestCases(cases =>
          cases.map(tc => ({
            ...tc,
            result: {
              status: 'COMPILE_ERROR',
              error: data.error,
              executionTime: 0,
              compileTime: data.compile_time_ms
            }
          }))
        )
        return
      }

      setTestCases(cases =>
        cases.map((tc, index) => {
          const item = data.cases[index]

          return {
            ...tc,
            result: {
              status: item.status,
              output: item.output,
              error: item.error,
              executionTime: item.execution_time_ms,
              compileTime: index === 0
                ? data.compile_time_ms
                : 0
            }
          }
        })
      )

    } catch (error) {
      setBackendConnected(false)

      setTestCases(cases =>
        cases.map(tc => ({
          ...tc,
          result: {
            status: 'ERROR',
            error: error.message,
            executionTime: 0,
            compileTime: 0
          }
        }))
      )

    } finally {
      setRunning(false)
    }
  }


  const resetAll = () => {
    if (running) return
    setCode(initialCode)
    setTestCases(initialCases)
  }

  const getStatusColor = (status) => {
    if (status === 'SUCCESS') return 'text-green-400'
    if (status === 'RUNNING') return 'text-indigo-400'
    if (status === 'COMPILE_ERROR' || status === 'RUNTIME_ERROR' ||
        status === 'CONNECTION_ERROR' || status === 'TIME_LIMIT_EXCEEDED') {
      return 'text-red-400'
    }
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-200">

      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl">
            π
          </div>
          <div>
            <h1 className="font-bold text-lg">PiBench</h1>
            <p className="text-[10px] text-gray-500 tracking-widest">
              ALGORITHM PERFORMANCE LAB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Dataset: 1B digits</span>
          <span className="bg-indigo-500/15 text-indigo-400 px-3 py-1 rounded-md">
            C++17
          </span>
        </div>
      </header>

      <main className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT PANEL */}
        <section className="border border-white/10 rounded-xl overflow-hidden">
          <div className="h-12 px-4 flex items-center justify-between bg-[#151a24] border-b border-white/10">
            <div className="flex items-center gap-2 text-sm">
              <Code2 size={16} />
              solution.cpp
            </div>
            <span className="text-xs text-gray-500">C++17</span>
          </div>

          <Editor
            height="480px"
            language="cpp"
            theme="vs-dark"
            value={code}
            onChange={value => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              padding: { top: 16 },
              scrollBeyondLastLine: false
            }}
          />

          <div className="p-4 bg-[#151a24] border-t border-white/10 space-y-4">

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold">Test Cases</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Each input is passed to your program through stdin.
                </p>
              </div>

              <button
                onClick={addTestCase}
                disabled={running}
                className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg disabled:opacity-40"
              >
                <Plus size={14} />
                Add Case
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testCases.map((tc, index) => (
                <div key={tc.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-10 shrink-0">
                    TC{String(index + 1).padStart(2, '0')}
                  </span>

                  <input
                    value={tc.input}
                    onChange={e => updateCaseInput(tc.id, e.target.value)}
                    disabled={running}
                    className="min-w-0 flex-1 bg-[#0b0e14] border border-white/10 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-mono text-sm disabled:opacity-50"
                    placeholder="Enter test input"
                  />

                  <button
                    onClick={() => removeTestCase(tc.id)}
                    disabled={running || testCases.length === 1}
                    className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30"
                    title="Delete test case"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {testCases.length === 0 && (
                <p className="text-xs text-gray-500">
                  No test cases. Add one to continue.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={runAll}
                disabled={running || testCases.length === 0 || !code.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg py-3 flex items-center justify-center gap-2 font-semibold"
              >
                {running
                  ? <Loader2 size={17} className="animate-spin" />
                  : <Play size={17} />}
                {running ? 'Running Tests...' : 'Run All Tests'}
              </button>

              <button
                onClick={resetAll}
                disabled={running}
                className="px-4 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-40"
                title="Reset editor and test cases"
              >
                <RotateCcw size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="border border-white/10 rounded-xl overflow-hidden flex flex-col min-h-[600px]">

          <div className="h-12 px-4 flex items-center justify-between bg-[#151a24] border-b border-white/10">
            <div className="flex items-center">
              <Terminal size={16} className="mr-2" />
              <span className="text-sm font-medium">Execution Results</span>
            </div>
            <span className={`text-xs ${backendConnected ? 'text-green-400' : 'text-gray-500'}`}>
              {backendConnected ? 'Backend connected' : 'Backend status unknown'}
            </span>
          </div>

          <div className="p-5 space-y-5 flex-1">

            {/* METRICS */}
            <div className="grid grid-cols-2 gap-3">
              <Metric
                icon={<Clock />}
                label="Total Execution Time"
                value={completedCases.length
                  ? `${totalExecution.toFixed(3)} ms`
                  : '--'}
              />

              <Metric
                icon={<Cpu />}
                label="Compilation Time"
                value={completedCases.length
                  ? `${completedCases[0]?.result?.compileTime || 0} ms`
                  : '--'}
              />

              <Metric
                icon={<HardDrive />}
                label="Memory Usage"
                value="Not measured"
              />

              <Metric
                icon={<Zap />}
                label="Completed Cases"
                value={`${completedCases.length} / ${testCases.length}`}
              />
            </div>

            {/* CASE RESULTS */}
            <div className="border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Test Case Results</h3>
                <span className="text-xs text-gray-500">
                  {testCases.length} cases
                </span>
              </div>

              <div className="space-y-2">
                {testCases.map((tc, index) => (
                  <div
                    key={tc.id}
                    className="p-3 bg-[#151a24] rounded-lg border border-white/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          TC{String(index + 1).padStart(2, '0')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                          Input: {tc.input || '(empty)'}
                        </p>
                      </div>

                      <div className={`flex items-center gap-2 text-xs shrink-0 ${getStatusColor(tc.result?.status)}`}>
                        {tc.result?.status === 'SUCCESS' ? (
                          <CheckCircle2 size={16} />
                        ) : tc.result?.status === 'RUNNING' ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : tc.result?.status ? (
                          <XCircle size={16} />
                        ) : null}
                        {tc.result?.status || 'PENDING'}
                      </div>
                    </div>

                    {tc.result && tc.result.status !== 'RUNNING' && (
                      <div className="mt-3 pt-2 border-t border-white/5 flex gap-4 text-xs text-gray-500">
                        <span>Execution: {tc.result.executionTime} ms</span>
                        <span>Compile: {tc.result.compileTime} ms</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CONSOLE OUTPUT */}
            <div className="border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Console Output</h3>

              <div className="space-y-4 max-h-72 overflow-y-auto">
                {completedCases.length === 0 ? (
                  <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                    Waiting for execution...
                  </pre>
                ) : (
                  testCases.filter(tc => tc.result && tc.result.status !== 'RUNNING')
                    .map((tc, index) => (
                      <div key={tc.id}>
                        <p className="text-xs text-indigo-400 mb-2">
                          TC{String(testCases.indexOf(tc) + 1).padStart(2, '0')}
                        </p>
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words">
                          {tc.result.output || tc.result.error || 'No output'}
                        </pre>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* BENCHMARK */}
            <div className="border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Algorithm Benchmark</h3>
              <p className="text-xs text-gray-500">
                Run your algorithm against multiple inputs. Benchmark comparisons and charts will be added in the next stages.
              </p>
            </div>

          </div>

          <div className="p-3 border-t border-white/10 text-xs text-gray-500 flex justify-between">
            <span>PiBench Engine</span>
            <span>{running ? 'Executing...' : 'Ready'}</span>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({ icon, label, value }) {
  return (
    <div className="border border-white/10 rounded-xl p-4 bg-[#111620]">
      <div className="text-gray-500 mb-3">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  )
}
