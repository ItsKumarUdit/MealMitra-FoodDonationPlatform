// Global variables
let donations = [];
let foodRequests = [];
let isDonationsLoaded = false;
let isRequestsLoaded = false;

// DOM elements
const donationForm = document.getElementById("donationForm");
const donationList = document.getElementById("donationList");
const requestFoodForm = document.getElementById("requestFoodForm");
const foodRequestList = document.getElementById("foodRequestList");

// Initialize application
document.addEventListener("DOMContentLoaded", function() {
    initializeDonationSystem();
    initializeRequestSystem();
    setupSearchFunctionality();
    setupSidebarBehavior();
});

// Donation System
function initializeDonationSystem() {
    if (donationForm) {
        donationForm.addEventListener("submit", handleDonationSubmit);
    }
    
    if (donationList && !isDonationsLoaded) {
        fetchAndUpdateDonations();
    }
}

async function handleDonationSubmit(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        mobile: formatMobileNumber(document.getElementById("mobile").value.trim()),
        foodDetails: document.getElementById("foodDetails").value,
        expiryDate: document.getElementById("expiryDate").value,
        location: document.getElementById("location").value
    };

    if (!validateMobileNumber(formData.mobile)) {
        alert("Invalid phone number. Use format: +[country code][number], e.g., +966123456789");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/submit-donation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            donationForm.reset();
            window.location.href = "donations.html";
        } else {
            alert(result.message || "Failed to submit donation.");
        }
    } catch (error) {
        console.error("Donation submission error:", error);
        alert("Error submitting donation. Please try again later.");
    }
}

function formatMobileNumber(mobile) {
    if (!mobile.startsWith('+') && mobile.match(/^\d+$/)) {
        return `+${mobile}`;
    }
    return mobile;
}

function validateMobileNumber(mobile) {
    return /^\+[1-9]\d{9,14}$/.test(mobile);
}

async function fetchAndUpdateDonations() {
    if (isDonationsLoaded) return;

    try {
        const response = await fetch("http://localhost:5000/api/donations");
        if (!response.ok) throw new Error("Failed to fetch donations");
        
        donations = await response.json();
        updateDonationList(donations);
        isDonationsLoaded = true;
    } catch (error) {
        console.error("Donation fetch error:", error);
        if (donationList) {
            donationList.innerHTML = "<p>Error loading donations. Please try again later.</p>";
        }
    }
}

function updateDonationList(donationArray = donations) {
    if (!donationList) return;
    
    donationList.innerHTML = donationArray.length === 0 
        ? "<p>No donations found for this location.</p>"
        : donationArray.map(createDonationItem).join("");
}

function createDonationItem(donation) {
    const isExpired = new Date(donation.expiryDate) < new Date();
    const isAccepted = donation.status === 'Accepted';
    
    return `
        <div class="donation-item">
            <h3>Donor: ${donation.name}</h3>
            <p>Email: ${donation.email}</p>
            <p>Mobile: ${donation.mobile}</p>
            <p>Food Details: ${donation.foodDetails}</p>
            <p>Location: <a href="https://www.google.com/maps/search/${encodeURIComponent(donation.location)}" target="_blank">${donation.location}</a></p>
            <p>Expiry Date: ${donation.expiryDate}</p>
            <p class="${isExpired ? 'expired' : ''}">${isExpired ? 'Expired' : ''}</p>
            <p>Status: ${donation.status}</p>
            <button class="receive-btn" onclick="receiveFood(this, '${donation._id}')" ${isAccepted ? 'disabled' : ''}>
                ${isAccepted ? 'Food Received' : 'Receive Food'}
            </button>
        </div>
    `;
}

// Food Request System
function initializeRequestSystem() {
    if (requestFoodForm) {
        requestFoodForm.addEventListener("submit", handleRequestSubmit);
    }
    
    if (foodRequestList && !isRequestsLoaded) {
        fetchAndUpdateFoodRequests();
    }
}

