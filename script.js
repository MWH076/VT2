// Your Firebase configuration (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyBmEegMtxkjwJ_m7R3PcH1ADhz8TqHbg_o",
    authDomain: "voting-90a10.firebaseapp.com",
    projectId: "voting-90a10",
    storageBucket: "voting-90a10.appspot.com",
    messagingSenderId: "849139184503",
    appId: "1:849139184503:web:1d58b379ba3d5c683de772",
    measurementId: "G-DEHDS8GP6K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let pollData = {
    Blue: 0,
    Red: 0,
    total: 0
};

// Set up Google sign-in
const provider = new firebase.auth.GoogleAuthProvider();

document.getElementById('login-button').innerHTML = '<button onclick="signIn()">Login with Google</button>';
document.getElementById('logout-button').addEventListener('click', signOut);

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('user-name').innerText = `Welcome, ${user.displayName}`;
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        loadPollData();
    } else {
        document.getElementById('login-button').style.display = 'block';
        document.getElementById('content').style.display = 'none';
    }
});

function signIn() {
    auth.signInWithPopup(provider).catch(error => console.log(error));
}

function signOut() {
    auth.signOut().catch(error => console.log(error));
}

function loadPollData() {
    db.collection('poll').doc('results').get().then(doc => {
        if (doc.exists) {
            pollData = doc.data();
            updateResults();
        }
    }).catch(error => console.log(error));
}

function vote(option) {
    if (option === 'Blue') {
        pollData.Blue++;
    } else if (option === 'Red') {
        pollData.Red++;
    }
    pollData.total++;
    updatePollData();
    document.getElementById('poll').style.display = 'none';
    document.getElementById('results').style.display = 'block';
}

function updatePollData() {
    db.collection('poll').doc('results').set(pollData).then(() => {
        updateResults();
    }).catch(error => console.log(error));
}

function updateResults() {
    const bluePercentage = (pollData.Blue / pollData.total) * 100;
    const redPercentage = (pollData.Red / pollData.total) * 100;

    document.getElementById('blue-bar').style.width = `${bluePercentage}%`;
    document.getElementById('red-bar').style.width = `${redPercentage}%`;

    document.getElementById('total-votes').innerText = pollData.total;
}