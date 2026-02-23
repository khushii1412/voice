const HEALTH_URL = '/health';
const CREATE_WEB_CALL_URL = '/create-web-call';

// State
let isCalling = false;
let retellWebClient = null;

async function checkSystemStatus() {
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');

    try {
        const response = await fetch(HEALTH_URL);
        if (response.ok) {
            statusText.textContent = 'Live & Operational';
            statusDot.classList.add('online');
        } else {
            statusText.textContent = 'Server Error';
            statusDot.classList.remove('online');
            statusDot.style.background = '#e74c3c';
        }
    } catch (error) {
        statusText.textContent = 'Offline';
        statusDot.classList.remove('online');
        statusDot.style.background = '#e74c3c';
    }
}

async function toggleCall() {
    const btn = document.getElementById('talkToJordanBtn');

    if (isCalling) {
        stopCall();
        return;
    }

    startCall();
}

async function startCall() {
    const btn = document.getElementById('talkToJordanBtn');

    try {
        btn.textContent = 'Connecting...';
        btn.disabled = true;

        // 1. Get Access Token from our backend
        const response = await fetch(CREATE_WEB_CALL_URL, { method: 'POST' });
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }

        if (!data.access_token) {
            throw new Error('Retell did not return an access_token');
        }

        // 2. Initialize Retell Client
        if (!retellWebClient) {
            const ClientClass = window.RetellWebClient || (window.Retell && window.Retell.RetellWebClient) || (window.RetellClient && window.RetellClient.RetellWebClient);

            if (!ClientClass) {
                throw new Error('Retell SDK classes not found. Please refresh the page.');
            }

            retellWebClient = new ClientClass();

            retellWebClient.on('call_started', () => {
                console.log('Call started');
                isCalling = true;
                btn.textContent = 'End Call';
                btn.classList.add('calling');
                btn.disabled = false;
            });

            retellWebClient.on('call_ended', () => {
                console.log('Call ended');
                stopCallUI();
            });

            retellWebClient.on('error', (err) => {
                console.error('Retell error:', err);
                stopCallUI();
                alert('Connection error. Please check your mic permissions.');
            });
        }

        // 3. Start the call
        await retellWebClient.startCall({
            accessToken: data.access_token,
        });

    } catch (error) {
        console.error('Failed to start call:', error);
        alert(`Could not connect to Jordan: ${error.message}`);
        stopCallUI();
    }
}

function stopCall() {
    if (retellWebClient) {
        retellWebClient.stopCall();
    }
    stopCallUI();
}

function stopCallUI() {
    const btn = document.getElementById('talkToJordanBtn');
    isCalling = false;
    btn.textContent = 'Talk to Jordan';
    btn.classList.remove('calling');
    btn.disabled = false;
}

// Event Listeners
document.getElementById('talkToJordanBtn').addEventListener('click', toggleCall);

// Initial check
checkSystemStatus();
setInterval(checkSystemStatus, 30000);
