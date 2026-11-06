
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <chrono>
#include <algorithm>
#include <iomanip>
#include <cstdint>

using namespace std;
using namespace chrono;

struct SearchResult {
    bool fileOpened = false;
    long long position = -1;
    uint64_t bytesProcessed = 0;
};

SearchResult naiveSearch(const string& filename, const string& target) {

    SearchResult result;

    ifstream file(filename, ios::binary);

    if (!file.is_open()) {
        return result;
    }

    result.fileOpened = true;

    if (target.empty()) return result;

    const size_t BUFFER_SIZE = 4 * 1024 * 1024;

    vector<char> buffer(BUFFER_SIZE);
    string carry;

    uint64_t totalRead = 0;
    size_t overlap = target.length() - 1;

    while (file) {

        file.read(buffer.data(), BUFFER_SIZE);
        size_t bytesRead = static_cast<size_t>(file.gcount());

        if (bytesRead == 0) break;

        string current = carry;
        current.append(buffer.data(), bytesRead);

        size_t position = current.find(target);

        if (position != string::npos) {

            uint64_t globalPosition =
                totalRead - carry.size() + position;

            result.position = static_cast<long long>(globalPosition);

            result.bytesProcessed =
                globalPosition + target.length();

            return result;
        }

        totalRead += bytesRead;

        size_t keep = min(overlap, current.size());

        carry = current.substr(current.size() - keep);
    }

    result.bytesProcessed = totalRead;

    return result;
}

int main() {

    const string DATASET = "dataset/pi.txt";
    const int ITERATIONS = 5;

    string target;

    cout << "=====================================\n";
    cout << "           PiBench v0.3\n";
    cout << "=====================================\n";

    cout << "\nEnter number to search: ";
    cin >> target;

    vector<double> times;
    SearchResult finalResult;

    double totalTime = 0;
    double minTime = 1e18;
    double maxTime = 0;

    cout << "\nRunning " << ITERATIONS << " benchmark iterations...\n";

    for (int i = 0; i < ITERATIONS; i++) {

        auto start = steady_clock::now();

        SearchResult result = naiveSearch(DATASET, target);

        auto end = steady_clock::now();

        double elapsed =
            duration<double, milli>(end - start).count();

        if (!result.fileOpened) {
            cerr << "\nERROR: Cannot open dataset: "
                 << DATASET << "\n";
            return 1;
        }

        if (i == 0) {
            finalResult = result;
        }

        // Verify that every iteration gives the same answer.
        if (result.position != finalResult.position) {
            cerr << "ERROR: Inconsistent search results!\n";
            return 1;
        }

        times.push_back(elapsed);

        totalTime += elapsed;
        minTime = min(minTime, elapsed);
        maxTime = max(maxTime, elapsed);

        cout << "Run " << i + 1 << " : "
             << fixed << setprecision(3)
             << elapsed << " ms\n";
    }

    double averageTime = totalTime / ITERATIONS;

    cout << "\n========== PiBench Results ==========\n";

    if (finalResult.position != -1) {
        cout << "Status          : FOUND\n";
        cout << "Position        : " << finalResult.position << "\n";
    }
    else {
        cout << "Status          : NOT FOUND\n";
    }

    cout << "\n--- Dataset Metrics ---\n";

    cout << "Bytes Processed : "
         << finalResult.bytesProcessed << " bytes\n";

    cout << "MB Processed    : "
         << finalResult.bytesProcessed / (1024.0 * 1024.0)
         << " MB\n";

    cout << "\n--- Benchmark Metrics ---\n";

    cout << "Iterations      : " << ITERATIONS << "\n";
    cout << "Average Time    : " << averageTime << " ms\n";
    cout << "Minimum Time    : " << minTime << " ms\n";
    cout << "Maximum Time    : " << maxTime << " ms\n";

    cout << "=====================================\n";

    // Save results to CSV.
    ofstream csv("result/benchmarks.csv", ios::app);

    if (csv.is_open()) {

        if (csv.tellp() == 0) {
            csv << "Algorithm,Target,Position,BytesProcessed,"
                   "Iterations,AverageMs,MinMs,MaxMs\n";
        }

        csv << "Naive,"
            << target << ","
            << finalResult.position << ","
            << finalResult.bytesProcessed << ","
            << ITERATIONS << ","
            << setprecision(10) << averageTime << ","
            << minTime << ","
            << maxTime << "\n";

        cout << "\nResults saved to result/benchmarks.csv\n";
    }
    else {
        cerr << "\nWARNING: Could not save CSV results.\n";
    }

    return 0;
}
