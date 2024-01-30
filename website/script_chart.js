const dataUrl =
    "https://raw.githubusercontent.com/thomascamminady/traffic-balve/main/data/summary.csv";

fetch(dataUrl)
    .then((response) => response.text())
    .then((data) => {
        const parsedData = d3.csvParse(data, d3.autoType);

        const today = d3.timeFormat("%Y-%m-%d")(new Date());
        parsedData.forEach((d) => {
            d.parsedTime = d3.timeParse("%H:%M:%S")(
                d.datetime.split("T")[1].split(".")[0]
            );
            d.parsedDate = d3.timeFormat("%Y-%m-%d")(new Date(d.datetime));
            d.durationInTrafficMinutes = d.duration_in_traffic_s / 60; // Convert seconds to minutes
            d.is_today = d.parsedDate === today; // Add is_today attribute
            d.kph = d.distance_m / 1000 / (d.duration_in_traffic_s / 3600);
        });

        const fromValues = Array.from(new Set(parsedData.map((d) => d.from)));
        fromValues.forEach((fromValue) => {
            createObservablePlotChart1(parsedData, fromValue);
        });
        fromValues.forEach((fromValue) => {
            createObservablePlotChart2(parsedData, fromValue);
        });

        document.getElementById("btnChart1").addEventListener("click", function () {
            document.getElementById("chart_kph").style.display = "block";
            document.getElementById("chart_time").style.display = "none";
            document.getElementById("btnChart1").classList.add("active");
            document.getElementById("btnChart2").classList.remove("active");
        });

        document.getElementById("btnChart2").addEventListener("click", function () {
            document.getElementById("chart_kph").style.display = "none";
            document.getElementById("chart_time").style.display = "block";
            document.getElementById("btnChart1").classList.remove("active");
            document.getElementById("btnChart2").classList.add("active");
        });

        document.getElementById("btnChart1").classList.add("active");
    })
    .catch((error) => console.error("Error fetching the data:", error));

function createObservablePlotChart1(data, fromValue) {
    const filteredData = data.filter((d) => d.from === fromValue);
    const filteredDataToday = filteredData.filter((d) => d.is_today);

    // Group data by date
    const groupedByDate = Array.from(
        d3.group(filteredData, (d) => d.parsedDate).values()
    );
    const groupedByTo = Array.from(d3.group(filteredData, (d) => d.to).values());
    // var min = Math.min(...data.map(item => item.durationInTrafficMinutes));
    // var max = Math.max(...data.map(item => item.durationInTrafficMinutes));

    // Prepare data for labels for today's date
    const labelData = groupedByTo
        .filter((group) => group.some((d) => d.is_today))
        .map((group) => {
            const lastPoint = group[0];
            return {
                parsedTime: lastPoint.parsedTime,
                kph: lastPoint.kph,
                to: lastPoint.to,
            };
        });
    const chart = Plot.plot({
        subtitle: fromValue + " → ",
        grid: true,
        x: {
            type: "utc",
            label: "Uhrzeit",
            tickFormat: d3.timeFormat("%H:%M"),
        },
        y: {
            label: "Reisegeschwindigkeit (km/h)",
            domain: [10, 50],
        },
        color: {
            type: "categorical",
            domain: ["Krumpaul", "Krankenhaus", "Höhle"],
            range: ["purple", "green", "blue"],
        },
        marks: [
            ...groupedByDate.map((dayData) =>
                Plot.line(dayData, {
                    x: "parsedTime",
                    y: "kph",
                    stroke: "to",
                    opacity: (d) => (d.is_today ? 1 : 0.1),
                })
            ),

            Plot.dot(filteredDataToday, {
                x: "parsedTime",
                y: "kph",
                fill: "to",
                r: 2,
                tip: true,
            }),

            Plot.text(labelData, {
                x: "parsedTime",
                y: "kph",
                fill: "to",
                text: "to",
                fontSize: 16,
                textAnchor: "start",
                // fontWeight:"bold",
                // dy:
                dx: 10, // Offset the label horizontally
            }),
        ],
        width: 960,
        height: 425,
    });
    const div = document.querySelector("#chart_kph");
    div.append(chart);

    //    document.body.appendChild(chart);
}

function createObservablePlotChart2(data, fromValue) {
    const filteredData = data.filter((d) => d.from === fromValue);
    const filteredDataToday = filteredData.filter((d) => d.is_today);

    // Group data by date
    const groupedByDate = Array.from(
        d3.group(filteredData, (d) => d.parsedDate).values()
    );
    const groupedByTo = Array.from(d3.group(filteredData, (d) => d.to).values());
    // var min = Math.min(...data.map(item => item.durationInTrafficMinutes));
    // var max = Math.max(...data.map(item => item.durationInTrafficMinutes));

    // Prepare data for labels for today's date
    const labelData = groupedByTo
        .filter((group) => group.some((d) => d.is_today))
        .map((group) => {
            const lastPoint = group[0];
            return {
                parsedTime: lastPoint.parsedTime,
                durationInTrafficMinutes: lastPoint.durationInTrafficMinutes,
                to: lastPoint.to,
            };
        });
    const chart = Plot.plot({
        subtitle: fromValue + " → ",
        grid: true,
        x: {
            type: "utc",
            label: "Uhrzeit",
            tickFormat: d3.timeFormat("%H:%M"),
        },
        y: {
            label: "Reisedauer (min)",
            domain: [2, 6],
        },
        color: {
            type: "categorical",
            domain: ["Krumpaul", "Krankenhaus", "Höhle"],
            range: ["purple", "green", "blue"],
        },
        marks: [
            ...groupedByDate.map((dayData) =>
                Plot.line(dayData, {
                    x: "parsedTime",
                    y: "durationInTrafficMinutes",
                    stroke: "to",
                    opacity: (d) => (d.is_today ? 1 : 0.1),
                })
            ),

            Plot.dot(filteredDataToday, {
                x: "parsedTime",
                y: "durationInTrafficMinutes",
                fill: "to",
                r: 2,
                tip: true,
            }),

            Plot.text(labelData, {
                x: "parsedTime",
                y: "durationInTrafficMinutes",
                fill: "to",
                text: "to",
                fontSize: 16,
                textAnchor: "start",
                // fontWeight:"bold",
                // dy:
                dx: 10, // Offset the label horizontally
            }),
        ],
        width: 960,
        height: 425,
    });
    const div = document.querySelector("#chart_time");
    div.append(chart);

    //    document.body.appendChild(chart);
}

// JavaScript code to find the newest timestamp in the data
fetch(dataUrl)
    .then((response) => response.text())
    .then((data) => {
        const parsedData = d3.csvParse(data, d3.autoType);
        const newestTimestamp = d3.max(parsedData, (d) =>
            new Date(d.datetime).getTime()
        );

        document.getElementById("update-time").textContent =
            "Zuletzt aktualisiert: " + formatTimestamp(newestTimestamp);
    })
    .catch((error) => console.error("Error fetching the data:", error));

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
