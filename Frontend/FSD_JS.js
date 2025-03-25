// Donation handling (unchanged from original)
const donationForm = document.getElementById("donationForm");
const donationList = document.getElementById("donationList");

let donations = JSON.parse(localStorage.getItem("donations")) || [];

if (donationForm) {
    donationForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const mobile = document.getElementById("mobile").value;
        const foodDetails = document.getElementById("foodDetails").value;
        const expiryDate = document.getElementById("expiryDate").value;
        const location = document.getElementById("location").value;

        const donation = { name, email, mobile, foodDetails, location, expiryDate };
        donations.push(donation);
        localStorage.setItem("donations", JSON.stringify(donations));
        donationForm.reset();
        window.location.href = "donations.html";
    });
}

if (donationList) {
    updateDonationList();
}

function updateDonationList() {
    donationList.innerHTML = "";
    donations.forEach((donation, index) => {
        const donationItem = document.createElement("div");
        donationItem.classList.add("donation-item");
        const isExpired = new Date(donation.expiryDate) < new Date();
        donationItem.innerHTML = `
            <h3>Donor: ${donation.name}</h3>
            <p>Email: ${donation.email}</p>
            <p>Mobile: ${donation.mobile}</p>
            <p>Food Details: ${donation.foodDetails}</p>
            <p>Location: <a href="https://www.google.com/maps/search/${encodeURIComponent(donation.location)}" target="_blank">${donation.location}</a></p>
            <p>Expiry Date: ${donation.expiryDate}</p>
            <p class="${isExpired ? 'expired' : ''}">${isExpired ? 'Expired' : ''}</p>
            <button onclick="receiveFood(this)">Receive Food</button>
            <button onclick="deleteDonation(${index})">Remove</button>
        `;
        donationList.appendChild(donationItem);
    });
}

function receiveFood(button) {
    button.innerText = "Food Received";
    button.style.backgroundColor = "#4CAF50";
    button.disabled = true;
}

function deleteDonation(index) {
    donations.splice(index, 1);
    localStorage.setItem("donations", JSON.stringify(donations));
    updateDonationList();
}

// Food Request handling (updated to use MongoDB)
const requestFoodForm = document.getElementById("requestFoodForm");
const foodRequestList = document.getElementById("foodRequestList");

