
const numericalVariables = ["Walc", "Dalc", "age","Medu","Fedu","traveltime","studytime","failures","famrel","freetime","goout"
,"health","absences","G1","G2","G3"]; 
const categoricalVariables = ["school", "sex", "address","famsize","Pstatus","Mjob","Fjob","reason","guardian","Schoolsup","famsup","paid","activities"
,"nursery","higher","internet","romantic"]; 
function updateBar() {
    var selectedVariableX = document.getElementById("bar-chart-variable").value;

    if(selectedVariableX==="none"){
        d3.select("#bar-chart").remove();
        d3.select("#biplot").remove();
        d3.select("#mds").remove();
        d3.select("#pcoor").remove();
    }
    if (selectedVariableX !== "none" && categoricalVariables.includes(selectedVariableX)) {
        
        fetch(`/bar-chart-data/${selectedVariableX}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                d3.select("#bar-chart").remove();

                // Set up the SVG dimensions
                var svgWidth = 500;
                var svgHeight = 300;

                // Set up margins
                var margin = { top: 20, right: 20, bottom: 50, left: 50 };

                // Calculate chart dimensions
                var chartWidth = svgWidth - margin.left - margin.right;
                var chartHeight = svgHeight - margin.top - margin.bottom;

                // Create SVG element
                var svg = d3.select("#bar-chart-svg")
                    .append("svg")
                    .attr("id", "bar-chart")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight);

                // Create chart group
                var chartGroup = svg.append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

                // Create scales
                var xScale = d3.scaleBand()
                    .domain(data.map(d => d.category))
                    .range([0, chartWidth])
                    .padding(0.1);

                var yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.count)])
                    .range([chartHeight, 0]);

                // Create axes
                var xAxis = d3.axisBottom(xScale);
                var yAxis = d3.axisLeft(yScale);

                // Append axes to the chart
                chartGroup.append("g")
                    .attr("transform", `translate(0, ${chartHeight})`)
                    .call(xAxis);

                chartGroup.append("g")
                    .call(yAxis);

                // Create bars
                chartGroup.selectAll(".bar")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("x", d => xScale(d.category))
                    .attr("y", d => yScale(d.count))
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => chartHeight - yScale(d.count))
                    .attr("fill", "steelblue")
                    .on("click", function (event, d) {
                        // Handle bar click event
                        var isShiftPressed = event.shiftKey;
                        var selectedBar = d3.select(this);
                        if (isShiftPressed) {
                            selectedBar.attr("fill", "steelblue");
                            updateBiplot(selectedVariableX, [d.category], "steelblue");
                            updateParallelCoor(selectedVariableX, [d.category], "steelblue")
                            updateMds(selectedVariableX, [d.category], "steelblue");
                        }else{
                        
                        var selectedColor = getRandomColor(); // You can replace this with your color assignment logic
                        selectedBar.attr("fill", selectedColor);
                        
                        updateBiplot(selectedVariableX, [d.category], selectedColor);
                        updateParallelCoor(selectedVariableX, [d.category], selectedColor)
                        updateMds(selectedVariableX, [d.category], selectedColor);}
                    })

            })
            .catch(error => console.error('Error fetching bar chart data:', error));
            updateBiplot(selectedVariableX,null,null);
            updateParallelCoor(selectedVariableX,null,null)
            updateMds(selectedVariableX,null,null);
    } else {
        updateHistogram();
    }
}

function getRandomColor() {
    var colors = ['red', 'blue', 'green', 'yellow',
     'purple', 'orange', 'pink', 'brown', 
     'cyan', 'violet', 'teal', 'magenta', 
     'olive', 'navy', 'maroon', 'lime', 'indigo', 
     'gold', 'silver'];
    var randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}



function updateHistogram() {
    var selectedVariableX = document.getElementById("bar-chart-variable").value;

    // Check if both variables are selected
    if (selectedVariableX !== "none") {

        // Make an AJAX request to fetch histogram data and x-axis domain
        fetch(`/histogram-data/${selectedVariableX}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                d3.select("#bar-chart").remove();
                // Set up the SVG dimensions
                var svgWidth = 500;
                var svgHeight = 300;

                // Set up margins
                var margin = { top: 20, right: 20, bottom: 50, left: 50 };

                // Calculate chart dimensions
                var chartWidth = svgWidth - margin.left - margin.right;
                var chartHeight = svgHeight - margin.top - margin.bottom;
                
                var svg = d3.select("#bar-chart-svg")
                    .append("svg")
                    .attr("id","bar-chart")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight);

                var chartGroup = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                
                // Extract histogram data and x-axis domain from the response
                var histogramData = data.histogram_data;
                var xDomainData = data.x_domain;

                // Assuming you have defined chartWidth and chartHeight earlier in your code
                var xScale = d3.scaleLinear()
                    .domain([xDomainData[0], xDomainData[xDomainData.length - 1]])  // Use the x-axis domain from the server
                    .range([0, chartWidth]);

                var yScale = d3.scaleLinear()
                    .domain([0, d3.max(histogramData, d => d.count)])
                    .range([chartHeight, 0]);

                // Remove any existing bars
                chartGroup.selectAll(".bar").remove();

                // Create x-axis
                chartGroup.append("g")
                    .attr("transform", "translate(0," + chartHeight + ")")
                    .call(d3.axisBottom(xScale));

                // Create y-axis
                chartGroup.append("g")
                    .call(d3.axisLeft(yScale));

                // Create bars with steel blue color
                chartGroup.selectAll(".bar")
                    .data(histogramData)
                    .enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("x", d => xScale(d.bin_start))
                    .attr("y", d => yScale(d.count))
                    .attr("width", xScale(histogramData[0].bin_end) - xScale(histogramData[0].bin_start) - 1)
                    .attr("height", d => chartHeight - yScale(d.count))
                    .attr("fill", "steelblue")
                    .on("click", function (event, d) {
                        // Handle bar click event
                        var isShiftPressed = event.shiftKey;
                        var selectedBar = d3.select(this);
                        if (isShiftPressed) {
                            selectedBar.attr("fill", "steelblue");
                            updateBiplot(selectedVariableX, [d.bin_start, d.bin_end], "steelblue");
                            updateParallelCoor(selectedVariableX, [d.bin_start, d.bin_end], "steelblue")
                            updateMds(selectedVariableX, [d.bin_start, d.bin_end], "steelblue");
                        }else{
                        
                        var selectedColor = getRandomColor(); // You can replace this with your color assignment logic
                        selectedBar.attr("fill", selectedColor);
                        
                        updateBiplot(selectedVariableX, [d.bin_start, d.bin_end], selectedColor);
                        updateParallelCoor(selectedVariableX, [d.bin_start, d.bin_end], selectedColor)
                        updateMds(selectedVariableX, [d.bin_start, d.bin_end], selectedColor);
                    }
                        
                    })
            })
            .catch(error => console.error('Error fetching histogram data:', error));
            updateBiplot(selectedVariableX,null,null);
            updateParallelCoor(selectedVariableX,null,null)
            updateMds(selectedVariableX,null,null);
    }
}


