// Make the DIV element draggable:
dragElement(document.getElementById("mydiv"));
//document.onclick = () => console.log("body click");
document.addEventListener("keypress", function(event) {
  if (event.key == "n" && document.activeElement.tagName == "BODY") {
    alert('hi.');
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
  elem = document.createElement("div");
  elem.className = "entry";
  elem.contentEditable = true;

  elem.onclick = () => focAndAddDot(event)
  elem.onblur = () => unfoc(event)

  elem.innerText = txt;

  return elem;
}


// Right sided cell in a split cell
function createSublist(){
  elem = document.createElement("div");
  elem.className = "entrySublist";

  inDiv = document.createElement("div");
  inDiv.contentEditable = true;
  inDiv.className = "innerDiv";
  inDiv.onclick = () => focAndAddDot(event)
  inDiv.onblur = () => unfoc(event)

  elem.appendChild(inDiv)

  return elem;
}

var expose;
function plusRow(event){
  let pDiv = getCurrentFocusedTable(event.path);
  let kids = pDiv.children;
  kids[kids.length - 2].before(createEntry());
}

function minusRow(event){
  let pDiv = getCurrentFocusedTable(event.path)
  let kids = pDiv.children;
  expose = event.path

  let maybeRemove = kids[kids.length-3];

  if (maybeRemove.className == "entry"){
  	if (maybeRemove.innerText == ""){
    	maybeRemove.remove();
    }
//  	console.log("entry")
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

    return overallDiv
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
    console.log(elmnt)
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
    console.log(path[ind])
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