if (requestFoodForm) {
    requestFoodForm.removeEventListener("submit", handleFormSubmit);
    requestFoodForm.addEventListener("submit", handleFormSubmit);

    function handleFormSubmit(event) {
        event.preventDefault();

        const requestorName = document.getElementById("requestorName").value;
        const requestorMobile = document.getElementById("requestorMobile").value;
        const requestorLocation = document.getElementById("requestorLocation").value;

        const requestData = { requestorName, requestorMobile, requestorLocation };

        fetch("http://localhost:5000/api/request-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        })
        .then(response => response.json())
        .then(result => {
            if (result.message === "Food request submitted successfully!") {
                requestFoodForm.reset();
                window.location.href = "Food_Request.html";
            } else {
                alert(result.message || "Failed to submit request.");
            }
        })
        .catch(error => {
            console.error("Error submitting request:", error);
            alert("Error submitting request. Please try again later.");
        });
    }
}

let foodRequests = []; // Global array to store fetched food requests

if (foodRequestList) {
    fetchAndUpdateFoodRequests(); // Initial fetch and update
}

async function updateFoodRequestList(requestArray = foodRequests) {
    foodRequestList.innerHTML = "";
    if (requestArray.length === 0) {
        foodRequestList.innerHTML = "<p>No food requests found.</p>";
        return;
    }
    requestArray.forEach((foodRequest, index) => {
        const requestItem = document.createElement("div");
        requestItem.classList.add("food-request-item"); // Keep original styling
        requestItem.innerHTML = `
            <h3>Requestor: ${foodRequest.requestorName}</h3>
            <p>Mobile: ${foodRequest.requestorMobile}</p>
            <p>Location: <a href="https://www.google.com/maps/search/${encodeURIComponent(foodRequest.requestorLocation)}" target="_blank">${foodRequest.requestorLocation}</a></p>
            <button onclick="acceptRequest('${foodRequest._id}')">Accept Request</button>
            <button onclick="deleteFoodRequest('${foodRequest._id}')">Remove</button>
        `;
        foodRequestList.appendChild(requestItem);
    });
}

async function fetchAndUpdateFoodRequests() {
    try {
        const response = await fetch("http://localhost:5000/api/food-requests", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch requests");
        }

        foodRequests = await response.json(); // Store globally
        updateFoodRequestList(foodRequests); // Update with full list initially
    } catch (error) {
        console.error("Error fetching requests:", error);
        foodRequestList.innerHTML = "<p>Error loading requests. Please try again later.</p>";
    }
}

async function acceptRequest(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/food-requests/${id}/accept`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            alert("Request accepted!");
            fetchAndUpdateFoodRequests(); // Refresh the list
        } else {
            alert("Failed to accept request.");
        }
    } catch (error) {
        console.error("Error accepting request:", error);
        alert("Error accepting request.");
    }
}

async function deleteFoodRequest(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/food-requests/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            fetchAndUpdateFoodRequests(); // Refresh the list
        } else {
            alert("Failed to delete request.");
        }
    } catch (error) {
        console.error("Error deleting request:", error);
        alert("Error deleting request.");
    }
}

// Search functionality (unchanged for donations, added for food requests)
document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("locationSearch");
    const donationList = document.getElementById("donationList");

    // Modify updateDonationList to accept an optional parameter (unchanged)
    function updateDonationList(donationArray = donations) {
        donationList.innerHTML = "";
        if (donationArray.length === 0) {
            donationList.innerHTML = "<p>No donations found for this location.</p>";
            return;
        }
        donationArray.forEach((donation, index) => {
            const donationItem = document.createElement("div");
            donationItem.classList.add("donation-item");
            const isExpired = new Date(donation.expiryDate) < new Date();
            donationItem.innerHTML = `
                <h3>Donor: ${donation.name}</h3>
                <p>Email: ${donation.email}</p>
                <p>Mobile: ${donation.mobile}</p>
                <p>Food Details: ${donation.foodDetails}</p>
                <p>Location: <a href="https://www.google.com/maps/search/${encodeURIComponent(donation.location)}" target="_blank">${donation.location}</a></p>
                <p>Expiry Date: ${donation.expiryDate}</p>
                <p class="${isExpired ? 'expired' : ''}">${isExpired ? 'Expired' : ''}</p>
                <button onclick="receiveFood(this)">Receive Food</button>
                <button onclick="deleteDonation(${index})">Remove</button>
            `;
            donationList.appendChild(donationItem);
        });
    }

    // Donation search (unchanged)
    if (searchButton && searchInput && donationList) {
        searchButton.addEventListener("click", function () {
            const searchValue = searchInput.value.trim().toLowerCase();
            if (searchValue === "") {
                updateDonationList(donations);
                return;
            }

            const filteredDonations = donations.filter(donation =>
                donation.location.toLowerCase().includes(searchValue)
            );
            updateDonationList(filteredDonations);
        });

        searchInput.addEventListener("input", function () {
            const searchValue = searchInput.value.trim().toLowerCase();
            if (searchValue === "") {
                updateDonationList(donations);
            } else {
                const filteredDonations = donations.filter(donation =>
                    donation.location.toLowerCase().includes(searchValue)
                );
                updateDonationList(filteredDonations);
            }
        });
    }

    // Initial load of all donations (unchanged)
    if (donationList) {
        updateDonationList();
    }

    // Food Request search (new)
    if (foodRequestList) {
        fetchAndUpdateFoodRequests(); // Initial fetch

        searchButton.addEventListener("click", function () {
            const searchValue = searchInput.value.trim().toLowerCase();
            if (searchValue === "") {
                updateFoodRequestList(foodRequests);
                return;
            }

            const filteredRequests = foodRequests.filter(request =>
                request.requestorLocation.toLowerCase().includes(searchValue)
            );
            updateFoodRequestList(filteredRequests);
        });

        searchInput.addEventListener("input", function () {
            const searchValue = searchInput.value.trim().toLowerCase();
            if (searchValue === "") {
                updateFoodRequestList(foodRequests);
            } else {
                const filteredRequests = foodRequests.filter(request =>
                    request.requestorLocation.toLowerCase().includes(searchValue)
                );
                updateFoodRequestList(filteredRequests);
            }
        });
    }
});

// Sidebar click-outside handler (unchanged from original)
document.addEventListener("click", function (event) {
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.querySelector(".hamburger");
    if (sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.style.left = "-250px";
    }
});