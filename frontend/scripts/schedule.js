function populateList(data, id) {
  let list = document.getElementById(id)
  list.replaceChildren()
  let option = new Option('-- --', '')
  option.disabled = true
  option.selected = true
  list.appendChild(option)
  data.forEach(item => {
    option = new Option(item.name, JSON.stringify(item))
    list.appendChild(option)
  })
}

let populate = () => {
  getAllLinesNamesIdsDb().then(data => populateList(data, 'line_schedule'))
}

const searchById = (array, segmentID) => {
  let res = []
  for (let i = 0; i < array.length; i++)
    if (array[i].segment_id === segmentID)
      res.push({
        segment_id: array[i].segment_id,
        duration: array[i].duration,
        index: i,
      })
  return res
}

const differenceNewOriginal = (original, patched) => {
  let result = []
  if (patched.length !== original.length) throw new Error('Arrays don"t have same length')
  else
    for (let i = 0; i < patched.length; i++) {
      if (patched[i].segment_id === original[i].segment_id) {
        if (patched[i].duration !== original[i].duration) result.push(patched[i])
      }
    }
  return result
}

let line_schedule = document.getElementById('line_schedule')
line_schedule.addEventListener('change', event => {
  getAllSegmentLineDb(JSON.parse(event.target.value).name).then(data => {
    document.getElementsByClassName('rows')[0].replaceChildren()
    const originalDurations = []
    let newDurations = []
    data.line.forEach(item => {
      const fromStation = document.createElement('div')
      const toStation = document.createElement('div')
      const distance = document.createElement('div')
      const duration_div = document.createElement('div')
      const duration_input = document.createElement('input')
      const segmentID = document.createElement('div')
      // const actions = document.createElement('div')
      // const confirm_schedule = document.createElement('button')
      // const cancel_schedule = document.createElement('button')
      // confirm_schedule.innerHTML = 'Confirm'
      // cancel_schedule.innerHTML = 'Cancel'
      fromStation.innerHTML = item.from.name
      toStation.innerHTML = item.to.name
      distance.innerHTML = item.distance
      duration_input.value = item.duration
      segmentID.innerHTML = item.id
      originalDurations.push({
        segment_id: item.id,
        duration: item.duration,
      })

      fromStation.classList.add('cell', 'station')
      toStation.classList.add('cell', 'station')
      distance.classList.add('cell', 'distance')
      duration_div.classList.add('duration')
      duration_input.classList.add('cell', 'duration', 'value')
      duration_input.setAttribute('id', item.id)
      segmentID.classList.add('segment_id')
      segmentID.hidden = true
      duration_div.appendChild(duration_input)
      // actions.classList.add('actions')
      // actions.appendChild(confirm_schedule)
      // actions.appendChild(cancel_schedule)
      const row = document.createElement('div')
      row.classList.add('row')
      row.append(fromStation, toStation, distance, duration_div, segmentID)
      // , actions)
      document.getElementsByClassName('rows')[0].appendChild(row)
    })
    if (document.getElementsByClassName('table')[0].children.length === 2) {
      const confirm_all = document.createElement('button')
      confirm_all.innerHTML = 'Confirm all '
      confirm_all.setAttribute('id', 'confirm_all')
      document.getElementsByClassName('table')[0].appendChild(confirm_all)
    }

    newDurations = JSON.parse(JSON.stringify(originalDurations))
    const inputs = document.querySelectorAll('input')
    inputs.forEach(value =>
      value.addEventListener('focusout', e => {
        let segment = {}
        let search = searchById(newDurations, value.parentNode.children[0].getAttribute('id'))
        if (search.length !== 1) throw new Error('More than one segment had that id')
        else {
          segment = search[0]
          if (Number(e.target.value) !== segment.duration) {
            newDurations[segment.index].duration = Number(e.target.value)
            //change background of modified elements
            console.log(originalDurations)
            console.log(newDurations)
          }
        }
      })
    )
  })
})

// const getall = getAllSegmentLineDb('tramway retour').then(data => console.log(data))
// getAllSegmentLineDb('metro').then(data => {
