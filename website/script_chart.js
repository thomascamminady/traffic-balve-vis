// Change the URL to the location of your CSV file
const dataUrl = "https://raw.githubusercontent.com/thomascamminady/traffic-balve/refs/heads/main/data/summary.csv";

fetch(dataUrl)
    .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.text();
    })
    .then((csvText) => {
        // The rest of your processing logic here...
        const parsedData = d3.csvParse(csvText, d3.autoType);
        // Process parsedData as before
        const newestTimestamp = d3.max(parsedData, (d) =>
            new Date(d.datetime).getTime()
        );

        document.getElementById("update-time").textContent =
            "Zuletzt aktualisiert: " + formatTimestamp(newestTimestamp);

        const today = d3.timeFormat("%Y-%m-%d")(new Date());
        parsedData.forEach((d) => {

            d.parsedTime = d3.timeParse("%H:%M:%S")(
                d.datetime.split("T")[1].split(".")[0]
            );
            d.parsedDate = d3.timeFormat("%Y-%m-%d")(new Date(d.datetime));
            d.durationInTrafficMinutes = d.duration_in_traffic_s / 60; // Convert seconds to minutes
            d.is_today = d.parsedDate === today; // Add is_today attribute
            d.kph = d.distance_m / 1000 / (d.duration_in_traffic_s / 3600);
            d.ziel = "Ziel: " + d.to;
        });
        const criterias = Array.from(new Set(parsedData.map((d) => d.route))).slice(0, 3);
        criterias.forEach((criteria) => {
            createObservablePlotChart(
                parsedData,
                criteria,
                "durationInTrafficMinutes",
                "#chart_time",
                "Reisezeit (min)",
                [2, 8]
            );
        });
        criterias.forEach((criteria) => {
            createObservablePlotChart(
                parsedData,
                criteria,
                "kph",
                "#chart_kph",
                "Reisegeschwindigkeit (km/h)",
                [10, 50]
            );
        });
    })
    .catch((error) => {
        console.error('Error fetching or processing data:', error);
    });
function createObservablePlotChart(
    data,
    criteria,
    field,
    chartname,
    label,
    domain
) {
    const filteredData = data.filter(
        (d) =>
            d.route === criteria &&
            d.parsedTime < d3.timeParse("%H:%M:%S")("22:00:00")
    );
    const filteredDataToday = filteredData.filter((d) => d.is_today);
    const groupedByDate = Array.from(
        d3.group(filteredData, (d) => d.parsedDate).values()
    );
    const groupedByTo = Array.from(d3.group(filteredData, (d) => d.to).values());

    // Prepare data for labels for today's date
    const labelData = groupedByTo
        .filter((group) => group.some((d) => d.is_today))
        .map((group) => {
            const lastPoint = group[0];
            return {
                parsedTime: Math.min(
                    lastPoint.parsedTime,
                    d3.timeParse("%H:%M:%S")("20:00:00")
                ),
                y: lastPoint[field],
                to: lastPoint.to,
                ziel: lastPoint.ziel,
                fromto: lastPoint.from_to,
            };
        });
    const chart = Plot.plot({
        subtitle: criteria,
        grid: true,
        x: {
            type: "utc",
            label: "Uhrzeit",
            tickFormat: d3.timeFormat("%H:%M"),
        },
        y: {
            label: label,
            domain: domain,
        },
        color: {
            type: "categorical",
            domain: ["Krumpaul", "Krankenhaus", "Höhle"],
            range: ["darkorange", "#007bff", "green"],
        },
        marks: [
            ...groupedByDate.map((dayData) =>
                Plot.line(dayData, {
                    curve: "monotone-x",
                    x: "parsedTime",
                    y: field,
                    stroke: "to",
                    opacity: (d) => (d.is_today ? 1 : 0.08),
                    strokeWidth: (d) => (d.is_today ? 3 : 1)

                })
            ),

            Plot.dot(filteredDataToday, {
                x: "parsedTime",
                y: field,
                fill: "to",
                r: 4,
                tip: true,
            }),

            Plot.text(
                labelData.filter((d) => d.to === "Höhle"),
                {
                    x: "parsedTime",
                    y: "y",
                    fill: "to",
                    text: "fromto",
                    fontSize: 18,
                    textAnchor: "start",
                    fontWeight: "bold",
                    dy: 0, //-15,
                    dx: 10, // Offset the label horizontally
                }
            ),
            Plot.text(
                labelData.filter((d) => d.to !== "Höhle"),
                {
                    x: "parsedTime",
                    y: "y",
                    fill: "to",
                    text: "fromto",
                    fontSize: 18,
                    textAnchor: "start",
                    fontWeight: "bold",
                    dy: 0,
                    dx: 10, // Offset the label horizontally
                }
            ),
        ],
        width: 1360,
        height: 425,
    });
    const div = document.querySelector(chartname);
    div.append(chart);
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}
