let generatedText = "";
let generatedImageUrl = "";

// Bind initial execution listeners on window creation
window.onload = function() {
    // Automatically retrieve and load historical form parameters safely
    if(localStorage.getItem("apiKey")) document.getElementById("apiKey").value = localStorage.getItem("apiKey");
    if(localStorage.getItem("gmailUser")) document.getElementById("gmailUser").value = localStorage.getItem("gmailUser");
    if(localStorage.getItem("appPassword")) document.getElementById("appPassword").value = localStorage.getItem("appPassword");
    if(localStorage.getItem("recipient")) document.getElementById("recipient").value = localStorage.getItem("recipient");

    // Modal Event Bindings (FIXES THE UNRESPONSIVE BUTTON)
    const infoBtn = document.getElementById("infoBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    
    if (infoBtn) infoBtn.addEventListener("click", () => toggleModal(true));
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => toggleModal(false));

    // Form Event bindings
    document.getElementById("assistantForm").addEventListener("submit", generatePost);
    document.getElementById("sendEmailBtn").addEventListener("click", sendGeneratedEmail);
    document.getElementById("discardBtn").addEventListener("click", resetForm);
}

// Toggle Setup Information Modal overlay
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

    // Persist configuration settings locally
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("gmailUser", document.getElementById("gmailUser").value);
    localStorage.setItem("appPassword", document.getElementById("appPassword").value);
    localStorage.setItem("recipient", document.getElementById("recipient").value);

    // Current generation Gemini 2.5 flash production stable url targeting
    const targetUrl = `https://googleapis.com{apiKey}`;
    const proxyUrl = `https://herokuapp.com`;
    
    const payload = {
        contents: [{ parts: [{ text: `System Instruction Persona:\n${systemInstruction}\n\nTask:\nGenerate an engaging social media post with relevant hashtags and emojis about this topic: ${topic}` }] }]
    };

    let apiResponse;
    
    // Direct browser transaction dispatch execution
    try {
        apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (initialErr) {
        console.log("Direct frontend access flagged by origin policy rules. Redirecting requests via fallback proxy...");
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
            alert("Network Request Blocked!\n\nTo allow GitHub Pages to bypass client request tracking constraints, please browse to: https://herokuapp.comcorsdemo and click the 'Request temporary access' action item button.");
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
        
        // Deep verification array structure lookup 
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            generatedText = data.candidates[0].content.parts[0].text;
            
            const keyword = encodeURIComponent(topic.split(" ").slice(0, 2).join(","));
            generatedImageUrl = `https://unsplash.com`;
            if(keyword) {
                generatedImageUrl = `https://unsplash.com{keyword}`;
            }

            // Update UI elements 
            document.getElementById('postContent').innerText = generatedText;
            document.getElementById('postImage').src = generatedImageUrl;
            document.getElementById('previewBox').style.display = 'block';
            document.getElementById('statusMessage').innerText = "";
        } else {
            alert("The API completed but returned an unexpected or blank data container structure.");
        }
    } catch (error) {
        console.error(error);
        alert(`Execution Exception Error parsing response: ${error.message}`);
    } finally {
        generateBtn.innerText = "Generate Social Media Post";
        generateBtn.disabled = false;
    }
}

// Forward data payload variables wrapper down to EmailJS handles
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
        console.log('EmailJS Tracking Connection Block Error:', error);
        statusMessage.style.color = "orange";
        statusMessage.innerText = "⚠️ Email configuration incomplete. Update variables inside script.js to activate.";
        sendEmailBtn.innerText = "Approve & Send Email";
        sendEmailBtn.disabled = false;
    });
}

function resetForm() {
    document.getElementById('previewBox').style.display = 'none';
    document.getElementById('topic').value = "";
}
