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

// 2. Upload Logic (Multi-File Sequential)
uploadBtn.addEventListener('click', async () => {
    // Convert the FileList object into a standard array
    const files = Array.from(fileInput.files);
    const name = uploaderName.value.trim();
    const notes = uploadNotes.value.trim();

    if (files.length === 0 || !name) {
        alert("Please provide your name and select at least one file.");
        return;
    }

    // Disable inputs during upload
    uploadBtn.disabled = true;
    fileInput.disabled = true;
    progressContainer.classList.remove('hidden');

    // Loop through each file sequentially to prevent browser memory crashes
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // A helper promise to pause the loop until the current file finishes
        await new Promise((resolve, reject) => {
            const storageRef = ref(storage, `MythicFiles/${currentPin}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressFill.style.width = progress + '%';
                    // Update text to show which file is uploading
                    progressText.innerText = `File ${i + 1} of ${files.length}: ${Math.round(progress)}%`;
                }, 
                (error) => {
                    console.error(`Upload failed for ${file.name}:`, error);
                    alert(`Upload failed for ${file.name}. Moving to next file if any.`);
                    resolve(); // Resolve anyway so the loop continues to the next file
                }, 
                async () => {
                    // Current file upload completed successfully
                    try {
                        // Log this specific file to Firestore
                        await addDoc(collection(db, "dn_mythicFiles_comments"), {
                            pin: currentPin,
                            uploaderName: name,
                            notes: notes,
                            fileName: file.name,
                            timestamp: new Date()
                        });

                        // Fire off the EmailJS notification for this file
                        const templateParams = {
                            uploader_name: name,
                            pin: currentPin,
                            notes: notes,
                            file_name: file.name
                        };
                        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);

                    } catch (error) {
                        console.error("Error saving metadata or email for", file.name, error);
                    }
                    resolve(); // Tell the Promise this file is done, move to the next loop iteration
                }
            );
        });
    }

    // This runs only after ALL files in the loop are fully resolved
    progressText.innerText = "All files uploaded successfully!";
    progressFill.style.backgroundColor = "#55ff55"; // Turn the bar green
    uploadSuccess.classList.remove('hidden');
    uploadBtn.classList.add('hidden');
});
