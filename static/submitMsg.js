
function init() {
  var form = document.getElementById("msg_form");
  form.addEventListener('submit', handleForm);
}

function handleForm(event) {
  // prevent reload
  event.preventDefault();

  // form data
  const form = document.getElementById("msg_form");
  const formData = new FormData(form)
  const msg = formData.get('msg')
  const data = JSON.stringify(msg);

  // list displays
  const recents = document.getElementById("recent_msg")
  const history = document.getElementById("full_history")

  // send request
  fetch('/savemessage', {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'post',
    body: data,
  })

  // update history
  const span = document.createElement("span")
  span.innerHTML = recents.lastElementChild.innerHTML
  const br = document.createElement("br")
  history.prepend(span, br)

  // update recents
  const li = document.createElement("li")
  li.innerHTML = msg
  recents.prepend(li)
  recents.lastElementChild.remove()

  form.reset()
}

window.onload = init
