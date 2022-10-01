// Make the DIV element draggable:
dragElement(document.getElementById("mydiv"));
//document.onclick = () => console.log("body click");
document.addEventListener("keypress", function(event) {
    console.log(event.keyCode)
    if (document.activeElement.tagName == "BODY"){
        if (event.key == "n") {
            createAddableDiv();
        } else if (event.key == "c"){
            clearAddableDivs();
        }
    }
});


// Green/red button that controls the layers
var button = document.getElementById("editButton")


function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.children[0].onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

    // Set the dot's position too if its not invisible
    if (curFocusedCell != undefined && button.style.display != "none"){
        moveDotBeside(curFocusedCell)
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}









function createEntry(){
    return createEntryWithText("");
}

function createEntryWithText(txt){
  let elem = document.createElement("div");
  elem.className = "entry";
  elem.contentEditable = true;
  elem.innerText = txt;

  elem.onclick = (event) => focAndAddDot(event)
  elem.onblur = (event) => unfoc(event)

  return elem;
}


// Right sided cell in a split cell
function createSublist(){
  let elem = document.createElement("div");
  elem.className = "entrySublist";

  let inDiv = createEntry();
  inDiv.className = "innerDiv";

  elem.appendChild(inDiv)
  return elem;
}

// Keeps the header, plus, and minus buttons always the same height
// Call this after modifying the number of vertical rows in an addableDiv
function controlEndRowHeight(pDiv){
    let numVertRows = Array.from(pDiv.children).reduce((acc, obj) => {
        if (obj.className != "entrySublist"){
            return acc + 1;
        }
    }, 0);

    pDiv.style.gridTemplateRows = "3em repeat(" + (numVertRows - 3) + ", 1fr) 2em"
}

var expose;
function plusRow(event){
    let pDiv = getCurrentFocusedTable(event.path);
    expose = pDiv;
    let kids = pDiv.children;
    kids[kids.length - 2].before(createEntry());

    // Preserve size of the plusrow by modifying the current addableDiv
    controlEndRowHeight(pDiv);
}


function minusRow(event){
  let pDiv = getCurrentFocusedTable(event.path)
  let kids = pDiv.children;
  expose = event.path

  let maybeRemove = kids[kids.length-3];

  if (maybeRemove.className == "entry"){
  	if (maybeRemove.innerText == ""){
    	maybeRemove.remove();
    	// Also adjust the row heights
    	controlEndRowHeight(pDiv);
    }
  } else if (maybeRemove.className == "entrySublist"){
    // Need to remove entry sublist if its empty, otherwise
  	if (maybeRemove.innerText == ""){
    	maybeRemove.remove();
        // shrink the entryExpanded too
        shrink = kids[kids.length-3];
        shrink.className = "entry"
    }
  }
}


function createAddableDiv(){
    nextAddableDiv = document.getElementsByClassName("addableDiv").length + 1;

    let createDiv = (clss, onclick) =>{
        let elem = document.createElement("div")
        elem.classList.add(clss)
        elem.onclick = onclick
        return elem
    }

    // overall
    let overallDiv = createDiv("addableDiv", (event) => blockClick(event))
    overallDiv.id = "adiv" + nextAddableDiv;

    // header
    let headerdiv = createDiv("divheader", "");
    headerdiv.id = overallDiv.id + "header";
    overallDiv.appendChild(headerdiv);

    // title in header
    let titlebox = createDiv("headertext", (event) => blockClick(event))
    titlebox.onmousedown = (event) => blockClick(event);
    titlebox.contentEditable = true;
    headerdiv.appendChild(titlebox);
    titlebox.innerHTML = "<p>New Div " + nextAddableDiv + "</p>"

    // plus and minus
    let plus = createDiv("plus", (event) => plusRow(event))
    plus.innerHTML = "<b>+</b>"
    let minus = createDiv("minus", (event) => minusRow(event))
    minus.innerHTML = "<b>-</b>"
    overallDiv.appendChild(plus)
    overallDiv.appendChild(minus)

    // Add the addable to document and make it draggable
    document.body.appendChild(overallDiv)
    dragElement(overallDiv);
    addEmptyEntryToTable(overallDiv.id) // Also add an empty row so its not so lonely looking

    // Set its position randomly on the screen
    overallDiv.style.top = (Math.random() * window.innerHeight - 50) + "px";
    overallDiv.style.left = (Math.random() * window.innerWidth - 50) + "px";

    return overallDiv
}

