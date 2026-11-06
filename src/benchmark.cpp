
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <chrono>
#include <algorithm>
#include <iomanip>
#include <climits>

using namespace std;
using namespace chrono;

const size_t BUFFER_SIZE = 4 * 1024 * 1024;

struct Result {
    string algorithm;
    bool found = false;
    long long position = -1;
    long long bytesProcessed = 0;
    double averageMs = 0;
    double minMs = 0;
    double maxMs = 0;
};

vector<int> buildLPS(const string& pattern) {
    vector<int> lps(pattern.size(), 0);
    int len = 0;

    for (int i = 1; i < (int)pattern.size();) {
        if (pattern[i] == pattern[len]) {
            lps[i++] = ++len;
        } else if (len > 0) {
            len = lps[len - 1];
        } else {
            lps[i++] = 0;
        }
    }

    return lps;
}

Result naiveSearch(const string& filename,
                   const string& target) {

    Result result;
    result.algorithm = "Naive";

    ifstream file(filename, ios::binary);

    if (!file) {
        throw runtime_error("Cannot open dataset");
    }

    vector<char> buffer(BUFFER_SIZE);
    string carry;

    long long offset = 0;

    while (file) {
        file.read(buffer.data(), BUFFER_SIZE);
        streamsize count = file.gcount();

        if (count <= 0) break;

        result.bytesProcessed += count;

        string chunk = carry;
        chunk.append(buffer.data(), count);

        if (chunk.size() >= target.size()) {
            size_t limit = chunk.size() - target.size();

            for (size_t i = 0; i <= limit; i++) {
                size_t j = 0;

                while (j < target.size() &&
                       chunk[i + j] == target[j]) {
                    j++;
                }

                if (j == target.size()) {
                    result.found = true;
                    result.position =
                        offset - carry.size() + i;
                    return result;
                }
            }
        }

        size_t keep = min(
            target.size() > 0 ? target.size() - 1 : 0,
            chunk.size()
        );

        carry = chunk.substr(chunk.size() - keep);
        offset += count;
    }

    return result;
}

Result kmpSearch(const string& filename,
                 const string& target) {

    Result result;
    result.algorithm = "KMP";

    ifstream file(filename, ios::binary);

    if (!file) {
        throw runtime_error("Cannot open dataset");
    }

    vector<int> lps = buildLPS(target);
    vector<char> buffer(BUFFER_SIZE);

    long long position = 0;
    int j = 0;

    while (file) {
        file.read(buffer.data(), BUFFER_SIZE);
        streamsize count = file.gcount();

        if (count <= 0) break;

        result.bytesProcessed += count;

        for (streamsize i = 0; i < count; i++) {
            char c = buffer[i];

            while (j > 0 && c != target[j]) {
                j = lps[j - 1];
            }

            if (c == target[j]) {
                j++;
            }

            if (j == (int)target.size()) {
                result.found = true;
                result.position =
                    position + i - target.size() + 1;
                return result;
            }
        }

        position += count;
    }

    return result;
}

template <typename Function>
Result benchmark(const string& name,
                 Function searchFunction,
                 const string& filename,
                 const string& target,
                 int iterations) {

    Result result;
    result.algorithm = name;

    double total = 0;
    double minimum = 1e18;
    double maximum = 0;

    for (int i = 0; i < iterations; i++) {

        auto start = high_resolution_clock::now();

        Result current =
            searchFunction(filename, target);

        auto end = high_resolution_clock::now();

        double elapsed =
            duration<double, milli>(end - start).count();

        total += elapsed;
        minimum = min(minimum, elapsed);
        maximum = max(maximum, elapsed);

        result.found = current.found;
        result.position = current.position;
        result.bytesProcessed = current.bytesProcessed;
    }

    result.averageMs = total / iterations;
    result.minMs = minimum;
    result.maxMs = maximum;

    return result;
}

int main(int argc, char* argv[]) {

    if (argc < 4) {
        cerr << "Usage: benchmark.exe dataset target iterations\n";
        return 1;
    }

    string filename = argv[1];
    string target = argv[2];
    int iterations = stoi(argv[3]);

    if (target.empty() || iterations < 1 || iterations > 20) {
        cerr << "Invalid target or iteration count\n";
        return 1;
    }

    for (char c : target) {
        if (c < '0' || c > '9') {
            cerr << "Target must contain digits only\n";
            return 1;
        }
    }

    try {
        cout << fixed << setprecision(3);

        Result naive = benchmark(
            "Naive",
            naiveSearch,
            filename,
            target,
            iterations
        );

        Result kmp = benchmark(
            "KMP",
            kmpSearch,
            filename,
            target,
            iterations
        );

        cout << "ALGORITHM,FOUND,POSITION,BYTES_PROCESSED,"
             << "ITERATIONS,AVERAGE_MS,MIN_MS,MAX_MS\n";

        for (const Result& r : {naive, kmp}) {
            cout << r.algorithm << ","
                 << (r.found ? "YES" : "NO") << ","
                 << r.position << ","
                 << r.bytesProcessed << ","
                 << iterations << ","
                 << r.averageMs << ","
                 << r.minMs << ","
                 << r.maxMs << "\n";
        }

    } catch (const exception& e) {
        cerr << "ERROR: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
