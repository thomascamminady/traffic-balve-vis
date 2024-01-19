// JavaScript code to find the newest timestamp in the data

fetch(dataUrl)
    .then((response) => response.text())
    .then((data) => {
        const parsedData = d3.csvParse(data, d3.autoType);
        const newestTimestamp = d3.max(parsedData, (d) => new Date(d.datetime).getTime());

        document.getElementById('update-time').textContent = "Zuletzt aktualisiert: " + formatTimestamp(newestTimestamp);
    })
    .catch((error) => console.error("Error fetching the data:", error));

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}
