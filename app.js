import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

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
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const pinScreen = document.getElementById('pin-screen');
const uploadScreen = document.getElementById('upload-screen');
const pinInput = document.getElementById('pin-input');
const verifyBtn = document.getElementById('verify-btn');
const pinError = document.getElementById('pin-error');
const projectWelcome = document.getElementById('project-welcome');

const fileInput = document.getElementById('file-input');
const uploaderName = document.getElementById('uploader-name');
const uploadNotes = document.getElementById('upload-notes');
const uploadBtn = document.getElementById('upload-btn');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const uploadSuccess = document.getElementById('upload-success');

let currentPin = "";

// 1. Verify PIN Logic
verifyBtn.addEventListener('click', async () => {
    const pin = pinInput.value.trim();
    if (!pin) return;

    verifyBtn.innerText = "Verifying...";
    pinError.classList.add('hidden');

    try {
        const docRef = doc(db, "dn_mythicFiles_projects", pin);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().isOpen === true) {
            currentPin = pin;
            const clientName = docSnap.data().clientName || "Client";
            projectWelcome.innerText = `Project Unlocked: ${clientName}`;
            
            pinScreen.classList.add('hidden');
            uploadScreen.classList.remove('hidden');
        } else {
            pinError.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error verifying PIN:", error);
        pinError.innerText = "Access denied or connection error.";
        pinError.classList.remove('hidden');
    } finally {
        verifyBtn.innerText = "Access Portal";
    }
});

// 2. Upload Logic
uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const name = uploaderName.value.trim();
    const notes = uploadNotes.value.trim();

    if (!file || !name) {
        alert("Please provide your name and select a file.");
        return;
    }

    // Disable inputs during upload
    uploadBtn.disabled = true;
    fileInput.disabled = true;
    progressContainer.classList.remove('hidden');

    // Create storage reference based on security rules
    const storageRef = ref(storage, `MythicFiles/${currentPin}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = progress + '%';
            progressText.innerText = Math.round(progress) + '%';
        }, 
        (error) => {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
            uploadBtn.disabled = false;
            fileInput.disabled = false;
        }, 
        async () => {
            // Upload completed successfully
            try {
                // Log the comment/metadata to Firestore
                await addDoc(collection(db, "dn_mythicFiles_comments"), {
                    pin: currentPin,
                    uploaderName: name,
                    notes: notes,
                    fileName: file.name,
                    timestamp: new Date()
                });

                // --- NEW EMAILJS CODE ---
                const templateParams = {
                    uploader_name: name,
                    pin: currentPin,
                    notes: notes,
                    file_name: file.name
                };

                // Add your Service ID and Template ID here:
                await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
                // ------------------------

                uploadSuccess.classList.remove('hidden');
                uploadBtn.classList.add('hidden'); // Hide button to prevent double uploads
            } catch (error) {
                console.error("Error saving metadata:", error);
            }
        }
    );
});
