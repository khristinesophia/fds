function setSelectValuesFromURL() {
    let params = new URLSearchParams(window.location.search)
  
    let status = params.get('status')
    let typeid = params.get('typeid')

    // if (params.has('status') && params.has('typeid')) {
    //     // Both 'status' and 'typeid' exist
    // } else if (params.has('status') || params.has('typeid')) {
    //     // Only one of 'status' or 'typeid' exists
    // } else {
    //     // Neither 'status' nor 'typeid' exist
    // }

    console.log(status)
    console.log(typeid)

    document.getElementById('status').value = status
    document.getElementById('typeid').value = typeid
}

window.onload = setSelectValuesFromURL

// ----------------------------------------------------------------------------------------------------

document.getElementById('status').addEventListener('change', (event)=>{
    let url = new URL(window.location.href)
    let params = new URLSearchParams(url.search)
    let statusValue = event.target.value === 'All' ? null : event.target.value
    params.set('status', statusValue)
    url.search = params.toString()
    window.history.pushState({}, '', url)
    window.location.reload()
})
  
document.getElementById('typeid').addEventListener('change', (event)=>{
    let url = new URL(window.location.href)
    let params = new URLSearchParams(url.search)
    let typeidValue = event.target.value === 'All' ? null : event.target.value
    params.set('typeid', typeidValue)
    url.search = params.toString()
    window.history.pushState({}, '', url)
    window.location.reload()
})