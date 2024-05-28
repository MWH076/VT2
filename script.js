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

document.getElementById('login-button').innerHTML = '<button class="btn btn-primary" onclick="signIn()">Login</button>';
document.getElementById('logout-button').addEventListener('click', signOut);

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('user-name').innerText = `Signed in as ${user.displayName}`;
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
    const options = Array.from(document.getElementsByClassName('poll-option')).map(input => input.value);

    if (title && options.every(option => option.trim() !== '')) {
        const pollData = {
            title: title,
            options: {}
        };
        options.forEach(option => {
            pollData.options[option] = 0;
        });

        db.collection('polls').add(pollData)
            .then(() => {
                loadPolls();
            })
            .catch(error => console.log(error));
    } else {
        alert('Please fill in all fields');
    }
}

function loadPolls() {
    const pollsList = document.getElementById('polls');
    pollsList.innerHTML = '';
    db.collection('polls').get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                const poll = doc.data();
                const pollItem = document.createElement('li');
                pollItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                pollItem.innerHTML = `
                    <span><strong>${poll.title}</strong></span>
                    <div>
                        ${Object.keys(poll.options).map(option => `
                            <button class="btn btn-outline-primary btn-sm" onclick="vote('${doc.id}', '${option}')">${option}</button>
                        `).join('')}
                        <button class="btn btn-outline-secondary btn-sm" onclick="showResultsModal('${doc.id}')">Show Results</button>
                    </div>
                `;
                pollsList.appendChild(pollItem);
            });
        })
        .catch(error => console.log(error));
}

function vote(pollId, option) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in to vote');
        return;
    }

    const userRef = db.collection('users').doc(user.uid);
    const pollRef = db.collection('polls').doc(pollId);
    const votedPollRef = userRef.collection('votedPolls').doc(pollId);

    votedPollRef.get()
        .then(doc => {
            if (doc.exists) {
                alert('You have already voted in this poll.');
            } else {
                db.runTransaction(transaction => {
                    return transaction.get(pollRef)
                        .then(doc => {
                            if (!doc.exists) {
                                throw 'Poll does not exist!';
                            }
                            const poll = doc.data();
                            poll.options[option]++;
                            poll.total++;
                            transaction.update(pollRef, poll);
                            transaction.set(votedPollRef, { voted: true });
                        });
                })
                    .then(() => {
                        loadPolls();
                    })
                    .catch(error => console.log(error));
            }
        })
        .catch(error => console.log(error));
}

function showResultsModal(pollId) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '';

    const pollRef = db.collection('polls').doc(pollId);
    pollRef.get()
        .then(doc => {
            if (doc.exists) {
                const poll = doc.data();
                let resultsHtml = `<h5>${poll.title}</h5>`;
                Object.keys(poll.options).forEach(option => {
                    const percentage = ((poll.options[option] / poll.total) * 100).toFixed(2);
                    resultsHtml += `
                        <div>${option}: ${percentage}% (${poll.options[option]} votes)</div>
                        <div class="progress">
                            <div class="progress-bar" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    `;
                });
                resultsHtml += `<p>Total votes: ${poll.total}</p>`;
                modalBody.innerHTML = resultsHtml;

                const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
                resultsModal.show();
            } else {
                console.log('No such document!');
            }
        })
        .catch(error => console.log(error));
}

// Function to show polls list and hide other sections
function showPolls() {
    document.getElementById('polls-list').style.display = 'block';
    document.getElementById('create-poll').style.display = 'none';
}

// Function to show create poll form and hide other sections
function showCreatePoll() {
    document.getElementById('polls-list').style.display = 'none';
    document.getElementById('create-poll').style.display = 'block';
}
