
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <algorithm>
#include <cstdint>

using namespace std;

struct SearchResult {
    bool fileOpened = false;
    long long position = -1;
    uint64_t bytesProcessed = 0;
};

// Build the Longest Prefix Suffix (LPS) table
vector<int> buildLPS(const string& pattern) {
    vector<int> lps(pattern.size(), 0);

    int len = 0;
    int i = 1;

    while (i < pattern.size()) {
        if (pattern[i] == pattern[len]) {
            lps[i++] = ++len;
        }
        else if (len != 0) {
            len = lps[len - 1];
        }
        else {
            lps[i++] = 0;
        }
    }

    return lps;
}

SearchResult kmpSearch(const string& filename,
                       const string& target) {

    SearchResult result;

    if (target.empty()) return result;

    ifstream file(filename, ios::binary);
    if (!file.is_open()) return result;

    result.fileOpened = true;

    vector<int> lps = buildLPS(target);

    const size_t BUFFER_SIZE = 4 * 1024 * 1024;
    vector<char> buffer(BUFFER_SIZE);

    long long globalPosition = 0;
    int j = 0;

    while (file) {
        file.read(buffer.data(), BUFFER_SIZE);
        streamsize bytesRead = file.gcount();

        for (streamsize i = 0; i < bytesRead; i++) {

            char current = buffer[i];

            while (j > 0 && current != target[j]) {
                j = lps[j - 1];
            }

            if (current == target[j]) {
                j++;
            }

            if (j == target.size()) {
                result.position =
                    globalPosition + i - target.size() + 1;

                result.bytesProcessed =
                    result.position + target.size();

                return result;
            }
        }

        globalPosition += bytesRead;
    }

    result.bytesProcessed = globalPosition;
    return result;
}
