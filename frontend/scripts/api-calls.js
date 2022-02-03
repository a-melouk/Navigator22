const baseURI = 'http://localhost:4000/'

//-------------------------------GET METHODS-------------------------------//
async function getRelatedSegment(want, id) {
  let uri = baseURI + 'segment/'
  if (want === 'from') uri += 'to?id=' + id
  if (want === 'to') uri += 'from?id=' + id

  const response = await fetch(uri)
  const data = await response.json()
  if (typeof data.from !== 'undefined') return data
}

async function getSegmentHavingFromTo(line, fromID, toID) {
  let uri = baseURI + 'lines/' + line + '?from=' + fromID + '&to=' + toID
  const response = await fetch(uri)
  const data = await response.json()
  if (typeof data.from !== 'undefined') return data
}

async function getLineByName(line) {
  const uri = baseURI + 'lines?name=' + line
  const response = await fetch(uri)
  let data = await response.json()
  data = data[0].route
  return data
}

async function getStationsByLineForAdd(line) {
  const response = await fetch(baseURI + 'stations/' + line)
  let data = await response.json()
  return data
}

//Get stations from Lines collection
async function getStationsOfLine(line) {
  const response = await fetch(baseURI + 'lines/' + line + '/stations')
  let data = await response.json()
  return data
}

async function getAllLinesNamesIds() {
  const response = await fetch(baseURI + 'lines/all')
  let data = await response.json()
  return data
}

//-------------------------------POST METHODS------------------------------//
async function postStation(station) {
  try {
    const response = await fetch(baseURI + 'stations', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(station),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return console.log(err)
  }
}

async function postLine(line) {
  try {
    const response = await fetch(baseURI + 'lines', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(line),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return console.log(err)
  }
}

//------------------------------UPDATE METHODS------------------------------//
async function deleteStationByID(id) {
  try {
    const response = await fetch(baseURI + 'stations/' + id, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return data
  } catch (err) {
    return console.log(err)
  }
}

async function patchStation(id, body) {
  try {
    const response = await fetch(baseURI + 'station?id=' + id, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return console.log(err)
  }
}

async function patchSegment(id, body) {
  await fetch(baseURI + 'segment?id=' + id, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((data) => data.json())
    .catch((err) => console.log(err))
}

async function patchLine(id, body) {
  try {
    const response = await fetch(baseURI + 'line?id=' + id, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data
  } catch (err) {
    return console.log(err)
  }
}
//-------------------------------------------------------------------------//
