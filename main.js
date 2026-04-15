document.addEventListener('DOMContentLoaded', () => {
    const intakeForm = document.getElementById('intake-form');
    const submitBtn = intakeForm.querySelector('button[type="submit"]');

    if (intakeForm) {
        intakeForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent standard page reload

            // Disable button and show loading state
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            // Gather form data to match your EmailJS template variables
            const templateParams = {
                client_name: document.getElementById('client-name').value,
                client_email: document.getElementById('client-email').value,
                project_type: document.getElementById('project-type').value,
                project_details: document.getElementById('project-details').value,
            };

            try {
                // IMPORTANT: Replace these with your actual Service ID and Intake Template ID
                await emailjs.send('service_lqcloz9', 'template_1gn5fqk', templateParams);
                
                // Success UI State
                submitBtn.innerText = "Brief Submitted!";
                submitBtn.style.backgroundColor = "#55ff55"; // Matches your var(--green)
                submitBtn.style.color = "#000";
                intakeForm.reset();
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.backgroundColor = "";
                    submitBtn.style.color = "";
                    submitBtn.disabled = false;
                }, 3000);

            } catch (error) {
                console.error("Submission failed...", error);
                
                // Error UI State
                submitBtn.innerText = "Error - Try Again";
                submitBtn.style.backgroundColor = "#ff5555"; 
                submitBtn.disabled = false;
            }
        });
    }
});