function updateBiplot(selectedVariable, selectedLevel, selectedColor) {
    var selectedVariableX = document.getElementById("bar-chart-variable").value;

    // Check if both variables are selected
    if (selectedVariableX !== "none") {

        selectedLevel= selectedLevel || [];
        // Make an AJAX request to fetch biplot data
        fetch(`/biplot-data/${selectedVariable}?selected_range=${selectedLevel.join(',')}&selected_color=${selectedColor}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                var names = data.loading_factor_names
                var loadingFactors = data.loading_factors;
                data=data.records;
                
                // Remove any existing biplot
                d3.select("#biplot").remove();

                var svgWidth = 800;
                var svgHeight = 600;

                // Set up margins
                var margin = { top: 20, right: 20, bottom: 50, left: 50 };

                // Calculate chart dimensions
                var chartWidth = svgWidth - margin.left - margin.right;
                var chartHeight = svgHeight - margin.top - margin.bottom;

                // Create SVG element
                var svg = d3.select("#biplot-svg")
                    .append("svg")
                    .attr("id", "biplot")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight);

                // Create chart group
                var chartGroup = svg.append("g")
                    .attr("transform", `translate(${svgWidth/2}, ${svgHeight / 2})`); // Center the biplot x-axis

                // Check if 'PCA1' and 'PCA2' exist in the data
                if (!('PCA1' in data[0]) || !('PCA2' in data[0])) {
                    console.error("Missing 'PCA1' or 'PCA2' in the biplot data.");
                    return;
                }

                // Calculate the maximum absolute values of PCA1 and PCA2
                var maxAbsValue = Math.max(
                    Math.abs(d3.min(data, d => d.PCA1)),
                    Math.abs(d3.max(data, d => d.PCA1)),
                    Math.abs(d3.min(data, d => d.PCA2)),
                    Math.abs(d3.max(data, d => d.PCA2))
                );

                // Create scales for the biplot centered around (0, 0)
                var xScaleBiplot = d3.scaleLinear()
                    .domain([-maxAbsValue, maxAbsValue])
                    .range([-chartWidth / 2, chartWidth / 2]);

                var yScaleBiplot = d3.scaleLinear()
                    .domain([-maxAbsValue, maxAbsValue])
                    .range([chartHeight / 2, -chartHeight / 2]);

                // Create axes for the biplot
                var xAxisBiplot = d3.axisBottom(xScaleBiplot);
                var yAxisBiplot = d3.axisLeft(yScaleBiplot);

                for (let i = 0; i < loadingFactors.length; i++) {
                    const loadingFactor = loadingFactors[i];
                    const name = names[i];
            
                    const x1 = 0; // Start point for the vector at (0,0)
                    const y1 = 0;
                    const x2 = loadingFactor[0] * 100; // Adjust the scaling factor for visualization
                    const y2 = loadingFactor[1] * 100; // You might need to tweak the scaling factor
            
                    // Draw a line for the loading factor
                    chartGroup.append("line")
                        .attr("x1", x1)
                        .attr("y1", y1)
                        .attr("x2", x2)
                        .attr("y2", y2)
                        .attr("stroke", "red") // Color of the vector
                        .attr("stroke-width", 2); // Width of the vector line
            
                    // Display variable name next to the loading factor vector
                    chartGroup.append("text")
                        .attr("x", x2 + 5) // Offset the text to the right of the vector
                        .attr("y", y2 - 5) // Offset the text slightly above the vector
                        .text(name)
                        .attr("fill", "black")
                        .attr("font-size", "10px");
                }
                
                // Append axes to the chart
                chartGroup.append("g")
                    .call(xAxisBiplot);

                chartGroup.append("g")
                    .call(yAxisBiplot);
                
                
                // Create points in the biplot
                chartGroup.selectAll(".biplot-point")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("class", "biplot-point")
                    .attr("cx", d => xScaleBiplot(d.PCA1))
                    .attr("cy", d => yScaleBiplot(d.PCA2))
                    .attr("r", 5) // Adjust the radius as needed
                    .attr("fill", d => d.color);  // Use the selected color or a default color
            })
            .catch(error => console.error('Error fetching biplot data:', error));
    }
}

function updateMds(selectedVariable,selectedLevel,selectedColor){
    // Fetch MDS data from Flask API
    selectedLevel= selectedLevel || [];
    fetch(`/mds-data/${selectedVariable}?selected_range=${selectedLevel.join(',')}&selected_color=${selectedColor}`)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        var coordinates=data.mds_data;
        var colors = data.colors;
        // Set up dimensions and margins for the plot
        d3.select("#mds").remove();
        const svgWidth = 800;
        const svgHeight = 600;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        

        // Calculate chart dimensions
        var chartWidth = svgWidth - margin.left - margin.right;
        var chartHeight = svgHeight - margin.top - margin.bottom;

        // Create SVG element
        var svg = d3.select("#mds-plot-svg")
            .append("svg")
            .attr("id", "mds")
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        // Create scales for x and y axes
        const xScale = d3.scaleLinear()
            .domain([d3.min(coordinates, d => d[0]), d3.max(coordinates, d => d[0])])
            .range([margin.left, chartWidth - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(coordinates, d => d[1]), d3.max(coordinates, d => d[1])])
            .range([chartHeight - margin.bottom, margin.top]);
        
            // Create x and y axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        // Append x axis
        svg.append("g")
            .attr("transform", `translate(0, ${chartHeight - margin.bottom})`)
            .call(xAxis)
            .append("text")
            .attr("x", chartWidth / 2)
            .attr("y", margin.bottom - 10)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .text("Coordinate 1"); // Label for x-axis

        // Append y axis
        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 10 - margin.left)
            .attr("x", 0 - chartHeight / 2)
            .attr("dy", "1em")
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .text("Coordinate 2"); // Label for y-axis

        // Create circles for each point in the MDS plot
        svg.selectAll('circle')
            .data(coordinates) // Use mds_data here
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d[0]))
            .attr('cy', d => yScale(d[1]))
            .attr('r', 5)
            .attr('fill', (d, i) => colors[i] || "steelblue");

        
    })
    .catch(error => console.error('Error fetching MDS data:', error));

}
function updateParallelCoor(selectedVariable,selectedLevel,selectedColor){
    selectedLevel= selectedLevel || [];
    fetch(`/parallel-data/${selectedVariable}?selected_range=${selectedLevel.join(',')}&selected_color=${selectedColor}`)
    .then(response => response.json())
    .then(data => {
        const selectedAttributes = data.selected_attributes;
        const selectedData = data.selected_data;

        d3.select("#pcoor").remove();
        const svgWidth = 800;
        const svgHeight = 600;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        

        // Calculate chart dimensions
        var chartWidth = svgWidth - margin.left - margin.right;
        var chartHeight = svgHeight - margin.top - margin.bottom;

        // Create SVG element
        var svg = d3.select("#parallel-plot-svg")
            .append("svg")
            .attr("id", "pcoor")
            .attr("width", svgWidth)
            .attr("height", svgHeight);


        // Define scales for each attribute
        const scales = {};
        selectedAttributes.forEach(attr => {
            scales[attr] = d3.scaleLinear()
                .domain(d3.extent(selectedData, d => d[attr]))
                .range([margin.top, chartHeight]);
        });

        // Create lines for each data point
        svg.selectAll("path")
            .data(selectedData)
            .enter()
            .append("path")
            .attr("d", d => {
                return d3.line()(selectedAttributes.map(attr => {
                    return [margin.left + ((chartWidth / (selectedAttributes.length - 1)) * selectedAttributes.indexOf(attr)),
                        scales[attr](d[attr])
                    ];
                }));
            })
            .attr("fill", "none")
            .attr("stroke", d=>d.color)
            .attr("stroke-width", 1);

        // Create x-axis for each attribute
        selectedAttributes.forEach((attr, index) => {
            const x = margin.left + ((chartWidth / (selectedAttributes.length - 1)) * index);
            svg.append("g")
                .attr("transform", `translate(${x},0)`)
                .call(d3.axisLeft(scales[attr]))
                .append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", -10)
                .attr("y", -8)
                .attr("dy", "0.71em")
                .attr("text-anchor", "end")
                .text(attr);
        });
    })
    .catch(error => console.error('Error fetching parallel coordinates data:', error));
}


function updateBiplotsWithKMeans(kmeansData,selectedVariable, selectedLevel, selectedColor) {
    // Extract K-means cluster labels and colors from kmeansData
    const clusterLabels = kmeansData.cluster_labels;
    const clusterColors = kmeansData.cluster_colors;

    

        selectedLevel= selectedLevel || [];
        // Make an AJAX request to fetch biplot data
        fetch(`/biplot-data/${selectedVariable}?selected_range=${selectedLevel.join(',')}&selected_color=${selectedColor}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                var names = data.loading_factor_names
                var loadingFactors = data.loading_factors;
                data=data.records;
                
                // Remove any existing biplot
                d3.select("#biplot").remove();

                var svgWidth = 800;
                var svgHeight = 600;

                // Set up margins
                var margin = { top: 20, right: 20, bottom: 50, left: 50 };

                // Calculate chart dimensions
                var chartWidth = svgWidth - margin.left - margin.right;
                var chartHeight = svgHeight - margin.top - margin.bottom;

                // Create SVG element
                var svg = d3.select("#biplot-svg")
                    .append("svg")
                    .attr("id", "biplot")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight);

                // Create chart group
                var chartGroup = svg.append("g")
                    .attr("transform", `translate(${svgWidth/2}, ${svgHeight / 2})`); // Center the biplot x-axis

                // Check if 'PCA1' and 'PCA2' exist in the data
                if (!('PCA1' in data[0]) || !('PCA2' in data[0])) {
                    console.error("Missing 'PCA1' or 'PCA2' in the biplot data.");
                    return;
                }

                // Calculate the maximum absolute values of PCA1 and PCA2
                var maxAbsValue = Math.max(
                    Math.abs(d3.min(data, d => d.PCA1)),
                    Math.abs(d3.max(data, d => d.PCA1)),
                    Math.abs(d3.min(data, d => d.PCA2)),
                    Math.abs(d3.max(data, d => d.PCA2))
                );

                // Create scales for the biplot centered around (0, 0)
                var xScaleBiplot = d3.scaleLinear()
                    .domain([-maxAbsValue, maxAbsValue])
                    .range([-chartWidth / 2, chartWidth / 2]);

                var yScaleBiplot = d3.scaleLinear()
                    .domain([-maxAbsValue, maxAbsValue])
                    .range([chartHeight / 2, -chartHeight / 2]);

                // Create axes for the biplot
                var xAxisBiplot = d3.axisBottom(xScaleBiplot);
                var yAxisBiplot = d3.axisLeft(yScaleBiplot);

                for (let i = 0; i < loadingFactors.length; i++) {
                    const loadingFactor = loadingFactors[i];
                    const name = names[i];
            
                    const x1 = 0; // Start point for the vector at (0,0)
                    const y1 = 0;
                    const x2 = loadingFactor[0] * 100; // Adjust the scaling factor for visualization
                    const y2 = loadingFactor[1] * 100; // You might need to tweak the scaling factor
            
                    // Draw a line for the loading factor
                    chartGroup.append("line")
                        .attr("x1", x1)
                        .attr("y1", y1)
                        .attr("x2", x2)
                        .attr("y2", y2)
                        .attr("stroke", "red") // Color of the vector
                        .attr("stroke-width", 2); // Width of the vector line
            
                    // Display variable name next to the loading factor vector
                    chartGroup.append("text")
                        .attr("x", x2 + 5) // Offset the text to the right of the vector
                        .attr("y", y2 - 5) // Offset the text slightly above the vector
                        .text(name)
                        .attr("fill", "black")
                        .attr("font-size", "10px");
                }
                
                // Append axes to the chart
                chartGroup.append("g")
                    .call(xAxisBiplot);

                chartGroup.append("g")
                    .call(yAxisBiplot);
                
                
                // Create points in the biplot
                chartGroup.selectAll(".biplot-point")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("class", "biplot-point")
                    .attr("cx", d => xScaleBiplot(d.PCA1))
                    .attr("cy", d => yScaleBiplot(d.PCA2))
                    .attr("r", 5) // Adjust the radius as needed
                    .attr("fill",function(d, i) {
                        // Use cluster colors based on cluster labels
                        return clusterColors[clusterLabels[i]]; // Using the provided cluster color for the point
                    });
            })
            .catch(error => console.error('Error fetching biplot data:', error));
    }




