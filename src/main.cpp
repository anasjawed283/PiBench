#include <iostream>
#include <string>
#include <chrono>

using namespace std;
using namespace chrono;

int main() {

    cout << "================================\n";
    cout << "          PiBench v0.1          \n";
    cout << "================================\n";

    string target;

    cout << "\nEnter number to search: ";
    cin >> target;

    cout << "\nSearch target: " << target << endl;

    cout << "\nPiBench initialized successfully!\n";

    return 0;
}
