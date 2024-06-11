"use strict";

// Print all entries, across all of the *async* sources, in chronological order.

const {PriorityQueue} = require("@js-sdsl/priority-queue");

/**
 * I'm using a Priority Queue data structure in order to create a Minimum Heap.
 * The Minimum Heap will sort values based on the date of the LogEntry.
 * I'm using the `@js-sdsl/priority-queue` package due to this package's data structures outperforming others.
 * See {@link https://js-sdsl.org/#/test/benchmark-result|Benchmarks} for details.
 *
 * I originally just had an array of log entry promises that I used await Promise.all on, but this resulted in me later having to
 * wait one by one for each popAsync. I switched over to using a Map in order to start the next popSync as soon as possible.
 *
 * For creating the initial Map of log entry promises. I had the following options:
 * 1. Use for ... of to set values into the map for later use.
 *     I felt as though .reduce was a little nicer due to being a more functional method.
 *     But it's the same performance as .reduce.
 * 2. Use .reduce in order to create a map where the key is the log source index and the value is the popAsync promise.
 *      I went with this due .reduce being a more functional method.
 *
 * I then iterated through the log entry promises to insert the resolved popAsync into an array to
 * later heapify. I also start the next log entry's popAsync in order to minimize downtime.
 *
 * Once I had the initial list of awaited log entry from each log source, I had to create a Minimum Heap with the values.
 * I used a Priority Queue to achieve this. At this point, I had two options on how to initialize the Minimum Heap.
 * 1. Instead of previously pushing to an array to later heapify, I could have just inserted each log entry into the Minimum Heap.
 *      I did not do this due to the fact that individually inserting values into a Minimum Heap is slower than
 *      heapifying an array at once.
 * 2. Create the Minimum Heap with all the log entries at once.
 *      I went with this route for performance reasons.
 *
 * I then iterate through the log entries inside the Minimum Heap and print each log entry in ascending order.
 * I could have checked for `logEntry.drained` or a simple `!logEntry`, but for better IDE type hinting with JSDocs and
 * for better clarity since the return is not a single type, I explicitly wrote `logEntry === false`.
 *
 * I also start the next log entry's popAsync here as well in order to minimize downtime.
 * If the log source has been drained, I remove it from the map of log entry promises to save memory.
 *
 * This solution processes all log entries in ascending date order without needing to hold onto all log entries in memory at once.
 *
 * @param {LogSource[]}logSources
 * @param {Printer} printer
 */
module.exports = async (logSources, printer) => {
    /** @type {Map<number, Promise<boolean | LogEntry>>} */
    const logEntryPromises = logSources.reduce((logEntryPromises, logSource, index) => {
        logEntryPromises.set(index, logSource.popAsync());

        return logEntryPromises;
    }, new Map());


    const logEntries = [];
    for (const [index, logEntryPromise] of logEntryPromises.entries()) {
        const logEntry = await logEntryPromise;
        if (logEntry === false) {
            logEntryPromises.delete(index);
        } else {
            logEntries.push({
                logEntry,
                logSourceIndex: index
            });

            // Start popAsync to minimize waiting time.
            logEntryPromises.set(index, logSources[index].popAsync());
        }
    }

    const logEntryQueue = new PriorityQueue(
        logEntries,
        (a, b) => {
            return a.logEntry.date - b.logEntry.date;
        });


    while (logEntryQueue.length) {
        const {logEntry, logSourceIndex} = logEntryQueue.pop();
        printer.print(logEntry);

        const nextLogEntry = await logEntryPromises.get(logSourceIndex);
        if (nextLogEntry === false) {
            logEntryPromises.delete(logSourceIndex);
        } else {
            logEntryQueue.push({
                logEntry: nextLogEntry,
                logSourceIndex: logSourceIndex,
            });

            // Start popAsync to minimize waiting time.
            logEntryPromises.set(logSourceIndex, logSources[logSourceIndex].popAsync());
        }
    }

    printer.done();
    return console.log("Async sort complete.");
};
