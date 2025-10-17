class EnergyGrowth {
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

        // define axis
        vis.xAxis = vis.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${vis.height})`)


        vis.yAxis = vis.svg.append("g")
            .attr("class", "y axis")

        vis.line = d3.line()
            .x(function(d) { return vis.xScale(d.year) })
            .y(function(d) { return vis.yScale(d.generation); })
            .curve(d3.curveCardinal)

        vis.svg.append("path")
            .attr("class", "energy-line")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)

        vis.wrangleData()
    }


    // coundnt figure out how to parse data easily from global_power_plant_database.csv
    // used excel to clean it and made new file YearAndGeneration
    wrangleData() {
        let vis = this;

        // convert to numbers!
        vis.data.forEach(d => {
            d.year = +d.year;
            d.generation = +d.generation;
            //console.log(d.generation);
        })


        const yearSums = d3.rollups(
            vis.data,
            v => d3.sum(v, d => +d.generation),
            d => +d.year
        )

        vis.displayData = yearSums.map(([year, generation]) => ({year, generation}));

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        console.log(vis.displayData);

        vis.xScale.domain(d3.extent(vis.displayData, d => d.year))
        vis.yScale.domain([3600000, d3.max(vis.displayData, d => d.generation)])

        vis.xAxis
            .call(d3.axisBottom(vis.xScale)
                .tickValues([2013, 2014, 2015, 2016])
                .tickFormat(d3.format("d")))
        vis.yAxis
            .call(d3.axisLeft(vis.yScale)
                .ticks(6)
                .tickFormat(d3.format(".2s")))

        vis.svg.select(".energy-line")
            .datum(vis.displayData)
            .attr("d", vis.line)

    }
}

