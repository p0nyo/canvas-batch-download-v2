

function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .canvas-module-checkbox {
        width: 40px;
        height: 40px;
        accent-color: red;
        cursor: pointer;
        align-self: center;
      }

      .preview-button {
        text-decoration: underline;
        cursor: pointer;
      }

      .preview-button:hover {
        text-decoration: none;
      }
    `;
    document.head.appendChild(style);
}

function injectHTML() {
    // Injecting Download button
    const headerBar = document.querySelector('div.header-bar');
    const download = document.createElement('p');
    download.innerHTML = "Download Attachments";
    download.classList.add('btn');
    download.id = 'download-button';

    // Injecting Select All button
    const selectAll = document.createElement('p');
    selectAll.innerHTML = "Select All";
    selectAll.classList.add('btn');
    selectAll.classList.add('select-all-button');

    headerBar.insertBefore(download, headerBar.firstChild);
    headerBar.insertBefore(selectAll, headerBar.firstChild);

    document.getElementById('download-button').addEventListener('click', downloadSelectedPdfsAsZip);
    

    // Injecting Checkbox and Preview Button
    const items = document.querySelectorAll('li.context_module_item');
    items.forEach((item) => {
        // If not an attachment, skip it
        if (!item.classList.contains('attachment')) return;

        // Insert checkbox at the beginning of the .ig-row div
        const igRow = item.querySelector('.ig-row');
        if (!igRow) return;

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('canvas-module-checkbox');
        checkbox.style.marginLeft = '10px';
        
        // Inject it as the first child
        igRow.insertBefore(checkbox, igRow.firstChild);
        
        const link = item.querySelector('a.ig-title');

        // Only insert preview button if PDF
        if (link.title.includes('.pdf')) {
            const preview = document.createElement('p');
            preview.innerHTML = 'View Preview';
            preview.style.marginRight = '10px';
            preview.classList.add('preview-button');
            igRow.appendChild(preview);
        }
    });
}

async function getModuleItemLinks() {
    const anchors = document.querySelectorAll('a.ig-title.title.item_link');
    
    const moduleItems = Array.from(anchors).map((a) => ({
        url: new URL(a.getAttribute('href'), window.location.origin).toString(),
        text: a.textContent.trim()
    }));

    return moduleItems;
}

async function fetchModulePagesWithLimit(urls, limit = 5) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < urls.length) {
        const currentIndex = index++;
        const url = urls[currentIndex];

        try {
            const res = await fetch(url, { credentials: "include" });
            const text = await res.text();
            results[currentIndex] = { url, html: text };
        } catch (err) {
            console.error(`Error fetching ${url}:`, err);
            results[currentIndex] = null;
        }
        }
    }

    const workers = Array.from({ length: limit }, () => worker());
    await Promise.all(workers);

    return results.filter(Boolean);
}

function extractPdfLinkFromHTML(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let anchor = doc.querySelector('a[download]');

    if (!anchor) {
        anchor = Array.from(doc.querySelectorAll("a")).find((a) => 
            a.href.endsWith(".pdf")
        );
    }

    if (anchor) {
        const href = anchor.getAttribute("href");
        const pdfUrl = new URL(href, baseUrl).toString();
        return pdfUrl;
    }

    return null;
}

async function initialiseWebpage() {
    const moduleItems = await getModuleItemLinks(); // [{ url, text }, ...]
    const modulePages = await fetchModulePagesWithLimit(moduleItems.map(item => item.url), 30);

    const pdfLinks = modulePages
        .map(({ html, url }, index) => {
        const pdfUrl = extractPdfLinkFromHTML(html, url);
        if (!pdfUrl) return null;
        return { text: moduleItems[index].text, url: pdfUrl };
        })
        .filter(link => link !== null);

    console.log("Found PDF Links:", pdfLinks);

    // Store PDF URLs as data attributes on matching DOM elements
    pdfLinks.forEach(({ text, url }) => {
        const moduleItem = [...document.querySelectorAll('li.context_module_item')].find(li => {
        return li.textContent.includes(text);
        });

        if (moduleItem) {
        moduleItem.setAttribute('data-pdf-url', url);
        }
    });

    // Optionally save to chrome.storage too
    chrome.storage.local.set({ pdfLinks });
}

async function downloadSelectedPdfsAsZip() {
    const checkedItems = document.querySelectorAll('input.canvas-module-checkbox:checked');

    const selectedFiles = Array.from(checkedItems).map((checkbox, i) => {
        const parentLi = checkbox.closest('li.context_module_item');
        const pdfUrl = parentLi?.getAttribute('data-pdf-url');
        const filename = parentLi?.querySelector('.item_name')?.textContent.trim() || `file${i + 1}.pdf`;

        return pdfUrl ? { url: pdfUrl, filename } : null;
    }).filter(Boolean);

    if (selectedFiles.length === 0) {
        alert("No PDFs selected.");
        return;
    }

    console.log(selectedFiles);

    chrome.runtime.sendMessage({
        type: "ZIP_AND_DOWNLOAD",
        files: selectedFiles
    });
}




window.addEventListener("load", () => {
    chrome.storage.local.clear(() => {
        console.log("Extension storage cleared on page reload");
    });
    injectCSS();
    setTimeout(() => {
        injectHTML();
        initialiseWebpage();
    }, 1000); 
});
