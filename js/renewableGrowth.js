class RenewableGrowth {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 60, left: 40};

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


        vis.svg.append("path")
            .attr("class", "energy-line")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)

        vis.wrangleData()
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
                .tickFormat(d3.format("d")))
        vis.yAxis
            .call(d3.axisLeft(vis.yScale)
                .ticks(6)
                .tickFormat(d3.format(".2s")))

        vis.area = d3.area()
            .x(d => vis.xScale(d.data.year))
            .y0(d => vis.yScale(d[0]))
            .y1(d => vis.yScale(d[1]))

        let techGroup = vis.svg.selectAll(".area")
            .data(vis.stack, d => d.key)

        techGroup.enter()
            .append("path")
            .attr("class", "area")
            .merge(techGroup)
            .attr("d", vis.area)
            .attr("fill", d => vis.color(d.key))
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)

        techGroup.exit().remove();

    }
}

