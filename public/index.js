// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBZpQcqxR55x0SV9oNBSKXCHVVxm21te_c",
    authDomain: "alu-moe.firebaseapp.com",
    databaseURL: "https://alu-moe.firebaseio.com",
    projectId: "alu-moe",
    storageBucket: "alu-moe.appspot.com",
    messagingSenderId: "1094182939459",
    appId: "1:1094182939459:web:10d75f6e5eb03f4ed81df6",
    measurementId: "G-Y635EE64KW"
};

var team = "none";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const database = firebase.database();

function joinTeam(color) {
    team = color;

    showCameraFeed();
}

function showCameraFeed() {
    let video = document.getElementById("cameraElement");

    document.getElementById("intro-div").setAttribute("hidden", true);
    document.getElementById("game-div").removeAttribute("hidden");

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
            })
            .catch(function (err0r) {
                console.log("Something went wrong!");
            });
    }
}

function takePicture() {
    console.log("takePicture called");
    let video = document.getElementById("cameraElement");

    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let canvasContext = canvas.getContext("2d");
    canvasContext.drawImage(video, 0, 0);

    let filename = randomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

    canvas.toBlob((blob) => {
        storage.ref("scavision/" + filename).put(blob).then((snapshot) => {
            let gsUrl = "gs://" + firebaseConfig.storageBucket + "/" + snapshot.metadata.fullPath;
            console.log(gsUrl);

            const Http = new XMLHttpRequest();
            const url='/api/scavision?url=' + gsUrl;
            Http.open("GET", url);
            Http.send();

            Http.onreadystatechange = (e) => {
                console.log(Http.responseText)
            }

            storage.ref(snapshot.metadata.fullPath).getDownloadURL().then((url) => {
                console.log(url);
            });
        })
    });    
}

// Generate random string function
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}