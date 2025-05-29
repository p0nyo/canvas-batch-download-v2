importScripts('lib/jszip.min.js');
importScripts('lib/FileSaver.min.js');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ZIP_AND_DOWNLOAD") {
    handleZipAndDownload(msg.files);
  }
});

async function handleZipAndDownload(files) {
  const zip = new JSZip();

  for (const file of files) {
    try {
      const res = await fetch(file.url, { credentials: "include" });
      const blob = await res.blob();
      const safeName = file.filename.replace(/[^a-z0-9.\-_\s]/gi, "_");
      zip.file(safeName, blob);
    } catch (e) {
      console.error(`Failed to fetch: ${file.url}`, e);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  // Use chrome.downloads API to save the blob
  const blobUrl = URL.createObjectURL(zipBlob);

  chrome.downloads.download({
    url: blobUrl,
    filename: "selected_pdfs.zip",
    saveAs: true
  });
}
