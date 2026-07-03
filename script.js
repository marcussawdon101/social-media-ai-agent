let generatedText = "";
let generatedImageUrl = "";

// Bind initial execution listeners when DOM structure is ready
document.addEventListener("DOMContentLoaded", function() {
    // Automatically retrieve and load historical form parameters safely from storage
    if(localStorage.getItem("apiKey")) document.getElementById("apiKey").value = localStorage.getItem("apiKey");
    if(localStorage.getItem("gmailUser")) document.getElementById("gmailUser").value = localStorage.getItem("gmailUser");
    if(localStorage.getItem("appPassword")) document.getElementById("appPassword").value = localStorage.getItem("appPassword");
    if(localStorage.getItem("recipient")) document.getElementById("recipient").value = localStorage.getItem("recipient");

    // Modal Event Bindings with structural checks to prevent crashing
    const infoBtn = document.getElementById("infoBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    
    if (infoBtn) infoBtn.addEventListener("click", () => toggleModal(true));
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => toggleModal(false));

    // Form Action bindings
    document.getElementById("assistantForm").addEventListener("submit", generatePost);
    document.getElementById("sendEmailBtn").addEventListener("click", sendGeneratedEmail);
    document.getElementById("discardBtn").addEventListener("click", resetForm);
});

// Toggle Setup Information Modal overlay framework
function toggleModal(show) {
    const modal = document.getElementById('infoModal');
    if(modal) {
        modal.style.display = show ? 'flex' : 'none';
    }
}

// Handle Google Gemini Content Generation Flow
async function generatePost(event) {
    event.preventDefault();
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.innerText = "Generating post...";
    generateBtn.disabled = true;

    const apiKey = document.getElementById('apiKey').value.trim();
    const systemInstruction = document.getElementById('systemInstruction').value;
    const topic = document.getElementById('topic').value;

    // Persist configuration settings locally so user doesn't retype on reload
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("gmailUser", document.getElementById("gmailUser").value);
    localStorage.setItem("appPassword", document.getElementById("appPassword").value);
    localStorage.setItem("recipient", document.getElementById("recipient").value);

    // Modern Gemini 2.5 Flash Production Endpoint URL String
    const targetUrl = `https://googleapis.com{apiKey}`;
    const proxyUrl = `https://herokuapp.com`;
    
    const payload = {
        contents: [{ parts: [{ text: `System Instruction Persona:\n${systemInstruction}\n\nTask:\nGenerate an engaging social media post with relevant hashtags and emojis about this topic: ${topic}` }] }]
    };

    let apiResponse;
    
    // Attempt direct transaction dispatch 
    try {
        apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (initialErr) {
        console.log("Direct browser request blocked by CORS security origin rules. Switching pipeline to proxy layer...");
        try {
            apiResponse = await fetch(proxyUrl + targetUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            });
        } catch (proxyErr) {
            alert("Network Request Blocked!\n\nTo allow GitHub Pages to bypass client tracking constraints, visit: https://herokuapp.comcorsdemo and click the 'Request temporary access' button.");
            generateBtn.innerText = "Generate Social Media Post";
            generateBtn.disabled = false;
            return;
        }
    }

    try {
        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            const errorMsg = data.error?.message || "Unknown API Error";
            alert(`Google Gemini Server Error: ${errorMsg}`);
            return;
        }
        
        // FIXED SCHEMA PATH: Added correct explicit index brackets for JSON structural mapping
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            generatedText = data.candidates[0].content.parts[0].text;
            
            const keyword = encodeURIComponent(topic.split(" ").slice(0, 2).join(","));
            generatedImageUrl = `https://unsplash.com`;
            if(keyword) {
                generatedImageUrl = `https://unsplash.com{keyword}`;
            }

            // Update visible GUI components
            document.getElementById('postContent').innerText = generatedText;
            document.getElementById('postImage').src = generatedImageUrl;
            document.getElementById('previewBox').style.display = 'block';
            document.getElementById('statusMessage').innerText = "";
        } else {
            alert("The API completed but returned an unexpected or blank data structural payload layout.");
        }
    } catch (error) {
        console.error(error);
        alert(`Execution Parse Exception Error: ${error.message}`);
    } finally {
        generateBtn.innerText = "Generate Social Media Post";
        generateBtn.disabled = false;
    }
}

// Forward data payload parameters down to EmailJS
function sendGeneratedEmail() {
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const statusMessage = document.getElementById('statusMessage');
    sendEmailBtn.innerText = "Sending...";
    sendEmailBtn.disabled = true;

    const gmailUser = document.getElementById('gmailUser').value;
    const recipient = document.getElementById('recipient').value;
    const topic = document.getElementById('topic').value;

    emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");

    const templateParams = {
        to_email: recipient,
        from_email: gmailUser,
        subject: `Your Social Media Draft: ${topic}`,
        message: generatedText,
        image_url: generatedImageUrl
    };

    emailjs.send('default_service', 'YOUR_TEMPLATE_ID', templateParams).then(function(response) {
        statusMessage.style.color = "green";
        statusMessage.innerText = "✅ Email successfully delivered to " + recipient;
        sendEmailBtn.innerText = "Approve & Send Email";
        sendEmailBtn.disabled = false;
    }, function(error) {
        console.log('EmailJS Error Log:', error);
        statusMessage.style.color = "orange";
        statusMessage.innerText = "⚠️ Email code processed. Update variables inside script.js configuration strings to connect direct delivery handles.";
        sendEmailBtn.innerText = "Approve & Send Email";
        sendEmailBtn.disabled = false;
    });
}

function resetForm() {
    document.getElementById('previewBox').style.display = 'none';
    document.getElementById('topic').value = "";
}
