import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC7rf52sjUToorpEWo2d7kJTge7LxbX90I",
  authDomain: "mythicrewardsnetlify.firebaseapp.com",
  projectId: "mythicrewardsnetlify",
  storageBucket: "mythicrewardsnetlify.firebasestorage.app",
  messagingSenderId: "333592933644",
  appId: "1:333592933644:web:576d159b879da65ba3c529",
  measurementId: "G-LKPE8T8PXQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminEmail = document.getElementById('admin-email');
const adminPass = document.getElementById('admin-pass');
const loginError = document.getElementById('login-error');

const newPin = document.getElementById('new-pin');
const newClient = document.getElementById('new-client');
const createProjectBtn = document.getElementById('create-project-btn');
const projectsTbody = document.getElementById('projects-tbody');
const inboxFeed = document.getElementById('inbox-feed');

// Auth Listener: Switch screens based on login state
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loadDashboard();
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
});

// Login Logic
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, adminEmail.value, adminPass.value);
        loginError.classList.add('hidden');
    } catch (error) {
        loginError.innerText = "Invalid credentials.";
        loginError.classList.remove('hidden');
    }
});

// Logout Logic
logoutBtn.addEventListener('click', () => signOut(auth));

// --- DASHBOARD LOGIC ---

async function loadDashboard() {
    await loadProjects();
    await loadInbox();
}

// 1. Project Management (CRUD)
async function loadProjects() {
    projectsTbody.innerHTML = "<tr><td colspan='4'>Loading projects...</td></tr>";
    try {
        const querySnapshot = await getDocs(collection(db, "dn_mythicFiles_projects"));
        projectsTbody.innerHTML = "";
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const pin = docSnap.id;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pin}</td>
                <td>${data.clientName}</td>
                <td class="${data.isOpen ? 'status-open' : 'status-closed'}">
                    ${data.isOpen ? 'OPEN' : 'LOCKED'}
                </td>
                <td>
                    <button class="outline-btn toggle-btn" data-pin="${pin}" data-status="${data.isOpen}">
                        ${data.isOpen ? 'Lock' : 'Unlock'}
                    </button>
                </td>
            `;
            projectsTbody.appendChild(tr);
        });

        // Add event listeners to dynamically generated buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetPin = e.target.getAttribute('data-pin');
                const currentStatus = e.target.getAttribute('data-status') === 'true';
                await updateDoc(doc(db, "dn_mythicFiles_projects", targetPin), {
                    isOpen: !currentStatus
                });
                loadProjects(); // Reload table
            });
        });
    } catch (error) {
        console.error("Error loading projects:", error);
    }
}

// Create New Project
createProjectBtn.addEventListener('click', async () => {
    const pinVal = newPin.value.trim();
    const clientVal = newClient.value.trim();

    if (!pinVal || !clientVal) return alert("Enter both PIN and Client Name");

    try {
        await setDoc(doc(db, "dn_mythicFiles_projects", pinVal), {
            clientName: clientVal,
            isOpen: true,
            createdAt: new Date()
        });
        newPin.value = '';
        newClient.value = '';
        loadProjects();
    } catch (error) {
        console.error("Error creating project:", error);
        alert("Make sure your UID is correctly set in Firestore Rules.");
    }
});

// 2. Load Inbox & File Links
async function loadInbox() {
    inboxFeed.innerHTML = "<p>Loading files...</p>";
    try {
        // Query comments sorted by newest first
        const q = query(collection(db, "dn_mythicFiles_comments"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        inboxFeed.innerHTML = "";

        if (querySnapshot.empty) {
            inboxFeed.innerHTML = "<p>No files uploaded yet.</p>";
            return;
        }

        querySnapshot.forEach(async (docSnap) => {
            const data = docSnap.data();
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Unknown Date";
            
            // Generate standard card HTML
            const card = document.createElement('div');
            card.className = "inbox-card";
            card.innerHTML = `
                <div class="inbox-header">
                    <span><strong>PIN:</strong> ${data.pin}</span>
                    <span>${dateStr}</span>
                </div>
                <p><strong>From:</strong> ${data.uploaderName}</p>
                <p><strong>File:</strong> ${data.fileName}</p>
                <p><strong>Notes:</strong> ${data.notes}</p>
                <a href="#" class="download-link" id="link-${docSnap.id}">Retrieving secure link...</a>
            `;
            inboxFeed.appendChild(card);

            // Fetch the secure download URL from Firebase Storage
            try {
                const fileRef = ref(storage, `MythicFiles/${data.pin}/${data.fileName}`);
                const url = await getDownloadURL(fileRef);
                const linkElement = document.getElementById(`link-${docSnap.id}`);
                linkElement.href = url;
                linkElement.innerText = "Download File";
                linkElement.target = "_blank"; // Opens in new tab
            } catch (storageErr) {
                document.getElementById(`link-${docSnap.id}`).innerText = "File not found or processing.";
            }
        });
    } catch (error) {
        console.error("Error loading inbox:", error);
    }
}
