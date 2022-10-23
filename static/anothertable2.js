
// Custom keydown for pressing tab in the tables to add a new row
//bdbox = document.getElementsByClassName('bodyBox')[0]
document.addEventListener('keydown', function (event) {
    if (event.target.className = "bodyRow"){
        if (event.key === 'Tab') {
            event.preventDefault();
            curBox = event.target;

            // Create new row
            doc = (new DOMParser).parseFromString("<div class='bodyRow' placeholder='more...' contenteditable='true'></div>", "text/html");
            curBox.after(doc.body.firstChild);
//            "<div class='bodyRow' placeholder='what' contenteditable='true'>Whataever </div>"
            // Restore heights to be normal
            controlEndRowHeight(curBox.parentElement);
        }
    }
});

// Keeps the header, plus, and minus buttons always the same height
// Call this after modifying the number of vertical rows in an addableDiv
function controlEndRowHeight(bodyBox){
    // Count num elements in holder's body
    let numVertRows = Array.from(bodyBox.children).reduce((acc, obj) => {
        if (obj.className == "bodyRow"){
            return acc + 1;
        } else {
            return acc
        }
    }, 0);

//    pDiv.style.gridTemplateRows = "3em repeat(" + (numVertRows - 3) + ", auto) 2em"
    bodyBox.style.gridTemplateRows = "repeat(" + (numVertRows) + ", auto)"
}







// Header block movement unless its a tap only
boxes = document.querySelectorAll('.headerBox');
boxes.forEach(box => {
    box.setAttribute("onblur", "this.contentEditable = false");
});

interact('.headerBox').on('tap', function (event) {
    let d = event.target;
    d.contentEditable = true;
    d.focus();

    console.log("tapped")
    event.preventDefault()
})





// Resizable attributes
interact('.resizable')
  .resizable({
    edges: { top: false, left: false, bottom: true, right: true },
    invert: 'reposition',
    listeners: {
      move: function (event) {
        let { x, y } = event.target.dataset

        x = (parseFloat(x) || 0) + event.deltaRect.left
        y = (parseFloat(y) || 0) + event.deltaRect.top

        Object.assign(event.target.style, {
          width: `${event.rect.width}px`,
          height: `${event.rect.height}px`,
          transform: `translate(${x}px, ${y}px)`
        })


        Object.assign(event.target.dataset, { x, y })
      }
    }
  })



// target elements with the "draggable" class
interact('.draggable')
  .draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    // enable autoScroll
    autoScroll: true,

    listeners: {
      // call this function on every dragmove event
      move: dragMoveListener,

      // call this function on every dragend event
      end (event) {
//        var textEl = event.target.querySelector('p')
      }
    }
  })

function dragMoveListener (event) {
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

  // translate the element
  target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener