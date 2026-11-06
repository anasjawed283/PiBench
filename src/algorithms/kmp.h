
#ifndef KMP_H
#define KMP_H

#include <string>
#include <cstdint>

struct SearchResult {
    bool fileOpened = false;
    long long position = -1;
    uint64_t bytesProcessed = 0;
};

SearchResult kmpSearch(
    const std::string& filename,
    const std::string& target
);

#endif