function updateMDSWithKMeans(kmeansData,selectedVariable, selectedLevel, selectedColor) {
    // Extract K-means cluster labels and colors from kmeansData
    const clusterLabels = kmeansData.cluster_labels;
    const clusterColors = kmeansData.cluster_colors;
    selectedLevel= selectedLevel || [];
    fetch(`/parallel-data/${selectedVariable}?selected_range=${selectedLevel.join(',')}&selected_color=${selectedColor}`)
    .then(response => response.json())
    .then(data => {
        const selectedAttributes = data.selected_attributes;
        const selectedData = data.selected_data;

        d3.select("#pcoor").remove();
        const svgWidth = 800;
        const svgHeight = 600;
        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        

        // Calculate chart dimensions
        var chartWidth = svgWidth - margin.left - margin.right;
        var chartHeight = svgHeight - margin.top - margin.bottom;

        // Create SVG element
        var svg = d3.select("#parallel-plot-svg")
            .append("svg")
            .attr("id", "pcoor")
            .attr("width", svgWidth)
            .attr("height", svgHeight);


        // Define scales for each attribute
        const scales = {};
        selectedAttributes.forEach(attr => {
            scales[attr] = d3.scaleLinear()
                .domain(d3.extent(selectedData, d => d[attr]))
                .range([margin.top, chartHeight]);
        });

        // Create lines for each data point
        svg.selectAll("path")
            .data(selectedData)
            .enter()
            .append("path")
            .attr("d", d => {
                return d3.line()(selectedAttributes.map(attr => {
                    return [margin.left + ((chartWidth / (selectedAttributes.length - 1)) * selectedAttributes.indexOf(attr)),
                        scales[attr](d[attr])
                    ];
                }));
            })
            .attr("fill", "none")
            .attr("stroke",function(d, i) {
                // Use cluster colors based on cluster labels
                return clusterColors[clusterLabels[i]]; // Using the provided cluster color for the point
            })
            .attr("stroke-width", 1);

        // Create x-axis for each attribute
        selectedAttributes.forEach((attr, index) => {
            const x = margin.left + ((chartWidth / (selectedAttributes.length - 1)) * index);
            svg.append("g")
                .attr("transform", `translate(${x},0)`)
                .call(d3.axisLeft(scales[attr]))
                .append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", -10)
                .attr("y", -8)
                .attr("dy", "0.71em")
                .attr("text-anchor", "end")
                .text(attr);
        });
    })
    .catch(error => console.error('Error fetching parallel coordinates data:', error));
}



