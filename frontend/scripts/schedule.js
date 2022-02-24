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

let line_schedule = document.getElementById('line_schedule')
line_schedule.addEventListener('change', event => {
  // console.log(event.target.value)
  getAllSegmentLineDb(JSON.parse(event.target.value).name).then(data => {
    document.getElementsByClassName('rows')[0].replaceChildren()
    data.line.forEach(item => {
      const fromStation = document.createElement('div')
      const toStation = document.createElement('div')
      const distance = document.createElement('div')
      const duration_div = document.createElement('div')
      const duration_input = document.createElement('input')
      const segmentID = document.createElement('div')
      const actions = document.createElement('div')
      const confirm_schedule = document.createElement('button')
      const cancel_schedule = document.createElement('button')
      confirm_schedule.innerHTML = 'Confirm'
      cancel_schedule.innerHTML = 'Cancel'
      fromStation.innerHTML = item.from.name
      toStation.innerHTML = item.to.name
      distance.innerHTML = item.distance
      duration_input.value = item.duration
      segmentID.innerHTML = item.id

      fromStation.classList.add('cell', 'station')
      toStation.classList.add('cell', 'station')
      distance.classList.add('cell', 'distance')
      duration_div.classList.add('duration')
      duration_input.classList.add('cell', 'duration', 'value')
      segmentID.classList.add('segment_id')
      segmentID.hidden = true
      actions.classList.add('actions')
      duration_div.appendChild(duration_input)
      actions.appendChild(confirm_schedule)
      actions.appendChild(cancel_schedule)
      const row = document.createElement('div')
      row.classList.add('row')
      row.append(fromStation, toStation, distance, duration_div, segmentID, actions)
      document.getElementsByClassName('rows')[0].appendChild(row)
    })
  })
})

// const getall = getAllSegmentLineDb('tramway retour').then(data => console.log(data))
// getAllSegmentLineDb('metro').then(data => {
