class RenewableGrowth {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.renewableSources = ["Solar", "Wind", "Hydropower", "Geothermal", "Bioenergy", "Marine", "Pumped-Storage"]
        this.nonRenewableSources = ["Fossil", "Nuclear", "Other-Non-renewable"]

        this.filterMode = "all"

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 190, bottom: 60, left: 70};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // define scales
        vis.xScale = d3.scaleLinear().range([0, vis.width]);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);
        vis.color = d3.scaleOrdinal(d3.schemeCategory10);

        // define axis
        vis.xAxis = vis.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${vis.height})`)

        vis.yAxis = vis.svg.append("g")
            .attr("class", "y axis")

        // axis titles
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 50)
            .attr("text-anchor", "middle")
            .text("Year")

        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", `rotate(-90)`)
            .attr("x", -vis.height / 2)
            .attr("y", - 55)
            .attr("text-anchor", "middle")
            .attr("opacity", "1")
            .attr("text-size", "12px")
            .text("Electricity Generation (GWh)")

        vis.svg.append("path")
            .attr("class", "energy-line")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)

        // tooltip
        // append to parent element or else goes to the bottom of the page
        vis.tooltip = d3.select("#" + vis.parentElement).append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.8)")
            .style("opacity", 0)
            .style("color", "#fff")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("pointer-events", "none");

        // for toggle buttons
        d3.select("#all").on("click", function() {
            vis.filterMode = "all";
            vis.updateButtonStates();
            vis.wrangleData()
        })

        d3.select("#renewable").on("click", function() {
            vis.filterMode = "renewable";
            vis.updateButtonStates();
            vis.wrangleData()
        })

        d3.select("#non-renewable").on("click", function() {
            vis.filterMode = "non-renewable";
            vis.updateButtonStates();
            vis.wrangleData()
        })

        vis.wrangleData()
    }

    // for button selections - might be a better way to do this but since I got the data manually im doing this manually
    updateButtonStates() {
        let vis = this;

        d3.selectAll("#energy-toggle button").classed("active", false);

        if (vis.filterMode === "all") {
            d3.select("#all").classed("active", true);
        } else if (vis.filterMode === "renewable") {
            d3.select("#renewable").classed("active", true);
        } else if (vis.filterMode === "non-renewable") {
            d3.select("#non-renewable").classed("active", true);
        }
    }


    // Treied to use excel to clean this as much as possible but will have to parse here
    wrangleData() {
        let vis = this;

        let generationData = vis.data.filter(d => d.Metric === "Electricity Generation (GWh)")

        let yearGroup = d3.group(generationData, d => +d.Year); //group all the years together


        // have to convert format and ensure that each are numbers
        vis.displayData = Array.from(yearGroup, ([year, values]) => {
            let i = {year: year};
            values.forEach(d => i[d.Source] = +d.Value);
            return i;
        })

        // have to remove year and total sum columns because of the way that I converted format
        vis.sources = Object.keys(vis.displayData[0]).filter(d => d !== "year" && d !== "Total-Sum");

        // button filters
        if (vis.filterMode === "renewable") {
            vis.sources = vis.sources.filter(d => vis.renewableSources.includes(d));
        } else if (vis.filterMode === "non-renewable") {
            vis.sources = vis.sources.filter(d => vis.nonRenewableSources.includes(d));
        }

        vis.stack = d3.stack()
            .keys(vis.sources)(vis.displayData);

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        console.log(vis.stack);

        vis.xScale.domain(d3.extent(vis.displayData, d => d.year))
        vis.yScale.domain([0, d3.max(vis.stack[vis.stack.length - 1], d => d[1])])

        vis.xAxis
            .call(d3.axisBottom(vis.xScale)
                .tickValues([2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2023])
                .tickFormat(d3.format("d")))
        vis.yAxis
            .call(d3.axisLeft(vis.yScale)
                .ticks(6)
                .tickFormat(d3.format(".2s")))

        vis.area = d3.area()
            .x(d => vis.xScale(d.data.year))
            .y0(d => vis.yScale(d[0]))
            .y1(d => vis.yScale(d[1]))

        // makes it so it starts flat
        vis.areaFlat = d3.area()
            .x(d => vis.xScale(d.data.year))
            .y0(vis.height)
            .y1(vis.height)

        let techGroup = vis.svg.selectAll(".area")
            .data(vis.stack, d => d.key)

        let newArea = techGroup.enter()
            .append("path")
            .attr("class", "area")
            .attr("d", vis.areaFlat)
            .attr("fill", d => vis.color(d.key))
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0)


        // USE STYLE FOR TOOL TIP OR NOTHING SHOWS UP
        newArea.merge(techGroup)
            .on("mousemove", function (event, d) {
                // SAME MOUSE EVENTS AS OTHER AREA CHART
                let [mx,my] = d3.pointer(event, vis.svg.node())
                let year = Math.round(vis.xScale.invert(mx))
                // get the closes data point to the year
                let dataPoint = vis.displayData.find(dp => dp.year === year);

                // copied format for html from most recent lab (7)
                if (dataPoint) {
                    let value = dataPoint[d.key] || 0;
                    vis.tooltip
                        .style("opacity", 1)
                        .html(`<strong>${d.key}:</strong><br/>Year: ${year}<br/>Generation: ${d3.format("0,.0f")(value)} GWh`)
                        .style("left", (event.pageX +15) +"px")
                        .style("top", (event.pageY - 28) + "px")

                }
            })
            .on("mouseout", function (d, i) {
                vis.tooltip
                    .style("opacity", 0)
                    .style("pointer-events", "none")

            }) // animations from bar chart lab (5) ?
            .transition()
            .duration(1000)
            .delay((d, i) => i * 50)
            .attr("opacity", 1)
            .attr("d", vis.area)

        techGroup.exit().remove();

    }
}