function clearAddableDivs(){
    // get all addableDivs and their titles
    allAdds = Array.from(document.getElementsByClassName("addableDiv"));
    allTitles = allAdds.map(el => el.children[0].children[0].innerText)

    const regex = /^New Div \d+$/gm;
    const titleMatches = allTitles.filter(el => el.match(regex))
    const matches = allAdds.filter((elem, i) => /^New Div \d+$/gm.test(allTitles[i]));

    matches.map(elem => elem.remove())
    console.log("Removed empty divs of quantity: " + matches.length)
}




// When a box is highlighted, this function moves the dot to its side and
// allows us to add/remove layers to the nesting
var curFocusedCell;
function focAndAddDot(event){
    button.style.display = "";
    clicked = event.path[0];

    if (clicked.className == "innerDiv"){
        clicked = event.path[1]; // If its the inner div, we want the parent cell
    }
    moveDotBeside(clicked)
    curFocusedCell = clicked;
}


// When clicking off the element, stop sticking the mouse to that table
function unfoc(event){
    console.log("esbo blur")
//    button.style.display = "none";
//    curFocusedCell = null;
}

function moveDotBeside(elmnt){
    // set dot location
    let cellPos = getPos(elmnt)
    // If dot is beside an entrySublist, turn it red, otherwise turn it green
    let dotcolor = (elmnt.className == "entrySublist" || elmnt.className == "innerDiv") ? "salmon" : "#33ff11";
    button.style.background = dotcolor;

    if (elmnt.className == "entryExpanded"){
        button.style.left = (cellPos.left+clicked.clientWidth*2 + 10) + "px";
    } else{
        button.style.left = (cellPos.left+clicked.clientWidth + 10) + "px";
    }
    button.style.top = "calc(" + (cellPos.top + clicked.clientHeight/2) + "px" + " - 0.5em)";
}

// Depending on what cell its next to, do different stuff.
function dotClicked(e){
    e.stopPropagation();
    if (curFocusedCell.className == "entry"){
        entry2Expanded(curFocusedCell);
    } else if (curFocusedCell.className == "entrySublist"  || curFocusedCell.className == "innerDiv"){
        if (curFocusedCell.innerText == ""){
            // shrink the entryExpanded
            curFocusedCell.previousSibling.className = "entry";

            // Remove the other cell
            curFocusedCell.remove();
        }
    }
}




function addEmptyEntryToTable(tableID){
    en = createEntry()
    addEnToTable(tableID, en)
}

function addEnToTable(tableID, entry){
    table = document.getElementById(tableID)
    kids = table.children
    kids[kids.length-2].before(entry);
    controlEndRowHeight(table);
}

function entry2Expanded(entry){
    if (entry.className != "entry"){
        return;
    }
    // convert entry to entryExpanded
    entry.className = "entryExpanded"

    // Add a new sublist
    elem = createSublist();
    entry.after(elem)
}

// TODO: Propagation tree from the element instead of the click event? check SO
function getCurrentFocusedTable(path){
    let ind = 0;
    while (ind < path.length && path[ind].className != "addableDiv"){
        ind += 1
    }
//    console.log(path[ind]) // Log which one it is
    return path[ind]
}




// getting div positions
function getLeft(elem){
  return getPos(elem).left
}

function getPos(elem){
	var rect = elem.getBoundingClientRect();
  var position = {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  };
  return position;
}



// Prevent propagation of click events to parent elements
function blockClick(e){
  e.stopPropagation();
}


// For testing/dev
tableID = "mydiv"
addEnToTable(tableID, createEntryWithText("Get residence permit"));
addEnToTable(tableID, createEntryWithText("Other stuff"));
en = createEntryWithText("Buy a couch");
addEnToTable(tableID, en);
entry2Expanded(en)
