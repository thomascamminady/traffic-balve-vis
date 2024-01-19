// URL of the CSV data
const dataUrl =
    "https://raw.githubusercontent.com/thomascamminady/traffic-balve/main/data/summary.csv";

// Fetch the CSV data
fetch(dataUrl)
    .then((response) => response.text())
    .then((data) => {
        const parsedData = d3.csvParse(data, d3.autoType);

        // Sort the fromValues in the specific order
        const fromValues = Array.from(new Set(parsedData.map((d) => d.from))).sort(
            (a, b) => {
                const order = ["Höhle", "Krankenhaus", "Krumpaul"];
                return order.indexOf(a) - order.indexOf(b);
            }
        );

        fromValues.forEach((fromValue) => {
            createChart(
                parsedData.filter((d) => d.from === fromValue),
                fromValue
            );
        });
    })
    .catch((error) => console.error("Error fetching the data:", error));

function createChart(data, fromValue) {


    // Dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 960 - margin.left - margin.right,
        height = 325 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3
        .select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the date / time
    const parseTime = d3.timeParse("%H:%M:%S");

    // Format the data
    data.forEach((d) => {
        d.parsedTime = parseTime(d.datetime.split("T")[1].split(".")[0]);
        d.parsedDate = d3.timeFormat("%Y-%m-%d")(new Date(d.datetime));
    });

    const today = d3.timeFormat("%Y-%m-%d")(new Date());

    // Add X axis --> only time
    const x = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.parsedTime))
        .range([0, width]);

    const xAxis = d3
        .axisBottom(x)
        .ticks(d3.timeHour.every(1))
        .tickFormat(d3.timeFormat("%H:00"));

    svg.append("g").attr("transform", `translate(0, ${height})`).call(xAxis).selectAll("path, line")
        .style("stroke", d3.rgb(95, 109, 123));

    // Add Y axis with custom tick format
    // Define the maximum duration in seconds
    const maxDurationInSeconds = d3.max(data, (d) => +d.duration_in_traffic_s);

    // Calculate the maximum duration in minutes (rounded up) to determine the Y-axis domain
    const maxDurationInMinutes = Math.ceil(maxDurationInSeconds / 60);

    const minDurationInSeconds = d3.min(data, (d) => +d.duration_in_traffic_s);

    // Calculate the maximum duration in minutes (rounded up) to determine the Y-axis domain
    const minDurationInMinutes = Math.floor(minDurationInSeconds / 60);

    // Create a domain that covers 30-second increments
    const yDomain = d3.range((minDurationInMinutes) * 60, (maxDurationInMinutes + 0.1) * 60, 30);

    // Define the Y-axis scale with the custom domain
    const y = d3
        .scaleLinear()
        .domain([yDomain[0], yDomain[yDomain.length - 1]]) // Set the domain to cover 30-second increments
        .range([height, 0]);

    // Add Y axis with custom tick format
    svg.append("g").call(
        d3
            .axisLeft(y)
            .tickValues(yDomain)
            .tickFormat((d) => {
                // Convert seconds to minutes and seconds
                const minutes = Math.floor(d / 60);
                const seconds = d % 60;
                return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            })

    ).selectAll("path, line")
        .style("stroke", d3.rgb(95, 109, 123));

    svg
        .append("g")
        .attr("class", "grid")

        .call(
            d3.axisLeft(y)
                .tickValues(yDomain)
                .tickSize(-width)
                .tickFormat("")

        );
    svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)

        .call(xAxis.tickSize(-height).tickFormat(""));

    // Color scale for different routes
    const color = d3
        .scaleOrdinal()
        .domain([
            "Krankenhaus -> Krumpaul",
            "Krumpaul -> Krankenhaus",
            "Krankenhaus -> Höhle",
            "Höhle -> Krankenhaus",
            "Krumpaul -> Höhle",
            "Höhle -> Krumpaul",
        ])
        .range([d3.color("purple"), "blue", "green", "blue", "green", d3.color("purple")]);


    const colorfrom = d3
        .scaleOrdinal()
        .domain([
            "Krumpaul",
            "Krankenhaus",
            "Höhle",

        ])
        .range([d3.color("purple"), "blue", "green"]);


    // Group the data
    const sumstat = d3.group(data, (d) => d.from_to + "|" + d.parsedDate);

    // Draw the lines
    let todayLineEndPoints = {}; // Object to store the end points of today's lines
    svg
        .selectAll(".line")
        .data(sumstat)
        .join("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", function (d) {
            const route = d[0].split("|")[0];
            todayLineEndPoints[route] = { x: null, y: null };
            // console.log(route)
            return color(route);
        })
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", (d) => (d[0].split("|")[1] === today ? 1 : 0.07))
        .attr("d", function (d) {
            const line = d3
                .line()
                .x((d) => x(d.parsedTime))
                .y((d) => y(+d.duration_in_traffic_s));
            if (d[0].split("|")[1] === today) {
                const lastDataPoint = d[1][0];
                todayLineEndPoints[d[0].split("|")[0]] = {
                    x: x(lastDataPoint.parsedTime),
                    y: y(lastDataPoint.duration_in_traffic_s),
                };
            }
            return line(d[1]);
        });

    // Add title
    svg
        .append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("text-anchor", "right")
        .style("font-size", "18px")
        .style("fill", colorfrom(fromValue))
        .text("Start: " + fromValue);
    // Add axis labels
    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", d3.rgb(95, 109, 123))
        .text("Reisezeit (min:sek)");

    svg
        .append("text")
        .attr("transform", `translate(${width - 12}, ${height + margin.bottom})`)
        .style("text-anchor", "middle")
        .style("fill", d3.rgb(95, 109, 123))
        .style("font-size", "12px")
        .text("Uhrzeit");
    svg.selectAll(".x.axis text").style("fill", d3.rgb(95, 109, 123));
    svg.selectAll(".y.axis text").style("fill", d3.rgb(95, 109, 123));

    const labelSpacing = 25; // Minimum spacing between labels
    let lastY = -Infinity;
    for (const [route, endPoint] of Object.entries(todayLineEndPoints)) {
        if (endPoint.x !== null && endPoint.y !== null) {
            // Add white background for the label
            // Adjust for overlapping labels
            if (endPoint.y - lastY < labelSpacing) {
                endPoint.y = lastY + labelSpacing;
            }
            lastY = endPoint.y;

            // Add label text
            svg
                .append("text")
                .attr("x", endPoint.x + 15)
                .attr("y", endPoint.y)
                .style("font-size", "18px")
                .style("fill", color(route))
                .text("Ziel: " + route.split(" -> ")[1]);
        }
    }
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
