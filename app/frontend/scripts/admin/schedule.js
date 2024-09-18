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
    const rows = document.getElementsByClassName('rows')[0]
    rows.replaceChildren()
    rows.classList.add('full')

    const originalDurations = []
    let newDurations = []

    const fromHeader = document.createElement('div')
    const toHeader = document.createElement('div')
    const distanceHeader = document.createElement('div')
    const durationHeader = document.createElement('div')
    const segmentIDHeader = document.createElement('div')
    fromHeader.innerHTML = 'From'
    toHeader.innerHTML = 'To'
    distanceHeader.innerHTML = 'Distance'
    durationHeader.innerHTML = 'Duration'
    segmentIDHeader.innerHTML = 'Segment ID'
    fromHeader.classList.add('cell', 'station')
    toHeader.classList.add('cell', 'station')
    distanceHeader.classList.add('cell', 'distance')
    durationHeader.classList.add('duration')
    segmentIDHeader.classList.add('segment_id')
    segmentIDHeader.hidden = true
    const header = document.createElement('div')
    header.classList.add('row')
    header.append(fromHeader, toHeader, distanceHeader, durationHeader, segmentIDHeader)
    rows.appendChild(header)

    // if (!rows) {
    //   const newRows = document.createElement('div')
    //   newRows.classList.add('rows')
    //   newRows.appendChild(header)
    //   document.getElementsByClassName('table')[0].appendChild(newRows)
    // }

    // document.getElementsByClassName('rows')[0].appendChild(header)

    data.line.forEach(item => {
      const fromStation = document.createElement('div')
      const toStation = document.createElement('div')
      const distance = document.createElement('div')
      const duration_div = document.createElement('div')
      const duration_input = document.createElement('input')
      const segmentID = document.createElement('div')
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
      const row = document.createElement('div')
      row.append(fromStation, toStation, distance, duration_div, segmentID)
      row.classList.add('row')
      // if (!rows) {
      //   const newRows = document.createElement('div')
      //   newRows.classList.add('rows')
      //   newRows.appendChild(row)
      // }
      // rows.appendChild(row)
      document.getElementsByClassName('rows')[0].appendChild(row)
    })
    if (document.getElementsByClassName('table')[0].children.length === 2) {
      const confirm_all = document.createElement('button')
      confirm_all.innerHTML = 'Confirm all '
      confirm_all.setAttribute('id', 'confirm_all')
      confirm_all.disabled = true
      document.getElementsByClassName('table')[0].appendChild(confirm_all)
    }

    function clickConfirm() {
      let dif = differenceNewOriginal(originalDurations, newDurations)
      patchSegmentDurationDb(JSON.parse(document.getElementById('line_schedule').value)._id, dif)
      document.getElementById('confirm_all').removeEventListener('click', clickConfirm, true)
      line_schedule.value = ''
      rows.replaceChildren()
      // document.getElementsByClassName('rows')[0].replaceChildren()
      confirm_all.disabled = true
    }

    newDurations = JSON.parse(JSON.stringify(originalDurations))
    const inputs = document.querySelectorAll('input')
    inputs.forEach(value =>
      value.addEventListener('focusout', e => {
        let searchOriginal = searchById(originalDurations, value.parentNode.children[0].getAttribute('id'))
        if (searchOriginal.length !== 1) throw new Error('More than one segment have that id')
        else if (Number(e.target.value) !== searchOriginal[0].duration) value.style.backgroundColor = 'aliceblue'
        else value.style.backgroundColor = 'white'

        let searchPatched = searchById(newDurations, value.parentNode.children[0].getAttribute('id'))
        if (searchPatched.length !== 1) throw new Error('More than one segment have that id')
        else if (Number(e.target.value) !== searchPatched[0].duration) newDurations[searchPatched[0].index].duration = Number(e.target.value)

        let difference = differenceNewOriginal(originalDurations, newDurations)
        if (difference.length > 0) {
          confirm_all.disabled = false
          document.getElementById('confirm_all').addEventListener('click', clickConfirm, true)
        } else confirm_all.disabled = true
      })
    )
  })
})
