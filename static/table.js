// This is for making a table/grid for drawing

var tablArray;
var els;
var mouseDown;
document.addEventListener("DOMContentLoaded", function(event) {
    console.log("dom loaded")

    // Init drawing color to the first one
    setColorIndicator(1);

    // Create table
//    tablArray = fillTable("maintable", 64, 64)
    let rows = 64;
    let cols = 64;
    tablArray = fillGrid("maintable", rows, cols)
    els = tablArray[0];

    // Set number of cols/rows of the grid
    grid = document.getElementById("maintable")
    grid.style.gridTemplateColumns = "repeat(" + cols + ", 1em)"
    grid.style.gridTemplateRows = "repeat(" + rows + ", 1em)"
    // load in old localStorage grid
    loadGrid();


    // Create mousedown detection
    document.onmousedown = () => {
        mouseDown = true;
        console.log("mousedown held down")
    }
    document.onmouseup = () => {
        mouseDown = false;
        if (changed){
            saveGrid();
            changed = false;
        }
        console.log("mouse UP")
    }
})


var colorArr_10 = ["", "salmon", "moccasin", "plum", "LightBlue", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGreen", "LightPink"].map(el => el.toLowerCase());
var colorLookup = {}
colorArr_10.map((color, i) => { colorLookup[color] = i })

var drawColor;
var changed = false;

document.addEventListener("keypress", function onEvent(event) {
    var keyInt = parseInt(event.key);

    if (!isNaN(keyInt)){
        console.log(event.key)
        if (keyInt < 10){
            setColorIndicator(keyInt)
        }
    } else{
        if (event.key = "c"){
            clearGrid();
        }
    }
});


function setColorIndicator(intColor){
    // load in the html color display
    let tmp = document.getElementById("colorIndicator")
    let setColor = colorArr_10[intColor]

    tmp.style.backgroundColor = setColor
    tmp.innerHTML = "Current color is: " + (setColor=="" ? "eraser" : setColor)
    // set the draw color using the color array
    drawColor = setColor
    console.log("draw color is: " + drawColor)
}


// Usage: grid_stringify( tablArray)
function grid_stringify(tablArray){
    return tablArray.map(el => colorLookup[el.style.backgroundColor]).join("")
}

// Usage: grid_parseString(localStorage.grid, tablArray)
function grid_parseString(str, tablArray){
    let arr = str.split("")
    arr.map((el, i) => {
        tablArray[i].style.backgroundColor = colorArr_10[parseInt(el)]
    });
    return tablArray
//    return arr.map(el => colorLookup[el])
}

function saveGrid(){
    localStorage.grid = grid_stringify(tablArray)
}

function loadGrid(){
    grid_parseString(localStorage.grid, tablArray)
}



function clearGrid(){
    for (let i = 0; i < tablArray.length; i++){
        tablArray[i].style.backgroundColor = null;
    }
    saveGrid();
}

function addElemsToRow(trow, numElems){
    let arr = [];
    for (let i = 0; i < numElems; i++){
        let el = document.createElement("div")
        el.className = "drawcel";
        el.onmouseover = () => { // moving mouse over the grid
            if (mouseDown){
                el.style.backgroundColor = drawColor;
                changed = true;
            }
        }
        el.onmousedown = () => { // clicking the grid directly
            // Toggle color
            if (el.style.backgroundColor == drawColor){
                el.style.backgroundColor = null;
            } else{
                el.style.backgroundColor = drawColor;
            }
            changed = true;
        }


        trow.appendChild(el)
        arr.push(el)
    }
    return arr;
}

function addRowsToTable(tabl, numRows, numElems){
    let arr = [];
    for (let i = 0; i < numRows; i++){
        let tmpRow = document.createElement("div")
        let eachElem = addElemsToRow(tmpRow, numElems)

        tabl.appendChild(tmpRow)
        arr.push(eachElem)
    }
    return arr
}

function fillTable(tableID, numRows, numElems){
    tabl = document.getElementById(tableID)
    let arr = addRowsToTable(tabl, numRows, numElems)
    return arr
}

function fillGrid(tableID, numRows, numElems){
    tabl = document.getElementById(tableID)
    let arr = addElemsToRow(tabl, numRows*numElems)
    return arr
}

