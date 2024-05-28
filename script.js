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

document.getElementById('login-button').innerHTML = '<button onclick="signIn()">Login with Google</button>';
document.getElementById('logout-button').addEventListener('click', signOut);

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('user-name').innerText = `Welcome, ${user.displayName}`;
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        loadPolls();
    } else {
        document.getElementById('login-button').style.display = 'block';
        document.getElementById('content').style.display = 'none';
    }
});

function signIn() {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(error => console.log(error));
}

function signOut() {
    auth.signOut().catch(error => console.log(error));
}

function createPoll() {
    const title = document.getElementById('poll-title').value;
    const option1 = document.getElementById('poll-option1').value;
    const option2 = document.getElementById('poll-option2').value;

    if (title && option1 && option2) {
        db.collection('polls').add({
            title: title,
            options: {
                [option1]: 0,
                [option2]: 0
            },
            total: 0
        }).then(() => {
            loadPolls();
        }).catch(error => console.log(error));
    } else {
        alert('Please fill in all fields');
    }
}

function loadPolls() {
    const pollsList = document.getElementById('polls');
    pollsList.innerHTML = '';
    db.collection('polls').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const poll = doc.data();
            const pollItem = document.createElement('li');
            pollItem.innerHTML = `
                <strong>${poll.title}</strong>
                <button onclick="vote('${doc.id}', '${Object.keys(poll.options)[0]}')">${Object.keys(poll.options)[0]}</button>
                <button onclick="vote('${doc.id}', '${Object.keys(poll.options)[1]}')">${Object.keys(poll.options)[1]}</button>
                <button onclick="showResults('${doc.id}')">Show Results</button>
            `;
            pollsList.appendChild(pollItem);
        });
    }).catch(error => console.log(error));
}

function vote(pollId, option) {
    const user = auth.currentUser;
    const userRef = db.collection('users').doc(user.uid);
    const pollRef = db.collection('polls').doc(pollId);
    const votedPollRef = userRef.collection('votedPolls').doc(pollId);

    votedPollRef.get().then(doc => {
        if (doc.exists) {
            alert('You have already voted in this poll.');
        } else {
            return db.runTransaction(transaction => {
                return transaction.get(pollRef).then(doc => {
                    if (!doc.exists) {
                        throw 'Poll does not exist!';
                    }
                    const poll = doc.data();
                    poll.options[option]++;
                    poll.total++;
                    transaction.update(pollRef, poll);
                    transaction.set(votedPollRef, { voted: true });
                });
            }).then(() => {
                loadPolls();
            }).catch(error => console.log(error));
        }
    }).catch(error => console.log(error));
}

function showResults(pollId) {
    const pollRef = db.collection('polls').doc(pollId);
    pollRef.get().then(doc => {
        if (doc.exists) {
            const poll = doc.data();
            let resultsHtml = `<h3>Results for: ${poll.title}</h3>`;
            Object.keys(poll.options).forEach(option => {
                const percentage = ((poll.options[option] / poll.total) * 100).toFixed(2);
                resultsHtml += `
                    <div>${option}: ${percentage}% (${poll.options[option]} votes)</div>
                    <div style="width: ${percentage}%; background-color: lightblue; height: 20px;"></div>
                `;
            });
            resultsHtml += `<p>Total votes: ${poll.total}</p>`;
            document.getElementById('polls').innerHTML = resultsHtml;
        } else {
            console.log('No such document!');
        }
    }).catch(error => console.log(error));
}