# Guide to Debugging and Troubleshooting WebSocket Backpressure Mitigation

This document provides a systematic guide for debugging, verifying, and resolving issues related to the implementation of backpressure mitigation (buffer and throttling) in the analysis service.

## 1. Verification Objectives

Before starting debugging, it is crucial to understand the expected behavior of the solution:

- **No Deadlocks:** The analysis process (subprocess) must not block due to the pipe buffer filling up.
- **Batching:** Logs should not be sent immediately, but grouped into batches until either 32 KB is reached or 100 ms has elapsed.
- **Sustained Throughput:** The system must be able to process high-volume log loads without significant performance drops.
- **Data Integrity:** All generated log data must reach the client (no message loss or corruption).

## 2. Debugging Procedures (Server Side)

Use backend logs to monitor read, buffer, and send operations.

### 2.1. Verification of Aggressive Reading (Pipe Drain)

**Focus:** Confirm that the backend reads from child processes in large chunks (8 KB).

| Checkpoint         | Action                                                | Expected Log                                                                                     |
| :----------------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **Read Size**      | Log the size of each block read from the pipe.        | `Message: Read X bytes from pipe` where X is 8192 (8 KB), or less if near the end of the stream. |
| **Read Frequency** | Monitor the reading frequency during a high log load. | Reads should occur very quickly, almost continuously, until the pipe buffer is empty.            |

### 2.2. Verification of Buffering and Throttling

**Focus:** Confirm that WebSocket messages are only sent when the threshold is reached (32 KB or 100 ms).

| Checkpoint       | Action                                                                              | Expected Log                                                                                                                               |
| :--------------- | :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Size Trigger** | Send a rapid log stream exceeding 32 KB in under 100 ms.                            | `Message: Sending batch of Y bytes. Trigger: Size Limit` (Y > 32768). The send must occur before the 100 ms timeout expires.               |
| **Time Trigger** | Send a small volume of logs (e.g., 10 KB) and then wait 150 ms before sending more. | `Message: Sending batch of Z bytes. Trigger: Time Limit`. The send must occur approximately 100 ms after the first addition to the buffer. |
| **Buffer Reset** | After each send, verify that the buffer has been reset to zero.                     | `Message: Buffer reset after send`.                                                                                                        |

## 3. Troubleshooting Procedures

If blocks, excessive delays, or data loss occur, follow these steps.

### Problem A: Analysis Process Blocks (Deadlock)

**Symptoms:** Analysis suddenly stops without an error, and the child process is still running but inactive.

| Possible Cause                | Diagnosis                                                                                               | Proposed Solution                                                                                              |
| :---------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Insufficient Pipe Reading** | Reading 8 KB is not enough for exceptionally high loads (e.g., 500 MB output).                          | Increase the read block size to 16 KB or 32 KB. (Recommended Solution 4.1: I/O Decoupling).                    |
| **Block on ws.send()**        | The backend's `ws.send()` is blocked for too long, preventing pipe reading.                             | Implement I/O Decoupling (Solution 4.1) to separate the pipe reading thread from the WebSocket sending thread. |
| **Missing Pipe**              | A child process does not close its pipe correctly (e.g., stderr) or the application ignores the stream. | Ensure that both streams (stdout and stderr) are read and managed asynchronously.                              |

### Problem B: Extremely Delayed or Intermittent Logs

**Symptoms:** Logs appear on the client in long bursts, with long periods of inactivity, or arrive with significant delay.

| Possible Cause           | Diagnosis                                                                                 | Proposed Solution                                                                                                 |
| :----------------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Timeout Too High**     | The 100 ms timeout is too aggressive for low-volume workloads.                            | Reduce the timeout to 50 ms or use a hybrid approach: 100 ms for the first batches, then 50 ms if output is slow. |
| **Excessive Batching**   | The 32 KB threshold is too large for the application and introduces latency for the user. | Reduce the size threshold to 16 KB.                                                                               |
| **Client Fragmentation** | The client takes too long to process large batches (Client-side backpressure issue).      | Implement Client-Side Explicit Flow Control (Solution 4.3) to allow the client to request a pause in sending.     |

### Problem C: Log Loss or Corruption

**Symptoms:** The client receives incomplete messages or entire sections of logs are missing.

| Possible Cause         | Diagnosis                                                                     | Proposed Solution                                                                                                         |
| :--------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Closure Handling**   | Final data in the buffer is not sent when the subprocess terminates.          | Ensure that upon detecting subprocess closure, a final buffer cleanup (flush) is performed before closing the connection. |
| **Incorrect Encoding** | Encoding issues between the subprocess (e.g., UTF-8) and the backend reading. | Ensure that the read data is correctly decoded (e.g., `data.decode('utf-8', errors='replace')`) before being buffered.    |

## 4. Recommended Tools

- **Detailed Logging (Backend):** Use DEBUG level logging to track every `read()`, `buffer_append()`, `buffer_flush()`, and `ws.send()`.
- **Network Monitoring (Client):** Use the browser's developer tools Network tab to monitor the frequency and size of received WebSocket frames.
- **Stress Test Tool:** Use a script that intentionally generates a high volume of log output (echo "..." in a loop) to simulate the worst-case backpressure scenario.

### Problem B: "Zombie Pipes" (Hanging Modules)

**Symptoms:** The module status remains "RUNNING" even after the process seems to have finished, or logs are truncated.

| Possible Cause            | Diagnosis                                                                                                                                                     | Proposed Solution                                                                                          |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- |
| **Grandchild Processes**  | The main process exits, but a grandchild keeps the stdout/stderr pipe open.                                                                                   | Use `asyncio.wait_for` with a timeout when draining readers _after_ the main process exits.                |
| **Reader Crash Deadlock** | If a reader task crashes, the pipe fills up, blocking the subprocess. If the main loop waits for the process to exit _before_ checking readers, it deadlocks. | Use `asyncio.wait([process, readers], return_when=FIRST_COMPLETED)` to detect reader failures immediately. |