function updateParallelCoordinatesWithKMeans(kmeansData,selectedVariable, selectedLevel, selectedColor) {
    // Extract K-means cluster labels and colors from kmeansData
    const clusterLabels = kmeansData.cluster_labels;
    const clusterColors = kmeansData.cluster_colors;
// Fetch MDS data from Flask API
selectedLevel= selectedLevel || [];
fetch(`/mds-data/${selectedVariable}?selected_range=${selectedLevel.join(',')}&selected_color=${selectedColor}`)
.then(response => response.json())
.then(data => {
    console.log(data)
    var coordinates=data.mds_data;
    
    // Set up dimensions and margins for the plot
    d3.select("#mds").remove();
    const svgWidth = 800;
    const svgHeight = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    

    // Calculate chart dimensions
    var chartWidth = svgWidth - margin.left - margin.right;
    var chartHeight = svgHeight - margin.top - margin.bottom;

    // Create SVG element
    var svg = d3.select("#mds-plot-svg")
        .append("svg")
        .attr("id", "mds")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Create scales for x and y axes
    const xScale = d3.scaleLinear()
        .domain([d3.min(coordinates, d => d[0]), d3.max(coordinates, d => d[0])])
        .range([margin.left, chartWidth - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(coordinates, d => d[1]), d3.max(coordinates, d => d[1])])
        .range([chartHeight - margin.bottom, margin.top]);
    
        // Create x and y axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Append x axis
    svg.append("g")
        .attr("transform", `translate(0, ${chartHeight - margin.bottom})`)
        .call(xAxis)
        .append("text")
        .attr("x", chartWidth / 2)
        .attr("y", margin.bottom - 10)
        .attr("fill", "#000")
        .attr("text-anchor", "middle")
        .text("Coordinate 1"); // Label for x-axis

    // Append y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10 - margin.left)
        .attr("x", 0 - chartHeight / 2)
        .attr("dy", "1em")
        .attr("fill", "#000")
        .attr("text-anchor", "middle")
        .text("Coordinate 2"); // Label for y-axis

    // Create circles for each point in the MDS plot
    svg.selectAll('circle')
        .data(coordinates) // Use mds_data here
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => yScale(d[1]))
        .attr('r', 5)
        .attr('fill', (d, i) =>clusterColors[clusterLabels[i]]);

    
})
.catch(error => console.error('Error fetching MDS data:', error));

}
