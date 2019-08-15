const openCameraButton = document.getElementById('open_camera');
const captureButton = document.getElementById('capture');
const closeCameraButton = document.getElementById('close_camera');
const capturePreview = document.getElementById('preview');

const cameraWidth = 640, cameraHeight = 360;    
capturePreview.width = cameraWidth;
capturePreview.height = cameraHeight;

/**
 * datepart: 'y', 'm', 'w', 'd', 'h', 'n', 's'
 * reference: https://www.htmlgoodies.com/html5/javascript/calculating-the-difference-between-two-dates-in-javascript.html
 */
Date.dateDiff = function (datepart, fromdate, todate) {
    datepart = datepart.toLowerCase();
    var diff = todate - fromdate;
    var divideBy = {
        w: 604800000,
        d: 86400000,
        h: 3600000,
        n: 60000,
        s: 1000
    };

    return Math.floor(diff / divideBy[datepart]);
}

const constraints = {
    audio: false,
    video: {
        width: cameraWidth, height: cameraHeight,
        frameRate: { ideal: 30, max: 60 },
        //facingMode: { exact: "environment" }
    }
};

function openCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                capturePreview.srcObject = stream;
                capturePreview.play();
                document.getElementById('capture').disabled = false;
            })
            .catch((err) => {
                const errorMessage = document.querySelector('.error');
                if (err.name == 'NotAllowedError') {
                    errorMessage.textContent = 'Please accept the camera permission or refresh page to prompt the permission dialog';
                } else if (err.name == 'NotFoundError') {
                    errorMessage.textContent = `Camera not found or Camera does not support ${cameraHeight}p`;
                } else if (err.name == "OverconstrainedError") {
                    errorMessage.textContent = 'Device does not have front camera provided';
                } else if (err.name == "MediaStreamError") {
                    errorMessage.textContent = "Camera is using";
                } else {
                    errorMessage.textContent = err.message;
                }
                console.log(err)
            });
    }
}

function closeCamera() {
    if (capturePreview.srcObject) {
        capturePreview.srcObject.getTracks().forEach(track => {
            track.stop();
        });
        capturePreview.srcObject = null;
    }
    captureButton.disabled = true;
}

function resortCanvasTabIndex() {
    const images = document.querySelectorAll('canvas');

    images.forEach((canvas, index, arr) => {
        canvas.tabIndex = index + 1;
    });
    canvasTabIndex = images ? images.length : 0;
}

function addCloseButton(ctx) {
    const x = cameraWidth - 40, y = 10, side = 30;
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, side, side);

    var shift = side / 10;
    ctx.beginPath();
    ctx.moveTo(x + shift, y + shift);
    ctx.lineTo(x + side - shift, y + side - shift);
    ctx.moveTo(x + side - shift, y + shift);
    ctx.lineTo(x + shift, y + side - shift);
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    const thisCanvas = ctx.canvas;
    thisCanvas.addEventListener('click', function (event) {
        let clickX = event.pageX,
            clickY = event.pageY - side - cameraHeight * thisCanvas.tabIndex;

        if (clickY > y && clickY < y + side &&
            clickX > x && clickX < x + side) {
            thisCanvas.remove();
            resortCanvasTabIndex();
        }
    });
}

function buildImageContainer(image) {
    const container = document.createElement('div');
    container.className = "container";
    container.style = "position: relative;";
    const canvas = document.createElement('canvas');
    canvas.width = cameraWidth;
    canvas.height = cameraHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, cameraWidth, cameraHeight);
    const closeButton = document.createElement('button');
    closeButton.style = `position: absolute; top: 10px; left: ${cameraWidth - 40}px;`;
    closeButton.textContent = "X";
    closeButton.addEventListener('click', (event) => {
        event.target.parentNode.remove();
    })
    container.appendChild(canvas);
    container.appendChild(closeButton);
    document.body.appendChild(container);
}

function takeSnapshot() {
    buildImageContainer(capturePreview);
}

function loadImages() {
    clearCanvases();
    const imagesTotal = localStorage.getItem('imagesTotal');
    if (imagesTotal && imagesTotal > 0) {
        for (let i = 0; i < imagesTotal; i++) {
            const imageData = localStorage.getItem('image' + i);
            if (imageData) {
                let image = new Image();
                image.onload = function () {
                    buildImageContainer(image);
                }
                image.src = imageData;
            }
        }
    }
}

function clearCanvases() {
    let images = document.querySelectorAll('.container');
    images.forEach((canvas, index, arr) => {
        canvas.remove();
    });
}

function clearSavedImages() {
    let numOfImage = localStorage.getItem('imagesTotal')
    if (numOfImage && numOfImage > 0) {
        for (let i = 0; i < numOfImage; i++) {
            localStorage.removeItem('images' + i);
        }
        localStorage.removeItem('imagesTotal');
        localStorage.removeItem('imagesDate');
    }
}

function saveImages() {
    clearSavedImages();
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((canvas, index, arr) => {
        localStorage.setItem('image' + index, canvas.toDataURL());
    })
    localStorage.setItem('imagesTotal', canvases.length);
    localStorage.setItem('imagesDate', Date.now());
}

function clearImages() {
    clearCanvases();
    clearSavedImages();
}

function clearDaysAgoImages(days) {
    const imagesDate = localStorage.getItem('imagesDate');
    if (imagesDate) {
        if (Date.dateDiff('d', imagesDate, Date.now()) >= 7) {
            clearImages();
        }
    }
}

function uploadImages() {
    const successMessage = document.querySelector('.success');

    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((canvas, index, arr) => {
        const formData = new FormData();
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach((canvas, index, arr) => {
            formData.append('image' + index, canvas.toDataURL());
        })

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/Camera/Upload", false);
        xhr.onreadystatechange = function () {
            clearImages();
            successMessage.innerHTML = 'Upload succes!';
        }
        xhr.send(formData);
    })
    //clearImages();
}

// init load images
clearDaysAgoImages(7);
loadImages();