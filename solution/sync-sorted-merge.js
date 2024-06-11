"use strict";

// Print all entries, across all of the sources, in chronological order.

const {PriorityQueue} = require("@js-sdsl/priority-queue");

/**
 * I'm using a Priority Queue data structure in order to create a Minimum Heap.
 * The Minimum Heap will sort values based on the date of the LogEntry.
 * I'm using the `@js-sdsl/priority-queue` package due to this package's data structures outperforming others.
 * See {@link https://js-sdsl.org/#/test/benchmark-result|Benchmarks} for details.
 *
 * For creating the initial list of log entries and inserting them inside the Minimum Heap, I had the following options:
 * 1. Chain .map and .filter.
 *      I did not do this due to Node having to iterate through all the values twice since
 *      .map and .filter don't actually stream the values through each method.
 * 2. Use for ... of to push values into an array for later user.
 *      I felt as though .reduce was a little nicer due to being a more functional method.
 *      But it's the same performance as .reduce.
 * 3. Use .reduce in order to create a filtered array holding the initial log entries of all the different log sources.
 *      I went with this due .reduce being a more functional method.
 *
 * Once I had the initial list of log entries from each log source, I had to create a Minimum Heap with the values.
 * I used a Priority Queue to achieve this. At this point, I had two options on how to initialize the Minimum Heap.
 * 1. Instead of previously using .reduce, I could have just inserted each log entry into the Minimum Heap via a for ... of loop.
 *      I did not do this due to the fact that individually inserting values into a Minimum Heap is slower than
 *      heapifying an array at once.
 * 2. Create the Minimum Heap with all the log entries at once.
 *      I went with this route for performance reasons.
 *
 * I then iterate through the log entries inside the Minimum Heap and print each log entry in ascending order.
 * I could have checked for `logEntry.drained` or a simple `!logEntry`, but for better IDE type hinting with JSDocs and
 * for better clarity since the return is not a single type, I explicitly wrote `logEntry === false`.
 *
 * This solution processes all log entries in ascending date order without needing to hold onto all log entries in memory at once.
 *
 * @param {LogSource[]}logSources
 * @param {Printer} printer
 */
module.exports = (logSources, printer) => {
    /** @type {{logEntry: LogEntry, logSourceIndex: number}[]} */
    const logEntries = logSources.reduce((logEntries, logSource, index) => {
        const logEntry = logSource.pop();
        if (logEntry === false) {
            logEntries.push({
                logEntry,
                logSourceIndex: index,
            });
        }

        return logEntries;
    }, []);

    const logEntryQueue = new PriorityQueue(
        logEntries,
        (a, b) => {
            return a.logEntry.date - b.logEntry.date;
        });

    while (logEntryQueue.length) {
        const {logEntry, logSourceIndex} = logEntryQueue.pop();
        printer.print(logEntry);

        const logSource = logSources[logSourceIndex];
        const nextLogEntry = logSource.pop();
        if (nextLogEntry === false) {
            logEntryQueue.push({
                logEntry: nextLogEntry,
                logSourceIndex: logSourceIndex,
            });
        }
    }

    printer.done();
    return console.log("Sync sort complete.");
};
