importScripts('lib/jszip.min.js');
importScripts('lib/FileSaver.min.js');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "fetchAndZip" && Array.isArray(msg.files)) {
    console.log(msg.files);
    console.log(sender.tab.id);
    const tabId = sender.tab.id;
    fetchAndZipFiles(msg.files, tabId);
  } else {
    console.warn("Invalid or missing files array in message", msg);
  }
});

async function fetchAndZipFiles(files) {
    for (const { url, filename } of files) {
        try {
            console.log(url);
            console.log(filename);
            chrome.downloads.download({
                url: url,
                filename: filename,
            });
        } catch (err) {
            console.error(`Failed to download ${url}:`, err);
        }
    }
}

// chrome.downloads.download({
//     url: "https://canvas.auckland.ac.nz/courses/119935/files/14788656/download?download_frd=1",
//     filename: "myfile.pdf", 
//     }, (downloadId) => {
//     if (chrome.runtime.lastError) {
//         console.error("Download failed:", chrome.runtime.lastError.message);
//     } else {
//         console.log("Download started with ID:", downloadId);
//     }
// });