async function handleRequestSubmit(event) {
    event.preventDefault();

    const requestData = {
        requestorName: document.getElementById("requestorName").value,
        requestorMobile: document.getElementById("requestorMobile").value,
        requestorLocation: document.getElementById("requestorLocation").value
    };

    try {
        const response = await fetch("http://localhost:5000/api/request-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (response.ok) {
            requestFoodForm.reset();
            window.location.href = "Food_Request.html";
        } else {
            alert(result.message || "Failed to submit request.");
        }
    } catch (error) {
        console.error("Request submission error:", error);
        alert("Error submitting request. Please try again later.");
    }
}

async function fetchAndUpdateFoodRequests() {
    if (isRequestsLoaded) return;

    try {
        const response = await fetch("http://localhost:5000/api/food-requests");
        if (!response.ok) throw new Error("Failed to fetch requests");
        
        foodRequests = await response.json();
        updateFoodRequestList(foodRequests);
        isRequestsLoaded = true;
    } catch (error) {
        console.error("Request fetch error:", error);
        if (foodRequestList) {
            foodRequestList.innerHTML = "<p>Error loading requests. Please try again later.</p>";
        }
    }
}

function updateFoodRequestList(requestArray = foodRequests) {
    if (!foodRequestList) return;
    
    foodRequestList.innerHTML = requestArray.length === 0
        ? "<p>No food requests found.</p>"
        : requestArray.map(createRequestItem).join("");
}

function createRequestItem(request) {
    return `
        <div class="food-request-item">
            <h3>Requestor: ${request.requestorName}</h3>
            <p>Mobile: ${request.requestorMobile}</p>
            <p>Location: <a href="https://www.google.com/maps/search/${encodeURIComponent(request.requestorLocation)}" target="_blank">${request.requestorLocation}</a></p>
            <button onclick="acceptRequest('${request._id}')">Accept Request</button>
            <button onclick="deleteFoodRequest('${request._id}')">Remove</button>
        </div>
    `;
}

// Shared Functions
function setupSearchFunctionality() {
    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("locationSearch");

    if (!searchButton || !searchInput) return;

    const searchHandler = () => {
        const searchValue = searchInput.value.trim().toLowerCase();
        
        if (donationList) {
            const filteredDonations = donations.filter(d => 
                d.location.toLowerCase().includes(searchValue)
            );
            updateDonationList(filteredDonations);
        }
        
        if (foodRequestList) {
            const filteredRequests = foodRequests.filter(r => 
                r.requestorLocation.toLowerCase().includes(searchValue)
            );
            updateFoodRequestList(filteredRequests);
        }
    };

    searchButton.addEventListener("click", searchHandler);
    searchInput.addEventListener("input", searchHandler);
}

function setupSidebarBehavior() {
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.querySelector(".hamburger");

    if (sidebar && hamburger) {
        document.addEventListener("click", function(event) {
            if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                sidebar.style.left = "-250px";
            }
        });
    }
}

// Button Actions
async function receiveFood(button, donationId) {
    if (button.disabled) return;
    
    button.disabled = true;
    
    try {
        const response = await fetch(`http://localhost:5000/api/donations/${donationId}/accept`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to accept donation");
        }

        button.innerText = "Food Received";
        button.style.backgroundColor = "#4CAF50";
        button.style.color = "white";
        button.classList.add("received");

        isDonationsLoaded = false;
        await fetchAndUpdateDonations();
    } catch (error) {
        console.error("Donation acceptance error:", error);
        alert("Failed to accept donation: " + error.message);
        button.disabled = false;
    }
}

async function acceptRequest(requestId) {
    try {
        const response = await fetch(`http://localhost:5000/api/food-requests/${requestId}/accept`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            alert("Request accepted!");
            await fetchAndUpdateFoodRequests();
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Failed to accept request.");
        }
    } catch (error) {
        console.error("Request acceptance error:", error);
        alert("Error accepting request: " + error.message);
    }
}

async function deleteFoodRequest(requestId) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/food-requests/${requestId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            await fetchAndUpdateFoodRequests();
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Failed to delete request.");
        }
    } catch (error) {
        console.error("Request deletion error:", error);
        alert("Error deleting request: " + error.message);
    }
}
