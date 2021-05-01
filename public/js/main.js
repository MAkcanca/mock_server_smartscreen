
function deleteScreen(d) {
    fetch("/screens", {
        method: "delete",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            screen_id: d.getAttribute("data-id")
        })
    }).then(e => {
        if (e.ok) return e.json()
    }).then(e => {
        window.location.reload()
    })
}
function deleteImage(d) {
    fetch("/images", {
        method: "delete",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            image_id: d.getAttribute("data-id")
        })
    }).then(e => {
        if (e.ok) return e.json()
    }).then(e => {
        window.location.reload()
    })
}
